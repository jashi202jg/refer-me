from django.db import models
from django.conf import settings


class Job(models.Model):
    """
    Model for job postings
    """
    JOB_TYPE_CHOICES = (
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    )
    
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('closed', 'Closed'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    company = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    job_type = models.CharField(
        max_length=20,
        choices=JOB_TYPE_CHOICES,
        default='full_time'
    )
    experience_required = models.CharField(max_length=50, blank=True, null=True)
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    skills_required = models.TextField(help_text='Comma-separated skills', blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='open'
    )
    
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs',
        null=True,
        blank=True
    )
    
    # Combined/unified fields for external jobs
    is_external = models.BooleanField(default=False)
    external_job_id = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    employer_logo = models.URLField(blank=True, null=True)
    employer_website = models.URLField(blank=True, null=True)
    job_publisher = models.CharField(max_length=255, blank=True, null=True)
    job_apply_link = models.URLField(blank=True, null=True)
    job_is_remote = models.BooleanField(default=False, null=True, blank=True)
    job_posted_at_datetime_utc = models.DateTimeField(blank=True, null=True)
    job_benefits = models.JSONField(blank=True, null=True)
    job_salary_string = models.CharField(max_length=100, blank=True, null=True)
    job_min_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    job_max_salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    job_salary_period = models.CharField(max_length=20, blank=True, null=True)
    job_highlights = models.JSONField(blank=True, null=True)
    required_technologies = models.JSONField(blank=True, null=True)
    employer_reviews = models.JSONField(blank=True, null=True)
    
    # Sync column
    last_synced_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'jobs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['external_job_id']),
            models.Index(fields=['company']),
            models.Index(fields=['is_external']),
        ]
    
    def __str__(self):
        return f"{self.title} at {self.company}"
    
    @property
    def skills_list(self):
        """Return skills as a list"""
        if not self.skills_required:
            return []
        return [skill.strip() for skill in self.skills_required.split(',')]


class CompanySync(models.Model):
    """
    Model to track when a company's external openings were last fetched/synced
    """
    company = models.CharField(max_length=100, unique=True, db_index=True)
    last_synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'company_syncs'
        ordering = ['-last_synced_at']

    def __str__(self):
        return f"{self.company} synced at {self.last_synced_at}"


class Application(models.Model):
    """
    Model for job applications
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('reviewing', 'Reviewing'),
        ('shortlisted', 'Shortlisted'),
        ('rejected', 'Rejected'),
        ('referred', 'Referred'),
    )
    
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    
    cover_letter = models.TextField(blank=True, null=True)
    resume_url = models.URLField(blank=True, null=True)
    resume_blob = models.TextField(blank=True, null=True, help_text='Base64 encoded resume file')
    resume_filename = models.CharField(max_length=255, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    portfolio_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    notes = models.TextField(blank=True, null=True, help_text='Internal notes by referrer')
    
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'applications'
        ordering = ['-applied_at']
        unique_together = ('job', 'candidate')
    
    def __str__(self):
        return f"{self.candidate.username} - {self.job.title}"


class Notification(models.Model):
    """
    Model for user notifications
    """
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='general')
    link = models.CharField(max_length=255, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

