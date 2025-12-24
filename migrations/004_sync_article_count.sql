-- Function to update article count
CREATE OR REPLACE FUNCTION update_article_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles
    SET articles_count = articles_count + 1
    WHERE id = NEW.author_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles
    SET articles_count = GREATEST(0, articles_count - 1)
    WHERE id = OLD.author_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insertion
DROP TRIGGER IF EXISTS on_article_created ON articles;
CREATE TRIGGER on_article_created
AFTER INSERT ON articles
FOR EACH ROW
EXECUTE FUNCTION update_article_count();

-- Trigger for deletion
DROP TRIGGER IF EXISTS on_article_deleted ON articles;
CREATE TRIGGER on_article_deleted
AFTER DELETE ON articles
FOR EACH ROW
EXECUTE FUNCTION update_article_count();

-- Recalculate counts for existing data
UPDATE profiles p
SET articles_count = (
  SELECT COUNT(*)
  FROM articles a
  WHERE a.author_id = p.id
    AND a.status = 'published'
);
