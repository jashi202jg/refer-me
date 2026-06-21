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
    skills_required = models.TextField(help_text='Comma-separated skills')
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='open'
    )
    
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} at {self.company}"
    
    @property
    def skills_list(self):
        """Return skills as a list"""
        return [skill.strip() for skill in self.skills_required.split(',')]


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
