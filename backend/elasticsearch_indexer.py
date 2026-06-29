from elasticsearch import Elasticsearch
import os

# Initialize Elasticsearch client
# For local dev, this would typically be http://localhost:9200
es_url = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch([es_url])

INDEX_NAME = "jobs"

def setup_elasticsearch_index():
    """
    Prepares the Elasticsearch index with mappings for searchable structured fields.
    Fields: Role, Location, Experience, Required Skills, Preferred Skills,
    Industry, Job Type, Education, Salary Range, Employment Type, Notice Period, 
    Work Mode, Company.
    """
    if not es.indices.exists(index=INDEX_NAME):
        mapping = {
            "mappings": {
                "properties": {
                    "role": {"type": "text"},
                    "location": {"type": "keyword"},
                    "experience": {"type": "keyword"},
                    "requiredSkills": {"type": "keyword"},
                    "preferredSkills": {"type": "keyword"},
                    "industry": {"type": "keyword"},
                    "jobType": {"type": "keyword"},
                    "education": {"type": "keyword"},
                    "salaryRange": {"type": "keyword"},
                    "employmentType": {"type": "keyword"},
                    "noticePeriod": {"type": "keyword"},
                    "workMode": {"type": "keyword"},
                    "companyName": {"type": "keyword"}
                }
            }
        }
        es.indices.create(index=INDEX_NAME, body=mapping)
        print(f"Created Elasticsearch index: {INDEX_NAME}")
    else:
        print(f"Elasticsearch index {INDEX_NAME} already exists.")

def index_job(job_id: str, job_data: dict):
    """
    Indexes a job's structured fields in Elasticsearch.
    """
    # Extract only the searchable fields from job_data
    document = {
        "role": job_data.get("role", ""),
        "location": job_data.get("location", ""),
        "experience": job_data.get("experienceRange", ""),
        "requiredSkills": job_data.get("requiredSkills", []),
        "preferredSkills": job_data.get("preferredSkills", []),
        "industry": job_data.get("industry", ""),
        "jobType": job_data.get("jobType", ""),
        "education": job_data.get("education", ""),
        "salaryRange": job_data.get("salary", ""),
        "employmentType": job_data.get("employmentType", ""),
        "noticePeriod": job_data.get("noticePeriod", ""),
        "workMode": job_data.get("workMode", ""),
        "companyName": job_data.get("companyName", "")
    }
    
    try:
        es.index(index=INDEX_NAME, id=job_id, document=document)
    except Exception as e:
        print(f"Failed to index job {job_id} in Elasticsearch: {e}")
