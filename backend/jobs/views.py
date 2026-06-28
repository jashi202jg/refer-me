from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Job, Application, Notification
from .serializers import (
    JobSerializer,
    JobListSerializer,
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    NotificationSerializer
)

User = get_user_model()


class IsReferrerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow referrers to create/edit jobs
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_referrer
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.posted_by == request.user


class JobListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating jobs
    GET: List all open jobs (any authenticated user)
    POST: Create a new job (referrer only)
    """
    permission_classes = [permissions.IsAuthenticated, IsReferrerOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobSerializer
        return JobListSerializer
    
    def get_queryset(self):
        queryset = Job.objects.select_related('posted_by').all()
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by job type
        job_type = self.request.query_params.get('job_type', None)
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        
        # Search by title, company, or location
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(location__icontains=search)
            )
        
        # If user is referrer, show all their jobs
        # Otherwise, only show open jobs
        if self.request.user.is_referrer:
            user_jobs = self.request.query_params.get('my_jobs', None)
            if user_jobs:
                queryset = queryset.filter(posted_by=self.request.user)
        else:
            queryset = queryset.filter(status='open')
        
        return queryset
    
    def perform_create(self, serializer):
        job = serializer.save(posted_by=self.request.user)
        # Auto-create notifications for candidates
        candidates = User.objects.filter(user_type='candidate')
        notifications = [
            Notification(
                recipient=candidate,
                actor=self.request.user,
                title='New Job Opening',
                message=f"{job.company} posted a new opening for {job.title}",
                notification_type='new_job',
                link=f"/jobs/{job.id}"
            )
            for candidate in candidates
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for job details
    GET: View job details (any authenticated user)
    PUT/PATCH: Update job (owner only)
    DELETE: Delete job (owner only)
    """
    queryset = Job.objects.select_related('posted_by').all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsReferrerOrReadOnly]
    
    def perform_update(self, serializer):
        if self.get_object().posted_by != self.request.user:
            raise PermissionDenied("You can only update your own jobs")
        serializer.save()
    
    def perform_destroy(self, instance):
        if instance.posted_by != self.request.user:
            raise PermissionDenied("You can only delete your own jobs")
        instance.delete()


class ApplicationListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating applications
    GET: List applications (candidates see their own, referrers see applications to their jobs)
    POST: Create application (candidate only)
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_candidate:
            # Candidates see their own applications
            return Application.objects.filter(
                candidate=user
            ).select_related('job', 'candidate')
        else:
            # Referrers see applications to their jobs
            job_id = self.request.query_params.get('job_id', None)
            queryset = Application.objects.filter(
                job__posted_by=user
            ).select_related('job', 'candidate')
            
            if job_id:
                queryset = queryset.filter(job_id=job_id)
            
            # Filter by status
            status_param = self.request.query_params.get('status', None)
            if status_param:
                queryset = queryset.filter(status=status_param)
            
            return queryset
    
    def perform_create(self, serializer):
        if not self.request.user.is_candidate:
            raise PermissionDenied("Only candidates can apply for jobs")
        application = serializer.save(candidate=self.request.user)
        # Explicitly load job with posted_by
        job = Job.objects.select_related('posted_by').get(pk=application.job_id)
        candidate_name = self.request.user.get_full_name() or self.request.user.username or self.request.user.email
        Notification.objects.create(
            recipient=job.posted_by,
            actor=self.request.user,
            title='New Application Received',
            message=f"{candidate_name} applied for {job.title}",
            notification_type='new_application',
            link='/applications'
        )


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for application details
    """
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_candidate:
            return Application.objects.filter(candidate=user)
        else:
            return Application.objects.filter(job__posted_by=user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH'] and self.request.user.is_referrer:
            return ApplicationStatusUpdateSerializer
        return ApplicationSerializer
    
    def perform_update(self, serializer):
        old_status = self.get_object().status
        application = serializer.save()
        if old_status != application.status and self.request.user.is_referrer:
            job = application.job
            Notification.objects.create(
                recipient=application.candidate,
                actor=self.request.user,
                title='Application Status Updated',
                message=f"Your application for {job.title} at {job.company} status was updated to '{application.get_status_display()}'.",
                notification_type='status_change',
                link='/applications'
            )

    def perform_destroy(self, instance):
        if instance.candidate != self.request.user:
            raise PermissionDenied("You can only delete your own applications")
        job = instance.job
        candidate_name = self.request.user.get_full_name() or self.request.user.username
        instance.delete()
        Notification.objects.create(
            recipient=job.posted_by,
            actor=self.request.user,
            title='Application Withdrawn',
            message=f"{candidate_name} withdrew their application for {job.title}.",
            notification_type='application_withdrawn',
            link='/applications'
        )


class NotificationListView(generics.ListAPIView):
    """
    GET: List notifications for authenticated user
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationMarkReadView(APIView):
    """
    PATCH: Mark specific notification as read
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
            notif.is_read = True
            notif.save()
            return Response(NotificationSerializer(notif).data)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(APIView):
    """
    POST: Mark all notifications as read for current user
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


class NotificationUnreadCountView(APIView):
    """
    GET: Get unread notification count
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationClearAllView(APIView):
    """
    DELETE: Delete all notifications for current user
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Notification.objects.filter(recipient=request.user).delete()
        return Response({'message': 'All notifications cleared'})


