export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    followersCount: number;
    articlesCount: number;
  };
  publishedAt: string;
  readingTime: number;
  likes: number;
  comments: Comment[];
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published' | 'pending';
  coverImage: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
}

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The Future of Artificial Intelligence: Transforming Industries and Society',
    excerpt: 'Explore how AI is revolutionizing various sectors and what it means for the future of work, creativity, and human interaction.',
    content: `
      <h2>The Dawn of a New Era</h2>
      <p>Artificial Intelligence is no longer a concept confined to science fiction novels or futuristic films. It has become an integral part of our daily lives, reshaping industries and redefining what's possible in the digital age.</p>
      
      <h3>Industry Transformation</h3>
      <p>From healthcare to finance, from manufacturing to entertainment, AI is creating unprecedented opportunities for innovation and efficiency. Machine learning algorithms are now capable of diagnosing diseases with remarkable accuracy, autonomous vehicles are becoming a reality, and personalized recommendations are enhancing user experiences across platforms.</p>
      
      <h3>The Human Element</h3>
      <p>While AI continues to advance, the human touch remains irreplaceable. The most successful AI implementations are those that augment human capabilities rather than replace them entirely. This symbiotic relationship between human creativity and artificial intelligence opens new frontiers for innovation.</p>
      
      <h3>Looking Forward</h3>
      <p>As we stand on the cusp of this technological revolution, it's crucial to approach AI development with both excitement and responsibility. The decisions we make today will shape the AI landscape of tomorrow, influencing how technology serves humanity's best interests.</p>
    `,
    author: {
      id: '1',
      name: 'Lavindu Binuwara',
      avatar: 'https://media.licdn.com/dms/image/v2/D5603AQGgIlxEuk7sDw/profile-displayphoto-shrink_100_100/B56ZXXQS69GcAU-/0/1743073128704?e=1756944000&v=beta&t=Mbkn0HPtM2WmEt9WAWgN5RBPFPKb0ACjgwjUkeJPetk',
      bio: 'AI researcher and technology strategist with 15 years of experience in machine learning and neural networks.',
      followersCount: 12500,
      articlesCount: 47,
    },
    publishedAt: '2024-01-15T10:30:00Z',
    readingTime: 8,
    likes: 234,
    comments: [
      {
        id: '1',
        content: 'halooo',
        author: {
          id: '2',
          name: 'Hashani Uduwage',
          avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
        },
        createdAt: '2024-01-15T14:22:00Z',
        likes: 12,
      },
    ],
    tags: ['AI', 'Technology', 'Future', 'Innovation'],
    featured: true,
    status: 'published',
    coverImage: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1',
  },
  {
    id: '2',
    title: 'Sustainable Business Practices: A Guide to Corporate Responsibility',
    excerpt: 'Discover how modern businesses are integrating sustainability into their core operations and why it matters for long-term success.',
    content: `
      <h2>The Imperative of Sustainable Business</h2>
      <p>In today's rapidly evolving business landscape, sustainability has moved from a nice-to-have to a must-have. Companies that fail to adopt sustainable practices risk not only environmental impact but also their competitive edge and stakeholder trust.</p>
      
      <h3>Environmental Stewardship</h3>
      <p>Leading organizations are implementing comprehensive environmental strategies that go beyond compliance. From reducing carbon footprints to embracing circular economy principles, businesses are finding innovative ways to minimize their environmental impact while maximizing operational efficiency.</p>
      
      <h3>Social Responsibility</h3>
      <p>Sustainable business practices extend beyond environmental concerns to encompass social responsibility. This includes fair labor practices, community engagement, and creating positive social impact through business operations.</p>
      
      <h3>Economic Viability</h3>
      <p>The most successful sustainable business models demonstrate that environmental and social responsibility can coexist with profitability. Companies that embrace this triple bottom line approach often discover new revenue streams and cost savings opportunities.</p>
    `,
    author: {
      id: '2',
      name: 'Hashani Uduwage',
      avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
      bio: 'Sustainability consultant and business strategist helping organizations build responsible and profitable business models.',
      followersCount: 8900,
      articlesCount: 32,
    },
    publishedAt: '2024-01-12T09:15:00Z',
    readingTime: 6,
    likes: 187,
    comments: [],
    tags: ['Sustainability', 'Business', 'ESG', 'Corporate Responsibility'],
    featured: false,
    status: 'published',
    coverImage: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1',
  },
  {
    id: '3',
    title: 'The Rise of Remote Work: Reshaping the Modern Workplace',
    excerpt: 'An in-depth look at how remote work is transforming organizational culture, productivity, and the future of employment.',
    content: `
      <h2>A Paradigm Shift in Work Culture</h2>
      <p>The global shift toward remote work has fundamentally changed how we think about productivity, collaboration, and work-life balance. What started as a necessity has evolved into a preferred working model for many organizations and employees.</p>
      
      <h3>Technology as the Great Enabler</h3>
      <p>Advanced communication tools, cloud computing, and collaborative platforms have made remote work not just possible but highly effective. Organizations are discovering that with the right technology stack, distributed teams can be just as productive as their in-office counterparts.</p>
      
      <h3>Challenges and Opportunities</h3>
      <p>While remote work offers numerous benefits, it also presents unique challenges. Maintaining team cohesion, ensuring effective communication, and preventing isolation are ongoing concerns that organizations must address thoughtfully.</p>
      
      <h3>The Future of Work</h3>
      <p>As we look ahead, the future of work will likely be hybrid, combining the best of both remote and in-person collaboration. Organizations that adapt to this new reality will be better positioned to attract and retain top talent.</p>
    `,
    author: {
      id: '3',
      name: 'Buddhika Bandara',
      avatar: 'https://media.licdn.com/dms/image/v2/D5603AQGTXKzL1LlvBA/profile-displayphoto-shrink_800_800/B56ZVREf3oHQAc-/0/1740821889504?e=1756944000&v=beta&t=-Vj2WYcdaURintD3LbYDj3F8PppAhscNTYfcdvJZVfk',
      bio: 'Workplace transformation expert and organizational psychologist focused on the future of work.',
      followersCount: 15200,
      articlesCount: 28,
    },
    publishedAt: '2024-01-10T16:45:00Z',
    readingTime: 7,
    likes: 312,
    comments: [],
    tags: ['Remote Work', 'Workplace', 'Future of Work', 'Productivity'],
    featured: true,
    status: 'published',
    coverImage: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1',
  },
];

