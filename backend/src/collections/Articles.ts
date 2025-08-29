import { CollectionConfig } from 'payload/types';
import { isAdmin, isAuthor, isAuthenticated, isPublic } from '../access/isAdmin';

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'publishedAt', 'featured'],
    group: 'Content',
  },
  access: {
    read: isPublic,
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
        if (val.length > 200) {
          return 'Title must be less than 200 characters';
        }
        return true;
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the title (auto-generated)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description: 'Brief summary of the article (max 300 characters)',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Main article content with rich text editor',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'Author of the article',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Main image for the article',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Review', value: 'pending' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description: 'Current status of the article',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this article should be featured',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: false,
      admin: {
        description: 'Categories this article belongs to',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      required: false,
      admin: {
        description: 'Tags for this article',
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      required: false,
      admin: {
        description: 'Estimated reading time in minutes (auto-calculated)',
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (!value && data?.content) {
              // Calculate reading time based on content length
              const wordCount = JSON.stringify(data.content).split(' ').length;
              return Math.ceil(wordCount / 200); // Average reading speed: 200 words per minute
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          maxLength: 60,
          admin: {
            description: 'SEO title (max 60 characters)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: {
            description: 'SEO description (max 160 characters)',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          admin: {
            description: 'SEO keywords (comma-separated)',
          },
        },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        {
          name: 'views',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of views (auto-calculated)',
          },
        },
        {
          name: 'likes',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of likes (auto-calculated)',
          },
        },
        {
          name: 'comments',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of comments (auto-calculated)',
          },
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'When the article was published',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ value, data }) => {
            if (data?.status === 'published' && !value) {
              return new Date();
            }
            return value;
          },
        ],
      },
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
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update author stats when article is published
        if (operation === 'update' && doc.status === 'published') {
          // This would typically update the author's article count
          // Implementation depends on your specific requirements
        }
      },
    ],
  },
  endpoints: [
    {
      path: '/featured',
      method: 'get',
      handler: async (req, res, next) => {
        try {
          const articles = await req.payload.find({
            collection: 'articles',
            where: {
              and: [
                { status: { equals: 'published' } },
                { featured: { equals: true } },
              ],
            },
            sort: '-publishedAt',
            limit: 10,
          });
          res.json(articles);
        } catch (error) {
          next(error);
        }
      },
    },
    {
      path: '/search',
      method: 'get',
      handler: async (req, res, next) => {
        try {
          const { q, category, tag, author } = req.query;
          const where: any = { status: { equals: 'published' } };

          if (q) {
            where.or = [
              { title: { contains: q as string } },
              { excerpt: { contains: q as string } },
            ];
          }

          if (category) {
            where.categories = { in: [category] };
          }

          if (tag) {
            where.tags = { in: [tag] };
          }

          if (author) {
            where.author = { equals: author };
          }

          const articles = await req.payload.find({
            collection: 'articles',
            where,
            sort: '-publishedAt',
            limit: 20,
          });
          res.json(articles);
        } catch (error) {
          next(error);
        }
      },
    },
  ],
};
