import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, 
  Upload, 
  FileText, 
  Plus, 
  Target, 
  Award,
  TrendingUp,
  Users,
  Eye,
  Save,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Draft, StrapiBlock, ProfileProgress, profileTasks } from '../mock-data/strapiBlocks';
import { draftService } from '../services/draftService';
import { StrapiBlockUtils } from '../services/strapiBlockUtils';
import BlockEditor from '../components/write/BlockEditor';
import BlockRenderer from '../components/write/BlockRenderer';
import ImportHandler from '../components/write/ImportHandler';
import DraftCard from '../components/write/DraftCard';

const WriteDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const [activeView, setActiveView] = useState<'options' | 'editor' | 'preview'>('options');
  const [showImportModal, setShowImportModal] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Partial<Draft> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mock profile progress
  const [profileProgress] = useState<ProfileProgress>({
    userId: '1',
    completedTasks: ['profile_picture_added', 'bio_written', 'first_article_published'],
    badges: [
      {
        id: 'badge-1',
        name: 'First Steps',
        description: 'Completed profile setup',
        icon: '🎯',
        earnedAt: '2024-01-10T12:00:00Z',
        rarity: 'common'
      },
      {
        id: 'badge-2',
        name: 'Author',
        description: 'Published first article',
        icon: '✍️',
        earnedAt: '2024-01-12T15:30:00Z',
        rarity: 'rare'
      }
    ],
    totalScore: 75
  });

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const data = await draftService.getDrafts('1');
      setDrafts(data);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNew = () => {
    setCurrentDraft({
      title: '',
      content: [{ type: 'paragraph', children: [{ text: '' }] }],
      tags: [],
      status: 'draft'
    });
    setActiveView('editor');
  };

  const handleImportComplete = (content: StrapiBlock[], title: string) => {
    setCurrentDraft({
      title,
      content,
      tags: [],
      status: 'draft'
    });
    setShowImportModal(false);
    setActiveView('editor');
  };

  const handleEditDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setActiveView('editor');
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await draftService.deleteDraft(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  const handleSubmitDraft = async (draftId: string) => {
    try {
      await draftService.submitForReview(draftId);
      setDrafts(prev => prev.map(d => 
        d.id === draftId ? { ...d, status: 'submitted' as const } : d
      ));
    } catch (error) {
      console.error('Failed to submit draft:', error);
    }
  };

  const handlePreviewDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setActiveView('preview');
  };

  const handleSaveDraft = async () => {
    if (!currentDraft || !currentDraft.title || !currentDraft.content) return;

    setSaving(true);
    try {
      const savedDraft = await draftService.saveDraft({
        title: currentDraft.title,
        content: currentDraft.content,
        coverImage: currentDraft.coverImage,
        tags: currentDraft.tags || [],
        status: 'draft'
      });

      setDrafts(prev => {
        const existing = prev.find(d => d.id === savedDraft.id);
        if (existing) {
          return prev.map(d => d.id === savedDraft.id ? savedDraft : d);
        } else {
          return [savedDraft, ...prev];
        }
      });

      setCurrentDraft(savedDraft);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!currentDraft?.id) {
      await handleSaveDraft();
      return;
    }

    try {
      await draftService.submitForReview(currentDraft.id);
      setDrafts(prev => prev.map(d => 
        d.id === currentDraft.id ? { ...d, status: 'submitted' as const } : d
      ));
      setActiveView('options');
    } catch (error) {
      console.error('Failed to submit for review:', error);
    }
  };

  const completedTasksCount = profileProgress.completedTasks.length;
  const totalTasks = profileTasks.length;
  const progressPercentage = (completedTasksCount / totalTasks) * 100;

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <PenTool className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign in to start writing</h1>
          <p className="text-gray-400">Create and manage your articles with our premium editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeView === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Write & Create</h1>
                <p className="text-gray-400">
                  Share your ideas with the world using our premium writing tools
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Write Options */}
                  <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Start Writing</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Import Document */}
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
                        onClick={() => setShowImportModal(true)}
                      >
                        <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                          <Upload className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Import Document</h3>
                        <p className="text-gray-400 mb-4">
                          Upload a .docx, .md, or .txt file and convert it to our structured format
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-blue-400">
                          <span>Supports Word, Markdown, Text</span>
                        </div>
                      </motion.div>

                      {/* Start New */}
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="bg-dark-900 border border-dark-800 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
                        onClick={handleStartNew}
                      >
                        <div className="w-12 h-12 bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
                          <PenTool className="w-6 h-6 text-primary-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Start New Article</h3>
                        <p className="text-gray-400 mb-4">
                          Create a new article from scratch with our rich text editor
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-primary-400">
                          <span>Strapi Blocks Compatible</span>
                        </div>
                      </motion.div>
                    </div>
                  </section>

                  {/* Drafts Section */}
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">Your Drafts</h2>
                      <span className="text-sm text-gray-400">
                        {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
                      </span>
                    </div>
                    
                    {loading ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="bg-dark-900 border border-dark-800 rounded-lg p-6 animate-pulse">
                            <div className="h-6 bg-dark-700 rounded mb-4"></div>
                            <div className="h-4 bg-dark-700 rounded mb-2"></div>
                            <div className="h-4 bg-dark-700 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : drafts.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {drafts.map((draft) => (
                          <DraftCard
                            key={draft.id}
                            draft={draft}
                            onEdit={handleEditDraft}
                            onDelete={handleDeleteDraft}
                            onSubmit={handleSubmitDraft}
                            onPreview={handlePreviewDraft}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-dark-900 border border-dark-800 rounded-lg">
                        <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No drafts yet</h3>
                        <p className="text-gray-400 mb-6">
                          Start writing your first article to see it here
                        </p>
                        <button
                          onClick={handleStartNew}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Create Your First Draft
                        </button>
                      </div>
                    )}
                  </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Profile Completion */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-dark-900 border border-dark-800 rounded-xl p-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Target className="w-5 h-5 text-primary-500" />
                      <h3 className="text-lg font-semibold text-white">Profile Progress</h3>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Completion</span>
                        <span className="text-sm font-medium text-white">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-dark-800 rounded-full h-2">
                        <motion.div
                          className="bg-primary-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {profileTasks.slice(0, 5).map((task) => {
                        const isCompleted = profileProgress.completedTasks.includes(task.id);
                        return (
                          <div key={task.id} className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isCompleted ? 'bg-green-500' : 'bg-dark-700'
                            }`}>
                              {isCompleted && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500">{task.points} points</p>
                            </div>
                            <span className="text-lg">{task.icon}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Badges */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-dark-900 border border-dark-800 rounded-xl p-6"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-white">Earned Badges</h3>
                    </div>
                    
                    {profileProgress.badges.length > 0 ? (
                      <div className="space-y-3">
                        {profileProgress.badges.map((badge) => (
                          <div key={badge.id} className="flex items-center space-x-3">
                            <span className="text-2xl">{badge.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{badge.name}</p>
                              <p className="text-xs text-gray-400">{badge.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        Complete tasks to earn badges!
                      </p>
                    )}
                  </motion.div>

                  {/* Quick Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-dark-900 border border-dark-800 rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Drafts</span>
                        </div>
                        <span className="text-sm font-medium text-white">{drafts.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Published</span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {authState.user?.articlesCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Followers</span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {authState.user?.followersCount || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'editor' && currentDraft && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <button
                    onClick={() => setActiveView('options')}
                    className="text-gray-400 hover:text-white transition-colors mb-2"
                  >
                    ← Back to Dashboard
                  </button>
                  <h1 className="text-3xl font-bold text-white">Write Article</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveView('preview')}
                    className="flex items-center space-x-2 px-4 py-2 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                  </button>
                  <button
                    onClick={handleSubmitForReview}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit for Review</span>
                  </button>
                </div>
              </div>

              {/* Editor Form */}
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
                {/* Title */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={currentDraft.title || ''}
                    onChange={(e) => setCurrentDraft(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Article title..."
                    className="w-full text-3xl font-bold bg-transparent border-none outline-none text-white placeholder-gray-500"
                  />
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <input
                    type="text"
                    value={currentDraft.tags?.join(', ') || ''}
                    onChange={(e) => setCurrentDraft(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    }))}
                    placeholder="Tags (comma separated)..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                {/* Content Editor */}
                <BlockEditor
                  content={currentDraft.content || []}
                  onChange={(content) => setCurrentDraft(prev => ({ ...prev, content }))}
                  placeholder="Start writing your article..."
                />
              </div>
            </motion.div>
          )}

          {activeView === 'preview' && currentDraft && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <button
                    onClick={() => setActiveView('editor')}
                    className="text-gray-400 hover:text-white transition-colors mb-2"
                  >
                    ← Back to Editor
                  </button>
                  <h1 className="text-3xl font-bold text-white">Preview</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveView('editor')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Continue Editing</span>
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="bg-dark-900 border border-dark-800 rounded-xl p-8">
                <h1 className="text-4xl font-bold text-white mb-6">
                  {currentDraft.title || 'Untitled Article'}
                </h1>
                
                {currentDraft.tags && currentDraft.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {currentDraft.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-900/30 text-primary-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <BlockRenderer blocks={currentDraft.content || []} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Import Modal */}
        <AnimatePresence>
          {showImportModal && (
            <ImportHandler
              onImportComplete={handleImportComplete}
              onClose={() => setShowImportModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WriteDashboard;