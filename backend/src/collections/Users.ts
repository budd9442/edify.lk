import { CollectionConfig } from 'payload/types';
import { isAdmin, isAdminOrSelf } from '../access/isAdmin';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    verify: {
      generateEmailHTML: ({ token, user }) => {
        return `
          <h1>Verify your email</h1>
          <p>Hello ${user.email},</p>
          <p>Please click the link below to verify your email:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}">Verify Email</a>
        `;
      },
    },
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        return `
          <h1>Reset your password</h1>
          <p>Hello ${user.email},</p>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Reset Password</a>
        `;
      },
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'verified'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: (val) => {
        if (val.length < 2) {
          return 'Name must be at least 2 characters long';
        }
        return true;
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'This email will be used for login and notifications',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
      maxLength: 500,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Author', value: 'author' },
        { label: 'Editor', value: 'editor' },
        { label: 'Admin', value: 'admin' },
      ],
      access: {
        update: isAdmin,
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this user has been verified',
      },
      access: {
        update: isAdmin,
      },
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        {
          name: 'linkedin',
          type: 'text',
          admin: {
            description: 'LinkedIn profile URL',
          },
        },
        {
          name: 'twitter',
          type: 'text',
          admin: {
            description: 'Twitter/X profile URL',
          },
        },
        {
          name: 'website',
          type: 'text',
          admin: {
            description: 'Personal website URL',
          },
        },
      ],
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'emailNotifications',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive email notifications',
          },
        },
        {
          name: 'pushNotifications',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receive push notifications',
          },
        },
      ],
    },
    {
      name: 'stats',
      type: 'group',
      fields: [
        {
          name: 'followersCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of followers (auto-calculated)',
          },
        },
        {
          name: 'followingCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of users being followed (auto-calculated)',
          },
        },
        {
          name: 'articlesCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of published articles (auto-calculated)',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        // Ensure email is lowercase
        if (data.email) {
          data.email = data.email.toLowerCase();
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Update stats when user data changes
        if (operation === 'update') {
          // This would typically update related stats
          // Implementation depends on your specific requirements
        }
      },
    ],
  },
};
