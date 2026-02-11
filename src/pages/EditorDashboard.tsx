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
  Search,
  Heart
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
      {/* Mobile View */}
      <div className="md:hidden">
        <div className="px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage content and submissions.</p>
          </div>

          <div className="mb-6 overflow-x-auto -mx-4 px-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            <nav className="flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'articles', label: 'Articles', icon: FileText },
                { id: 'submissions', label: 'Submissions', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeTab === tab.id
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-dark-800 border-dark-700 text-gray-400'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-dark-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-800">
                      <FileText className="w-5 h-5 text-primary-500 mb-2" />
                      <p className="text-2xl font-bold text-white">{stats.totalArticles}</p>
                      <p className="text-xs text-gray-400">Total Articles</p>
                    </div>
                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-800">
                      <Star className="w-5 h-5 text-yellow-500 mb-2" />
                      <p className="text-2xl font-bold text-white">{stats.featuredArticles}</p>
                      <p className="text-xs text-gray-400">Featured</p>
                    </div>
                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-800">
                      <Clock className="w-5 h-5 text-orange-500 mb-2" />
                      <p className="text-2xl font-bold text-white">{stats.pendingSubmissions}</p>
                      <p className="text-xs text-gray-400">Pending</p>
                    </div>
                    <div className="bg-dark-900 p-4 rounded-xl border border-dark-800">
                      <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                      <p className="text-2xl font-bold text-white">{stats.publishedToday}</p>
                      <p className="text-xs text-gray-400">New Today</p>
                    </div>
                  </div>
                  <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Total Views</p>
                      <p className="text-xl font-bold text-blue-400">{stats.totalViews.toLocaleString()}</p>
                    </div>
                    <Eye className="w-6 h-6 text-blue-500/20" />
                  </div>
                  <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Total Likes</p>
                      <p className="text-xl font-bold text-red-400">{stats.totalLikes.toLocaleString()}</p>
                    </div>
                    <Users className="w-6 h-6 text-red-500/20" />
                  </div>
                </div>
              )}

              {activeTab === 'articles' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-dark-900 border border-dark-800 rounded-lg pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredArticles.map(article => (
                      <div key={article.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white line-clamp-1">{article.title}</h3>
                          {article.featured && <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-400 mb-3">
                          <span>{article.views} views</span>
                          <span>•</span>
                          <span>{article.likes} likes</span>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleFeatured(article.id, article.featured)}
                            className="p-2 bg-dark-800 rounded-lg text-gray-400"
                          >
                            {article.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id, article.title)}
                            className="p-2 bg-dark-800 rounded-lg text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-3">
                  {pendingSubmissions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No pending submissions</p>
                  ) : pendingSubmissions.map(submission => (
                    <div key={submission.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                      <h3 className="font-semibold text-white mb-1">{submission.title}</h3>
                      <p className="text-xs text-gray-400 mb-3">by {submission.author.name}</p>
                      <div className="flex justify-between gap-2">
                        <a href={`/article/preview/${submission.id}`} className="flex-1 py-2 bg-dark-800 rounded-lg text-center text-xs font-medium text-blue-400">Preview</a>
                        <button onClick={() => handleApproveSubmission(submission.id)} className="flex-1 py-2 bg-green-900/20 text-green-400 rounded-lg text-xs font-medium">Approve</button>
                        <button onClick={() => handleRejectSubmission(submission.id)} className="flex-1 py-2 bg-red-900/20 text-red-400 rounded-lg text-xs font-medium">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Editor Dashboard</h1>
            <p className="text-gray-400">Manage articles, submissions, and content curation.</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-4 border-b border-dark-800">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'articles', label: 'Articles', icon: FileText },
                { id: 'submissions', label: 'Submissions', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-primary-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-dark-700'
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
                  <div className="grid grid-cols-4 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Total Articles</p>
                          <p className="text-3xl font-bold text-white mt-1">{stats.totalArticles}</p>
                        </div>
                        <div className="p-3 bg-primary-600/20 rounded-lg">
                          <FileText className="w-6 h-6 text-primary-500" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Featured</p>
                          <p className="text-3xl font-bold text-white mt-1">{stats.featuredArticles}</p>
                        </div>
                        <div className="p-3 bg-yellow-600/20 rounded-lg">
                          <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Pending</p>
                          <p className="text-3xl font-bold text-white mt-1">{stats.pendingSubmissions}</p>
                        </div>
                        <div className="p-3 bg-orange-600/20 rounded-lg">
                          <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-dark-800 rounded-lg p-6 border border-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">New Today</p>
                          <p className="text-3xl font-bold text-white mt-1">{stats.publishedToday}</p>
                        </div>
                        <div className="p-3 bg-green-600/20 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Engagement Stats - Full Width */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Engagement Overview</h3>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Total Views</p>
                          <div className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" />
                            <span className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Total Likes</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-red-500" />
                            <span className="text-2xl font-bold text-white">{stats.totalLikes.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles Tab (Table Layout) */}
              {activeTab === 'articles' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="relative w-96">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400 text-sm">Filter:</span>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-gray-300 focus:border-primary-500 focus:outline-none"
                      >
                        <option value="all">All Articles</option>
                        <option value="featured">Featured Only</option>
                        <option value="recent">Recent (7 days)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-dark-900 border-b border-dark-700">
                          <th className="p-4 font-medium text-gray-400 text-sm">Article</th>
                          <th className="p-4 font-medium text-gray-400 text-sm">Author</th>
                          <th className="p-4 font-medium text-gray-400 text-sm">Stats</th>
                          <th className="p-4 font-medium text-gray-400 text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArticles.map(article => (
                          <tr key={article.id} className="border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-start gap-3">
                                {article.featured && <Star className="w-4 h-4 text-yellow-500 fill-current mt-1 flex-shrink-0" />}
                                <div>
                                  <p className="font-medium text-white line-clamp-1">{article.title}</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {article.tags.slice(0, 3).map(tag => (
                                      <span key={tag} className="text-xs bg-dark-900 text-gray-400 px-1.5 py-0.5 rounded border border-dark-700">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-gray-300">{article.author.name}</span>
                              <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(article.publishedAt || article.createdAt))} ago</p>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {article.views}</span>
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {article.likes}</span>
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleToggleFeatured(article.id, article.featured)}
                                  className="p-2 hover:bg-dark-600 rounded-lg text-gray-400 hover:text-yellow-400"
                                  title={article.featured ? "Unfeature" : "Feature"}
                                >
                                  {article.featured ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(article.id, article.title)}
                                  className="p-2 hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredArticles.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">
                              No articles found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Submissions Tab (Table Layout) */}
              {activeTab === 'submissions' && (
                <div className="space-y-6">
                  <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-dark-900 border-b border-dark-700">
                          <th className="p-4 font-medium text-gray-400 text-sm">Submission</th>
                          <th className="p-4 font-medium text-gray-400 text-sm">Author</th>
                          <th className="p-4 font-medium text-gray-400 text-sm">Submitted</th>
                          <th className="p-4 font-medium text-gray-400 text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingSubmissions.map(submission => (
                          <tr key={submission.id} className="border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-white">{submission.title}</p>
                              <p className="text-sm text-gray-400 line-clamp-1">{submission.excerpt}</p>
                            </td>
                            <td className="p-4 text-gray-300">{submission.author.name}</td>
                            <td className="p-4 text-gray-400 text-sm">{formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <a
                                  href={`/article/preview/${submission.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-900/20 text-blue-400 rounded-lg text-sm border border-blue-900/30 hover:bg-blue-900/30"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </a>
                                <button
                                  onClick={() => handleApproveSubmission(submission.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-900/20 text-green-400 rounded-lg text-sm border border-green-900/30 hover:bg-green-900/30"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectSubmission(submission.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-900/30 hover:bg-red-900/30"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {pendingSubmissions.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-gray-500">
                              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                              No pending submissions.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorDashboard;
