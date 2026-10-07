# Google Calendar Integration - Setup Guide

## 🎯 Overview

This feature allows Sloth Planner users to connect their Google Calendar and create events directly from the app using Firebase Authentication and Google Calendar API.

## 📦 Architecture

- **Frontend**: React component with Google Sign-In
- **Backend**: Next.js API routes (App Router)
- **Auth**: Firebase Authentication + Google OAuth
- **Database**: Firestore (storing OAuth tokens)
- **API**: Google Calendar API v3

## 🔧 Setup Instructions

### 1. Install Dependencies

Already done! The following packages are installed:
```bash
bun add googleapis firebase-admin
```

### 2. Configure Google OAuth

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

#### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add Authorized JavaScript origins:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
5. Add Authorized redirect URIs:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
6. Click "Create" and copy:
   - **Client ID**
   - **Client Secret**

#### Step 3: Update .env.local
Add to your `.env.local` file:
```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### 3. Configure Firebase Admin SDK

#### Step 1: Download Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (sloth-main)
3. Go to "Project Settings" (gear icon)
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Download the JSON file

#### Step 2: Save Service Account
1. Rename the downloaded file to `serviceAccountKey.json`
2. Move it to your project root directory:
   ```
   c:\Users\tanoo\OneDrive\Documents\vsc\sloth\serviceAccountKey.json
   ```
3. **IMPORTANT**: Add to `.gitignore`:
   ```
   serviceAccountKey.json
   ```

#### Step 3: Update .env.local
Already configured:
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### 4. Restart Development Server

```bash
bun run dev
```

## 🚀 Usage

### Access the Feature
Navigate to: **http://localhost:3001/calendar-integration**

### Workflow

1. **Log In**: Must be logged into Sloth Planner first
2. **Connect Google Calendar**: 
   - Click "Connect Google Calendar"
   - Sign in with Google
   - Grant calendar permissions
3. **Create Events**:
   - Fill in event details (title, description, start/end times)
   - Click "Create Event"
   - Event appears in your Google Calendar instantly!

## 🗂️ File Structure

```
lib/
├── firebase-admin.ts          # Firebase Admin SDK initialization
└── firebase.ts                # Firebase client (already exists)

app/
├── api/
│   ├── save-token/
│   │   └── route.ts          # API: Save OAuth tokens to Firestore
│   └── create-event/
│       └── route.ts          # API: Create Google Calendar event
└── (app)/
    └── calendar-integration/
        └── page.tsx          # Main calendar integration page

components/
├── google-calendar-scheduler.tsx  # Main scheduler component
└── ui/
    └── textarea.tsx          # Added for description field
```

## 🔐 Security

### Token Storage
- OAuth tokens are stored in Firestore collection: `userTokens`
- Each user's tokens are stored under their Firebase UID
- Tokens include:
  - `accessToken` (required)
  - `refreshToken` (for long-term access)
  - `updatedAt` (timestamp)

### Authentication Flow
1. User signs in with Firebase Auth
2. Google Sign-In popup requests calendar scope
3. Google returns OAuth tokens
4. Frontend sends tokens to `/api/save-token` with Firebase ID token
5. Backend verifies Firebase ID token
6. Backend stores tokens in Firestore

### API Protection
- All API routes verify Firebase ID tokens
- Only authenticated users can save/use tokens
- Tokens are associated with Firebase UID (no cross-user access)

## 🔍 Firestore Rules

Add these rules to your Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User tokens - only accessible by the owner
    match /userTokens/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🐛 Troubleshooting

### Error: "No tokens found"
- **Solution**: Click "Disconnect" and reconnect Google Calendar
- Ensure you granted calendar permissions during sign-in

### Error: "Token expired"
- **Solution**: Reconnect your Google Calendar
- This happens if refresh token is not stored or expired

### Error: "Firebase config missing"
- **Solution**: Ensure `serviceAccountKey.json` exists in project root
- Check `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env.local`

### Error: "Permission denied"
- **Solution**: Verify Google Calendar API is enabled in Google Cloud Console
- Check that calendar scope was granted during sign-in

### Events not appearing
- **Solution**: 
  - Check Google Calendar (web version)
  - Verify time zone settings match
  - Look for browser console errors

## 📝 API Reference

### POST /api/save-token
**Purpose**: Save Google OAuth tokens to Firestore

**Headers**:
```json
{
  "Authorization": "Bearer <Firebase_ID_Token>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//0e..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tokens saved successfully"
}
```

### POST /api/create-event
**Purpose**: Create a Google Calendar event

**Headers**:
```json
{
  "Authorization": "Bearer <Firebase_ID_Token>",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "summary": "Team Meeting",
  "description": "Quarterly planning session",
  "startDateTime": "2025-12-01T10:00:00",
  "endDateTime": "2025-12-01T11:00:00",
  "timeZone": "UTC"
}
```

**Response**:
```json
{
  "success": true,
  "event": {
    "id": "event_id_here",
    "htmlLink": "https://calendar.google.com/...",
    "summary": "Team Meeting",
    "start": { "dateTime": "2025-12-01T10:00:00Z" },
    "end": { "dateTime": "2025-12-01T11:00:00Z" }
  }
}
```

## 🎨 UI Components

Built with shadcn/ui components:
- `Card` - Container for forms and sections
- `Button` - Action buttons with loading states
- `Input` - Text and datetime-local inputs
- `Textarea` - Event description field
- `Label` - Form labels
- `Alert` - Status messages (success/error)
- Lucide icons: Calendar, CheckCircle2, AlertCircle, Loader2, LogOut

## 🚢 Production Deployment

### Environment Variables
Add to your production environment:
```bash
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

### Google OAuth Redirect URIs
Add your production domain to Google Cloud Console:
```
https://yourdomain.com
```

### Firebase Rules
Ensure Firestore rules are deployed (see above)

### Service Account
- Upload `serviceAccountKey.json` to your deployment platform
- Set `FIREBASE_SERVICE_ACCOUNT_PATH` to the correct path
- **Never** commit this file to Git!

## 📚 Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## ✅ Feature Checklist

- [x] Install dependencies (googleapis, firebase-admin)
- [x] Create Firebase Admin SDK initialization
- [x] Create API route: save-token
- [x] Create API route: create-event
- [x] Create GoogleCalendarScheduler component
- [x] Create calendar integration page
- [x] Add textarea shadcn component
- [x] Update .env.local template
- [ ] Configure Google OAuth (manual)
- [ ] Download Firebase service account key (manual)
- [ ] Test end-to-end flow

---

**Need Help?** Check the troubleshooting section or create an issue!
