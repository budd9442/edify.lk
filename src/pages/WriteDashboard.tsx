import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PenTool, Type, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Draft } from '../types/payload';
import { draftService } from '../services/draftService';
import { organizeContentWithAI } from '../services/aiService';
import ImportHandler from '../components/write/ImportHandler';
import DashboardView from '../components/write/DashboardView';
import EditorView from '../components/write/EditorView';
import PreviewView from '../components/write/PreviewView';
import { useLocation } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

const WriteDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const loadInFlightRef = useRef(false);
  const [activeView, setActiveView] = useState<'options' | 'editor' | 'preview'>('options');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditorTutorial, setShowEditorTutorial] = useState(false);
  const [hasShownTutorialForNewArticle, setHasShownTutorialForNewArticle] = useState(false);
  const [organizingWithAI, setOrganizingWithAI] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<Partial<Draft> | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    loadDrafts();
  }, [authState.isAuthenticated, authState.user?.id]);

  // Show editor tutorial when creating new article (only once per new article)
  useEffect(() => {
    if (activeView === 'editor' && currentDraft && !currentDraft.id && !hasShownTutorialForNewArticle) {
      setShowEditorTutorial(true);
      setHasShownTutorialForNewArticle(true);
    }
  }, [activeView, currentDraft, hasShownTutorialForNewArticle]);

  const handleEditorTutorialClose = () => {
    setShowEditorTutorial(false);
  };

  // Sync tagsInput with currentDraft.tags
  useEffect(() => {
    if (currentDraft?.tags) {
      setTagsInput(currentDraft.tags.join(', '));
    } else {
      setTagsInput('');
    }
  }, [currentDraft?.tags]);

  // Revalidate on route focus/popstate and window focus
  useEffect(() => {
    const onFocus = () => {
      if (location.pathname === '/write') {
        loadDrafts();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [location.pathname]);

  useEffect(() => {
    // React Router updates location.key on back/forward
    if (location.pathname === '/write') {
      loadDrafts();
    }
  }, [location.key, location.pathname]);

  // Apply syntax highlighting in preview when content changes
  useEffect(() => {
    if (activeView !== 'preview') return;
    // Defer to next tick to ensure DOM is painted
    const id = window.setTimeout(async () => {
      const mod: any = await import('highlight.js/lib/common');
      const hljs = mod.default || mod;
      // Highlight <pre><code>...</code></pre>
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el as HTMLElement);
      });
      // Highlight Quill code blocks (<pre class="ql-syntax">...)

      document.querySelectorAll('pre.ql-syntax').forEach((el) => {
        // Wrap contents in a code element for consistent styling if not present
        if (!el.querySelector('code')) {
          const code = document.createElement('code');
          code.textContent = (el as HTMLElement).textContent || '';
          el.textContent = '';
          el.appendChild(code);
          hljs.highlightElement(code);
        } else {
          const code = el.querySelector('code') as HTMLElement;
          hljs.highlightElement(code);
        }
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeView, currentDraft?.contentHtml]);

  const loadDrafts = async () => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    console.log('[WriteDashboard] Loading drafts...');
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
      showError('Failed to load drafts');
    } finally {
      loadInFlightRef.current = false;
      console.log('[WriteDashboard] Loading drafts complete');
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
    setHasShownTutorialForNewArticle(false); // Reset tutorial flag for new article
    setActiveView('editor');
  };

  const handleImportComplete = (contentHtml: string, title: string) => {
    setCurrentDraft({
      title,
      contentHtml: contentHtml || '',
      tags: [],
      status: 'draft'
    });
    setHasShownTutorialForNewArticle(false); // Reset tutorial flag for imported article
    setShowImportModal(false);
    setActiveView('editor');
  };

  const handleOrganizeWithAI = async () => {
    if (!currentDraft?.contentHtml) return;

    setOrganizingWithAI(true);
    try {
      const result = await organizeContentWithAI(currentDraft.contentHtml);

      // Update content with optimized HTML
      const updatedDraft = {
        ...currentDraft,
        contentHtml: result.optimizedHtml,
      };

      // Add suggested tags if none are present and AI suggested some
      if ((!currentDraft.tags || currentDraft.tags.length === 0) && result.suggestedTags) {
        updatedDraft.tags = result.suggestedTags;
        showSuccess('Content organized with AI and tags added!');
      } else {
        showSuccess('Content organized with AI!');
      }

      setCurrentDraft(updatedDraft);
    } catch (error) {
      console.error('AI organization failed:', error);
      showError('Failed to organize with AI. Please try again.');
    } finally {
      setOrganizingWithAI(false);
    }
  };

  const handleEditDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    setActiveView('editor');
  };

  const handleDeleteDraft = async (draftId: string) => {
    // Find the draft to check status
    const draftToDelete = drafts.find(d => d.id === draftId);
    if (!draftToDelete) return;

    const message = draftToDelete.status === 'published'
      ? 'WARNING: This will delete both the draft AND the published article from the website. This action cannot be undone. Are you sure?'
      : 'Are you sure you want to delete this draft? This action cannot be undone.';

    if (!window.confirm(message)) {
      return;
    }

    try {
      if (draftToDelete.status === 'published' && authState.user?.id && draftToDelete.title) {
        // Attempt to delete cascade
        await draftService.deleteDraftAndArticle(draftId, authState.user.id, draftToDelete.title);
      } else {
        await draftService.deleteDraft(draftId);
      }

      setDrafts(prev => prev.filter(d => d.id !== draftId));

      // If the deleted draft was the current one, reset state
      if (currentDraft?.id === draftId) {
        setCurrentDraft({
          title: '',
          contentHtml: '',
          tags: [],
          status: 'draft'
        });
        setActiveView('options');
      }
      showSuccess('Deleted successfully');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      showError('Failed to delete');
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
        userId: authState.user?.id,
        // include quiz questions so they persist
        quizQuestions: (currentDraft as any).quizQuestions || []
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
  }, [
    currentDraft?.id,
    currentDraft?.title,
    currentDraft?.contentHtml,
    (currentDraft?.tags || []).join(','),
    // trigger autosave when quiz questions change
    JSON.stringify((currentDraft as any)?.quizQuestions || []),
    saving,
  ]);

  const handleSubmitForReview = async () => {
    // Validate title before submission
    if (!currentDraft?.title || currentDraft.title.trim().length === 0) {
      showError('Please enter a title before submitting for review');
      return;
    }

    // Validate content before submission
    if (!currentDraft?.contentHtml || currentDraft.contentHtml.trim().length === 0) {
      showError('Please add content before submitting for review');
      return;
    }

    // Set saving state to verify operations
    setSaving(true);

    try {
      if (!authState.isAuthenticated || !authState.user?.id) {
        showError('Please sign in to submit.');
        return;
      }

      // Always save the draft first to ensure latest content and quiz questions are persisted
      // This handles both new drafts (creating them) and existing drafts (updating them)
      const savedDraft = await draftService.saveDraft({
        id: currentDraft.id,
        title: currentDraft.title!,
        contentHtml: currentDraft.contentHtml || '',
        coverImage: currentDraft.coverImage,
        tags: currentDraft.tags || [],
        status: 'draft', // Keep as draft initially during save
        userId: authState.user.id,
        quizQuestions: (currentDraft as any).quizQuestions || []
      });

      // Now submit for review
      await draftService.submitForReview(savedDraft.id);

      // Update local state with submitted status
      setDrafts(prev => {
        const existing = prev.find(d => d.id === savedDraft.id);
        if (existing) {
          return prev.map(d => d.id === savedDraft.id ? { ...savedDraft, status: 'submitted' as const } : d);
        } else {
          return [{ ...savedDraft, status: 'submitted' as const }, ...prev];
        }
      });

      setCurrentDraft({ ...savedDraft, status: 'submitted' as const });
      showSuccess('Article submitted for review successfully!');

      // Update autoSavedAt
      setAutoSavedAt(new Date().toISOString());

    } catch (error) {
      console.error('Failed to submit for review:', error);
      showError('Failed to submit for review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen bg-dark-950 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          {activeView === 'options' && (
            <DashboardView
              drafts={drafts}
              loading={loading}
              userFollowersCount={(authState.user as any)?.followersCount || 0}
              onStartNew={handleStartNew}
              onImport={() => setShowImportModal(true)}
              onEditDraft={handleEditDraft}
              onPreviewDraft={handlePreviewDraft}
              onSubmitDraft={handleSubmitDraft}
              onDeleteDraft={handleDeleteDraft}
            />
          )}

          {activeView === 'editor' && currentDraft && (
            <EditorView
              currentDraft={currentDraft}
              onChange={(updates) => setCurrentDraft(prev => ({ ...prev!, ...updates }))}
              onSave={handleSaveDraft}
              onSubmit={handleSubmitForReview}
              onPreview={() => setActiveView('preview')}
              onBack={() => setActiveView('options')}
              onOrganize={handleOrganizeWithAI}
              organizingWithAI={organizingWithAI}
              saving={saving}
              autoSavedAt={autoSavedAt}
              saveError={saveError}
              tagsInput={tagsInput}
              setTagsInput={setTagsInput}
            />
          )}

          {activeView === 'preview' && currentDraft && (
            <PreviewView
              currentDraft={currentDraft}
              onBack={() => setActiveView('options')}
              onEdit={() => setActiveView('editor')}
              onOrganize={handleOrganizeWithAI}
              organizingWithAI={organizingWithAI}
            />
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

        {/* Editor Tutorial */}
        <AnimatePresence>
          {showEditorTutorial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-dark-900 border border-dark-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto my-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-800">
                  <div className="flex items-center space-x-2">
                    <Type className="w-5 h-5 text-primary-400" />
                    <h3 className="font-semibold text-white">How to use the editor</h3>
                  </div>
                  <button
                    onClick={handleEditorTutorialClose}
                    className="p-1 hover:bg-dark-800 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  <div className="text-sm text-gray-300">
                    <p className="mb-3 font-medium text-white">Select some text and use the toolbar to format your text:</p>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0"></span>
                        <span><strong>Bold</strong>, &nbsp; <em>italic</em>, &nbsp; <u>underline</u> &nbsp; or &nbsp; <code className="bg-dark-800 px-1 rounded text-primary-300">code formatting</code> &nbsp; for emphasis</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0"></span>
                        <span>Headers (H1, H2, H3) for structure</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0"></span>
                        <span>Lists and blockquotes for organization</span>
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0"></span>
                        <span>Links and images for rich content</span>
                      </li>
                    </ul>

                    <div className="mt-4 pt-3 border-t border-dark-700">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          <span className="font-medium text-white">💡 Pro Tip:</span> You can use the <span className="text-primary-300 font-medium">Organize with AI</span> button to help you format your content.
                        </p>
                        <p className="text-xs text-gray-400">
                          <span className="font-medium text-white">🧠 Quiz Builder:</span> In the quiz builder you can add questions and answers to your article. They can be generated with the <span className="text-primary-300 font-medium">Generate with AI</span> button as well.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-dark-800">
                  <button
                    onClick={handleEditorTutorialClose}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WriteDashboard;