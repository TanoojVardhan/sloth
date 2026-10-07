# Sloth - Personal Productivity Planner

A modern, full-stack productivity application built with Next.js 15, Firebase, and TypeScript. Manage your tasks, events, goals, and projects with real-time cloud synchronization across all your devices.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-12.4.0-orange?style=flat-square&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.9-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Features

### 📋 Task Management
- **Kanban Board**: Organize tasks in To Do, In Progress, and Done columns
- **Priority Levels**: Low, medium, and high priority indicators
- **Due Dates**: Set deadlines with datetime support
- **Project Association**: Link tasks to specific projects

### 📅 Event Calendar
- **Full Calendar View**: Visualize all your events
- **Mini Calendar**: Quick date navigation
- **Location Support**: Add event locations with map pins
- **Time Management**: Set start and end times for events

### 🎯 Goal Tracking
- **Long-term Planning**: Define and track personal and professional goals
- **Status Tracking**: Active and completed goal states
- **Target Dates**: Set goal deadlines
- **Tags System**: Organize goals by categories (personal, career, health, etc.)
- **Descriptions**: Add detailed notes about each goal

### 🗂️ Project Organization
- **Project Dashboard**: Centralized view of all projects
- **Task Association**: Link tasks to projects
- **Descriptions**: Add project details and context

### 📊 Smart Schedule View
- **Time-based Organization**: 
  - Overdue items (requiring immediate attention)
  - Today (Morning, Afternoon, Evening breakdown)
  - Tomorrow
  - This Week
  - Later (beyond this week)
  - Past Items (completed and historical)
- **Unified Timeline**: See tasks, events, and goals in one place
- **Quick Stats**: At-a-glance counters for each time period

### 🔐 Authentication
- **Email/Password**: Traditional authentication
- **Google Sign-In**: Quick OAuth integration
- **Protected Routes**: Secure app pages
- **User Profiles**: Personalized experience

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5.4**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript 5.x**: Type-safe development
- **Tailwind CSS 4.1.9**: Utility-first styling
- **shadcn/ui**: Beautiful UI components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Backend & Database
- **Firebase 12.4.0**: Backend as a Service
  - Authentication (Email/Password, Google OAuth)
  - Firestore Database (NoSQL)
  - Real-time data synchronization
- **SWR 2.3.6**: Data fetching and caching

### Developer Tools
- **Bun**: Fast JavaScript runtime and package manager
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Geist Font**: Modern typography

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Firebase account (free tier works)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sloth.git
cd sloth
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore Database
   - Get your Firebase configuration

4. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

5. **Run the development server**
```bash
bun dev
# or
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
sloth/
├── app/                      # Next.js App Router
│   ├── (app)/               # Protected app routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── tasks/           # Task management (Kanban)
│   │   ├── events/          # Event calendar
│   │   ├── goals/           # Goal tracking
│   │   ├── schedule/        # Timeline view
│   │   ├── calendar/        # Full calendar
│   │   ├── projects/        # Project management
│   │   └── settings/        # User settings
│   ├── login/               # Authentication
│   ├── signup/              # Registration
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── add-item-panel.tsx   # Quick add widget
│   ├── auth-provider.tsx    # Auth context
│   ├── sidebar.tsx          # Navigation
│   └── ...
├── hooks/                   # Custom React hooks
│   ├── use-firebase-data.ts # Firebase CRUD operations
│   ├── use-auth.ts          # Authentication hook
│   └── ...
├── lib/                     # Utility libraries
│   ├── firebase.ts          # Firebase initialization
│   ├── firebase-auth.ts     # Auth operations
│   ├── firebase-db.ts       # Database operations
│   ├── api.ts               # API layer
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript definitions
│   └── entities.ts          # Data models
└── public/                  # Static assets
```

## 🗄️ Database Schema

### Firestore Collections

```
users/
  {userId}/
    - email: string
    - name: string
    - createdAt: timestamp
    - updatedAt: timestamp

tasks/
  {taskId}/
    - userId: string
    - title: string
    - status: "todo" | "in_progress" | "done"
    - priority: "low" | "medium" | "high"
    - dueDate: timestamp | null
    - projectId: string | null
    - createdAt: timestamp
    - updatedAt: timestamp

events/
  {eventId}/
    - userId: string
    - title: string
    - start: timestamp
    - end: timestamp | null
    - location: string | null
    - projectId: string | null
    - createdAt: timestamp
    - updatedAt: timestamp

goals/
  {goalId}/
    - userId: string
    - title: string
    - description: string | null
    - status: "active" | "completed"
    - targetDate: timestamp | null
    - tags: string[]
    - createdAt: timestamp
    - updatedAt: timestamp

projects/
  {projectId}/
    - userId: string
    - name: string
    - description: string | null
    - createdAt: timestamp
    - updatedAt: timestamp
```

## 🔥 Key Features Explained

### Real-time Synchronization
All data is stored in Firebase Firestore and syncs automatically across devices. Changes made on one device appear instantly on all others.

### Smart Caching with SWR
- Automatic revalidation on focus
- Optimistic UI updates
- Background data fetching
- Error handling and retry logic

### No Firebase Indexes Required
Queries use in-memory sorting instead of Firestore orderBy clauses, eliminating the need for composite indexes and speeding up development.

### Type Safety
Full TypeScript coverage ensures type safety across the entire application, catching errors at compile time.

### Responsive Design
Mobile-first approach with Tailwind CSS ensures the app works beautifully on all screen sizes.

## 🎨 Customization

### Theming
The app uses Tailwind CSS v4 with custom color variables defined in `app/globals.css`. Modify these to match your brand:

```css
:root {
  --background: oklch(0.98 0.01 85);
  --foreground: oklch(0.25 0.02 60);
  --primary: oklch(0.35 0.03 60);
  /* ... more variables */
}
```

### Adding Components
Use shadcn/ui CLI to add new components:

```bash
npx shadcn@latest add [component-name]
```

## 📝 Scripts

```bash
# Development
bun dev          # Start dev server on port 3000

# Production
bun build        # Build for production
bun start        # Start production server

# Code Quality
bun lint         # Run ESLint
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Docker

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend platform
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Hosting platform
- [Lucide](https://lucide.dev/) - Icon library

## 📞 Support

For support, email your-email@example.com or open an issue in the repository.

---

Built with ❤️ using Next.js and Firebase
