# Supabase Email Templates

## Reset Password Template

Copy the contents of `reset-password.html` into your Supabase Dashboard:

1. Go to **Authentication** → **Email Templates**
2. Select **Reset Password**
3. Paste the HTML (replacing the default template)
4. Save

### Required Configuration

**Redirect URLs**: Add your reset password URL to allowed redirects:

- **Supabase Dashboard** → **Authentication** → **URL Configuration**
- Under **Redirect URLs**, add:
  - `http://localhost:5173/reset-password` (for local dev)
  - `https://yourdomain.com/reset-password` (for production)

### Template Variables

Supabase provides these variables (Go template syntax):

- `{{ .ConfirmationURL }}` – Full reset link (used in the template)
- `{{ .SiteURL }}` – Your configured site URL
- `{{ .Email }}` – User's email address
