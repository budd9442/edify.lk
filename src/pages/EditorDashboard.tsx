import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { editorService, EditorStats, ArticleManagementData } from '../services/editorService';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Star, 
  StarOff, 
  Trash2, 
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useToast } from '../hooks/useToast';

const EditorDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<EditorStats | null>(null);
  const [articles, setArticles] = useState<ArticleManagementData[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'submissions'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'featured' | 'recent'>('all');
  const [error, setError] = useState<string | null>(null);

  const isEditor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

  useEffect(() => {
    if (!isEditor) return;
    loadDashboardData();
  }, [isEditor]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, articlesData, submissionsData] = await Promise.all([
        editorService.getEditorStats(),
        editorService.getAllArticlesForManagement(),
        editorService.getPendingSubmissions()
      ]);
      
      setStats(statsData);
      setArticles(articlesData);
      setPendingSubmissions(submissionsData);
    } catch (e) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (articleId: string, currentlyFeatured: boolean) => {
    try {
      await editorService.toggleFeatured(articleId, !currentlyFeatured);
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, featured: !currentlyFeatured }
          : article
      ));
      showSuccess(`Article ${!currentlyFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (e) {
      showError('Failed to update article feature status');
    }
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await editorService.deleteArticle(articleId);
      setArticles(prev => prev.filter(article => article.id !== articleId));
      showSuccess('Article deleted successfully');
    } catch (e) {
      showError('Failed to delete article');
    }
  };

  const handleApproveSubmission = async (draftId: string) => {
    try {
      await editorService.approveDraft(draftId);
      setPendingSubmissions(prev => prev.filter(draft => draft.id !== draftId));
      await loadDashboardData(); // Reload to get updated stats
      showSuccess('Draft approved and published successfully');
    } catch (e) {
      showError('Failed to approve draft');
    }
  };

  const handleRejectSubmission = async (draftId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      await editorService.rejectDraft(draftId, reason || undefined);
      setPendingSubmissions(prev => prev.filter(draft => draft.id !== draftId));
      showSuccess('Draft rejected successfully');
    } catch (e) {
      showError('Failed to reject draft');
    }
  };

  // Filter articles based on search and filter criteria
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'featured' && article.featured) ||
                          (filterStatus === 'recent' && new Date(article.publishedAt || article.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">Sign in as an editor to continue.</div>
      </div>
    );
  }

  if (!isEditor) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">You do not have access to the editor dashboard.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Editor Dashboard</h1>
          <p className="text-gray-400">Manage articles, submissions, and content curation.</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'articles', label: 'Articles', icon: FileText },
              { id: 'submissions', label: 'Submissions', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-dark-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Articles</p>
                        <p className="text-2xl font-bold text-white">{stats.totalArticles}</p>
                      </div>
                      <FileText className="w-8 h-8 text-primary-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Featured Articles</p>
                        <p className="text-2xl font-bold text-white">{stats.featuredArticles}</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Pending Submissions</p>
                        <p className="text-2xl font-bold text-white">{stats.pendingSubmissions}</p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-500" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Published Today</p>
                        <p className="text-2xl font-bold text-white">{stats.publishedToday}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </motion.div>
                </div>

                {/* Engagement Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Total Views</h3>
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-400">{stats.totalViews.toLocaleString()}</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-dark-800 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Total Likes</h3>
                      <Users className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-400">{stats.totalLikes.toLocaleString()}</p>
                  </motion.div>
            </div>
                </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search articles, authors, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="all">All Articles</option>
                    <option value="featured">Featured Only</option>
                    <option value="recent">Recent (7 days)</option>
                  </select>
                </div>

                {/* Articles List */}
                <div className="space-y-4">
                  {filteredArticles.map((article, index) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{article.title}</h3>
                            {article.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          <p className="text-gray-400 mb-3">{article.excerpt}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>By {article.author.name}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(article.publishedAt || article.createdAt), { addSuffix: true })}</span>
                            <span>•</span>
                            <span>{article.views} views</span>
                            <span>•</span>
                            <span>{article.likes} likes</span>
                            <span>•</span>
                            <span>{article.comments} comments</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {article.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-dark-700 text-gray-300 text-xs rounded">
                                {tag}
                    </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                    <button
                            onClick={() => handleToggleFeatured(article.id, article.featured)}
                            className={`p-2 rounded-lg transition-colors ${
                              article.featured
                                ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                                : 'bg-dark-700 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/20'
                            }`}
                            title={article.featured ? 'Unfeature article' : 'Feature article'}
                          >
                            {article.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </button>
                          
                    <button
                            onClick={() => handleDeleteArticle(article.id, article.title)}
                            className="p-2 bg-dark-700 text-gray-400 hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete article"
                    >
                            <Trash2 className="w-4 h-4" />
                    </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {filteredArticles.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No articles found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">

                {pendingSubmissions.map((submission, index) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{submission.title}</h3>
                        <p className="text-gray-400 mb-3">{submission.excerpt}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>By {submission.author.name}</span>
                          <span>•</span>
                          <span>Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {submission.tags?.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 bg-dark-700 text-gray-300 text-xs rounded">
                              {tag}
                            </span>
              ))}
            </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={`/article/preview/${submission.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </a>
                        
                        <button
                          onClick={() => handleApproveSubmission(submission.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        
                        <button
                          onClick={() => handleRejectSubmission(submission.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {pendingSubmissions.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending submissions at the moment.</p>
          </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditorDashboard;
