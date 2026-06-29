from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Import our new modules
from database import get_supabase
from job_parser import parse_job_description
from jd_generator import generate_jd_suggestion
from embedding_service import generate_embedding
from chroma_service import store_job_embedding, store_candidate_embedding
from elasticsearch_indexer import index_job, setup_elasticsearch_index

# Resume AI Modules
from resume_parser import extract_text_from_bytes, parse_resume_to_json
from project_intelligence import analyze_projects
from skill_inference import infer_hidden_skills
from career_analyzer import analyze_career
from education_parser import analyze_education
from certification_parser import analyze_certifications
from evidence_confidence import calculate_evidence_confidence
from candidate_indexer import index_candidate, setup_candidate_index
from retrieval_service import retrieve_candidates
from ranking_engine import rank_candidates
from reverse_recruitment import find_passive_candidates_for_job
from comparison_engine import generate_comparison
import uuid
import datetime

# Try to load from the root folder if running from backend folder
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv()

app = FastAPI(title="TalentSphere AI Backend")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional: setup ES index on startup
@app.on_event("startup")
async def startup_event():
    try:
        setup_elasticsearch_index()
        setup_candidate_index()
    except Exception as e:
        print(f"Warning: Elasticsearch setup failed on startup: {e}")

class JDSuggestionRequest(BaseModel):
    title: str

@app.post("/api/generate-jd")
async def generate_jd(request: JDSuggestionRequest):
    try:
        suggestion = generate_jd_suggestion(request.title)
        return suggestion.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProcessJobRequest(BaseModel):
    job_id: str
    description: str
    location: str = ""
    salary: str = ""
    employmentType: str = ""
    jobType: str = ""
    companyName: str = ""
    workMode: str = ""
    noticePeriod: str = ""
    experienceLevel: str = ""
    industry: str = ""

