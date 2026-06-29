import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Edit3, Send, Check } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface AIConfidenceData {
  score: number;
  roleIdentified: boolean;
  skillsExtracted: boolean;
  responsibilitiesParsed: boolean;
  hiringPrioritiesIdentified: boolean;
  technologiesDetected: boolean;
}

export function JobCreationFlow({ onPostJob }: { onPostJob: (jobData: any) => void }) {
  const [expandedSection, setExpandedSection] = useState<string>('basic');
  const [aiTitle, setAiTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJD, setGeneratedJD] = useState('');
  const [confidenceData, setConfidenceData] = useState<AIConfidenceData | null>(null);

  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? '' : section);
  };

  const handleGenerateAI = async () => {
    if (!aiTitle) return;
    setIsGenerating(true);
    try {
      // Simulate API call to /api/generate-jd
      // const res = await fetch('http://localhost:8000/api/generate-jd', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ title: aiTitle })
      // });
      // const data = await res.json();
      
      // Simulated response for UI demonstration
      await new Promise(r => setTimeout(r, 2000));
      const mockMarkdown = `### Job Summary\nWe are looking for a highly skilled ${aiTitle}...\n\n### Key Responsibilities\n- Design and implement scalable systems\n- Collaborate with cross-functional teams\n\n### Required Skills\n- Python\n- React\n- PostgreSQL\n`;
      setGeneratedJD(mockMarkdown);
      setDescription(mockMarkdown);
      setExpandedSection('preview');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostJob = async () => {
    // Simulate AI parsing /process-job
    setConfidenceData(null);
    try {
      // const res = await fetch('http://localhost:8000/api/process-job', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ job_id: "temp_id", description })
      // });
      // const data = await res.json();

      await new Promise(r => setTimeout(r, 1500));
      
      // Mock confidence
      setConfidenceData({
        score: 96,
        roleIdentified: true,
        skillsExtracted: true,
        responsibilitiesParsed: true,
        hiringPrioritiesIdentified: true,
        technologiesDetected: true
      });

      onPostJob({ title: jobTitle || aiTitle, description });
    } catch (err) {
      console.error("AI processing failed, continuing manually", err);
      onPostJob({ title: jobTitle, description });
    }
  };

  const renderSectionHeader = (id: string, title: string, icon: React.ReactNode) => (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2D3042]/50 transition-colors"
      onClick={() => toggleSection(id)}
    >
      <div className="flex items-center gap-3">
        <div className="text-accent-blue">{icon}</div>
        <h3 className="font-sora font-semibold text-text-primary">{title}</h3>
      </div>
      {expandedSection === id ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-sora font-bold text-text-primary">Create Job Posting</h2>
          <p className="text-text-muted font-manrope text-sm mt-1">Leverage AI to perfectly capture your hiring intent.</p>
        </div>
      </div>

      <div className="bg-[#1F212E] border border-[#2D3042] rounded-2xl overflow-hidden shadow-xl">
        {/* Basic Information */}
        <div className="border-b border-[#2D3042]">
          {renderSectionHeader('basic', 'Basic Information', <Edit3 className="w-5 h-5" />)}
          {expandedSection === 'basic' && (
            <div className="p-4 pt-0 space-y-4 font-manrope animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Job Title</label>
                <input 
                  type="text" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-[#161820] border border-[#2D3042] rounded-lg p-3 text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                  placeholder="e.g. Senior AI Engineer"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestion Panel */}
        <div className="border-b border-[#2D3042] bg-gradient-to-r from-[#161820] to-[#1F212E]">
          {renderSectionHeader('ai', 'AI Job Description Assistant', <Sparkles className="w-5 h-5 text-accent-orange" />)}
          {expandedSection === 'ai' && (
            <div className="p-6 pt-0 space-y-4 font-manrope animate-fade-in">
              <div className="bg-[#161820] border border-[#2D3042] rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-orange/10 blur-3xl rounded-full" />
                <p className="text-sm text-text-secondary mb-3">
                  Enter a role below, and our AI will generate a comprehensive, professional job description instantly.
                </p>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={aiTitle}
                    onChange={(e) => setAiTitle(e.target.value)}
                    className="flex-1 bg-[#1F212E] border border-[#2D3042] rounded-lg p-3 text-text-primary focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
                    placeholder="e.g. AI Engineer, Backend Developer"
                  />
                  <Button variant="primary" onClick={handleGenerateAI} disabled={isGenerating || !aiTitle}>
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {isGenerating ? 'Generating...' : 'Generate AI Suggestion'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Job Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#161820] border border-[#2D3042] rounded-lg p-3 text-text-primary min-h-[200px] focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                  placeholder="The job description will appear here. You can manually edit it or use the AI Assistant."
                />
              </div>

              {generatedJD && (
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={handleGenerateAI}><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</Button>
                  <Button variant="primary"><Check className="w-4 h-4 mr-2" /> Accept</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="primary" size="lg" onClick={handlePostJob} className="shadow-lg shadow-accent-blue/20">
          <Send className="w-5 h-5 mr-2" /> Post Job
        </Button>
      </div>

      {/* AI Confidence Score Panel */}
      {confidenceData && (
        <div className="bg-[#161820] border border-accent-green/30 rounded-2xl p-6 mt-8 animate-fade-in-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-accent-green" />
                <h3 className="text-lg font-sora font-bold text-text-primary">AI Understanding Complete</h3>
              </div>
              <p className="text-text-muted text-sm font-manrope">The system has successfully extracted structured hiring intent from your job description.</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-sora font-extrabold text-accent-green">{confidenceData.score}%</div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-bold mt-1">Confidence Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${confidenceData.roleIdentified ? 'text-accent-green' : 'text-text-muted'}`} />
              <span className="text-sm text-text-secondary font-manrope">Role Identified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${confidenceData.skillsExtracted ? 'text-accent-green' : 'text-text-muted'}`} />
              <span className="text-sm text-text-secondary font-manrope">Skills Extracted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${confidenceData.responsibilitiesParsed ? 'text-accent-green' : 'text-text-muted'}`} />
              <span className="text-sm text-text-secondary font-manrope">Responsibilities Parsed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${confidenceData.hiringPrioritiesIdentified ? 'text-accent-green' : 'text-text-muted'}`} />
              <span className="text-sm text-text-secondary font-manrope">Hiring Priorities Identified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${confidenceData.technologiesDetected ? 'text-accent-green' : 'text-text-muted'}`} />
              <span className="text-sm text-text-secondary font-manrope">Technologies Detected</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