export const mockUsers = [
  {
    id: '1',
    name: 'Lavindu Binuwara',
    avatar: 'https://media.licdn.com/dms/image/v2/D5603AQGgIlxEuk7sDw/profile-displayphoto-shrink_100_100/B56ZXXQS69GcAU-/0/1743073128704?e=1756944000&v=beta&t=Mbkn0HPtM2WmEt9WAWgN5RBPFPKb0ACjgwjUkeJPetk',
    bio: 'AI researcher and technology strategist with 15 years of experience in machine learning and neural networks.',
    followersCount: 12500,
    followingCount: 234,
    articlesCount: 47,
    verified: true,
  },
  {
    id: '2',
    name: 'Hashani Uduwage',
    avatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
    bio: 'Sustainability consultant and business strategist helping organizations build responsible and profitable business models.',
    followersCount: 8900,
    followingCount: 456,
    articlesCount: 32,
    verified: false,
  },
  {
    id: '3',
    name: 'Buddhika Bandara',
    avatar: 'https://media.licdn.com/dms/image/v2/D5603AQGTXKzL1LlvBA/profile-displayphoto-shrink_800_800/B56ZVREf3oHQAc-/0/1740821889504?e=1756944000&v=beta&t=-Vj2WYcdaURintD3LbYDj3F8PppAhscNTYfcdvJZVfk',
    bio: 'Workplace transformation expert and organizational psychologist focused on the future of work.',
    followersCount: 15200,
    followingCount: 189,
    articlesCount: 28,
    verified: true,
  },
];

export const mockNotifications = [
  {
    id: '1',
    type: 'like',
    message: 'Lavindu Binuwara liked your article "The Future of Remote Work"',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
  },
  {
    id: '2',
    type: 'comment',
    message: 'Hashani Uduwage commented on your article "Sustainable Business Practices"',
    timestamp: '2024-01-15T09:15:00Z',
    read: false,
  },
  {
    id: '3',
    type: 'follow',
    message: 'Buddhika Bandara started following you',
    timestamp: '2024-01-14T14:22:00Z',
    read: true,
  },
];