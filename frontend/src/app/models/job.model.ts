// Job model
export interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  experience_required?: string;
  salary_range?: string;
  skills_required?: string;
  skills_list?: string[];
  status: 'open' | 'closed';
  posted_by?: number | null;
  posted_by_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  applications_count?: number;
  created_at: string;
  updated_at: string;

  // Unified external columns
  is_external?: boolean;
  external_job_id?: string;
  employer_logo?: string;
  employer_website?: string;
  job_publisher?: string;
  job_apply_link?: string;
  job_is_remote?: boolean;
  job_posted_at_datetime_utc?: string;
  job_benefits?: any;
  job_salary_string?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_period?: string;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  required_technologies?: any;
  employer_reviews?: any[];
  last_synced_at?: string;
  job_employment_type?: string;
}

// External Job model (extends Job for unified usage)
export interface ExternalJob extends Job {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_location?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_apply_link: string;
  job_description: string;
  job_employment_type?: string;
}

// External Job Search Request
export interface ExternalJobSearchRequest {
  query: string;
  num_pages?: number;
  country?: string;
  location?: string;
  date_posted?: 'all' | 'today' | '3days' | 'week' | 'month';
  work_from_home?: boolean;
  employment_types?: string;
  job_requirements?: string;
  radius?: number;
}

// External Job Search Filters
export interface ExternalJobFilters {
  days?: number;
  location?: string;
  employment_type?: string;
  remote?: boolean;
  search?: string;
}

// Job create/update request
export interface JobRequest {
  title: string;
  description: string;
  company: string;
  location: string;
  job_type: string;
  experience_required?: string;
  salary_range?: string;
  skills_required: string;
  status?: string;
}

// Application model
export interface Application {
  id: number;
  job: number;
  job_details?: {
    id: number;
    title: string;
    company: string;
    location: string;
  };
  candidate: number;
  candidate_details?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  cover_letter?: string;
  resume_url?: string;
  resume_blob?: string;
  resume_filename?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'referred';
  notes?: string;
  applied_at: string;
  updated_at: string;
}

// Application request
export interface ApplicationRequest {
  job: number;
  cover_letter?: string;
  resume_url?: string;
  resume_blob?: string;
  resume_filename?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
}
