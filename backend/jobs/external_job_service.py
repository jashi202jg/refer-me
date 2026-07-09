import requests
from django.conf import settings
from datetime import datetime, timedelta
from .models import ExternalJob


class ExternalJobService:
    """
    Service for fetching and managing external jobs from JSearch API
    """
    BASE_URL = "https://jsearch.p.rapidapi.com"
    
    @staticmethod
    def get_headers():
        return {
            'Content-Type': 'application/json',
            'x-rapidapi-host': settings.RAPIDAPI_HOST,
            'x-rapidapi-key': settings.RAPIDAPI_KEY
        }
    
    @staticmethod
    def search_jobs(query, num_pages=1, country='in', location=None, 
                   date_posted='week', work_from_home=False, 
                   employment_types=None, job_requirements=None, radius=None):
        """
        Search for jobs using JSearch API
        
        Args:
            query: Search query (e.g., "developer jobs in chicago")
            num_pages: Number of pages to fetch (1-20)
            country: Country code (default 'in' for India)
            location: Location string
            date_posted: all, today, 3days, week, month
            work_from_home: Boolean
            employment_types: Comma-separated (FULLTIME, CONTRACTOR, PARTTIME, INTERN)
            job_requirements: Comma-separated requirements
            radius: Search radius in km
        """
        url = f"{ExternalJobService.BASE_URL}/search-v2"
        
        params = {
            'query': query,
            'num_pages': num_pages,
            'country': country,
            'date_posted': date_posted,
        }
        
        if location:
            params['location'] = location
        if work_from_home:
            params['work_from_home'] = 'true'
        if employment_types:
            params['employment_types'] = employment_types
        if job_requirements:
            params['job_requirements'] = job_requirements
        if radius:
            params['radius'] = radius
        
        try:
            response = requests.get(url, headers=ExternalJobService.get_headers(), params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                jobs_data = data.get('data', {}).get('jobs', [])
                return ExternalJobService.save_jobs(jobs_data), data.get('data', {}).get('cursor')
            return [], None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching jobs: {e}")
            return [], None
    
    @staticmethod
    def get_job_details(job_ids, country='in'):
        """
        Get detailed information for specific job(s)
        
        Args:
            job_ids: Single job_id or comma-separated job_ids (up to 20)
            country: Country code
        """
        url = f"{ExternalJobService.BASE_URL}/job-details"
        
        params = {
            'job_id': job_ids,
            'country': country
        }
        
        try:
            response = requests.get(url, headers=ExternalJobService.get_headers(), params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK':
                jobs_data = data.get('data', [])
                return ExternalJobService.save_jobs(jobs_data)
            return []
        except requests.exceptions.RequestException as e:
            print(f"Error fetching job details: {e}")
            return []
    
    @staticmethod
    def save_jobs(jobs_data):
        """
        Save or update jobs in the database
        """
        saved_jobs = []
        
        for job_data in jobs_data:
            job_id = job_data.get('job_id')
            if not job_id:
                continue
            
            # Parse datetime if available
            posted_at_datetime = None
            if job_data.get('job_posted_at_datetime_utc'):
                try:
                    posted_at_datetime = datetime.fromisoformat(
                        job_data['job_posted_at_datetime_utc'].replace('Z', '+00:00')
                    )
                except:
                    pass
            
            # Prepare job fields
            job_fields = {
                'job_title': (job_data.get('job_title') or '')[:500],
                'employer_name': (job_data.get('employer_name') or '')[:255],
                'employer_logo': job_data.get('employer_logo'),
                'employer_website': job_data.get('employer_website'),
                'job_publisher': (job_data.get('job_publisher') or '')[:255],
                'job_employment_type': (job_data.get('job_employment_type') or '')[:50],
                'job_apply_link': job_data.get('job_apply_link') or '',
                'job_description': job_data.get('job_description') or '',
                'job_is_remote': job_data.get('job_is_remote'),
                'job_posted_at_timestamp': job_data.get('job_posted_at_timestamp'),
                'job_posted_at_datetime_utc': posted_at_datetime,
                'job_location': (job_data.get('job_location') or '')[:255],
                'job_city': (job_data.get('job_city') or '')[:100],
                'job_state': (job_data.get('job_state') or '')[:100],
                'job_country': (job_data.get('job_country') or '')[:10],
                'job_benefits': job_data.get('job_benefits'),
                'job_salary_string': (job_data.get('job_salary_string') or '')[:100],
                'job_min_salary': job_data.get('job_min_salary'),
                'job_max_salary': job_data.get('job_max_salary'),
                'job_salary_period': (job_data.get('job_salary_period') or '')[:20],
                'job_highlights': job_data.get('job_highlights'),
                'required_technologies': job_data.get('required_technologies'),
                'employer_reviews': job_data.get('employer_reviews'),
            }
            
            # Update or create
            job, created = ExternalJob.objects.update_or_create(
                job_id=job_id,
                defaults=job_fields
            )
            saved_jobs.append(job)
        
        return saved_jobs
    
    @staticmethod
    def get_cached_jobs(days=7, **filters):
        """
        Get jobs from database cache
        
        Args:
            days: Get jobs from last N days (default 7)
            **filters: Additional filters (location, employment_type, etc.)
        """
        from django.utils import timezone
        
        queryset = ExternalJob.objects.all()
        
        # Filter by date
        if days:
            cutoff_date = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(job_posted_at_datetime_utc__gte=cutoff_date)
        
        # Apply additional filters
        if 'location' in filters and filters['location']:
            queryset = queryset.filter(job_location__icontains=filters['location'])
        
        if 'employment_type' in filters and filters['employment_type']:
            queryset = queryset.filter(job_employment_type__icontains=filters['employment_type'])
        
        if 'remote' in filters and filters['remote']:
            queryset = queryset.filter(job_is_remote=True)
        
        if 'search' in filters and filters['search']:
            from django.db.models import Q
            search = filters['search']
            queryset = queryset.filter(
                Q(job_title__icontains=search) |
                Q(employer_name__icontains=search) |
                Q(job_description__icontains=search)
            )
        
        return queryset
