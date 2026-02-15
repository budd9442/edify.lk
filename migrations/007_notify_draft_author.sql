-- Function for editors to notify draft authors (bypasses RLS)
-- Used when approving or rejecting draft submissions

CREATE OR REPLACE FUNCTION public.notify_draft_author(
  p_draft_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_editor boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('editor', 'admin')
  ) INTO v_is_editor;
  IF NOT v_is_editor THEN
    RAISE EXCEPTION 'Only editors can notify draft authors';
  END IF;

  SELECT user_id INTO v_user_id FROM public.drafts WHERE id = p_draft_id;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    VALUES (v_user_id, p_type, p_title, p_message, p_action_url);
  END IF;
END;
$$;
