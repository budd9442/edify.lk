import React, { useRef } from 'react';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Article } from '../../types/payload';
import TagPill from '../TagPill';
import LoaderSkeleton from '../LoaderSkeleton';
import ArticleCardMobile from '../ArticleCardMobile';
import AuthorCard from '../AuthorCard';
import type { SearchType, Tag, Author } from '../../hooks/useArticleSearch';

export interface MobileSearchViewProps {
    query: string;
    setQuery: (q: string) => void;
    sortBy: 'relevance' | 'date' | 'likes';
    setSortBy: (s: 'relevance' | 'date' | 'likes') => void;
    searchType: SearchType;
    setSearchType: (t: SearchType) => void;
    results: any[];
    isSearching: boolean;
    allTags: Tag[];
    isLoading?: boolean;
}

const MobileSearchView: React.FC<MobileSearchViewProps> = ({
    query,
    setQuery,
    sortBy,
    setSortBy,
    searchType,
    setSearchType,
    results,
    isSearching,
    allTags,
    isLoading = false
}) => {
    const [showFilters, setShowFilters] = React.useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const clearFilters = () => {
        setSortBy('relevance');
        setShowFilters(false);
    };

    return (
        <div className="min-h-screen bg-dark-950 pb-20">
            {/* Search Header */}
            <div className="sticky top-0 z-40 bg-dark-950 px-4 py-3 border-b border-dark-800 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${searchType}...`}
                        className="w-full bg-dark-900 border border-dark-800 rounded-xl py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                    {isSearching ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                        </div>
                    ) : query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search Mode Toggles */}
                <div className="flex p-1 bg-dark-900 rounded-lg border border-dark-800">
                    {(['articles', 'authors', 'tags'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSearchType(type)}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${searchType === type
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-300'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Filter Toggle (Only for Articles?) */}
                {searchType === 'articles' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${showFilters || sortBy !== 'relevance'
                                ? 'bg-primary-900/20 border-primary-500/50 text-primary-400'
                                : 'bg-dark-900 border-dark-800 text-gray-400'
                                }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Drawer */}
            <AnimatePresence>
                {showFilters && searchType === 'articles' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-dark-900 border-b border-dark-800 overflow-hidden"
                    >
                        <div className="p-4 space-y-6">
                            {/* Sort */}
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'relevance', label: 'Relevance' },
                                        { value: 'date', label: 'Newest' },
                                        { value: 'likes', label: 'Most Liked' }
                                    ].map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => setSortBy(option.value as any)}
                                            className={`px-4 py-2 rounded-lg text-sm border transition-colors ${sortBy === option.value
                                                ? 'bg-primary-600 text-white border-primary-500'
                                                : 'bg-dark-800 text-gray-400 border-dark-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2 border-t border-dark-800">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="px-4 py-4">
                {isLoading ? (
                    <LoaderSkeleton variant={searchType === 'authors' ? 'author' : 'article'} count={3} />
                ) : (
                    <>
                        {/* Results Count */}
                        {!isLoading && (
                            <div className="mb-4 text-sm text-gray-500">
                                {results.length} results found
                            </div>
                        )}

                        {results.length > 0 ? (
                            <div className="space-y-4">
                                {searchType === 'articles' && results.map((article: Article, index: number) => (
                                    <ArticleCardMobile key={article.id} article={article} index={index} />
                                ))}

                                {searchType === 'authors' && results.map((author: Author, index: number) => (
                                    <motion.div
                                        key={author.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <AuthorCard author={author} variant="compact" />
                                    </motion.div>
                                ))}

                                {searchType === 'tags' && (
                                    <div className="flex flex-wrap gap-2">
                                        {results.map((tag: Tag, index: number) => (
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
                        ) : (
                            <div className="text-center py-12">
                                <Search className="w-12 h-12 text-dark-800 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-1">No matches found</h3>
                                <p className="text-gray-400 text-sm">Try adjusting your search</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MobileSearchView;
