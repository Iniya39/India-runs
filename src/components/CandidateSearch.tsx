import React, { useState } from 'react';
import { Search, Filter, Loader2, Zap, Clock, Users, Database, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CandidateSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/search-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during search.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 font-manrope">
      {/* Search Header */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-border-warm shadow-warm-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Search className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="font-sora font-extrabold text-2xl md:text-3xl text-text-navy mb-3">
            Hybrid Candidate Retrieval
          </h2>
          <p className="text-text-muted text-sm mb-8 leading-relaxed">
            Describe the perfect candidate in plain English. Our engine uses an Elasticsearch first-pass filter followed by deep semantic vector search to find conceptually matched candidates instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. 'Need a Senior AI Engineer with Python, FastAPI, and Vector DBs in Chennai'"
                className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-border-warm focus:border-accent-purple focus:ring-4 focus:ring-accent-purple/10 text-text-navy font-medium outline-none transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-8 py-4 bg-accent-purple text-white rounded-xl font-bold hover:bg-accent-purple/90 transition-all shadow-warm-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Search
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          {error}
        </div>
      )}

      {/* Search Analytics & Results */}
      {results && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Analytics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-accent-purple rounded-lg"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Total Time</p>
                <p className="text-lg font-sora font-extrabold text-text-navy">{results.analytics.total_time_ms} ms</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-accent-orange rounded-lg"><Database className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Elasticsearch Pass</p>
                <p className="text-lg font-sora font-extrabold text-text-navy">{results.analytics.es_candidates_found}</p>
                <p className="text-[10px] text-text-muted">Candidates Filtered</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Zap className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Semantic Pass</p>
                <p className="text-lg font-sora font-extrabold text-text-navy">{results.analytics.final_candidates_returned}</p>
                <p className="text-[10px] text-text-muted">Conceptually Matched</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Sparkles className="w-5 h-5" /></div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Query Parsed In</p>
                <p className="text-lg font-sora font-extrabold text-text-navy">{results.analytics.query_parsing_ms} ms</p>
              </div>
            </div>
          </div>

          {/* AI Extracted Intent */}
          <div className="bg-gradient-to-r from-accent-purple/5 to-transparent p-5 rounded-xl border border-accent-purple/20 flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-shrink-0">
              <span className="text-xs font-bold text-accent-purple uppercase tracking-wider">AI Intent Parsed</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white rounded-md border border-border-warm font-bold text-text-navy">
                Role: {results.parsed_query.primaryRole}
              </span>
              {results.parsed_query.location && (
                <span className="px-2.5 py-1 bg-white rounded-md border border-border-warm text-text-navy">
                  Loc: {results.parsed_query.location}
                </span>
              )}
              {results.parsed_query.skills?.map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-purple-50 text-accent-purple rounded-md font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Candidate Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.candidates?.map((candidate: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-border-warm shadow-sm hover:shadow-warm-md hover:border-accent-purple/30 transition-all flex flex-col gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-bl-xl font-sora font-bold text-sm border-l border-b border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                  {candidate.similarity_score}% Match
                </div>
                
                <div>
                  <h3 className="font-sora font-extrabold text-text-navy text-lg pr-20 truncate">
                    {candidate.metadata?.name || 'Anonymous Candidate'}
                  </h3>
                  <p className="text-sm text-text-muted truncate">{candidate.metadata?.role || 'Software Engineer'}</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-orange" />
                  <span>Semantically matched to query intent</span>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-warm/50">
                  <span className="text-[10px] font-bold uppercase text-text-muted">Status: Open</span>
                  <button className="text-xs font-bold text-accent-purple hover:text-accent-purple/80 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
            
            {results.candidates?.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted flex flex-col items-center">
                <Users className="w-12 h-12 text-border-warm mb-3" />
                <p>No candidates found matching this semantic intent.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
