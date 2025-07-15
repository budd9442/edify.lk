-- Sample data for testing the application
-- Run this after creating the main schema and after you have signed up for an account.
-- This script will associate the sample data with your user account.

-- Insert sample tags
INSERT INTO tags (name, slug, description, color) VALUES
  ('Technology', 'technology', 'All things tech', '#3B82F6'),
  ('AI', 'ai', 'Artificial Intelligence', '#8B5CF6'),
  ('Web Development', 'web-development', 'Frontend and backend development', '#10B981'),
  ('React', 'react', 'React framework', '#06B6D4'),
  ('JavaScript', 'javascript', 'JavaScript programming', '#F59E0B'),
  ('Programming', 'programming', 'General programming topics', '#EF4444'),
  ('Tutorial', 'tutorial', 'Step-by-step guides', '#84CC16'),
  ('Opinion', 'opinion', 'Personal thoughts and opinions', '#F97316')
ON CONFLICT (name) DO NOTHING;

-- Insert sample articles and associate them with your user ID.
-- The user profile is created automatically by a trigger when you sign up.
INSERT INTO articles (title, slug, content, excerpt, author_id, status, featured, reading_time, published_at) VALUES
  (
    'The Future of Artificial Intelligence: Transforming Industries and Society',
    'future-of-artificial-intelligence',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Artificial Intelligence is no longer a concept confined to science fiction novels or futuristic films. It has become an integral part of our daily lives, reshaping industries and redefining what''s possible in the digital age."}]}]}',
    'Explore how AI is revolutionizing various sectors and what it means for the future of work, creativity, and human interaction.',
    '1c579344-011b-4f58-af32-058951fbedce', -- <-- Your User ID
    'published',
    true,
    8,
    now() - interval '1 day'
  ),
  (
    'Building Modern Web Applications with React and TypeScript',
    'modern-web-apps-react-typescript',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Modern web development has evolved significantly with the introduction of powerful frameworks and type-safe languages. React and TypeScript have become the go-to combination for building scalable, maintainable applications."}]}]}',
    'A comprehensive guide to building robust web applications using React and TypeScript.',
    '1c579344-011b-4f58-af32-058951fbedce', -- <-- Your User ID
    'published',
    false,
    12,
    now() - interval '2 days'
  ),
  (
    'The Art of Clean Code: Best Practices for Developers',
    'art-of-clean-code',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Writing clean, maintainable code is both an art and a science. It requires discipline, practice, and a deep understanding of programming principles."}]}]}',
    'Learn the essential principles and practices for writing clean, maintainable code that your future self will thank you for.',
    '1c579344-011b-4f58-af32-058951fbedce', -- <-- Your User ID
    'published',
    true,
    10,
    now() - interval '3 days'
  ),
  (
    'Understanding Async/Await in JavaScript',
    'understanding-async-await-javascript',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Asynchronous programming in JavaScript can be tricky, but async/await makes it much more manageable. Let''s explore how to use these powerful features effectively."}]}]}',
    'Master asynchronous programming in JavaScript with practical examples and best practices.',
    '1c579344-011b-4f58-af32-058951fbedce', -- <-- Your User ID
    'published',
    false,
    6,
    now() - interval '4 days'
  ),
  (
    'Introduction to Machine Learning for Beginners',
    'intro-machine-learning-beginners',
    '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Machine learning might seem intimidating at first, but with the right approach, anyone can start their journey into this fascinating field."}]}]}',
    'A beginner-friendly introduction to machine learning concepts, algorithms, and practical applications.',
    '1c579344-011b-4f58-af32-058951fbedce', -- <-- Your User ID
    'published',
    false,
    15,
    now() - interval '5 days'
  )
ON CONFLICT (slug) DO NOTHING;

-- Create article-tag associations
INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM articles a, tags t
WHERE (a.slug = 'future-of-artificial-intelligence' AND t.slug IN ('ai', 'technology'))
   OR (a.slug = 'modern-web-apps-react-typescript' AND t.slug IN ('react', 'web-development', 'typescript'))
   OR (a.slug = 'art-of-clean-code' AND t.slug IN ('programming', 'tutorial'))
   OR (a.slug = 'understanding-async-await-javascript' AND t.slug IN ('javascript', 'programming', 'tutorial'))
   OR (a.slug = 'intro-machine-learning-beginners' AND t.slug IN ('ai', 'tutorial'))
ON CONFLICT (article_id, tag_id) DO NOTHING;

-- Update article counts for your user profile
UPDATE profiles SET articles_count = (
  SELECT COUNT(*) FROM articles WHERE author_id = '1c579344-011b-4f58-af32-058951fbedce'
) WHERE id = '1c579344-011b-4f58-af32-058951fbedce';

-- Update tag article counts
UPDATE tags SET articles_count = (
  SELECT COUNT(*) FROM article_tags WHERE tag_id = tags.id
);
