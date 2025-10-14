export interface StrapiTextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface StrapiBlock {
  type: 'paragraph' | 'heading' | 'quote' | 'list' | 'list-item' | 'code' | 'image' | 'link';
  level?: number; // for headings (1-6)
  format?: 'ordered' | 'unordered'; // for lists
  url?: string; // for images and links
  alt?: string; // for images
  caption?: string; // for images
  language?: string; // for code blocks
  children: (StrapiTextNode | StrapiBlock)[];
}

export interface Draft {
  id: string;
  title: string;
  contentHtml: string;
  coverImage?: string;
  tags: string[];
  status: 'draft' | 'submitted' | 'published';
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  readingTime: number;
}

export interface ProfileProgress {
  userId: string;
  completedTasks: string[];
  badges: Badge[];
  totalScore: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Notification {
  id: string;
  type: 'comment' | 'like' | 'follow' | 'article_approved' | 'article_rejected' | 'badge_earned' | 'mention';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  timestamp: string;
  data?: any;
}

// Sample Strapi Blocks content
// Deprecated sample blocks left for reference; not used in the HTML-based flow
export const sampleStrapiBlocks: StrapiBlock[] = [];

export const mockDrafts: Draft[] = [
  {
    id: 'draft-1',
    title: 'The Evolution of Web Development',
    contentHtml: '<h1>Welcome to the Future of Content Creation</h1><p>This is a <strong>bold</strong> statement about the power of <em>structured content</em> in modern publishing platforms.</p><blockquote>The best way to predict the future is to create it.</blockquote><ul><li>Rich text editing with structured data</li><li>Seamless Strapi integration</li><li>Premium user experience</li></ul><pre><code>const content = {\n  type: "paragraph",\n  children: [{ text: "Hello World!" }]\n};</code></pre>',
    coverImage: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1',
    tags: ['Web Development', 'Technology', 'Programming'],
    status: 'draft',
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-15T16:45:00Z',
    wordCount: 1250,
    readingTime: 5
  },
  {
    id: 'draft-2',
    title: 'Building Sustainable Digital Products',
    contentHtml: '<p>Sustainability in digital product development...</p>',
    tags: ['Sustainability', 'Product Design'],
    status: 'submitted',
    createdAt: '2024-01-08T10:15:00Z',
    updatedAt: '2024-01-12T09:30:00Z',
    wordCount: 890,
    readingTime: 4
  }
];

export const mockProfileProgress: ProfileProgress = {
  userId: '1',
  completedTasks: [
    'profile_picture_added',
    'bio_written',
    'first_article_published',
    'first_comment_received'
  ],
  badges: [
    {
      id: 'badge-1',
      name: 'First Steps',
      description: 'Completed your profile setup',
      icon: '🎯',
      earnedAt: '2024-01-10T12:00:00Z',
      rarity: 'common'
    },
    {
      id: 'badge-2',
      name: 'Author',
      description: 'Published your first article',
      icon: '✍️',
      earnedAt: '2024-01-12T15:30:00Z',
      rarity: 'rare'
    },
    {
      id: 'badge-3',
      name: 'Engagement Master',
      description: 'Received 10 comments on your articles',
      icon: '💬',
      earnedAt: '2024-01-14T18:45:00Z',
      rarity: 'epic'
    }
  ],
  totalScore: 150
};

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'article_approved',
    title: 'Article Approved!',
    message: 'Your article "The Future of AI" has been approved and published.',
    read: false,
    link: '/article/1',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: 'notif-2',
    type: 'comment',
    title: 'New Comment',
    message: 'Lavindu Binuwara commented on your article "Sustainable Business Practices".',
    read: false,
    link: '/article/2',
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: 'notif-3',
    type: 'follow',
    title: 'New Follower',
    message: 'Buddhika Bandara started following you.',
    read: true,
    link: '/profile/james-wilson',
    timestamp: '2024-01-14T16:22:00Z'
  },
  {
    id: 'notif-4',
    type: 'badge_earned',
    title: 'Badge Earned!',
    message: 'You earned the "Engagement Master" badge for receiving 10 comments.',
    read: true,
    timestamp: '2024-01-14T18:45:00Z',
    data: { badgeId: 'badge-3' }
  },
  {
    id: 'notif-5',
    type: 'like',
    title: 'Article Liked',
    message: '5 people liked your article "Remote Work Strategies".',
    read: true,
    link: '/article/3',
    timestamp: '2024-01-13T14:10:00Z'
  }
];

// Profile completion tasks
export const profileTasks = [
  {
    id: 'profile_picture_added',
    title: 'Add Profile Picture',
    description: 'Upload a professional profile photo',
    points: 10,
    icon: '📸'
  },
  {
    id: 'bio_written',
    title: 'Write Bio',
    description: 'Add a compelling bio to your profile',
    points: 15,
    icon: '📝'
  },
  {
    id: 'first_article_published',
    title: 'Publish First Article',
    description: 'Share your first article with the community',
    points: 25,
    icon: '🚀'
  },
  {
    id: 'social_links_added',
    title: 'Add Social Links',
    description: 'Connect your social media profiles',
    points: 10,
    icon: '🔗'
  },
  {
    id: 'first_comment_made',
    title: 'Make First Comment',
    description: 'Engage with the community by commenting',
    points: 15,
    icon: '💬'
  },
  {
    id: 'five_drafts_created',
    title: 'Create 5 Drafts',
    description: 'Build up your content pipeline',
    points: 20,
    icon: '📄'
  },
  {
    id: 'first_follower',
    title: 'Get First Follower',
    description: 'Build your audience',
    points: 20,
    icon: '👥'
  },
  {
    id: 'ten_articles_published',
    title: 'Publish 10 Articles',
    description: 'Become a prolific writer',
    points: 50,
    icon: '🏆'
  }
];