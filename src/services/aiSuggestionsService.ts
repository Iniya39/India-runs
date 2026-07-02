export interface JobSummary {
  job_id: string;
  title: string;
  description: string;
  required_skills: string[];
  required_experience: string | null;
  education: string | null;
  certifications: string[];
}

export interface RankedCandidate {
  candidate_id: string;
  name: string;
  final_score: number;
  semantic_similarity: number;
  skills_match: number;
  project_relevance: number;
  experience_match: number;
  certification_score: number;
  education_score: number;
  explanation: string;
}

export interface AISuggestionsResponse {
  job: JobSummary;
  rankings: RankedCandidate[];
  candidate_count: number;
  elapsed_ms: number;
}

// Access environment variable with fallback to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetches AI-ranked candidate suggestions for a given job ID.
 * Uses the existing backend endpoint: GET /api/jobs/{job_id}/ai-suggestions
 */
export const fetchAISuggestions = async (jobId: string): Promise<AISuggestionsResponse> => {
  if (!jobId || !jobId.trim()) {
    throw new Error('Job ID is required.');
  }

  const url = `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId.trim())}/ai-suggestions`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch AI candidate suggestions.';
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (_) {
      // Ignore JSON parse errors and use default fallback message
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
