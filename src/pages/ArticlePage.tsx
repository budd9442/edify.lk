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
  Twitter,
  Facebook,
  Send
} from 'lucide-react';
import { Article } from '../mock-data/articles';
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

const ArticlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        const data = await articlesService.getById(id);
        console.log('📄 [ARTICLE DEBUG] Fetched article data:', { id: data?.id, views: data?.views, likes: data?.likes });
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
              avatar: profile?.avatar_url || '/logo.png',
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
            coverImage: data.coverImage || '/logo.png',
          };
          
          setArticle(articleData as any);
          setLikesCount(data.likes);
          
          // Track view
          console.log('📄 [ARTICLE DEBUG] About to track view for article:', id, 'user:', authState.user?.id);
          const viewTracked = await viewsService.trackView(id, authState.user?.id || null);
          console.log('📄 [ARTICLE DEBUG] View tracking result:', viewTracked);
          
          // If view was tracked, refetch the article to get updated view count
          if (viewTracked) {
            console.log('📄 [ARTICLE DEBUG] View was tracked, refetching article for updated view count...');
            const updatedData = await articlesService.getById(id);
            if (updatedData) {
              console.log('📄 [ARTICLE DEBUG] Updated article data:', { views: updatedData.views });
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
  }, [id]);

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
    } finally {
      setCommentLoading(false);
    }
  };

  const shareUrl = `https://edify.exposition.lk/article/${id}`;

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
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-900 border border-dark-800 rounded-xl p-8 shadow-2xl"
        >
          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              {article.tags.map(tag => (
                <span 
                  key={tag}
                  className="bg-primary-900/30 text-primary-300 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <Link to={`/profile/${article.author.id}`} className="flex items-center space-x-3">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-white">{article.author.name}</h3>
                    <p className="text-sm text-gray-400">{article.author.followersCount.toLocaleString()} followers</p>
                  </div>
                </Link>
                <div className="text-gray-400">
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.readingTime} min read</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{(article.views || 0).toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLiked 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                      : 'bg-dark-800 text-gray-400 hover:text-red-400 border border-dark-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                <div className="relative group">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-800 text-gray-400 hover:text-white border border-dark-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </a>
                  </div>
                </div>

                <button className="p-2 rounded-lg bg-dark-800 text-gray-400 hover:text-primary-400 border border-dark-700 transition-colors">
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
          <section className="border-t border-dark-800 pt-8 mt-12">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Comments ({article.comments.length})</span>
            </h3>

            {/* Comment Form */}
            {authState.isAuthenticated ? (
              <form onSubmit={handleComment} className="mb-8">
                <div className="flex space-x-4">
                  <img
                    src={authState.user?.avatar?.url || '/logo.png'}
                    alt={authState.user?.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-4 py-3 bg-dark-800 text-white rounded-lg border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={!comment.trim() || commentLoading}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        <span>{commentLoading ? 'Posting...' : 'Post Comment'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-8 p-6 bg-dark-800 rounded-lg border border-dark-700">
                <p className="text-gray-300 mb-4">Sign in to join the conversation</p>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {article.comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex space-x-4"
                >
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-white">{comment.author.name}</h4>
                        <span className="text-gray-400 text-sm">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.article>
      </div>
    </div>
  );
};

export default ArticlePage;