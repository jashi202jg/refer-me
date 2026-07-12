import requests
from django.conf import settings
from datetime import datetime, timedelta
from .models import Job


class ExternalJobService:
    """
    Service for fetching and managing external jobs from JSearch API using the unified Job model
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
                # Pass query/company name so we can save it correctly
                return ExternalJobService.save_jobs(jobs_data, company_name=query.replace(' jobs', '')), data.get('data', {}).get('cursor')
            return [], None
        except requests.exceptions.RequestException as e:
            print(f"Error fetching jobs: {e}")
            return [], None
    
    @staticmethod
    def get_job_details(job_ids, country='in'):
        """
        Get detailed information for specific job(s)
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
    def save_jobs(jobs_data, company_name=None):
        """
        Save or update jobs in the unified Job table
        """
        saved_jobs = []
        from django.utils import timezone
        
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
            
            # Map job type
            emp_type = job_data.get('job_employment_type')
            mapped_type = 'full_time'
            if emp_type:
                emp_type_upper = emp_type.upper()
                if 'FULL' in emp_type_upper:
                    mapped_type = 'full_time'
                elif 'PART' in emp_type_upper:
                    mapped_type = 'part_time'
                elif 'CONTRACT' in emp_type_upper:
                    mapped_type = 'contract'
                elif 'INTERN' in emp_type_upper:
                    mapped_type = 'internship'
            
            # Comma-separated skills
            techs = job_data.get('required_technologies') or []
            skills_req = ", ".join(techs) if techs else "Software Development"
            
            # Resolve company name
            resolved_company = company_name or job_data.get('employer_name') or 'External Company'
            
            # Prepare job fields
            job_fields = {
                'title': (job_data.get('job_title') or '')[:200],
                'description': job_data.get('job_description') or '',
                'company': resolved_company[:100],
                'location': (job_data.get('job_location') or job_data.get('job_city') or 'Remote')[:100],
                'job_type': mapped_type,
                'experience_required': 'Not specified',
                'salary_range': (job_data.get('job_salary_string') or '')[:100],
                'skills_required': skills_req,
                'status': 'open',
                'posted_by': None,
                
                # External specific
                'is_external': True,
                'employer_logo': job_data.get('employer_logo'),
                'employer_website': job_data.get('employer_website'),
                'job_publisher': (job_data.get('job_publisher') or '')[:255],
                'job_apply_link': job_data.get('job_apply_link') or '',
                'job_is_remote': job_data.get('job_is_remote', False),
                'job_posted_at_datetime_utc': posted_at_datetime,
                'job_benefits': job_data.get('job_benefits'),
                'job_salary_string': (job_data.get('job_salary_string') or '')[:100],
                'job_min_salary': job_data.get('job_min_salary'),
                'job_max_salary': job_data.get('job_max_salary'),
                'job_salary_period': (job_data.get('job_salary_period') or '')[:20],
                'job_highlights': job_data.get('job_highlights'),
                'required_technologies': job_data.get('required_technologies'),
                'employer_reviews': job_data.get('employer_reviews'),
                'last_synced_at': timezone.now()
            }
            
            # Update or create by external_job_id
            job, created = Job.objects.update_or_create(
                external_job_id=job_id,
                defaults=job_fields
            )
            saved_jobs.append(job)
        
        return saved_jobs
    
    @staticmethod
    def get_cached_jobs(days=7, **filters):
        """
        Get jobs from the unified Job database table
        """
        from django.utils import timezone
        
        queryset = Job.objects.filter(is_external=True)
        
        # Filter by date
        if days:
            cutoff_date = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(job_posted_at_datetime_utc__gte=cutoff_date)
        
        # Apply additional filters
        if 'location' in filters and filters['location']:
            queryset = queryset.filter(location__icontains=filters['location'])
        
        if 'employment_type' in filters and filters['employment_type']:
            emp_type = filters['employment_type'].upper()
            if 'FULL' in emp_type:
                queryset = queryset.filter(job_type='full_time')
            elif 'PART' in emp_type:
                queryset = queryset.filter(job_type='part_time')
            elif 'CONTRACT' in emp_type:
                queryset = queryset.filter(job_type='contract')
            elif 'INTERN' in emp_type:
                queryset = queryset.filter(job_type='internship')
        
        if 'remote' in filters and filters['remote']:
            queryset = queryset.filter(job_is_remote=True)
        
        if 'search' in filters and filters['search']:
            from django.db.models import Q
            search = filters['search']
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(company__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset
