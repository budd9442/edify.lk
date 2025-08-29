import { buildConfig } from 'payload/config';
import { webpackBundler } from '@payloadcms/bundler-webpack';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { slateEditor } from '@payloadcms/richtext-slate';
import path from 'path';
import { Users } from './collections/Users';
import { Articles } from './collections/Articles';
import { Comments } from './collections/Comments';
import { Categories } from './collections/Categories';
import { Tags } from './collections/Tags';
import { Media } from './collections/Media';
import { Quizzes } from './collections/Quizzes';
import { Notifications } from './collections/Notifications';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- Edify Exposition',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    components: {
      // Custom admin components can be added here
    },
  },
  collections: [
    Users,
    Articles,
    Comments,
    Categories,
    Tags,
    Media,
    Quizzes,
    Notifications,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  cors: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:3000',
  ],
  csrf: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:3000',
  ],
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/edify-exposition',
  }),
  upload: {
    limits: {
      fileSize: 5000000, // 5MB
    },
  },
  rateLimit: {
    max: 1000,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  hooks: {
    // Global hooks can be added here
  },
});
