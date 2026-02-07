import React from 'react';
import { BADGES, getBadge } from '../../constants/badges';

interface BadgeListProps {
    earnedBadgeIds: string[];
}

const BadgeList: React.FC<BadgeListProps & { scrollable?: boolean }> = ({ earnedBadgeIds = [], scrollable = false }) => {
    // Filter badges that the user has earned
    const earnedBadges = earnedBadgeIds
        .map(id => getBadge(id))
        .filter(badge => badge !== undefined);

    if (earnedBadges.length === 0) {
        return (
            <div className="text-gray-400 text-sm py-4">
                No badges earned yet. Keep engaging to unlock achievements!
            </div>
        );
    }

    if (scrollable) {
        return (
            <div className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar snap-x">
                {earnedBadges.map((badge) => {
                    if (!badge) return null;
                    const Icon = badge.icon;
                    return (
                        <div
                            key={badge.id}
                            className="flex-shrink-0 flex flex-col items-center p-2 bg-dark-800 rounded-lg border border-dark-700 min-w-[72px] snap-start"
                            title={badge.description}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-900/20 flex items-center justify-center mb-1">
                                <Icon className="w-4 h-4 text-primary-400" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-200 text-center leading-tight line-clamp-2 max-w-[64px]">{badge.name}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {earnedBadges.map((badge, index) => {
                if (!badge) return null;
                const Icon = badge.icon;

                return (
                    <div
                        key={badge.id}
                        className="flex flex-col items-center p-3 bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/50 transition-colors group relative"
                        title={badge.description}
                    >
                        <div className="w-12 h-12 rounded-full bg-primary-900/20 flex items-center justify-center mb-2 group-hover:bg-primary-900/40 transition-colors">
                            <Icon className="w-6 h-6 text-primary-400" />
                        </div>
                        <span className="text-xs font-medium text-gray-200 text-center">{badge.name}</span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-900 text-xs text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-dark-700">
                            {badge.description}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default BadgeList;
