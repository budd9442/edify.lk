import React from 'react';
import { Article } from '../types/payload';
import MediumStyleArticleCard from './MediumStyleArticleCard';

interface MobileFeedViewProps {
    articles: Article[];
    loading: boolean;
    onRefresh: () => void;
}

const MobileFeedView: React.FC<MobileFeedViewProps> = ({ articles, loading, onRefresh }) => {
    return (
        <div className="md:hidden min-h-screen bg-dark-950 pb-20">
            {/* Article List */}
            <div className="bg-dark-950">
                {loading ? (
                    <div className="text-center text-gray-400 py-10">Loading articles...</div>
                ) : articles.length > 0 ? (
                    articles.map(article => (
                        <MediumStyleArticleCard key={article.id} article={article} />
                    ))
                ) : (
                    <div className="text-center text-gray-400 py-10 px-4">
                        No articles found. Follow some authors to see their posts here!
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileFeedView;
