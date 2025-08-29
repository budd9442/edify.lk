import { CollectionConfig } from 'payload/types';
import { isAuthenticated, isAdminOrSelf } from '../access/isAdmin';

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'author', 'article', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAdminOrSelf,
    delete: isAdminOrSelf,
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      validate: (val) => {
        if (val.length < 1) {
          return 'Comment cannot be empty';
        }
        if (val.length > 1000) {
          return 'Comment must be less than 1000 characters';
        }
        return true;
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'Author of the comment',
      },
    },
    {
      name: 'article',
      type: 'relationship',
      relationTo: 'articles',
      required: true,
      hasMany: false,
      admin: {
        description: 'Article this comment belongs to',
      },
    },
    {
      name: 'parentComment',
      type: 'relationship',
      relationTo: 'comments',
      required: false,
      hasMany: false,
      admin: {
        description: 'Parent comment if this is a reply',
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
      name: 'replies',
      type: 'relationship',
      relationTo: 'comments',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Replies to this comment (auto-populated)',
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          // Update article comment count
          try {
            await req.payload.update({
              collection: 'articles',
              id: doc.article,
              data: {
                'stats.comments': {
                  increment: 1,
                },
              },
            });
          } catch (error) {
            console.error('Error updating article comment count:', error);
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Decrease article comment count
        try {
          await req.payload.update({
            collection: 'articles',
            id: doc.article,
            data: {
              'stats.comments': {
                increment: -1,
              },
            },
          });
        } catch (error) {
          console.error('Error updating article comment count:', error);
        }
      },
    ],
  },
};
