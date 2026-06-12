# Supabase Auth configuration

For production SSR auth, configure Supabase:

Authentication -> URL Configuration

Site URL:

```text
https://royalty-hospitality.vercel.app
```

Redirect URLs:

```text
https://royalty-hospitality.vercel.app/**
http://localhost:3000/**
```

For the initial demo, keep email confirmation OFF so password login creates an active session immediately.
