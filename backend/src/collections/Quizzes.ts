import { CollectionConfig } from 'payload/types';
import { isAuthenticated, isAuthor, isAdmin } from '../access/isAdmin';

export const Quizzes: CollectionConfig = {
  slug: 'quizzes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: ({ req: { user }, doc }) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'editor') return true;
      if (user?.id === doc.author) return true;
      return false;
    },
    delete: ({ req: { user }, doc }) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'editor') return true;
      if (user?.id === doc.author) return true;
      return false;
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      validate: (val) => {
        if (val.length < 5) {
          return 'Title must be at least 5 characters long';
        }
        return true;
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      maxLength: 500,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'multiple-choice',
          options: [
            { label: 'Multiple Choice', value: 'multiple-choice' },
            { label: 'True/False', value: 'true-false' },
            { label: 'Short Answer', value: 'short-answer' },
          ],
        },
        {
          name: 'options',
          type: 'array',
          required: false,
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
            {
              name: 'isCorrect',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'multiple-choice',
          },
        },
        {
          name: 'correctAnswer',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData) => 
              siblingData?.type === 'true-false' || siblingData?.type === 'short-answer',
          },
        },
        {
          name: 'explanation',
          type: 'textarea',
          required: false,
          admin: {
            description: 'Explanation for the correct answer',
          },
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          max: 10,
        },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'timeLimit',
          type: 'number',
          required: false,
          admin: {
            description: 'Time limit in minutes (0 = no limit)',
          },
        },
        {
          name: 'passingScore',
          type: 'number',
          required: true,
          defaultValue: 70,
          min: 0,
          max: 100,
        },
        {
          name: 'allowRetakes',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showResults',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'randomizeQuestions',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        {
          name: 'attempts',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'averageScore',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'completionRate',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-set author if not provided
        if (!data.author && req.user) {
          data.author = req.user.id;
        }
        return data;
      },
    ],
  },
};
