import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Calendar, Heart, MessageCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSearch } from '../hooks/useSearch';
import { useApp } from '../contexts/AppContext';
import LoaderSkeleton from '../components/LoaderSkeleton';
import TagPill from '../components/TagPill';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'likes'>('relevance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { state } = useApp();
  const { results, isSearching } = useSearch(state.articles, query);

  const allTags = Array.from(new Set(state.articles.flatMap(article => article.tags)));

  const filteredResults = results.filter(article => {
    if (selectedTags.length === 0) return true;
    return selectedTags.some(tag => article.tags.includes(tag));
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case 'likes':
        return b.likes - a.likes;
      default:
        return 0; // Relevance is handled by Fuse.js
    }
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span>Search</span>
          {query && (
            <>
              <span>/</span>
              <span className="text-white">"{query}"</span>
            </>
          )}
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          {!isSearching && (
            <p className="text-gray-400">
              {sortedResults.length} {sortedResults.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 space-y-6">
            {/* Sort Options */}
            <div className="bg-dark-900 border border-dark-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <SortAsc className="w-5 h-5" />
                <span>Sort by</span>
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'date', label: 'Most Recent' },
                  { value: 'likes', label: 'Most Liked' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      sortBy === option.value
                        ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                        : 'text-gray-300 hover:bg-dark-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filters */}
            <div className="bg-dark-900 border border-dark-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filter by tags</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <TagPill
                    key={tag}
                    tag={tag}
                    isActive={selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    variant="outline"
                    size="sm"
                  />
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            {isSearching ? (
              <LoaderSkeleton variant="article" count={3} />
            ) : sortedResults.length > 0 ? (
              <div className="space-y-6">
                {sortedResults.map((article, index) => (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-dark-900 border border-dark-800 rounded-lg p-6 hover:border-primary-500/50 transition-all duration-300"
                  >
                    <Link to={`/article/${article.id}`}>
                      <div className="flex space-x-4">
                        <div className="flex-1">
                          {/* Tags */}
                          <div className="flex items-center space-x-2 mb-3">
                            {article.tags.slice(0, 3).map(tag => (
                              <TagPill
                                key={tag}
                                tag={tag}
                                variant="outline"
                                size="sm"
                              />
                            ))}
                          </div>

                          {/* Title */}
                          <h2 className="text-xl font-semibold text-white mb-2 hover:text-primary-400 transition-colors">
                            {article.title}
                          </h2>

                          {/* Excerpt */}
                          <p className="text-gray-400 mb-4 line-clamp-2">
                            {article.excerpt}
                          </p>

                          {/* Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <img
                                  src={article.author.avatar}
                                  alt={article.author.name}
                                  className="w-6 h-6 rounded-full"
                                />
                                <span className="text-sm text-gray-300">{article.author.name}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">
                                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{article.readingTime} min read</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">{article.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">{article.comments.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cover Image */}
                        {article.coverImage && (
                          <div className="w-32 h-24 flex-shrink-0">
                            <img
                              src={article.coverImage}
                              alt={article.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            ) : query ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No results found</h2>
                <p className="text-gray-400 mb-6">
                  We couldn't find any articles matching "{query}". Try adjusting your search terms or filters.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Check your spelling</p>
                  <p>• Try different keywords</p>
                  <p>• Remove filters to see more results</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Start searching</h2>
                <p className="text-gray-400">
                  Enter a search term to find articles, authors, and topics.
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;