import {
    PenTool,
    Feather,
    BookOpen,
    MessageSquare,
    Users,
    Award,
    Zap,
    TrendingUp,
    Star,
    Trophy,
    Crown,
    Heart,
    Eye,
    CheckCircle,
    Medal
} from 'lucide-react';

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: any; // Lucide icon
    category: 'writer' | 'reader' | 'community' | 'quality' | 'quiz';
    assetUrl?: string; // For custom images later
}

export const BADGES: Badge[] = [
    // Writer Badges
    {
        id: 'first_ink',
        name: 'First Ink',
        description: 'Published your first article',
        icon: PenTool,
        category: 'writer'
    },
    {
        id: 'scribe',
        name: 'Scribe',
        description: 'Published 5 articles',
        icon: Feather,
        category: 'writer'
    },
    {
        id: 'wordsmith',
        name: 'Wordsmith',
        description: 'Published 10 articles',
        icon: BookOpen,
        category: 'writer'
    },

    // Reader & Engagement Badges
    {
        id: 'observer',
        name: 'Observer',
        description: 'Read 10 different articles',
        icon: Eye,
        category: 'reader'
    },
    {
        id: 'conversation_starter',
        name: 'Conversation Starter',
        description: 'Posted your first comment',
        icon: MessageSquare,
        category: 'reader'
    },
    {
        id: 'debater',
        name: 'Debater',
        description: 'Posted 50 comments',
        icon: MessageSquare,
        category: 'reader'
    },

    // Community Badges
    {
        id: 'rising_star',
        name: 'Rising Star',
        description: 'Reached 10 followers',
        icon: Star,
        category: 'community'
    },
    {
        id: 'influencer',
        name: 'Influencer',
        description: 'Reached 100 followers',
        icon: Crown,
        category: 'community'
    },
    {
        id: 'thought_leader',
        name: 'Thought Leader',
        description: 'Reached 1,000 followers',
        icon: Trophy,
        category: 'community'
    },

    // Quality Badges
    {
        id: 'viral_hit',
        name: 'Viral Hit',
        description: 'One of your articles reached 1,000 views',
        icon: TrendingUp,
        category: 'quality'
    },
    {
        id: 'crowd_favorite',
        name: 'Crowd Favorite',
        description: 'One of your articles reached 100 likes',
        icon: Heart,
        category: 'quality'
    },
    {
        id: 'editors_choice',
        name: 'Editor\'s Choice',
        description: 'Had an article featured by editors',
        icon: Award,
        category: 'quality'
    },

    // Quiz Badges
    {
        id: 'quiz_whiz',
        name: 'Quiz Whiz',
        description: 'Attempted 10 quizzes',
        icon: Zap,
        category: 'quiz'
    },
    {
        id: 'leaderboard_legend',
        name: 'Leaderboard Legend',
        description: 'Reached top 10 on a quiz leaderboard',
        icon: Medal,
        category: 'quiz'
    },
    {
        id: 'top_scorer',
        name: 'Top Scorer',
        description: 'Ranked #1 on a quiz leaderboard',
        icon: CheckCircle,
        category: 'quiz'
    }
];

export const getBadge = (id: string): Badge | undefined => {
    return BADGES.find(b => b.id === id);
};
