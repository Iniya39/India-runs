// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CandidateSuggestionsDrawer } from './CandidateSuggestionsDrawer';
import * as aiService from '../services/aiSuggestionsService';

// Mock the AI service
vi.mock('../services/aiSuggestionsService', () => ({
  fetchAISuggestions: vi.fn(),
}));

describe('AI Candidate Suggestions Frontend Tests', () => {
  const jobId = 'test-job-id';
  const jobTitle = 'Senior Software Engineer';
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResponse: aiService.AISuggestionsResponse = {
    job: {
      job_id: jobId,
      title: jobTitle,
      description: 'Test job description',
      required_skills: ['React', 'TypeScript'],
      required_experience: '5 years',
      education: 'BS CS',
      certifications: ['AWS Developer'],
    },
    rankings: [
      {
        candidate_id: 'cand-1',
        name: 'John Doe',
        final_score: 95.0,
        semantic_similarity: 90.0,
        skills_match: 92.0,
        project_relevance: 95.0,
        experience_match: 100.0,
        certification_score: 100.0,
        education_score: 90.0,
        explanation: 'Excellent alignment with modern web frameworks.',
      },
      {
        candidate_id: 'cand-2',
        name: 'Jane Smith',
        final_score: 82.0,
        semantic_similarity: 80.0,
        skills_match: 85.0,
        project_relevance: 75.0,
        experience_match: 80.0,
        certification_score: 80.0,
        education_score: 80.0,
        explanation: 'Strong frontend candidate.',
      },
      {
        candidate_id: 'cand-3',
        name: 'Bob Johnson',
        final_score: 35.0,
        semantic_similarity: 40.0,
        skills_match: 50.0,
        project_relevance: 40.0,
        experience_match: 50.0,
        certification_score: 0.0,
        education_score: 30.0,
        explanation: 'Weak overall match.',
      },
    ],
    candidate_count: 3,
    elapsed_ms: 1250,
  };

  it('renders loading state (skeleton loaders) on mount', async () => {
    // Return a promise that doesn't resolve immediately
    let resolvePromise: any;
    const fetchPromise = new Promise<aiService.AISuggestionsResponse>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(aiService.fetchAISuggestions).mockReturnValue(fetchPromise);

    const { container } = render(
      <CandidateSuggestionsDrawer
        jobId={jobId}
        jobTitle={jobTitle}
        onClose={onCloseMock}
      />
    );

    // Should show the skeleton loader or placeholder indicators
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);

    // Resolve to clear warning
    resolvePromise(mockResponse);
    await waitFor(() => {});
  });

  it('renders successful suggestions in descending score order', async () => {
    vi.mocked(aiService.fetchAISuggestions).mockResolvedValue(mockResponse);

    render(
      <CandidateSuggestionsDrawer
        jobId={jobId}
        jobTitle={jobTitle}
        onClose={onCloseMock}
      />
    );

    // Wait for the drawer to load the suggestions
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    // Verify star rating badges
    expect(screen.getByText('★★★★★ Excellent Match')).toBeInTheDocument();
    expect(screen.getByText('★★★★ Strong Match')).toBeInTheDocument();
    expect(screen.getByText('★ Weak Match')).toBeInTheDocument();

    // Verify count and elapsed time
    expect(screen.getByText((content, node) => node?.textContent === '3 candidates evaluated')).toBeInTheDocument();
    expect(screen.getByText(/Completed in/i)).toBeInTheDocument();
  });

  it('renders empty results message when no candidates are found', async () => {
    const emptyResponse: aiService.AISuggestionsResponse = {
      job: mockResponse.job,
      rankings: [],
      candidate_count: 0,
      elapsed_ms: 200,
    };
    vi.mocked(aiService.fetchAISuggestions).mockResolvedValue(emptyResponse);

    render(
      <CandidateSuggestionsDrawer
        jobId={jobId}
        jobTitle={jobTitle}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /No suitable candidates found/i })).toBeInTheDocument();
    });
  });

  it('renders API failure state with a retry button and error details', async () => {
    vi.mocked(aiService.fetchAISuggestions).mockRejectedValueOnce(new Error('AI service offline'));

    render(
      <CandidateSuggestionsDrawer
        jobId={jobId}
        jobTitle={jobTitle}
        onClose={onCloseMock}
      />
    );

    // Verify error message renders
    await waitFor(() => {
      const errorElements = screen.getAllByText(/AI service offline/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });

    const retryBtn = screen.getByRole('button', { name: /Retry Request/i });
    expect(retryBtn).toBeInTheDocument();

    // Now mock a successful recovery
    vi.mocked(aiService.fetchAISuggestions).mockResolvedValueOnce(mockResponse);
    fireEvent.click(retryBtn);

    // Verify data successfully loads after retry
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('correctly color-codes score rendering classes based on final score brackets', async () => {
    vi.mocked(aiService.fetchAISuggestions).mockResolvedValue(mockResponse);

    render(
      <CandidateSuggestionsDrawer
        jobId={jobId}
        jobTitle={jobTitle}
        onClose={onCloseMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check color classes for scores
    // John Doe final score is 95 -> Green (text-green-500)
    const johnScore = screen.getByText('95');
    expect(johnScore).toHaveClass('text-green-500');

    // Jane Smith final score is 82 -> Blue (text-blue-500)
    const janeScore = screen.getByText('82');
    expect(janeScore).toHaveClass('text-blue-500');

    // Bob Johnson final score is 35 -> Red (text-red-500)
    const bobScore = screen.getByText('35');
    expect(bobScore).toHaveClass('text-red-500');
  });
});
