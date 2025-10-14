import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizPreview from '../components/quiz/QuizPreview';
import { draftService } from '../services/draftService';
import { useAuth } from '../contexts/AuthContext';

const ArticlePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);

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

  const isEditor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

  if (!authState.isAuthenticated || !isEditor) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center text-gray-400">You do not have access to previews.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
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
                  <span key={idx} className="bg-primary-900/30 text-primary-300 px-3 py-1 rounded-full text-sm">
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


