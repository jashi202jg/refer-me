from rest_framework import serializers
from .models import Job, Application, Notification
from accounts.serializers import UserSerializer


class ExternalJobSerializer(serializers.ModelSerializer):
    """
    Serializer for external job details from the unified Job model
    """
    # Backward compatibility aliases for JSearch UI elements
    job_title = serializers.CharField(source='title', read_only=True)
    employer_name = serializers.CharField(source='company', read_only=True)
    job_location = serializers.CharField(source='location', read_only=True)
    job_employment_type = serializers.CharField(source='job_type', read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'title', 'description', 'company', 'location',
            'job_type', 'experience_required', 'salary_range',
            'skills_required', 'skills_list', 'status',
            'posted_by', 'posted_by_details', 'applications_count',
            'is_external', 'external_job_id', 'employer_logo',
            'employer_website', 'job_publisher', 'job_apply_link',
            'job_is_remote', 'job_posted_at_datetime_utc',
            'job_benefits', 'job_salary_string', 'job_min_salary',
            'job_max_salary', 'job_salary_period', 'job_highlights',
            'required_technologies', 'employer_reviews', 'last_synced_at',
            'created_at', 'updated_at',
            # Aliases
            'job_title', 'employer_name', 'job_location', 'job_employment_type'
        )


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for Job model
    """
    posted_by_details = UserSerializer(source='posted_by', read_only=True)
    skills_list = serializers.ReadOnlyField()
    applications_count = serializers.SerializerMethodField()
    company = serializers.CharField(required=False, allow_blank=True)
    
    # Backward compatibility aliases for JSearch UI elements
    job_title = serializers.CharField(source='title', read_only=True)
    employer_name = serializers.CharField(source='company', read_only=True)
    job_location = serializers.CharField(source='location', read_only=True)
    job_employment_type = serializers.CharField(source='job_type', read_only=True)
    
    class Meta:
        model = Job
        fields = (
            'id', 'title', 'description', 'company', 'location',
            'job_type', 'experience_required', 'salary_range',
            'skills_required', 'skills_list', 'status',
            'posted_by', 'posted_by_details', 'applications_count',
            'is_external', 'external_job_id', 'employer_logo',
            'employer_website', 'job_publisher', 'job_apply_link',
            'job_is_remote', 'job_posted_at_datetime_utc',
            'job_benefits', 'job_salary_string', 'job_min_salary',
            'job_max_salary', 'job_salary_period', 'job_highlights',
            'required_technologies', 'employer_reviews', 'last_synced_at',
            'created_at', 'updated_at',
            # Aliases
            'job_title', 'employer_name', 'job_location', 'job_employment_type'
        )
        read_only_fields = ('id', 'posted_by', 'created_at', 'updated_at')
    
    def get_applications_count(self, obj):
        return obj.applications.count()
    
    def validate(self, attrs):
        # Ensure only referrers can create jobs
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if not user.is_referrer:
                raise serializers.ValidationError(
                    "Only referrers can post jobs"
                )
            if not attrs.get('company'):
                if user.company:
                    attrs['company'] = user.company
                else:
                    raise serializers.ValidationError(
                        {"company": "Your profile company is not set. Please update your profile first."}
                    )
        return attrs


class JobListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for job listings
    """
    posted_by_name = serializers.CharField(
        source='posted_by.get_full_name',
        default='',
        read_only=True
    )
    skills_list = serializers.ReadOnlyField()
    
    # Backward compatibility aliases for JSearch UI elements
    job_title = serializers.CharField(source='title', read_only=True)
    employer_name = serializers.CharField(source='company', read_only=True)
    job_location = serializers.CharField(source='location', read_only=True)
    job_employment_type = serializers.CharField(source='job_type', read_only=True)
    
    class Meta:
        model = Job
        fields = (
            'id', 'title', 'company', 'location', 'job_type',
            'experience_required', 'salary_range', 'skills_list',
            'status', 'posted_by_name', 'created_at',
            'is_external', 'employer_logo', 'job_apply_link',
            'job_is_remote', 'job_posted_at_datetime_utc',
            'job_publisher', 'last_synced_at',
            # Aliases
            'job_title', 'employer_name', 'job_location', 'job_employment_type'
        )


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for Application model
    """
    candidate_details = UserSerializer(source='candidate', read_only=True)
    job_details = JobListSerializer(source='job', read_only=True)
    
    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_details', 'candidate', 'candidate_details',
            'cover_letter', 'resume_url', 'resume_blob', 'resume_filename',
            'linkedin_url', 'portfolio_url', 'github_url',
            'status', 'notes', 'applied_at', 'updated_at'
        )
        read_only_fields = ('id', 'candidate', 'applied_at', 'updated_at')
    
    def validate(self, attrs):
        # Ensure only candidates can apply
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if not request.user.is_candidate:
                raise serializers.ValidationError(
                    "Only candidates can apply for jobs"
                )
            
            # Check if user already applied
            job = attrs.get('job')
            if Application.objects.filter(
                job=job,
                candidate=request.user
            ).exists():
                raise serializers.ValidationError(
                    "You have already applied for this job"
                )
        
        return attrs


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating application status
    """
    class Meta:
        model = Application
        fields = ('status', 'notes')


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model
    """
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'actor', 'actor_name', 'title',
            'message', 'notification_type', 'link', 'is_read', 'created_at'
        )
        read_only_fields = ('id', 'recipient', 'actor', 'created_at')

