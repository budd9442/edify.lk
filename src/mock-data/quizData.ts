export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  articleId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  quizId: string;
  articleId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpent: number; // in seconds
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  articleId: string;
  articleTitle: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpent: number;
  rank: number;
}

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    articleId: '1',
    title: 'AI & Technology Knowledge Check',
    questions: [
      {
        id: 'q1',
        question: 'What is the primary goal of artificial intelligence?',
        options: [
          'To replace all human jobs',
          'To augment human capabilities and solve complex problems',
          'To create robots that look like humans',
          'To make computers faster'
        ],
        correctAnswer: 1,
        explanation: 'AI aims to augment human capabilities and help solve complex problems, not replace humans entirely.'
      },
      {
        id: 'q2',
        question: 'Which of the following is a key component of machine learning?',
        options: [
          'Data',
          'Algorithms',
          'Computing power',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: 'Machine learning requires data to learn from, algorithms to process information, and computing power to execute.'
      },
      {
        id: 'q3',
        question: 'What does "neural network" refer to in AI?',
        options: [
          'A network of computers',
          'A mathematical model inspired by biological neural networks',
          'A type of internet connection',
          'A programming language'
        ],
        correctAnswer: 1,
        explanation: 'Neural networks are mathematical models inspired by how biological neural networks in the brain process information.'
      },
      {
        id: 'q4',
        question: 'Which industry has NOT been significantly impacted by AI?',
        options: [
          'Healthcare',
          'Finance',
          'Transportation',
          'None - AI has impacted all major industries'
        ],
        correctAnswer: 3,
        explanation: 'AI has made significant impacts across all major industries, from healthcare diagnostics to autonomous vehicles.'
      }
    ]
  },
  {
    id: 'quiz-2',
    articleId: '2',
    title: 'Sustainability & Business Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What does ESG stand for in business?',
        options: [
          'Economic, Social, Governance',
          'Environmental, Social, Governance',
          'Environmental, Strategic, Growth',
          'Economic, Strategic, Governance'
        ],
        correctAnswer: 1,
        explanation: 'ESG stands for Environmental, Social, and Governance - key factors in measuring sustainability and ethical impact.'
      },
      {
        id: 'q2',
        question: 'What is the "triple bottom line" approach?',
        options: [
          'Profit, People, Planet',
          'Revenue, Growth, Expansion',
          'Cost, Quality, Speed',
          'Innovation, Efficiency, Scale'
        ],
        correctAnswer: 0,
        explanation: 'The triple bottom line focuses on Profit, People, and Planet - balancing financial, social, and environmental performance.'
      },
      {
        id: 'q3',
        question: 'Which of these is a key benefit of sustainable business practices?',
        options: [
          'Reduced operational costs',
          'Improved brand reputation',
          'Better risk management',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: 'Sustainable practices offer multiple benefits including cost reduction, enhanced reputation, and better risk management.'
      }
    ]
  },
  {
    id: 'quiz-3',
    articleId: '3',
    title: 'Remote Work Mastery',
    questions: [
      {
        id: 'q1',
        question: 'What is the biggest challenge of remote work according to most studies?',
        options: [
          'Technology issues',
          'Communication and collaboration',
          'Time zone differences',
          'Internet connectivity'
        ],
        correctAnswer: 1,
        explanation: 'Communication and collaboration remain the biggest challenges in remote work environments.'
      },
      {
        id: 'q2',
        question: 'Which tool category is most essential for remote teams?',
        options: [
          'Project management',
          'Video conferencing',
          'Cloud storage',
          'All are equally important'
        ],
        correctAnswer: 3,
        explanation: 'Successful remote work requires a combination of project management, communication, and collaboration tools.'
      },
      {
        id: 'q3',
        question: 'What is a key advantage of hybrid work models?',
        options: [
          'Lower office costs',
          'Flexibility for employees',
          'Better work-life balance',
          'All of the above'
        ],
        correctAnswer: 3,
        explanation: 'Hybrid models offer multiple benefits including cost savings, flexibility, and improved work-life balance.'
      }
    ]
  }
];

export const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    id: 'entry-1',
    userId: '1',
    userName: 'Lavindu Binuwara',
    userAvatar: 'https://media.licdn.com/dms/image/v2/D5603AQGgIlxEuk7sDw/profile-displayphoto-shrink_100_100/B56ZXXQS69GcAU-/0/1743073128704?e=1756944000&v=beta&t=Mbkn0HPtM2WmEt9WAWgN5RBPFPKb0ACjgwjUkeJPetk',
    articleId: '1',
    articleTitle: 'The Future of Artificial Intelligence',
    score: 4,
    totalQuestions: 4,
    completedAt: '2024-01-15T14:30:00Z',
    timeSpent: 120,
    rank: 1
  },
  {
    id: 'entry-2',
    userId: '2',
    userName: 'Hashani Uduwage',
    userAvatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
    articleId: '1',
    articleTitle: 'The Future of Artificial Intelligence',
    score: 4,
    totalQuestions: 4,
    completedAt: '2024-01-15T15:45:00Z',
    timeSpent: 95,
    rank: 2
  },
  {
    id: 'entry-3',
    userId: '3',
    userName: 'Hashani Uduwage',
    userAvatar: 'https://media.licdn.com/dms/image/v2/D4E03AQFM2bia86LEpQ/profile-displayphoto-shrink_100_100/B4EZQ1W9ILHEAU-/0/1736062004138?e=1756944000&v=beta&t=NRca3iZVIMWnDQX4DSCf3jjF73JgMJJkV_QeUUxxPiY',
    articleId: '2',
    articleTitle: 'Sustainable Business Practices',
    score: 3,
    totalQuestions: 3,
    completedAt: '2024-01-14T16:20:00Z',
    timeSpent: 85,
    rank: 1
  },
  {
    id: 'entry-4',
    userId: '4',
    userName: 'Buddhika Bandara',
    userAvatar: 'https://media.licdn.com/dms/image/v2/D5603AQGTXKzL1LlvBA/profile-displayphoto-shrink_800_800/B56ZVREf3oHQAc-/0/1740821889504?e=1756944000&v=beta&t=-Vj2WYcdaURintD3LbYDj3F8PppAhscNTYfcdvJZVfk',
    articleId: '3',
    articleTitle: 'The Rise of Remote Work',
    score: 3,
    totalQuestions: 3,
    completedAt: '2024-01-13T11:15:00Z',
    timeSpent: 110,
    rank: 1
  }
];