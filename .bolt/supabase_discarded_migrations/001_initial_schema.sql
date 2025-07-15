-- Create a new migration file with conditional checks
DO $$ 
BEGIN
  -- Create tables only if they don't exist
  
  -- Profiles table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      website TEXT,
      location TEXT,
      twitter_handle TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      is_verified BOOLEAN DEFAULT false,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      articles_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Articles table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'articles') THEN
    CREATE TABLE articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content JSONB NOT NULL,
      excerpt TEXT,
      cover_image TEXT,
      author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      featured BOOLEAN DEFAULT false,
      reading_time INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Tags table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
    CREATE TABLE tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT,
      articles_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Article tags junction table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'article_tags') THEN
    CREATE TABLE article_tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(article_id, tag_id)
    );
  END IF;

  -- Comments table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      content TEXT NOT NULL,
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      likes_count INTEGER DEFAULT 0,
      is_edited BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Likes table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
    CREATE TABLE likes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
      comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, article_id),
      UNIQUE(user_id, comment_id),
      CHECK ((article_id IS NOT NULL AND comment_id IS NULL) OR (article_id IS NULL AND comment_id IS NOT NULL))
    );
  END IF;

  -- Follows table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
    CREATE TABLE follows (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(follower_id, following_id),
      CHECK (follower_id <> following_id)
    );
  END IF;

  -- Bookmarks table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookmarks') THEN
    CREATE TABLE bookmarks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, article_id)
    );
  END IF;

  -- Notifications table
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'article_published', 'mention')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data JSONB,
      read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
  CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
  CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
  CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
  CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
  CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
  CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
  CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
  CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

  -- Create or replace trigger functions
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create or replace function to handle new users
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create or replace function to update article counts
  CREATE OR REPLACE FUNCTION update_article_counts()
  RETURNS TRIGGER AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      UPDATE profiles SET articles_count = articles_count + 1 WHERE id = NEW.author_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE profiles SET articles_count = articles_count - 1 WHERE id = OLD.author_id;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  -- Create or replace function to update follow counts
  CREATE OR REPLACE FUNCTION update_follow_counts()
  RETURNS TRIGGER AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
      UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
      UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  -- Create or replace function to update like counts
  CREATE OR REPLACE FUNCTION update_like_counts()
  RETURNS TRIGGER AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      IF (NEW.article_id IS NOT NULL) THEN
        UPDATE articles SET likes_count = likes_count + 1 WHERE id = NEW.article_id;
      ELSIF (NEW.comment_id IS NOT NULL) THEN
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
      END IF;
    ELSIF (TG_OP = 'DELETE') THEN
      IF (OLD.article_id IS NOT NULL) THEN
        UPDATE articles SET likes_count = likes_count - 1 WHERE id = OLD.article_id;
      ELSIF (OLD.comment_id IS NOT NULL) THEN
        UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
      END IF;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  -- Create or replace function to update comment counts
  CREATE OR REPLACE FUNCTION update_comment_counts()
  RETURNS TRIGGER AS $$
  BEGIN
    IF (TG_OP = 'INSERT') THEN
      UPDATE articles SET comments_count = comments_count + 1 WHERE id = NEW.article_id;
    ELSIF (TG_OP = 'DELETE') THEN
      UPDATE articles SET comments_count = comments_count - 1 WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
  END;
  $$ LANGUAGE plpgsql;

  -- Create triggers if they don't exist
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
  CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
  CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
  CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_article_counts_trigger ON articles;
  CREATE TRIGGER update_article_counts_trigger
    AFTER INSERT OR DELETE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_counts();

  DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
  CREATE TRIGGER update_follow_counts_trigger
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_counts();

  DROP TRIGGER IF EXISTS update_like_counts_trigger ON likes;
  CREATE TRIGGER update_like_counts_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_counts();

  DROP TRIGGER IF EXISTS update_comment_counts_trigger ON comments;
  CREATE TRIGGER update_comment_counts_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_counts();

  -- Create auth trigger for new users
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

  -- Enable RLS on all tables
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
  ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

  -- Create policies for profiles table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
      CREATE POLICY "Public profiles are viewable by everyone" 
      ON profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can insert their own profile'
    ) THEN
      CREATE POLICY "Users can insert their own profile" 
      ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can update their own profile'
    ) THEN
      CREATE POLICY "Users can update their own profile" 
      ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
  END
  $policies$;

  -- Create policies for articles table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'articles' 
      AND policyname = 'Published articles are viewable by everyone'
    ) THEN
      CREATE POLICY "Published articles are viewable by everyone" 
      ON articles FOR SELECT USING ((status = 'published') OR (auth.uid() = author_id));
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'articles' 
      AND policyname = 'Users can insert their own articles'
    ) THEN
      CREATE POLICY "Users can insert their own articles" 
      ON articles FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'articles' 
      AND policyname = 'Users can update their own articles'
    ) THEN
      CREATE POLICY "Users can update their own articles" 
      ON articles FOR UPDATE USING (auth.uid() = author_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'articles' 
      AND policyname = 'Users can delete their own articles'
    ) THEN
      CREATE POLICY "Users can delete their own articles" 
      ON articles FOR DELETE USING (auth.uid() = author_id);
    END IF;
  END
  $policies$;

  -- Create policies for tags table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'tags' 
      AND policyname = 'Tags are viewable by everyone'
    ) THEN
      CREATE POLICY "Tags are viewable by everyone" 
      ON tags FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'tags' 
      AND policyname = 'Authenticated users can insert tags'
    ) THEN
      CREATE POLICY "Authenticated users can insert tags" 
      ON tags FOR INSERT TO authenticated USING (true);
    END IF;
  END
  $policies$;

  -- Create policies for article_tags table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'article_tags' 
      AND policyname = 'Article tags are viewable by everyone'
    ) THEN
      CREATE POLICY "Article tags are viewable by everyone" 
      ON article_tags FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'article_tags' 
      AND policyname = 'Users can manage tags for their articles'
    ) THEN
      CREATE POLICY "Users can manage tags for their articles" 
      ON article_tags FOR ALL USING (
        EXISTS (
          SELECT 1 FROM articles
          WHERE articles.id = article_tags.article_id
          AND articles.author_id = auth.uid()
        )
      );
    END IF;
  END
  $policies$;

  -- Create policies for comments table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'comments' 
      AND policyname = 'Comments are viewable by everyone'
    ) THEN
      CREATE POLICY "Comments are viewable by everyone" 
      ON comments FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'comments' 
      AND policyname = 'Authenticated users can insert comments'
    ) THEN
      CREATE POLICY "Authenticated users can insert comments" 
      ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'comments' 
      AND policyname = 'Users can update their own comments'
    ) THEN
      CREATE POLICY "Users can update their own comments" 
      ON comments FOR UPDATE USING (auth.uid() = author_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'comments' 
      AND policyname = 'Users can delete their own comments'
    ) THEN
      CREATE POLICY "Users can delete their own comments" 
      ON comments FOR DELETE USING (auth.uid() = author_id);
    END IF;
  END
  $policies$;

  -- Create policies for likes table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'likes' 
      AND policyname = 'Likes are viewable by everyone'
    ) THEN
      CREATE POLICY "Likes are viewable by everyone" 
      ON likes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'likes' 
      AND policyname = 'Authenticated users can manage their likes'
    ) THEN
      CREATE POLICY "Authenticated users can manage their likes" 
      ON likes FOR ALL TO authenticated USING (auth.uid() = user_id);
    END IF;
  END
  $policies$;

  -- Create policies for follows table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'follows' 
      AND policyname = 'Follows are viewable by everyone'
    ) THEN
      CREATE POLICY "Follows are viewable by everyone" 
      ON follows FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'follows' 
      AND policyname = 'Authenticated users can manage their follows'
    ) THEN
      CREATE POLICY "Authenticated users can manage their follows" 
      ON follows FOR ALL TO authenticated USING (auth.uid() = follower_id);
    END IF;
  END
  $policies$;

  -- Create policies for bookmarks table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'bookmarks' 
      AND policyname = 'Users can view their own bookmarks'
    ) THEN
      CREATE POLICY "Users can view their own bookmarks" 
      ON bookmarks FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'bookmarks' 
      AND policyname = 'Users can manage their own bookmarks'
    ) THEN
      CREATE POLICY "Users can manage their own bookmarks" 
      ON bookmarks FOR ALL USING (auth.uid() = user_id);
    END IF;
  END
  $policies$;

  -- Create policies for notifications table
  DO $policies$
  BEGIN
    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'notifications' 
      AND policyname = 'Users can view their own notifications'
    ) THEN
      CREATE POLICY "Users can view their own notifications" 
      ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT FROM pg_policies 
      WHERE tablename = 'notifications' 
      AND policyname = 'Users can update their own notifications'
    ) THEN
      CREATE POLICY "Users can update their own notifications" 
      ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END
  $policies$;

END $$;
