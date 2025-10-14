import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, 
  Upload, 
  FileText, 
  TrendingUp,
  Users,
  Eye,
  Save,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Draft } from '../mock-data/strapiBlocks';
import { draftService } from '../services/draftService';
import QuillEditor from '../components/write/QuillEditor';
import ImageUpload from '../components/write/ImageUpload';
// BlockRenderer is not used in HTML flow
import ImportHandler from '../components/write/ImportHandler';
// Removed DraftCard in favor of horizontal list rows
import { formatDistanceToNow } from 'date-fns';

const WriteDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const [activeView, setActiveView] = useState<'options' | 'editor' | 'preview'>('options');
  const [showImportModal, setShowImportModal] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Partial<Draft> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Mock profile progress
  // Removed profile progress state

  useEffect(() => {
    loadDrafts();
  }, [authState.isAuthenticated, authState.user?.id]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      if (!authState.isAuthenticated || !authState.user?.id) {
        setDrafts([]);
        return;
      }
      const data = await draftService.getDrafts(authState.user.id);
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
      contentHtml: '',
      tags: [],
      status: 'draft'
    });
    setActiveView('editor');
  };

  const handleImportComplete = (contentHtml: string, title: string) => {
    setCurrentDraft({
      title,
      contentHtml: contentHtml || '',
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
    if (!currentDraft || currentDraft.contentHtml === undefined) return;
    const hasTitle = !!(currentDraft.title && currentDraft.title.trim().length > 0);
    const hasContent = !!(currentDraft.contentHtml && currentDraft.contentHtml.trim().length > 0);
    if (!hasTitle && !hasContent) return;
    if (saving) return;

    if (!authState.isAuthenticated || !authState.user?.id) {
      setSaveError('Please sign in to save drafts.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const wasNew = !currentDraft.id;
      const savedDraft = await draftService.saveDraft({
        id: currentDraft.id,
        title: currentDraft.title!,
        contentHtml: currentDraft.contentHtml || '',
        coverImage: currentDraft.coverImage,
        tags: currentDraft.tags || [],
        status: 'draft',
        userId: authState.user?.id
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
      if (wasNew) {
        // Refresh list so the newly created draft appears immediately
        loadDrafts();
      }
      setAutoSavedAt(new Date().toISOString());
    } catch (error) {
      console.error('Failed to save draft:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save draft';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save when title, tags, or contentHtml change
  useEffect(() => {
    if (!currentDraft) return;
    if (currentDraft.status === 'submitted') return;
    if (!currentDraft.title && !(currentDraft.contentHtml && currentDraft.contentHtml.trim())) return;
    if (saving) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      handleSaveDraft();
    }, 30000);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentDraft?.id, currentDraft?.title, currentDraft?.contentHtml, (currentDraft?.tags || []).join(','), saving]);

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
      setCurrentDraft(prev => prev ? { ...prev, status: 'submitted' as const } : prev);
    } catch (error) {
      console.error('Failed to submit for review:', error);
    }
  };

  // Removed profile progress and badges

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
                      <div className="space-y-2">
                        {drafts.map((draft) => {
                          const textPreview = (draft.contentHtml || '')
                            .replace(/<style[\s\S]*?<\/style>/gi, '')
                            .replace(/<script[\s\S]*?<\/script>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                          const isDraft = draft.status === 'draft';
                          return (
                            <div key={draft.id} className={"flex items-center gap-4 p-4 bg-dark-900 hover:bg-dark-800 rounded-lg border border-dark-800"}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                  <h3 className="text-white font-medium truncate">{draft.title || 'Untitled Draft'}</h3>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-1 mt-1">{textPreview || 'No content yet...'}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`px-2 py-0.5 text-xs rounded-full border ${
                                    draft.status === 'published'
                                      ? 'text-green-400 bg-green-900/20 border-green-500/50'
                                      : draft.status === 'submitted'
                                      ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/50'
                                      : 'text-gray-400 bg-gray-900/20 border-gray-500/50'
                                  }`}>
                                    {draft.status === 'published' ? 'Published' : draft.status === 'submitted' ? 'Under Review' : 'Draft'}
                                  </span>
                                  {draft.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs bg-dark-800 text-gray-300 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                  {draft.tags.length > 3 && (
                                    <span className="px-2 py-0.5 text-xs bg-dark-800 text-gray-400 rounded-full">+{draft.tags.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isDraft && (
                                  <button
                                    onClick={() => handleEditDraft(draft)}
                                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePreviewDraft(draft)}
                                  className="px-3 py-1.5 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 text-sm"
                                >
                                  Preview
                                </button>
                                {isDraft && (
                                  <button
                                    onClick={() => handleSubmitDraft(draft.id)}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                  >
                                    Submit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDraft(draft.id)}
                                  className="px-2 py-1 text-gray-400 hover:text-red-400"
                                  aria-label="Delete draft"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
                          {Number((authState.user as any)?.articlesCount) || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Followers</span>
                        </div>
                        <span className="text-sm font-medium text-white">
                          {Number((authState.user as any)?.followersCount) || 0}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <a
                        href="/feed"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        View Published
                      </a>
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Draft'}</span>
                    </button>
                    {autoSavedAt && (
                      <span className="text-xs text-gray-400">Auto-saved {new Date(autoSavedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                  {saveError && (
                    <div className="text-xs text-red-400 mt-1">{saveError}</div>
                  )}
                  <button
                    onClick={handleSubmitForReview}
                    disabled={currentDraft.status === 'submitted'}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{currentDraft.status === 'submitted' ? 'Submitted' : 'Submit for Review'}</span>
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

                {/* Cover Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cover Image
                  </label>
                  <ImageUpload
                    currentImage={currentDraft.coverImage}
                    onImageChange={(url) => setCurrentDraft(prev => ({ ...prev, coverImage: url }))}
                    onImageRemove={() => setCurrentDraft(prev => ({ ...prev, coverImage: undefined }))}
                    placeholder="Upload cover image for your article"
                    className="mb-4"
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

                {/* Content Editor (Quill stores HTML) */}
                <div className="space-y-4">
                  <QuillEditor
                    value={currentDraft.contentHtml || ''}
                    onChange={(html) => {
                      setCurrentDraft(prev => ({ ...prev!, contentHtml: html }));
                    }}
                    placeholder="Start writing your article..."
                    readOnly={currentDraft.status === 'submitted'}
                  />
                </div>
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

                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentDraft.contentHtml || '' }} />
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