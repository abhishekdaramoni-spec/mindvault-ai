import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Bell, ArrowRight, BookOpen, X } from 'lucide-react';
import { searchKnowledge, SearchResult } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await searchKnowledge(searchTerm);
        setSuggestions(res.slice(0, 4));
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectResult = (res: SearchResult) => {
    setShowDropdown(false);
    navigate(`/chat?q=${encodeURIComponent(res.excerpt.slice(0, 80))}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowDropdown(false);
      if (onSearch) onSearch(searchTerm);
      else navigate(`/chat?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="h-16 border-b border-[#1a2336] bg-[#0c111e]/85 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-6 pl-72 shadow-lg shadow-black/20">
      {/* Global Quick Search Bar with Instant Suggestions */}
      <div className="relative w-96 max-w-full">
        <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Semantic search across all documents & concepts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          className="w-full bg-[#111827] border border-[#1f293d] rounded-xl pl-10 pr-8 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500/80 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-inner"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dropdown Suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-[#111827] border border-[#1f293d] rounded-xl shadow-2xl p-2 z-50 space-y-1 divide-y divide-[#1f293d]/60">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center justify-between">
              <span>Instant Vault Matches</span>
              <span className="text-cyan-400 font-mono">{suggestions.length} Found</span>
            </div>
            <div className="space-y-1 pt-1">
              {suggestions.map((s) => (
                <div
                  key={s.chunk_id}
                  onClick={() => handleSelectResult(s)}
                  className="p-2 rounded-lg hover:bg-[#1a2336] cursor-pointer text-xs space-y-1 transition"
                >
                  <div className="flex items-center justify-between font-semibold text-violet-300 text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      {s.document_title}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">p.{s.page_number || 1}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 italic">"{s.excerpt}"</p>
                </div>
              ))}
            </div>
            <div className="pt-2 px-2 pb-1 text-center">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate(`/chat?q=${encodeURIComponent(searchTerm)}`);
                }}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1 w-full font-semibold"
              >
                <span>Ask MindVault Chat regarding "{searchTerm}"</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/15 border border-violet-500/30 text-cyan-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>Local Intelligence Active</span>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-[#162035] transition border border-[#1f293d]"
          title="System Settings"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