@app.post("/api/process-job")
async def process_job(request: ProcessJobRequest):
    try:
        supabase = get_supabase()
        
        # 1. Parse Job Description using Gemini
        parsed_data = parse_job_description(request.description)
        
        # 2. Save structured data to Supabase (PostgreSQL)
        job_data = {
            "id": request.job_id,
            "role": parsed_data.role,
            "department": parsed_data.department,
            "domain": parsed_data.domain,
            "seniorityLevel": parsed_data.seniorityLevel,
            "industry": request.industry or parsed_data.industry,
            "experienceRange": request.experienceLevel or parsed_data.experienceRange,
            "education": parsed_data.education,
            "primarySkills": parsed_data.primarySkills,
            "secondarySkills": parsed_data.secondarySkills,
            "requiredSkills": parsed_data.requiredSkills,
            "preferredSkills": parsed_data.preferredSkills,
            "mustHaveSkills": parsed_data.mustHaveSkills,
            "niceToHaveSkills": parsed_data.niceToHaveSkills,
            "programmingLanguages": parsed_data.programmingLanguages,
            "frameworks": parsed_data.frameworks,
            "libraries": parsed_data.libraries,
            "databases": parsed_data.databases,
            "cloudPlatforms": parsed_data.cloudPlatforms,
            "devopsTools": parsed_data.devopsTools,
            "aiTechnologies": parsed_data.aiTechnologies,
            "softSkills": parsed_data.softSkills,
            "certifications": parsed_data.certifications,
            "responsibilities": parsed_data.responsibilities,
            "businessObjectives": parsed_data.businessObjectives,
            "hiringPriorities": parsed_data.hiringPriorities,
            "importantHiddenRequirements": parsed_data.importantHiddenRequirements
        }
        
        # Upsert into parsed_jobs table
        result = supabase.table("parsed_jobs").upsert(job_data).execute()
        
        # 3. Generate a combined semantic text string for the embedding
        semantic_text = f"Role: {parsed_data.role}. Domain: {parsed_data.domain}. " \
                        f"Industry: {job_data['industry']}. Seniority: {parsed_data.seniorityLevel}. " \
                        f"Required Skills: {', '.join(parsed_data.requiredSkills)}. " \
                        f"Hidden Requirements: {', '.join(parsed_data.importantHiddenRequirements)}. " \
                        f"Hiring Priorities: {', '.join(parsed_data.hiringPriorities)}."
                        
        # 4. Generate the embedding
        embedding = generate_embedding(semantic_text)
        
        # 5. Store in ChromaDB
        store_job_embedding(job_id=request.job_id, embedding=embedding, metadata={"role": parsed_data.role})
        
        # 6. Prepare Elasticsearch Indexing (Part 5)
        try:
            es_data = {
                "role": parsed_data.role,
                "location": request.location,
                "experienceRange": request.experienceLevel,
                "requiredSkills": parsed_data.requiredSkills,
                "preferredSkills": parsed_data.preferredSkills,
                "industry": request.industry or parsed_data.industry,
                "jobType": request.jobType,
                "education": parsed_data.education,
                "salary": request.salary,
                "employmentType": request.employmentType,
                "noticePeriod": request.noticePeriod,
                "workMode": request.workMode,
                "companyName": request.companyName
            }
            index_job(request.job_id, es_data)
        except Exception as es_error:
            print(f"Warning: Elasticsearch indexing failed: {es_error}")

        return {"message": "Job processed successfully", "job_id": request.job_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process-resume")
async def process_resume(
    candidate_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        supabase = get_supabase()
        file_bytes = await file.read()
        
        # 1. Store the original file in Supabase Storage
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
        timestamp = datetime.datetime.now().strftime("%Y%md%H%M%S")
        storage_path = f"{candidate_id}/{timestamp}_{file.filename}"
        
        try:
            supabase.storage.from_("resumes").upload(file=file_bytes, path=storage_path, file_options={"content-type": file.content_type})
            resume_url = supabase.storage.from_("resumes").get_public_url(storage_path)
        except Exception as storage_e:
            print(f"Warning: Resume upload to storage failed, proceeding anyway: {storage_e}")
            resume_url = ""
            
        # 2. Extract Text and Base Parsing
        text = extract_text_from_bytes(file_bytes, file.filename)
        base_parsed = parse_resume_to_json(text)
        
        # 3. AI Intelligence Modules
        import json
        projects_json = json.dumps([p.model_dump() for p in base_parsed.projects])
        project_intel = analyze_projects(text, projects_json)
        
        explicit_skills = base_parsed.skills + base_parsed.softSkills
        hidden_skills = infer_hidden_skills(text, explicit_skills)
        
        exp_json = json.dumps([e.model_dump() for e in base_parsed.experience])
        career_intel = analyze_career(exp_json)
        
        edu_json = json.dumps([e.model_dump() for e in base_parsed.education])
        education_intel = analyze_education(text, edu_json)
        
        cert_json = json.dumps([c.model_dump() for c in base_parsed.certifications])
        certification_intel = analyze_certifications(text, cert_json)
        
        # Gather all skills for confidence
        all_found_skills = explicit_skills.copy()
        for h in hidden_skills:
            all_found_skills.append(h['skill'])
        
        evidence_conf = calculate_evidence_confidence(text, all_found_skills)
        
        # 4. Save to PostgreSQL (candidateProfiles)
        resume_metadata = {
            "resume_url": resume_url,
            "uploaded_at": timestamp,
            "file_name": file.filename,
            "file_size": len(file_bytes),
            "version": timestamp
        }
        
        db_data = {
            "id": candidate_id,
            "basics": base_parsed.basics.model_dump(),
            "skills": base_parsed.skills,
            "softSkills": base_parsed.softSkills,
            "experience": base_parsed.experience,
            "education": base_parsed.education,
            "projects": base_parsed.projects,
            "certifications": base_parsed.certifications,
            "achievements": base_parsed.achievements,
            "research": base_parsed.research,
            "languages": base_parsed.languages,
            "projectIntelligence": project_intel,
            "hiddenSkills": hidden_skills,
            "careerIntelligence": career_intel,
            "evidenceConfidence": evidence_conf,
            "resumeMetadata": resume_metadata,
            "profileComplete": True
        }
        
        supabase.table("candidateProfiles").upsert(db_data).execute()
        
        # 5. Generate Semantic Embeddings (ChromaDB)
        # We will create a combined text string for candidate embedding
        candidate_semantic_text = f"Title/Role: {base_parsed.basics.summary}. " \
                                  f"Skills: {', '.join(all_found_skills)}. " \
                                  f"Experience: {exp_json}. Projects: {projects_json}."
        
        try:
            candidate_embedding = generate_embedding(candidate_semantic_text)
            store_candidate_embedding(candidate_id, candidate_embedding, metadata={"name": base_parsed.basics.name, "role": base_parsed.basics.summary})
        except Exception as emb_e:
            print(f"Warning: Candidate embedding failed: {emb_e}")
        
        # 6. Elasticsearch Indexing
        es_data = {
            "location": base_parsed.basics.location,
            "experienceLevel": career_intel.get("careerProgression", ""),
            "skills": all_found_skills,
            "education": [e["degree"] for e in base_parsed.education.model_dump() if "degree" in e] if hasattr(base_parsed.education, "model_dump") else [],
            "certifications": [c.get("certificationName", "") for c in certification_intel]
        }
        index_candidate(candidate_id, es_data)
        
        return {"message": "Resume processed successfully", "data": db_data}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class SearchCandidatesRequest(BaseModel):
    query: str
    filters: dict = {}

@app.post("/api/search-candidates")
async def search_candidates(request: SearchCandidatesRequest):
    try:
        results = retrieve_candidates(request.query, request.filters)
        
        # In a real app we would fetch the full candidate profile from Supabase using the candidate_ids
        # but for this phase we'll just return the structured results directly.
        
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class RankCandidatesRequest(BaseModel):
    job_data: dict
    semantic_candidates: list

@app.post("/api/rank-candidates")
async def api_rank_candidates(request: RankCandidatesRequest):
    try:
        results = rank_candidates(request.job_data, request.semantic_candidates)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ReverseRecruitmentRequest(BaseModel):
    job_data: dict

@app.post("/api/reverse-recruitment")
async def api_reverse_recruitment(request: ReverseRecruitmentRequest):
    try:
        results = find_passive_candidates_for_job(request.job_data)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class CompareCandidatesRequest(BaseModel):
    job_data: dict
    candidates: list

@app.post("/api/compare-candidates")
async def api_compare_candidates(request: CompareCandidatesRequest):
    try:
        results = generate_comparison(request.job_data, request.candidates)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
