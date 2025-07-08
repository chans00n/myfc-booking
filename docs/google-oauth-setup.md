# Google OAuth Setup for Supabase

To enable Google authentication in your massage booking system, follow these steps:

## 1. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Name your OAuth client (e.g., "Massage Booking App")
   - Add authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Click "Create"

5. Save your credentials:
   - Client ID
   - Client Secret

## 2. Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to Authentication > Providers
3. Find Google in the list and enable it
4. Enter your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
5. Save the configuration

## 3. Update Environment Variables

Add these to your `.env.local` if needed for any custom OAuth flows:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. Test the Integration

1. Sign out of any existing sessions
2. Go to the sign-in page
3. Click "Continue with Google"
4. Authorize the application
5. Verify that the user profile is created correctly

## Troubleshooting

- **Redirect URI mismatch**: Ensure the redirect URI in Google Cloud Console exactly matches your Supabase project URL
- **API not enabled**: Make sure Google+ API is enabled in your Google Cloud project
- **Invalid client**: Double-check that your client ID and secret are correctly entered in Supabase

## Security Notes

- Never commit Google OAuth credentials to version control
- Use environment variables for any client-side OAuth configuration
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console