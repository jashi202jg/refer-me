from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q

from .models import Job, Application
from .serializers import (
    JobSerializer,
    JobListSerializer,
    ApplicationSerializer,
    ApplicationStatusUpdateSerializer
)


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
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
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
        serializer.save(posted_by=self.request.user)


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
            status = self.request.query_params.get('status', None)
            if status:
                queryset = queryset.filter(status=status)
            
            return queryset
    
    def perform_create(self, serializer):
        if not self.request.user.is_candidate:
            raise PermissionDenied("Only candidates can apply for jobs")
        serializer.save(candidate=self.request.user)


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for application details
    GET: View application details
    PUT/PATCH: Update application (candidate updates cover letter, referrer updates status)
    DELETE: Delete application (candidate only)
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
    
    def perform_destroy(self, instance):
        if instance.candidate != self.request.user:
            raise PermissionDenied("You can only delete your own applications")
        instance.delete()
