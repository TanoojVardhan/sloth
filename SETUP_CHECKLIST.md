# 🚀 Quick Setup Checklist - Google Calendar Integration

Complete these steps to enable Google Calendar features:

## ✅ Already Done (by AI Agent)
- [x] Installed `googleapis` and `firebase-admin` packages
- [x] Created Firebase Admin SDK initialization
- [x] Created API routes (`/api/save-token`, `/api/create-event`)
- [x] Created GoogleCalendarScheduler component
- [x] Created calendar integration page
- [x] Added Textarea component (shadcn)
- [x] Updated environment variables template
- [x] Added navigation link to sidebar
- [x] Built successfully (32 routes)

## 📋 Manual Steps Required (Your Action Needed)

### Step 1: Google OAuth Setup (5 minutes)
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new)
3. Go to "APIs & Services" → "Library"
4. Search "Google Calendar API" → Click "Enable"
5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "OAuth client ID"
7. Application type: "Web application"
8. Add Authorized JavaScript origins:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
9. Add Authorized redirect URIs:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
10. Click "Create"
11. Copy the **Client ID** and **Client Secret**

### Step 2: Update .env.local
Open `.env.local` and update these lines:
```bash
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

### Step 3: Firebase Service Account (3 minutes)
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select "sloth-main" project
3. Click gear icon → "Project settings"
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Click "Generate key" (downloads JSON file)
7. Rename file to `serviceAccountKey.json`
8. Move it to project root:
   ```
   C:\Users\tanoo\OneDrive\Documents\vsc\sloth\serviceAccountKey.json
   ```

### Step 4: Restart Server
```bash
# Stop the current dev server (Ctrl+C in terminal)
bun run dev
```

### Step 5: Test It! 🎉
1. Open http://localhost:3001/calendar-integration
2. You should see "Google Calendar Integration" page
3. Click "Connect Google Calendar"
4. Sign in with Google
5. Grant calendar permissions
6. Create a test event
7. Check your Google Calendar - the event should be there!

## 🔍 Verification

If everything is set up correctly, you should see:
```
✅ Firebase Admin initialized with service account
✅ Google Calendar connected successfully!
✅ Event created successfully! View: https://calendar.google.com/...
```

## ❌ Common Issues

### "Service account file not found"
- **Fix**: Make sure `serviceAccountKey.json` is in project root
- **Check**: File path is `C:\Users\tanoo\OneDrive\Documents\vsc\sloth\serviceAccountKey.json`

### "Token expired"
- **Fix**: Disconnect and reconnect Google Calendar
- **Why**: Refresh token wasn't stored properly

### "Permission denied"
- **Fix**: Check Google Calendar API is enabled in Google Cloud Console
- **Fix**: Ensure you granted calendar permissions during sign-in

### "Invalid client"
- **Fix**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
- **Fix**: Check redirect URIs match in Google Cloud Console

## 📚 Documentation

- **Setup Guide**: `GOOGLE_CALENDAR_SETUP.md` (detailed instructions)
- **Implementation**: `IMPLEMENTATION_COMPLETE.md` (what was built)
- **Main README**: `README.md` (project overview)

## 🎯 Quick Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Calendar Integration Page](http://localhost:3001/calendar-integration)

## ⏱️ Total Setup Time: ~10 minutes

Good luck! 🍀

---

**Questions?** Check `GOOGLE_CALENDAR_SETUP.md` for troubleshooting.
