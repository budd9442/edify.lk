import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Calendar, Heart, MessageCircle, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useArticleSearch } from '../hooks/useArticleSearch';
import MobileSearchView from '../components/search/MobileSearchView';
import LoaderSkeleton from '../components/LoaderSkeleton';
import TagPill from '../components/TagPill';
import AuthorCard from '../components/AuthorCard';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const {
    query,
    setQuery,
    searchType,
    setSearchType,
    sortBy,
    setSortBy,
    selectedTags,
    setSelectedTags,
    results,
    isSearching,
    allTags,
    isLoading
  } = useArticleSearch();

  // Sync URL with query
  React.useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  }, [query]);

  // Mobile View
  return (
    <div className="min-h-screen bg-dark-950">
      <div className="md:hidden">
        <MobileSearchView
          query={query}
          setQuery={setQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchType={searchType}
          setSearchType={setSearchType}
          results={results}
          isSearching={isSearching}
          allTags={allTags}
          isLoading={isLoading}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          {/* Search Type Toggles for Desktop (Optional but useful given we have mixed results) */}
          <div className="flex gap-4 mt-4 border-b border-dark-800 pb-1">
            {(['articles', 'authors', 'tags'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type)}
                className={`pb-2 px-1 text-sm font-medium transition-colors relative ${searchType === type ? 'text-primary-500' : 'text-gray-400 hover:text-white'
                  }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {searchType === type && (
                  <motion.div layoutId="searchTypeUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                )}
              </button>
            ))}
          </div>
          {!isSearching && !isLoading && (
            <p className="text-gray-400 mt-4">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {searchType === 'articles' && (
            <aside className="lg:w-64 space-y-6">
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
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${sortBy === option.value
                        ? 'bg-primary-900/30 text-primary-300 border border-primary-500/50'
                        : 'text-gray-300 hover:bg-dark-800'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-dark-900 border border-dark-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filter by topics</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 15).map(tag => (
                    <TagPill
                      key={tag.name}
                      tag={tag.name}
                      isActive={selectedTags.includes(tag.name)}
                      onClick={() => setSelectedTags(
                        selectedTags.includes(tag.name)
                          ? selectedTags.filter(t => t !== tag.name)
                          : [...selectedTags, tag.name]
                      )}
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
          )}

          <main className="flex-1">
            {isLoading || isSearching ? (
              <LoaderSkeleton variant={searchType === 'authors' ? 'author' : 'article'} count={3} />
            ) : results.length > 0 ? (
              <div className={searchType === 'authors' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-6"}>
                {searchType === 'articles' && results.map((article: any, index: number) => (
                  <motion.article
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-dark-900 border border-dark-800 rounded-lg p-4 sm:p-6 hover:border-primary-500/50 transition-all duration-300"
                  >
                    <Link to={`/article/${article.slug}`}>
                      <div className="flex flex-col sm:flex-row gap-4 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-3">
                            {article.tags.slice(0, 3).map((tag: string) => (
                              <TagPill
                                key={tag}
                                tag={tag}
                                variant="outline"
                                size="sm"
                              />
                            ))}
                          </div>

                          <h2 className="text-xl font-semibold text-white mb-2 hover:text-primary-400 transition-colors">
                            {article.title}
                          </h2>

                          <p className="text-gray-400 mb-4 line-clamp-2">
                            {article.excerpt}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{article.views?.toLocaleString() || 0}</span>
                              </div>
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

                {searchType === 'authors' && results.map((author: any, index: number) => (
                  <motion.div
                    key={author.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AuthorCard author={author} variant="detailed" />
                  </motion.div>
                ))}

                {searchType === 'tags' && (
                  <div className="flex flex-wrap gap-2">
                    {results.map((tag: any) => (
                      <TagPill
                        key={tag.name}
                        tag={`${tag.name} (${tag.count})`}
                        variant="outline"
                        onClick={() => {
                          setQuery(tag.name);
                          setSearchType('articles');
                        }}
                      />
                    ))}
                  </div>
                )}

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
                  We couldn't find any {searchType} matching "{query}". Try adjusting your search terms or filters.
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