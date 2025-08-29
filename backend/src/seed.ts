import payload from 'payload';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

const seed = async () => {
  try {
    // Initialize PayloadCMS
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
      config: resolve(__dirname, 'payload.config.ts'),
    });

    console.log('🌱 Starting database seeding...');

    // Create default categories
    const categories = [
      { name: 'Technology', description: 'Latest technology trends and innovations', icon: '💻', color: '#3B82F6' },
      { name: 'Business', description: 'Business insights and strategies', icon: '💼', color: '#10B981' },
      { name: 'Science', description: 'Scientific discoveries and research', icon: '🔬', color: '#8B5CF6' },
      { name: 'Health', description: 'Health and wellness information', icon: '🏥', color: '#EF4444' },
      { name: 'Education', description: 'Learning resources and educational content', icon: '📚', color: '#F59E0B' },
      { name: 'Arts', description: 'Creative arts and cultural content', icon: '🎨', color: '#EC4899' },
      { name: 'Sports', description: 'Sports news and analysis', icon: '⚽', color: '#06B6D4' },
      { name: 'Politics', description: 'Political news and analysis', icon: '🏛️', color: '#84CC16' },
    ];

    console.log('📂 Creating categories...');
    for (const category of categories) {
      try {
        await payload.create({
          collection: 'categories',
          data: category,
        });
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⏭️  Category already exists: ${category.name}`);
        } else {
          console.error(`❌ Error creating category ${category.name}:`, error.message);
        }
      }
    }

    // Create default tags
    const tags = [
      'AI', 'Machine Learning', 'Web Development', 'Mobile Apps', 'Cloud Computing',
      'Cybersecurity', 'Data Science', 'Blockchain', 'IoT', 'Startups',
      'Leadership', 'Marketing', 'Finance', 'Innovation', 'Sustainability',
      'Research', 'Medicine', 'Psychology', 'Environment', 'Space',
      'Learning', 'Skills', 'Career', 'Personal Development', 'Creativity',
      'Design', 'Photography', 'Music', 'Literature', 'Film',
      'Fitness', 'Nutrition', 'Mental Health', 'Wellness', 'Lifestyle',
      'Football', 'Basketball', 'Tennis', 'Olympics', 'Fitness',
      'Elections', 'Policy', 'International Relations', 'Economics', 'Social Issues'
    ];

    console.log('🏷️  Creating tags...');
    for (const tag of tags) {
      try {
        await payload.create({
          collection: 'tags',
          data: { name: tag },
        });
        console.log(`✅ Created tag: ${tag}`);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⏭️  Tag already exists: ${tag}`);
        } else {
          console.error(`❌ Error creating tag ${tag}:`, error.message);
        }
      }
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    try {
      const adminUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Admin User',
          email: 'admin@edify.lk',
          password: 'admin123',
          role: 'admin',
          verified: true,
          bio: 'System administrator for Edify Exposition platform',
        },
      });
      console.log(`✅ Created admin user: ${adminUser.email}`);
    } catch (error) {
      if (error.message.includes('duplicate')) {
        console.log(`⏭️  Admin user already exists`);
      } else {
        console.error(`❌ Error creating admin user:`, error.message);
      }
    }

    // Create sample author user
    console.log('✍️  Creating sample author...');
    try {
      const authorUser = await payload.create({
        collection: 'users',
        data: {
          name: 'Sample Author',
          email: 'author@edify.lk',
          password: 'author123',
          role: 'author',
          verified: true,
          bio: 'Sample author for demonstration purposes',
          socialLinks: {
            linkedin: 'https://linkedin.com/in/sample-author',
            twitter: 'https://twitter.com/sampleauthor',
            website: 'https://sampleauthor.com',
          },
        },
      });
      console.log(`✅ Created author user: ${authorUser.email}`);
    } catch (error) {
      if (error.message.includes('duplicate')) {
        console.log(`⏭️  Author user already exists`);
      } else {
        console.error(`❌ Error creating author user:`, error.message);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Access admin panel: http://localhost:3000/admin');
    console.log('3. Login with admin@edify.lk / admin123');
    console.log('4. Create your first article and start building!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
