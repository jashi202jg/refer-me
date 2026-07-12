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
    list_display = ('title', 'company', 'location', 'job_type', 'status', 'is_external', 'posted_by', 'created_at')
    list_filter = ('job_type', 'status', 'is_external', 'created_at')
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
            'fields': ('status', 'posted_by', 'is_external', 'external_job_id', 'last_synced_at')
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
