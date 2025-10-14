import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { draftService } from '../services/draftService';
import { FileText, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EditorDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'published' | 'rejected'>('all');
  const [error, setError] = useState<string | null>(null);

  const isEditor = authState.user?.role === 'editor' || authState.user?.role === 'admin';

  useEffect(() => {
    if (!isEditor) return;
    load();
  }, [isEditor]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await draftService.getSubmittedDrafts();
      setDrafts(data);
    } catch (e) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    try {
      await draftService.approveDraft(id);
      // Update the draft status instead of removing it
      setDrafts(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'published', updatedAt: new Date().toISOString() } : d
      ));
    } catch (e) {
      setError('Failed to approve draft');
    }
  };

  const reject = async (id: string) => {
    try {
      await draftService.rejectDraft(id);
      // Update the draft status instead of removing it
      setDrafts(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'rejected', updatedAt: new Date().toISOString() } : d
      ));
    } catch (e) {
      setError('Failed to reject draft');
    }
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Editor Dashboard</h1>
          <p className="text-gray-400">Review submissions and approve or reject.</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-dark-900 border border-dark-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : drafts.length > 0 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              {(['all','submitted','published','rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${filter === f ? 'bg-primary-600 text-white' : 'bg-dark-800 text-gray-300 hover:bg-dark-700'}`}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {drafts
                .filter(d => filter === 'all' ? true : d.status === filter)
                .map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-4 bg-dark-900 rounded-lg border border-dark-800">
                <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-white font-medium truncate">{d.title || 'Untitled Draft'}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="prose prose-invert max-w-none line-clamp-1" dangerouslySetInnerHTML={{ __html: d.contentHtml }} />
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/article/preview/${d.id}`}
                    className="px-3 py-1.5 bg-dark-800 text-gray-300 rounded-lg hover:bg-dark-700 text-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </a>
                  {d.status === 'published' ? (
                    <span className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Published
                    </span>
                  ) : d.status !== 'published' ? (
                    <button
                      onClick={() => approve(d.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                  ) : null}
                  {d.status !== 'rejected' && d.status !== 'published' && (
                    <button
                      onClick={() => reject(d.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-dark-900 border border-dark-800 rounded-lg">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No submissions</h3>
            <p className="text-gray-400">There are currently no drafts under review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorDashboard;


