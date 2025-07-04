import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Compass, 
  TrendingUp, 
  Star, 
  Hash, 
  Users, 
  Filter,
  Grid,
  List
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ArticleCard from '../components/ArticleCard';
import AuthorCard from '../components/AuthorCard';
import TagPill from '../components/TagPill';
import LoaderSkeleton from '../components/LoaderSkeleton';
import { mockUsers } from '../mock-data/articles';

const ExplorePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'tags' | 'authors' | 'featured'>('trending');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const { state } = useApp();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const trendingArticles = [...state.articles]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 6);

  const featuredArticles = state.articles.filter(article => article.featured);

  const allTags = Array.from(new Set(state.articles.flatMap(article => article.tags)))
    .map(tag => ({
      name: tag,
      count: state.articles.filter(article => article.tags.includes(tag)).length
    }))
    .sort((a, b) => b.count - a.count);

  const topAuthors = mockUsers.slice(0, 6);

  const filteredArticles = selectedTag 
    ? state.articles.filter(article => article.tags.includes(selectedTag))
    : state.articles;

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'tags', label: 'Topics', icon: Hash },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'authors', label: 'Authors', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-white">Explore</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
              <Compass className="w-8 h-8 text-primary-500" />
              <span>Explore</span>
            </h1>
            <p className="text-gray-400">
              Discover trending content, topics, and authors across the platform
            </p>
          </div>
          
          {(activeTab === 'trending' || activeTab === 'featured') && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-900/30 text-primary-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-900/30 text-primary-300'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-8 bg-dark-900 p-1 rounded-lg border border-dark-800">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedTag(null);
                  setLoading(true);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {activeTab === 'authors' ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <LoaderSkeleton variant="author" count={6} />
              </div>
            ) : (
              <LoaderSkeleton variant="article" count={3} />
            )}
          </div>
        ) : (
          <>
            {/* Trending Articles */}
            {activeTab === 'trending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-primary-500" />
                    <span>Trending Articles</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Based on likes and engagement
                  </span>
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {trendingArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ArticleCard article={article} featured />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {trendingArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Topics/Tags */}
            {activeTab === 'tags' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Hash className="w-6 h-6 text-primary-500" />
                    <span>Browse by Topic</span>
                  </h2>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Tag Cloud */}
                <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Popular Topics</h3>
                  <div className="flex flex-wrap gap-3">
                    {allTags.map(tag => (
                      <TagPill
                        key={tag.name}
                        tag={`${tag.name} (${tag.count})`}
                        isActive={selectedTag === tag.name}
                        onClick={() => setSelectedTag(tag.name)}
                        variant="outline"
                      />
                    ))}
                  </div>
                </div>

                {/* Filtered Articles */}
                {selectedTag && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Articles tagged with "{selectedTag}"
                    </h3>
                    <div className="space-y-6">
                      {filteredArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ArticleCard article={article} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Featured Articles */}
            {activeTab === 'featured' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Star className="w-6 h-6 text-primary-500" />
                    <span>Editor's Picks</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Curated by our editorial team
                  </span>
                </div>
                
                {viewMode === 'grid' ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {featuredArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ArticleCard article={article} featured />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {featuredArticles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ArticleCard article={article} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Top Authors */}
            {activeTab === 'authors' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary-500" />
                    <span>Top Authors</span>
                  </h2>
                  <span className="text-sm text-gray-400">
                    Most followed writers on the platform
                  </span>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {topAuthors.map((author, index) => (
                    <motion.div
                      key={author.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AuthorCard author={author} variant="detailed" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;