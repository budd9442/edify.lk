import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../types/payload';

interface ArticleCardMobileProps {
    article: Article;
    index?: number;
}

const ArticleCardMobile: React.FC<ArticleCardMobileProps> = ({ article, index = 0 }) => {
    // Helper to validate image
    const hasValidCover = article.coverImage && article.coverImage !== '/logo.png';

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-dark-900/50 border border-dark-800 rounded-xl p-4 active:scale-[0.99] transition-transform mb-4"
        >
            <Link to={`/article/${article.slug}`}>
                <div className="flex gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            {article.customAuthor ? (
                                <>
                                    <div className="w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        {article.customAuthor.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-300 truncate">{article.customAuthor}</span>
                                </>
                            ) : (
                                <>
                                    {article.author.avatar ? (
                                        <img src={article.author.avatar} alt="" className="w-5 h-5 rounded-full" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            {article.author.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-300 truncate">{article.author.name}</span>
                                </>
                            )}
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-white leading-snug line-clamp-2">
                            {article.title}
                        </h3>

                        {/* Snippet */}
                        <p className="text-sm text-gray-400 line-clamp-2">
                            {article.excerpt}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {article.readingTime}m
                            </span>
                            <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" /> {article.likes}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" /> {article.comments.length}
                            </span>
                        </div>
                    </div>
                    {/* Image */}
                    {hasValidCover && (
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-dark-800">
                            <img
                                src={article.coverImage!}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    )}
                </div>
            </Link>
        </motion.article>
    );
};

export default ArticleCardMobile;
