// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to the edify-exposition database
db = db.getSiblingDB('edify-exposition');

// Create a user for the application
db.createUser({
  user: 'edify_user',
  pwd: 'edify_password',
  roles: [
    {
      role: 'readWrite',
      db: 'edify-exposition'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('articles');
db.createCollection('comments');
db.createCollection('categories');
db.createCollection('tags');
db.createCollection('media');
db.createCollection('quizzes');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "verified": 1 });

db.articles.createIndex({ "slug": 1 }, { unique: true });
db.articles.createIndex({ "status": 1 });
db.articles.createIndex({ "featured": 1 });
db.articles.createIndex({ "author": 1 });
db.articles.createIndex({ "categories": 1 });
db.articles.createIndex({ "tags": 1 });
db.articles.createIndex({ "publishedAt": -1 });

db.comments.createIndex({ "article": 1 });
db.comments.createIndex({ "author": 1 });
db.comments.createIndex({ "parentComment": 1 });

db.categories.createIndex({ "slug": 1 }, { unique: true });
db.categories.createIndex({ "parent": 1 });

db.tags.createIndex({ "slug": 1 }, { unique: true });
db.tags.createIndex({ "usageCount": -1 });

db.media.createIndex({ "filename": 1 });
db.media.createIndex({ "mimeType": 1 });

db.quizzes.createIndex({ "status": 1 });
db.quizzes.createIndex({ "author": 1 });
db.quizzes.createIndex({ "tags": 1 });

db.notifications.createIndex({ "recipient": 1 });
db.notifications.createIndex({ "read": 1 });
db.notifications.createIndex({ "type": 1 });

print('MongoDB initialization completed successfully!');
print('Database: edify-exposition');
print('User: edify_user');
print('Collections and indexes created.');
