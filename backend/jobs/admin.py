from django.contrib import admin
from .models import Job, Application, CompanySync


@admin.register(CompanySync)
class CompanySyncAdmin(admin.ModelAdmin):
    list_display = ('company', 'last_synced_at')
    search_fields = ('company',)
    list_per_page = 20


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """
    Admin configuration for Job model
    """
    list_display = ('title', 'company_name', 'location', 'job_type', 'status', 'source', 'posted_by', 'created_at')
    list_filter = ('job_type', 'status', 'source', 'created_at')
    search_fields = ('title', 'company_name', 'location', 'description')
    list_per_page = 20
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Job Information', {
            'fields': ('title', 'description', 'company_name', 'company_id', 'location')
        }),
        ('Job Details', {
            'fields': (
                'job_type', 'experience_required', 'job_min_salary', 'job_max_salary',
                'job_salary_period', 'job_salary_currency', 'job_salary_string',
                'skills_required', 'required_technologies'
            )
        }),
        ('Status & Owner', {
            'fields': (
                'status', 'is_active', 'posted_by', 'source', 'provider',
                'external_job_id', 'expires_at', 'last_synced_at',
                'provider_job_url', 'provider_response'
            )
        }),
    )


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """
    Admin configuration for Application model
    """
    list_display = ('candidate', 'job', 'status', 'applied_at')
    list_filter = ('status', 'applied_at')
    search_fields = ('candidate__username', 'job__title', 'job__company_name')
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
