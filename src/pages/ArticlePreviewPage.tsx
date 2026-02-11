import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft, Eye } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizPreview from '../components/quiz/QuizPreview';
import { draftService } from '../services/draftService';
import { editorService } from '../services/editorService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

const ArticlePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isEditor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await draftService.getDraft(id);
        if (!data) {
          setError('Draft not found');
        }
        setDraft(data);
      } catch (e) {
        setError('Failed to load draft');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Apply syntax highlighting after draft content loads/changes
  useEffect(() => {
    const id = window.setTimeout(async () => {
      const mod: any = await import('highlight.js/lib/common');
      const hljs = mod.default || mod;
      document.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el as HTMLElement));
      document.querySelectorAll('pre.ql-syntax').forEach((el) => {
        if (!el.querySelector('code')) {
          const code = document.createElement('code');
          code.textContent = (el as HTMLElement).textContent || '';
          el.textContent = '';
          el.appendChild(code);
          hljs.highlightElement(code);
        } else {
          hljs.highlightElement(el.querySelector('code') as HTMLElement);
        }
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [draft?.contentHtml]);

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await editorService.approveDraft(id);
      showSuccess('Submission approved successfully!');
      navigate('/editor');
    } catch (error) {
      console.error('Failed to approve submission:', error);
      showError('Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await editorService.rejectDraft(id);
      showSuccess('Submission rejected');
      navigate('/editor');
    } catch (error) {
      console.error('Failed to reject submission:', error);
      showError('Failed to reject submission');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !draft) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Preview Unavailable</h1>
          <p className="text-gray-400 mb-8">{error || 'The requested draft could not be found.'}</p>
          <Link
            to="/editor"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Editor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated || !isEditor) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">You do not have access to previews.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile Editor Controls Header */}
      <div className="md:hidden bg-dark-900 border-b border-dark-800 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/editor"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Eye className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">Preview</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400">
              <span className="text-yellow-400 font-medium">{draft.status}</span>
            </span>
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-1 max-w-[100px]"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Approve</span>
              </button>

              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex-1 max-w-[100px]"
              >
                <XCircle className="w-3 h-3" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Editor Controls Header */}
      <div className="hidden md:block bg-dark-900 border-b border-dark-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/editor"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Editor</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">Preview Mode</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">
                Status: <span className="text-yellow-400 font-medium">{draft.status}</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'Processing...' : 'Approve'}</span>
                </button>

                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{actionLoading ? 'Processing...' : 'Reject'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Hero */}
      {draft.coverImage && (
        <div className="relative h-80 overflow-hidden">
          <img
            src={draft.coverImage}
            alt={draft.title || 'Cover'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-900 border border-dark-800 rounded-xl p-8 shadow-2xl"
        >
          <header className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {draft.title || 'Untitled Draft'}
              </h1>
              <span className="text-xs px-2 py-1 rounded bg-dark-800 text-gray-400 border border-dark-700">Preview</span>
            </div>
            {Array.isArray(draft.tags) && draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {draft.tags.map((tag: string, idx: number) => (
                  <span key={idx} className="bg-primary-900/30 text-primary-300 px-3 py-1 rounded-full text-sm whitespace-nowrap overflow-hidden" title={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div
            className="prose prose-invert prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: draft.contentHtml || '' }}
          />

          {/* Quiz Preview */}
          <QuizPreview title="Article Quiz" questions={((draft as any).quizQuestions || []) as any} />
        </motion.article>
      </div>
    </div>
  );
};

export default ArticlePreviewPage;


