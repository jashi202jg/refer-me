from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model with user type field
    """
    USER_TYPE_CHOICES = (
        ('referrer', 'Referrer'),
        ('candidate', 'Candidate'),
    )
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='candidate'
    )
    phone = models.CharField(max_length=15, blank=True, null=True)
    company = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
    
    @property
    def is_referrer(self):
        return self.user_type == 'referrer'
    
    @property
    def is_candidate(self):
        return self.user_type == 'candidate'
        
    def save(self, *args, **kwargs):
        if self.company:
            company_name_stripped = self.company.strip()
            if company_name_stripped:
                Company.objects.get_or_create(name=company_name_stripped)
        super().save(*args, **kwargs)


class Company(models.Model):
    name = models.CharField(max_length=100, unique=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'companies'
        ordering = ['name']
        
    def __str__(self):
        return self.name
