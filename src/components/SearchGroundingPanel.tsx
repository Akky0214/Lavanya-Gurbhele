import React, { useState } from 'react';
import {
  Globe,
  Search,
  X,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { GroundedSearchResult } from '../types/energy';

interface SearchGroundingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const SearchGroundingPanel: React.FC<SearchGroundingPanelProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(
    initialQuery ||
      'Current US IRA 25C tax credits and state rebates for cold-climate heat pumps and battery storage'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroundedSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    'US IRA 25C & 179D tax deductions for heat pumps & building efficiency',
    'Cold climate heat pump COP & SEER2 Energy Star Most Efficient 2025/2026 benchmarks',
    'Commercial peak demand electricity tariffs and battery storage arbitrage',
    'European Union Ecodesign heat pump regulations and phase-out of fluorinated gases',
  ];

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch search-grounded data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Google Search Grounding</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live web retrieval for real-world utility tariffs, IRA tax credits, equipment ratings & standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about utility rates, heat pump subsidies, ASHRAE standards..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-cyan-950/40 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Ground Search</span>
            </button>
          </form>

          {/* Quick Pre-fill Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Trending:</span>
            {sampleQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(sq);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 border border-slate-700/80 transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs">Searching live web with Google Search & synthesizing with Gemini 3.8 Flash...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
              <p className="font-semibold mb-1">Search Error</p>
              <p>{error}</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-4">
              {/* Verified Web Sources Pills */}
              {result.sources && result.sources.length > 0 && (
                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Verified Web Grounding Sources ({result.sources.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-900 text-slate-200 hover:text-white hover:border-cyan-400 border border-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[240px]">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounded Synthesis Markdown Content */}
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap font-sans text-xs">
                {result.text}
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Globe className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              <p>Type any energy efficiency query above or select one of the trending topics.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Data is verified through live Google Search grounding.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
