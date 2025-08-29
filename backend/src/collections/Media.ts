import { CollectionConfig } from 'payload/types';
import { isAuthenticated, isAdmin } from '../access/isAdmin';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 400,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1200,
        height: 600,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize'],
    group: 'Content',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      required: false,
      maxLength: 500,
    },
    {
      name: 'credit',
      type: 'text',
      required: false,
      admin: {
        description: 'Photo credit or attribution',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      required: false,
    },
    {
      name: 'usage',
      type: 'group',
      fields: [
        {
          name: 'articles',
          type: 'relationship',
          relationTo: 'articles',
          hasMany: true,
          admin: {
            readOnly: true,
            description: 'Articles using this media (auto-populated)',
          },
        },
        {
          name: 'users',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          admin: {
            readOnly: true,
            description: 'Users using this media (auto-populated)',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update usage tracking when media is used
        if (operation === 'update') {
          // Implementation for tracking media usage
        }
      },
    ],
  },
};
