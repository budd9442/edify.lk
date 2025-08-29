import { CollectionConfig } from 'payload/types';
import { isAuthenticated, isAdminOrSelf } from '../access/isAdmin';

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipient', 'type', 'read', 'createdAt'],
    group: 'System',
  },
  access: {
    read: isAdminOrSelf,
    create: isAuthenticated,
    update: isAdminOrSelf,
    delete: isAdminOrSelf,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Article Comment', value: 'comment' },
        { label: 'Follow', value: 'follow' },
        { label: 'Like', value: 'like' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the notification has been read',
      },
    },
    {
      name: 'actionUrl',
      type: 'text',
      required: false,
      admin: {
        description: 'URL to navigate to when notification is clicked',
      },
    },
    {
      name: 'actionText',
      type: 'text',
      required: false,
      admin: {
        description: 'Text for the action button',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Additional data for the notification',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: false,
      admin: {
        description: 'When the notification expires (optional)',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-set recipient if not provided and user is creating for themselves
        if (!data.recipient && req.user) {
          data.recipient = req.user.id;
        }
        return data;
      },
    ],
  },
  endpoints: [
    {
      path: '/mark-read',
      method: 'post',
      handler: async (req, res, next) => {
        try {
          const { notificationIds } = req.body;
          const userId = req.user?.id;

          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
          }

          if (Array.isArray(notificationIds)) {
            await Promise.all(
              notificationIds.map(async (id: string) => {
                await req.payload.update({
                  collection: 'notifications',
                  id,
                  data: { read: true },
                });
              })
            );
          }

          res.json({ success: true });
        } catch (error) {
          next(error);
        }
      },
    },
    {
      path: '/unread-count',
      method: 'get',
      handler: async (req, res, next) => {
        try {
          const userId = req.user?.id;

          if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
          }

          const result = await req.payload.find({
            collection: 'notifications',
            where: {
              and: [
                { recipient: { equals: userId } },
                { read: { equals: false } },
              ],
            },
            limit: 0, // Just get count
          });

          res.json({ count: result.totalDocs });
        } catch (error) {
          next(error);
        }
      },
    },
  ],
};
