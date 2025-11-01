# Deploy Ms. Cheesy POS to Netlify

## Prerequisites
- A Netlify account (sign up at https://netlify.com)
- Your Supabase project credentials
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Make sure all your changes are committed:
```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 20

6. Add environment variables (click "Show advanced" → "New variable"):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hmozgkvakanhxddmficm.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

7. Click "Deploy site"

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize your site:
```bash
netlify init
```

4. Set environment variables:
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://hmozgkvakanhxddmficm.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_anon_key_here"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key_here"
```

5. Deploy:
```bash
netlify deploy --prod
```

## Step 3: Get Your Supabase Keys

1. Go to https://supabase.com/dashboard/project/hmozgkvakanhxddmficm
2. Click "Settings" → "API"
3. Copy:
   - **Project URL:** This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key:** This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key:** This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 4: Post-Deployment Setup

After deployment, you need to:

1. **Update Supabase Auth Settings:**
   - Go to your Supabase Dashboard → Authentication → URL Configuration
   - Add your Netlify URL to "Site URL": `https://your-site.netlify.app`
   - Add to "Redirect URLs": `https://your-site.netlify.app/**`

2. **Test Your Deployment:**
   - Visit your Netlify URL
   - Try logging in
   - Test a complete order flow
   - Check sales reports

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Authentication Issues
- Verify Supabase URL configuration includes your Netlify domain
- Check that environment variables are correct
- Clear browser cache and try again

### Database Connection Issues
- Verify Supabase is running and accessible
- Check RLS policies are correctly configured
- Ensure service role key is set if using server-side functions

## Environment Variables Reference

Required variables:
```env
# Public (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://hmozgkvakanhxddmficm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Private (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow instructions to configure DNS
4. Update Supabase Auth settings with your custom domain

## Auto-Deploy on Push

Once connected to Git, Netlify will automatically deploy when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify will automatically build and deploy!
```

## Support

For issues:
- Netlify: https://docs.netlify.com
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
