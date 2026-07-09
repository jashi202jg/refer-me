from django.contrib import admin
from .models import Job, Application, ExternalJob


@admin.register(ExternalJob)
class ExternalJobAdmin(admin.ModelAdmin):
    """
    Admin configuration for ExternalJob model
    """
    list_display = ('job_title', 'employer_name', 'job_location', 'job_employment_type', 'job_posted_at_datetime_utc', 'fetched_at')
    list_filter = ('job_employment_type', 'job_is_remote', 'job_country', 'fetched_at')
    search_fields = ('job_title', 'employer_name', 'job_location', 'job_description')
    list_per_page = 20
    date_hierarchy = 'job_posted_at_datetime_utc'
    readonly_fields = ('job_id', 'fetched_at', 'updated_at')
    
    fieldsets = (
        ('Job Information', {
            'fields': ('job_id', 'job_title', 'employer_name', 'employer_logo', 'employer_website')
        }),
        ('Job Details', {
            'fields': ('job_description', 'job_employment_type', 'job_is_remote', 'job_apply_link')
        }),
        ('Location', {
            'fields': ('job_location', 'job_city', 'job_state', 'job_country')
        }),
        ('Salary', {
            'fields': ('job_salary_string', 'job_min_salary', 'job_max_salary', 'job_salary_period')
        }),
        ('Metadata', {
            'fields': ('job_posted_at_datetime_utc', 'job_posted_at_timestamp', 'job_publisher', 'fetched_at', 'updated_at')
        }),
    )


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """
    Admin configuration for Job model
    """
    list_display = ('title', 'company', 'location', 'job_type', 'status', 'posted_by', 'created_at')
    list_filter = ('job_type', 'status', 'created_at')
    search_fields = ('title', 'company', 'location', 'description')
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Job Information', {
            'fields': ('title', 'description', 'company', 'location')
        }),
        ('Job Details', {
            'fields': ('job_type', 'experience_required', 'salary_range', 'skills_required')
        }),
        ('Status & Owner', {
            'fields': ('status', 'posted_by')
        }),
    )


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """
    Admin configuration for Application model
    """
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('candidate__username', 'job__title', 'job__company')
    list_per_page = 20
    date_hierarchy = 'applied_at'
    
    fieldsets = (
        ('Application Info', {
            'fields': ('job', 'candidate', 'status')
        }),
        ('Details', {
            'fields': ('cover_letter', 'resume_url', 'notes')
        }),
    )
