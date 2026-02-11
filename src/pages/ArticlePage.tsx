import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  Clock,
  Eye,
  Linkedin,
  Facebook,
  Send,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { Article } from '../types/payload';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { articlesService } from '../services/articlesService';
import supabase from '../services/supabaseClient';
import { commentsService } from '../services/commentsService';
import { viewsService } from '../services/viewsService';
import { likesService } from '../services/likesService';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizCard from '../components/quiz/QuizCard';
import { FollowButton } from '../components/follow/FollowButton';
import Avatar from '../components/common/Avatar';

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareRef = React.useRef<HTMLDivElement>(null);
  const { dispatch } = useApp();
  const { state: authState } = useAuth();
  const { showError } = useToast();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;

      try {
        // Try to fetch by slug first, if that fails and slug looks like a UUID, try by ID
        let data = await articlesService.getBySlug(slug);

        // If slug is actually an ID (UUID format), try fetching by ID
        if (!data && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
          data = await articlesService.getById(slug);
        }

        //console.log('📄 [ARTICLE DEBUG] Fetched article data:', { id: data?.id, views: data?.views, likes: data?.likes, ca: (data as any)?.customAuthor });
        if (!data) {
          setArticle(null);
        } else {
          // fetch author profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,bio,followers_count,articles_count')
            .eq('id', (data as any).authorId)
            .single();

          // fetch comments with user profiles
          const comments = await commentsService.listByArticle(data.id);

          const articleData = {
            id: data.id,
            title: data.title,
            excerpt: data.excerpt,
            content: data.contentHtml,
            author: {
              id: (data as any).authorId,
              name: profile?.name || 'Anonymous',
              avatar: profile?.avatar_url,
              bio: profile?.bio || '',
              followersCount: profile?.followers_count ?? 0,
              articlesCount: profile?.articles_count ?? 0,
            },
            publishedAt: data.publishedAt || new Date().toISOString(),
            readingTime: 5,
            likes: data.likes,
            views: data.views,
            comments: comments,
            tags: data.tags,
            featured: data.featured,
            status: 'published',
            coverImage: data.coverImage,
            customAuthor: (data as any).customAuthor,
          };

          setArticle(articleData as any);
          setLikesCount(data.likes);

          // Track view
          //console.log('📄 [ARTICLE DEBUG] About to track view for article:', data.id, 'user:', authState.user?.id);
          const viewTracked = await viewsService.trackView(data.id, authState.user?.id || null);
          //console.log('📄 [ARTICLE DEBUG] View tracking result:', viewTracked);

          // If view was tracked, refetch the article to get updated view count
          if (viewTracked) {
            //console.log('📄 [ARTICLE DEBUG] View was tracked, refetching article for updated view count...');
            const updatedData = await articlesService.getBySlug(slug);
            if (updatedData) {
              //console.log('📄 [ARTICLE DEBUG] Updated article data:', { views: updatedData.views });
              setArticle(prev => prev ? { ...prev, views: updatedData.views } as any : null);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch article:', error);
        dispatch({ type: 'SET_TOAST', payload: { type: 'error', message: 'Failed to load article' } });
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, authState.user?.id]);

  // Load like status when article and user are available
  useEffect(() => {
    const loadLikeStatus = async () => {
      if (!article || !authState.user) return;

      try {
        const liked = await likesService.checkIfLiked(article.id, authState.user.id);
        setIsLiked(liked);
      } catch (error) {
        console.error('Failed to load like status:', error);
      }
    };

    loadLikeStatus();
  }, [article, authState.user]);

  const handleLike = async () => {
    if (!article || !authState.user) {
      showError('Please login to like articles');
      return;
    }

    try {
      if (isLiked) {
        await likesService.unlikeArticle(article.id, authState.user.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likesService.likeArticle(article.id, authState.user.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      showError('Failed to update like');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !article || !authState.user) return;

    setCommentLoading(true);
    try {
      await commentsService.create({
        articleId: article.id,
        userId: authState.user.id,
        content: comment,
      });

      // Refresh comments from database to get the latest with proper user data
      const updatedComments = await commentsService.listByArticle(article.id);

      // Update the article with fresh comments
      setArticle(prev => prev ? { ...prev, comments: updatedComments } as any : null);

      setComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showError('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentsService.remove(commentId);
      // Update local state
      setArticle(prev => prev ? {
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      } as any : null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      showError('Failed to delete comment');
    }
  };

  const shareUrl = `https://edify.exposition.lk/article/${article?.slug || article?.id}`;

  // Close share dropdown on outside click
  useEffect(() => {
    if (!isShareOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setIsShareOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShareOpen]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-gray-400 mb-8">The article you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile View */}
      <div className="md:hidden pb-24">
        {/* Mobile Nav/Back Button could go here if needed, or rely on browser back */}


        {/* Hero Section */}
        {article.coverImage ? (
          <div className="relative h-64 w-full">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 to-transparent opacity-80" />
          </div>
        ) : (
          <div className="h-24 w-full bg-gradient-to-br from-primary-900/20 to-dark-950" />
        )}

        <div className="px-4 -mt-12 relative z-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="bg-primary-900/50 text-primary-300 px-2 py-1 rounded text-xs backdrop-blur-sm border border-primary-500/20"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4 leading-tight shadow-sm">
            {article.title}
          </h1>

          {/* Author & Meta */}
          <div className="flex items-center gap-3 mb-6">
            {article.customAuthor ? (
              <div className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-lg font-bold text-gray-400 border border-dark-700 flex-shrink-0">
                {article.customAuthor.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Link to={`/profile/${article.author.id}`} className="flex-shrink-0">
                <Avatar
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-10 h-10 border border-dark-700"
                />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                {article.customAuthor ? (
                  <span className="font-medium text-white text-sm truncate block mb-0.5">{article.customAuthor}</span>
                ) : (
                  <Link to={`/profile/${article.author.id}`} className="font-medium text-white text-sm truncate block mb-0.5">
                    {article.author.name}
                  </Link>
                )}
                {!article.customAuthor && (
                  <FollowButton
                    authorId={article.author.id}
                    compact
                    onChange={(isFollowing) => {
                      setArticle(prev => prev ? {
                        ...prev,
                        author: {
                          ...prev.author,
                          followersCount: Math.max(0, prev.author.followersCount + (isFollowing ? 1 : -1))
                        }
                      } as any : prev);
                    }}
                  />
                )}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                <span>•</span>
                <span>{article.readingTime} min read</span>
              </div>
            </div>
          </div>

          <hr className="border-dark-800 mb-6" />

          {/* Article Content */}
          <div
            className="prose prose-invert prose-sm max-w-none mb-8 text-gray-300"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Quiz Section */}
          <QuizCard articleId={article.id} />

          {/* Comments Section */}
          <section className="mt-8 pt-6 border-t border-dark-800">
            <h3 className="text-xl font-bold text-white mb-6">Comments ({article.comments.length})</h3>

            {/* Comment Form */}
            {authState.isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-8">
                <div className="flex gap-4">
                  <Avatar
                    src={authState.user?.avatar?.url}
                    alt={authState.user?.name || 'User'}
                    className="w-10 h-10 border border-dark-700"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 text-sm text-white focus:ring-1 focus:ring-primary-500 outline-none resize-none h-24 transition-all"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={!comment.trim() || commentLoading}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/20"
                      >
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-dark-900 border border-dark-800 p-6 rounded-xl text-center mb-8">
                <p className="text-gray-400 text-sm mb-4">Sign in to join the conversation</p>
                <Link to="/login" className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-500 transition-all">
                  Login
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {article.comments.map((comment) => {
                const canDelete = authState.user && (
                  authState.user.id === comment.author.id ||
                  authState.user.role === 'editor' ||
                  authState.user.role === 'admin'
                );

                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 group"
                  >
                    <Link to={`/profile/${comment.author.id}`} className="flex-shrink-0">
                      <Avatar
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-10 h-10 border border-dark-700 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <Link
                            to={`/profile/${comment.author.id}`}
                            className="font-bold text-white text-sm hover:text-primary-400 transition-colors"
                          >
                            {comment.author.name}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                              {formatDistanceToNow(new Date(comment.createdAt))} ago
                            </span>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {article.comments.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-dark-700 mx-auto mb-4 opacity-20" />
                  <p className="text-gray-500 text-sm">No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Mobile Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 px-6 py-3 flex items-center justify-between z-50 safe-area-bottom">
          <button
            onClick={handleLike}
            className={`flex flex-col items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{likesCount}</span>
          </button>

          <button
            onClick={() => {
              document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">{article.comments.length}</span>
          </button>

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-xs">Share</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-gray-400">
            <BookmarkPlus className="w-6 h-6" />
            <span className="text-xs">Save</span>
          </button>
        </div>

        {/* Mobile Share Sheet */}
        {isShareOpen && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsShareOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-dark-800 w-full rounded-t-xl p-6 relative z-10"
            >
              <div className="w-12 h-1 bg-dark-600 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-white mb-4">Share this article</h3>
              <div className="grid grid-cols-4 gap-4">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                  onClick={() => setIsShareOpen(false)}
                >
                  <div className="w-12 h-12 bg-[#0077b5] rounded-full flex items-center justify-center text-white">
                    <Linkedin className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-300">LinkedIn</span>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2"
                  onClick={() => setIsShareOpen(false)}
                >
                  <div className="w-12 h-12 bg-[#1877f2] rounded-full flex items-center justify-center text-white">
                    <Facebook className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-300">Facebook</span>
                </a>
                <button
                  className="flex flex-col items-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    showError('Link copied to clipboard!');
                    setIsShareOpen(false);
                  }}
                >
                  <div className="w-12 h-12 bg-dark-700 rounded-full flex items-center justify-center text-white">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-300">Copy Link</span>
                </button>
              </div>
              <button
                onClick={() => setIsShareOpen(false)}
                className="w-full mt-6 bg-dark-700 text-white py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Hero Section */}
        {article.coverImage ? (
          <div className="relative h-96 overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-primary-900/20 to-dark-950" />
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-2xl"
          >
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-primary-900/30 text-primary-300 px-3 py-1 rounded-full text-sm whitespace-nowrap overflow-hidden max-w-full"
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {article.customAuthor ? (
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center text-xl font-bold text-gray-400 border border-dark-700">
                        {article.customAuthor.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-white truncate">{article.customAuthor}</h3>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-3 flex-shrink-0">
                        <Avatar
                          src={article.author.avatar}
                          alt={article.author.name}
                          className="w-12 h-12 border border-dark-700 hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0">
                          <h3 className="font-medium text-white truncate">{article.author.name}</h3>
                          <p className="text-sm text-gray-400">{article.author.followersCount.toLocaleString()} followers</p>
                        </div>
                      </Link>
                      <FollowButton
                        authorId={article.author.id}
                        compact
                        onChange={(isFollowing) => {
                          setArticle(prev => prev ? {
                            ...prev,
                            author: {
                              ...prev.author,
                              followersCount: Math.max(0, prev.author.followersCount + (isFollowing ? 1 : -1))
                            }
                          } as any : prev);
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="text-gray-400">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{article.readingTime} min read</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4 flex-shrink-0" />
                      <span>{(article.views || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg min-h-[44px] transition-colors ${isLiked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-dark-800 text-gray-400 hover:text-red-400 border border-dark-700'
                      }`}
                  >
                    <Heart className={`w-4 h-4 flex-shrink-0 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                  </button>

                  <div className="relative" ref={shareRef}>
                    <button
                      type="button"
                      onClick={() => setIsShareOpen(!isShareOpen)}
                      className="flex items-center space-x-2 px-4 py-2 min-h-[44px] rounded-lg bg-dark-800 text-gray-400 hover:text-white border border-dark-700 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    {isShareOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2 z-10">
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
                          onClick={() => setIsShareOpen(false)}
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
                          onClick={() => setIsShareOpen(false)}
                        >
                          <Facebook className="w-4 h-4" />
                          <span>Facebook</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-dark-800 text-gray-400 hover:text-primary-400 border border-dark-700 transition-colors"
                    aria-label="Bookmark"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div
              className="prose prose-invert prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Quiz Section */}
            <QuizCard articleId={article.id} />

            {/* Comments Section */}
            <section className="border-t border-dark-800 pt-12 mt-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-primary-500" />
                  <span>Comments ({article.comments.length})</span>
                </h3>
              </div>

              {/* Comment Form */}
              {authState.isAuthenticated ? (
                <form onSubmit={handleComment} className="mb-12 group">
                  <div className="flex gap-6">
                    <Avatar
                      src={authState.user?.avatar?.url}
                      alt={authState.user?.name || 'User'}
                      className="w-12 h-12 border border-dark-700"
                    />
                    <div className="flex-1">
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Join the discussion..."
                          className="w-full px-5 py-4 bg-dark-900/50 backdrop-blur-sm text-white rounded-2xl border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none transition-all hover:border-dark-600"
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          type="submit"
                          disabled={!comment.trim() || commentLoading}
                          className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-500 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-900/20"
                        >
                          {commentLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>Post Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-12 p-10 bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-dark-800 border-dashed text-center">
                  <h4 className="text-white font-bold mb-2">Want to join the conversation?</h4>
                  <p className="text-gray-400 mb-6">Sign in to share your thoughts on this article.</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-500 transition-all shadow-lg"
                  >
                    <span>Sign In to Comment</span>
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-8">
                {article.comments.map((comment) => {
                  const canDelete = authState.user && (
                    authState.user.id === comment.author.id ||
                    authState.user.role === 'editor' ||
                    authState.user.role === 'admin'
                  );

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-6 group/comment"
                    >
                      <Link to={`/profile/${comment.author.id}`} className="flex-shrink-0">
                        <Avatar
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-12 h-12 border border-dark-700 hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-dark-900/40 border border-dark-800 rounded-2xl p-6 transition-colors hover:border-dark-700">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <Link
                                to={`/profile/${comment.author.id}`}
                                className="font-bold text-white text-lg hover:text-primary-400 transition-colors block"
                              >
                                {comment.author.name}
                              </Link>
                              <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover/comment:opacity-100 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all p-2 rounded-lg"
                                title="Delete comment"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {article.comments.length === 0 && (
                  <div className="text-center py-20 border border-dark-800 rounded-3xl border-dashed">
                    <MessageCircle className="w-16 h-16 text-dark-800 mx-auto mb-6" />
                    <h4 className="text-white font-bold mb-2">No comments yet</h4>
                    <p className="text-gray-500">Startup the discussion by posting the first comment!</p>
                  </div>
                )}
              </div>
            </section>
          </motion.article>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;