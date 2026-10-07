# Firebase Integration Guide

This project is integrated with Firebase for authentication and database operations.

## Firebase Services Used

- **Firebase Authentication**: Email/Password and Google Sign-in
- **Cloud Firestore**: NoSQL database for storing users, tasks, events, and projects
- **Firebase Storage**: For file uploads (configured but not yet implemented)

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Follow the setup wizard

### 2. Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional, for Google Sign-in)

### 3. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** or **test mode** (for development)
4. Choose a location close to your users

### 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (⚙️ icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the configuration values

### 5. Configure Environment Variables

Update your `.env.local` file with the configuration values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 6. Set Up Firestore Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
    
    // Events collection
    match /events/{eventId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
    }
  }
}
```

## Project Structure

### Firebase Configuration Files

- `lib/firebase.ts` - Firebase initialization
- `lib/firebase-auth.ts` - Authentication functions
- `lib/firebase-db.ts` - Database operations (CRUD)
- `lib/api.ts` - API layer that wraps Firebase operations
- `hooks/use-firebase-data.ts` - React hooks for data fetching with SWR

### Data Flow

```
Component → Hook (use-firebase-data.ts) → API (api.ts) → Firebase DB (firebase-db.ts) → Firestore
```

### Authentication Flow

```
Component → AuthProvider → Firebase Auth (firebase-auth.ts) → Firebase Authentication
```

## Usage Examples

### Authentication

```typescript
import { useAuth } from "@/components/auth-provider"

function MyComponent() {
  const { user, loading, login, loginWithGoogle, logout } = useAuth()

  // Email/Password login
  const handleLogin = async () => {
    const result = await login("email@example.com", "password")
    if (result.ok) {
      console.log("Login successful")
    } else {
      console.error(result.message)
    }
  }

  // Google login
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle()
    if (result.ok) {
      console.log("Google login successful")
    }
  }

  // Logout
  const handleLogout = async () => {
    await logout()
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please login</div>

  return <div>Welcome, {user.name || user.email}</div>
}
```

### Data Operations

```typescript
import { useTasks, useProjects, useEvents } from "@/hooks/use-firebase-data"

function TasksComponent() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks()

  // Create a new task
  const handleCreateTask = async () => {
    const taskId = await createTask({
      title: "New Task",
      status: "todo",
      priority: "medium",
      dueDate: new Date().toISOString(),
    })
    console.log("Created task:", taskId)
  }

  // Update a task
  const handleUpdateTask = async (taskId: string) => {
    await updateTask(taskId, {
      status: "done",
    })
  }

  // Delete a task
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  if (isLoading) return <div>Loading tasks...</div>

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.taskId}>{task.title}</div>
      ))}
    </div>
  )
}
```

## Database Schema

### Users Collection
```typescript
{
  userId: string,        // Document ID (from Firebase Auth)
  email: string,
  name?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Tasks Collection
```typescript
{
  taskId: string,        // Document ID
  userId: string,        // Reference to user
  title: string,
  status: "todo" | "in_progress" | "done",
  priority: "low" | "medium" | "high",
  dueDate?: string,      // ISO date string
  projectId?: string,    // Reference to project
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Events Collection
```typescript
{
  eventId: string,       // Document ID
  userId: string,        // Reference to user
  title: string,
  start: string,         // ISO date string
  end?: string,          // ISO date string
  location?: string,
  projectId?: string,    // Reference to project
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Projects Collection
```typescript
{
  projectId: string,     // Document ID
  userId: string,        // Reference to user
  name: string,
  description?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Testing

After setup, you can test the integration:

1. Run the development server: `bun dev`
2. Navigate to the login page
3. Try signing up with email/password or Google
4. Create tasks, events, and projects
5. Check Firebase Console to verify data is being stored

## Troubleshooting

### "User not authenticated" error
- Make sure you're logged in before making database requests
- Check that Firebase Auth is properly configured

### "Permission denied" error
- Verify Firestore security rules are set up correctly
- Make sure the user is authenticated
- Check that `userId` field is being set correctly

### Environment variables not loading
- Restart the development server after updating `.env.local`
- Make sure all variables start with `NEXT_PUBLIC_` for client-side access

## Next Steps

1. ✅ Firebase configured
2. ✅ Authentication implemented (Email/Password + Google)
3. ✅ Database operations implemented
4. ✅ React hooks created for data fetching
5. 🔲 Update UI components to use Firebase hooks
6. 🔲 Implement error handling and loading states
7. 🔲 Add form validation
8. 🔲 Implement file upload functionality
9. 🔲 Add real-time listeners for live updates
10. 🔲 Implement offline support

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Next.js with Firebase](https://firebase.google.com/docs/hosting/nextjs)
