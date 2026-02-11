import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { followsService } from '../../services/followsService';
import { useToast } from '../../hooks/useToast';

type Props = { authorId: string; compact?: boolean; onChange?: (isFollowing: boolean) => void };

export const FollowButton: React.FC<Props> = ({ authorId, compact, onChange }) => {
  const { state: auth } = useAuth();
  const { showError } = useToast();
  const [isFollowing, setIsFollowing] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);

  const currentUserId = auth.user?.id;
  const isSelf = currentUserId === authorId;

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUserId || isSelf) return;
      //console.log('👤 [FOLLOW DEBUG] Checking follow state', { currentUserId, authorId });
      const following = await followsService.isFollowing(currentUserId, authorId);
      //console.log('👤 [FOLLOW DEBUG] isFollowing result:', following);
      if (!cancelled) setIsFollowing(!!following);
    })();
    return () => { cancelled = true; };
  }, [currentUserId, authorId, isSelf]);

  const onToggle = async () => {
    if (!currentUserId) {
      showError('Please sign in to follow authors');
      return;
    }
    if (isSelf) return;
    if (loading) return;
    setLoading(true);
    const next = !isFollowing;
    //console.log('👤 [FOLLOW DEBUG] Toggling follow', { currentUserId, authorId, from: isFollowing, to: next });
    setIsFollowing(next);
    try {
      if (next) {
        const res = await followsService.follow(currentUserId, authorId);
        //console.log('👤 [FOLLOW DEBUG] Follow success:', res);
        onChange?.(true);
        try { window.dispatchEvent(new CustomEvent('follow:changed', { detail: { authorId, following: true } })); } catch { }
      } else {
        const res = await followsService.unfollow(currentUserId, authorId);
        //console.log('👤 [FOLLOW DEBUG] Unfollow success:', res);
        onChange?.(false);
        try { window.dispatchEvent(new CustomEvent('follow:changed', { detail: { authorId, following: false } })); } catch { }
      }
    } catch (e) {
      console.error('👤 [FOLLOW DEBUG] Toggle failed, rolling back', e);
      // rollback on error
      setIsFollowing(!next);
      // also rollback parent notification
      onChange?.(!next);
    } finally {
      //console.log('👤 [FOLLOW DEBUG] Toggle complete');
      setLoading(false);
    }
  };

  const base = compact ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-sm';
  const style = isFollowing
    ? 'bg-dark-700/60 text-gray-100 border border-dark-600 hover:bg-dark-700'
    : 'bg-dark-800/70 text-gray-200 border border-dark-700 hover:bg-dark-700';

  if (isSelf) return null;

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`${base} rounded-md ${style} transition-colors disabled:opacity-60`}
    >
      {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};


