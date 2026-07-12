from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Job, Application, Notification, CompanySync
from .serializers import (
    JobSerializer,
    JobListSerializer,
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer,
    NotificationSerializer,
    ExternalJobSerializer
)
from .external_job_service import ExternalJobService

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
    
    def sync_company_external_jobs(self, company_name):
        from django.utils import timezone
        from datetime import timedelta
        from .external_job_service import ExternalJobService
        
        # Check if synced within the last 24 hours
        sync_info = CompanySync.objects.filter(company__iexact=company_name).first()
        now = timezone.now()
        
        if not sync_info or sync_info.last_synced_at < now - timedelta(hours=24):
            print(f"Daily sync: Fetching external jobs for company: {company_name}")
            try:
                ExternalJobService.search_jobs(
                    query=company_name,
                    num_pages=1,
                    country='in',
                    date_posted='month'
                )
            except Exception as e:
                print(f"Error during daily external job sync: {e}")
            
            CompanySync.objects.update_or_create(
                company=company_name.lower(),
                defaults={'last_synced_at': now}
            )

    def get_queryset(self):
        queryset = Job.objects.select_related('posted_by').all()
        user = self.request.user
        
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
        
        # Filter by is_external query param if explicitly provided
        is_external_param = self.request.query_params.get('is_external', None)
        if is_external_param is not None:
            queryset = queryset.filter(is_external=is_external_param.lower() == 'true')
        
        # Role-based query logic
        if user.is_referrer:
            user_jobs = self.request.query_params.get('my_jobs', None)
            if user_jobs:
                # Dashboard: only user-posted jobs from DB (internal)
                queryset = queryset.filter(posted_by=user, is_external=False)
            else:
                # Jobs listing: all jobs (internal + external) under their company name
                company_name = user.company
                if company_name:
                    # Sync company external openings if needed (24 hours check)
                    self.sync_company_external_jobs(company_name)
                    queryset = queryset.filter(company__iexact=company_name)
                else:
                    # Fallback to user posted if company not set
                    queryset = queryset.filter(posted_by=user)
        else:
            # Candidates: default to only open internal jobs
            if is_external_param is None:
                queryset = queryset.filter(is_external=False, status='open')
            else:
                if is_external_param.lower() == 'true':
                    # Allow searching external cached jobs
                    pass
                else:
                    queryset = queryset.filter(is_external=False, status='open')
        
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


class ExternalJobSearchView(APIView):
    """
    POST: Search for external jobs and cache them
    GET: Get cached external jobs
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get cached external jobs with filters
        """
        days = int(request.query_params.get('days', 7))
        location = request.query_params.get('location', '')
        employment_type = request.query_params.get('employment_type', '')
        remote = request.query_params.get('remote', '') == 'true'
        search = request.query_params.get('search', '')
        
        filters = {
            'location': location,
            'employment_type': employment_type,
            'remote': remote,
            'search': search,
        }
        
        jobs = ExternalJobService.get_cached_jobs(days=days, **filters)
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        result_page = paginator.paginate_queryset(jobs, request)
        
        serializer = ExternalJobSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        """
        Search and fetch new external jobs
        """
        query = request.data.get('query', 'developer jobs')
        num_pages = int(request.data.get('num_pages', 1))
        country = request.data.get('country', 'in')
        location = request.data.get('location')
        date_posted = request.data.get('date_posted', 'week')
        work_from_home = request.data.get('work_from_home', False)
        employment_types = request.data.get('employment_types')
        job_requirements = request.data.get('job_requirements')
        radius = request.data.get('radius')
        
        jobs, cursor = ExternalJobService.search_jobs(
            query=query,
            num_pages=num_pages,
            country=country,
            location=location,
            date_posted=date_posted,
            work_from_home=work_from_home,
            employment_types=employment_types,
            job_requirements=job_requirements,
            radius=radius
        )
        
        serializer = ExternalJobSerializer(jobs, many=True)
        return Response({
            'count': len(jobs),
            'cursor': cursor,
            'results': serializer.data
        })


class ExternalJobDetailView(APIView):
    """
    GET: Get external job details by job_id
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, job_id):
        """
        Get job details - first check cache, then fetch from API if needed
        """
        try:
            # Try to get from cache first
            job = ExternalJob.objects.get(job_id=job_id)
            serializer = ExternalJobSerializer(job)
            return Response(serializer.data)
        except ExternalJob.DoesNotExist:
            # Fetch from API
            country = request.query_params.get('country', 'in')
            jobs = ExternalJobService.get_job_details(job_id, country)
            
            if jobs:
                serializer = ExternalJobSerializer(jobs[0])
                return Response(serializer.data)
            else:
                return Response(
                    {'detail': 'Job not found'},
                    status=status.HTTP_404_NOT_FOUND
                )


