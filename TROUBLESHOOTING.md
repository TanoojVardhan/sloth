# Troubleshooting Guide

## Data Not Loading from Firebase

### Check 1: Firebase Configuration
**Problem**: Data not retrieving from database

**Solution**:
1. Verify `.env.local` file exists in project root
2. Check that all Firebase environment variables are set:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
3. Open browser console and look for: `Firebase config loaded for project: your-project-id`
4. If config is missing, copy `.env.example` to `.env.local` and add your Firebase credentials

### Check 2: Authentication State
**Problem**: "User not authenticated" errors

**Solution**:
1. Make sure you're logged in (check `/login` page)
2. Open browser console and look for: `Current user ID: xyz...`
3. If you see "User not authenticated", log out and log back in
4. Clear browser cache and localStorage if needed

### Check 3: Firebase Rules
**Problem**: "Permission denied" errors

**Solution**: 
Update your Firestore Security Rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User must be authenticated
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Check 4: Firestore Collections
**Problem**: No data showing up

**Solution**:
1. Go to Firebase Console → Firestore Database
2. Verify these collections exist:
   - `users`
   - `tasks`
   - `events`
   - `goals`
   - `projects`
3. Try creating a test item in the app
4. Check Firebase Console to see if the document was created

### Check 5: Console Errors
**Problem**: Silent failures

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Look for these log messages:
   - `Fetching tasks for user: ...`
   - `Retrieved tasks: X`
   - `Fetching events for user: ...`
   - `Retrieved events: X`
   - `Fetching goals for user: ...`
   - `Retrieved goals: X`

### Check 6: Network Requests
**Problem**: Data not fetching

**Solution**:
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `firestore.googleapis.com`
4. Check response status codes (should be 200)
5. If you see 401/403 errors, check authentication

## Common Errors

### Error: "Firebase config is missing"
```
Firebase configuration is missing! Please check your .env.local file
```

**Fix**: Create `.env.local` file with your Firebase credentials

### Error: "User not authenticated"
```
Error fetching tasks: User not authenticated
```

**Fix**: 
1. Navigate to `/login`
2. Sign in with your credentials
3. If problem persists, check auth state in AuthProvider

### Error: "The query requires an index"
```
FirebaseError: The query requires an index
```

**Fix**: 
- This shouldn't happen anymore (we use in-memory sorting)
- If it does, click the link in the error to create the index

### Error: "Cannot read properties of undefined"
```
TypeError: Cannot read properties of undefined (reading 'length')
```

**Fix**: 
- This means data hasn't loaded yet
- Make sure you're checking `isLoading` state
- Ensure user is authenticated before fetching

## Still Having Issues?

1. **Clear all data**:
   ```javascript
   // Run in browser console
   localStorage.clear()
   sessionStorage.clear()
   // Then refresh page
   ```

2. **Check Environment**:
   - Node.js 18+ or Bun installed?
   - `.env.local` file present?
   - Firebase project created?
   - Authentication enabled in Firebase Console?
   - Firestore Database created?

3. **Restart Development Server**:
   ```bash
   # Stop server (Ctrl+C)
   bun run dev
   ```

4. **Check Firebase Status**: [https://status.firebase.google.com/](https://status.firebase.google.com/)

5. **Review Logs**:
   - Browser Console (F12)
   - Terminal output
   - Firebase Console → Project Settings → Usage and billing

## Debug Mode

Enable verbose logging:

1. Open browser console
2. Run: `localStorage.setItem('debug', 'true')`
3. Refresh page
4. Check console for detailed logs
