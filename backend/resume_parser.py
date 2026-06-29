import io
import os
import fitz  # PyMuPDF
from docx import Document
from google import genai
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Ensure GEMINI_API_KEY is available
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class ResumeBasics(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    location: str = ""
    summary: str = ""

class ResumeExperience(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""

class ResumeEducation(BaseModel):
    degree: str = ""
    university: str = ""
    graduationYear: str = ""
    cgpa: str = ""

class ResumeProject(BaseModel):
    name: str = ""
    description: str = ""
    link: str = ""

class ResumeCertification(BaseModel):
    name: str = ""
    organization: str = ""
    year: str = ""

class ParsedResume(BaseModel):
    basics: ResumeBasics
    skills: List[str] = Field(default_factory=list)
    softSkills: List[str] = Field(default_factory=list)
    experience: List[ResumeExperience] = Field(default_factory=list)
    education: List[ResumeEducation] = Field(default_factory=list)
    projects: List[ResumeProject] = Field(default_factory=list)
    certifications: List[ResumeCertification] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    research: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    text = ""
    if filename.lower().endswith(".pdf"):
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text("text") + "\n"
    elif filename.lower().endswith(".docx"):
        doc = Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    else:
        # Fallback for plain text or unsupported
        try:
            text = file_bytes.decode("utf-8")
        except:
            pass
    return text.strip()

def parse_resume_to_json(text: str) -> ParsedResume:
    prompt = f"""
    You are an expert AI Resume Parser. Extract the following information from the provided resume text.
    Structure the data exactly as requested in the JSON schema.
    If a field is not found, leave it as an empty string or empty array.
    
    Resume Text:
    ---
    {text}
    ---
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-pro',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': ParsedResume,
            'temperature': 0.1
        }
    )
    
    return ParsedResume.model_validate_json(response.text)
