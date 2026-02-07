import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, User } from 'lucide-react';
import { Article } from '../types/payload';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { likesService } from '../services/likesService';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';

interface MediumStyleArticleCardProps {
    article: Article;
}

const MediumStyleArticleCard: React.FC<MediumStyleArticleCardProps> = ({ article }) => {
    const { state: authState } = useAuth();
    const { state: appState, dispatch } = useApp();
    const isLiked = appState.likedArticles.includes(article.id);
    const [likes, setLikes] = useState(article.likes);
    const [imageError, setImageError] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!authState.user) return;

        try {
            if (isLiked) {
                await likesService.unlikeArticle(article.id, authState.user.id);
                dispatch({ type: 'UNLIKE_ARTICLE', payload: article.id });
                setLikes(prev => Math.max(0, prev - 1));
            } else {
                await likesService.likeArticle(article.id, authState.user.id);
                dispatch({ type: 'LIKE_ARTICLE', payload: article.id });
                setLikes(prev => prev + 1);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        if (navigator.share) {
            navigator.share({
                title: article.title,
                url: window.location.origin + `/article/${article.slug}`,
            });
        }
    };

    return (
        <Link
            to={`/article/${article.slug}`}
            className="flex gap-4 py-4 px-4 border-b border-dark-800 hover:bg-dark-900/30 transition-colors"
        >
            {/* Left: Thumbnail */}
            <div className="flex-shrink-0 w-28 h-28 bg-dark-800 rounded-lg overflow-hidden">
                <img
                    src={imageError ? DEFAULT_COVER_IMAGE : (article.coverImage || DEFAULT_COVER_IMAGE)}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            </div>

            {/* Right: Content */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* Title */}
                <h3 className="text-base font-bold text-white line-clamp-2 mb-2">
                    {article.title}
                </h3>

                {/* Author & Meta */}
                <div className="flex items-center gap-2 mb-2">
                    {avatarError || !article.author.avatar ? (
                        <div className="w-5 h-5 rounded-full bg-dark-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-400" />
                        </div>
                    ) : (
                        <img
                            src={article.author.avatar}
                            alt={article.author.name}
                            className="w-5 h-5 rounded-full object-cover"
                            onError={() => setAvatarError(true)}
                        />
                    )}
                    <span className="text-sm text-gray-400 truncate">{article.author.name}</span>
                </div>

                {/* Bottom Row: Date + Reading Time + Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{article.readingTime} min read</span>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                        <button
                            onClick={handleBookmark}
                            className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-white'
                                }`}
                            aria-label="Like"
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs">{likes}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default MediumStyleArticleCard;
