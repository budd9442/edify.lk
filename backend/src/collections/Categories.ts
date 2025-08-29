import { CollectionConfig } from 'payload/types';
import { isAdmin } from '../access/isAdmin';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'description'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the name (auto-generated)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
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
      name: 'description',
      type: 'textarea',
      required: false,
      maxLength: 500,
    },
    {
      name: 'icon',
      type: 'text',
      required: false,
      admin: {
        description: 'Icon class or emoji for the category',
      },
    },
    {
      name: 'color',
      type: 'text',
      required: false,
      admin: {
        description: 'Hex color code for the category',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      hasMany: false,
      admin: {
        description: 'Parent category if this is a subcategory',
      },
    },
  ],
};
