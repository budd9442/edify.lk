-- Allow editors and admins to delete any article
-- Without this policy, editors get "success" but 0 rows are deleted (RLS blocks it)

CREATE POLICY "Editors can delete any article"
ON public.articles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('editor', 'admin')
  )
);
