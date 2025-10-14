import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useApp } from '../contexts/AppContext';

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches] = useState(['AI Technology', 'Remote Work', 'Sustainability']);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state } = useApp();
  const { results, isSearching } = useSearch(state.articles, query);

  const suggestions = query.trim() ? results.slice(0, 5) : [];

  const { selectedIndex } = useKeyboardNavigation(suggestions, (article) => {
    navigate(`/article/${article.id}`);
    setIsOpen(false);
    setQuery('');
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search articles, authors, topics..."
          className="w-full pl-10 pr-4 py-2 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none transition-colors"
        />
      </form>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-900 border border-dark-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {query.trim() ? (
              <div className="p-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Articles
                    </div>
                    {suggestions.map((article, index) => (
                      <motion.button
                        key={article.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          navigate(`/article/${article.id}`);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                          selectedIndex === index
                            ? 'bg-primary-900/30 text-primary-300'
                            : 'hover:bg-dark-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <img
                            src={article.author.avatar}
                            alt={article.author.name}
                            className="w-8 h-8 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {article.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              by {article.author.name}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    <button
                      onClick={() => handleSearch(query)}
                      className="w-full text-left px-3 py-3 rounded-lg hover:bg-dark-800 text-primary-400 border-t border-dark-800 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Search for "{query}"</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <div className="px-3 py-8 text-center text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{query}"</p>
                    <button
                      onClick={() => handleSearch(query)}
                      className="mt-2 text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Search anyway
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 text-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{search}</span>
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide mt-4">
                  Trending
                </div>
                {['Artificial Intelligence', 'Remote Work', 'Sustainability'].map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(trend)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 text-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-primary-500" />
                      <span>{trend}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;