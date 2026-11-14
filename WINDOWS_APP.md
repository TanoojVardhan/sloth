# Sloth Planner on Windows

Sloth is an installable web app (PWA). Everything runs from https://slothplanner.vercel.app,
so the Windows app always has the latest version and the same encryption as the website.

## Option 1: Install from the browser (free, works today)
1. Open the site in Edge or Chrome and sign in.
2. Settings → **Install the app** → Install Sloth Planner.
   (Or the install icon in the address bar, or browser menu → Apps → Install.)
3. Sloth now has its own window, Start menu entry and taskbar icon. Reminders arrive as Windows notifications.

## Option 2: Microsoft Store package
1. Deploy the latest code to Vercel (the manifest and service worker must be live).
2. Go to https://www.pwabuilder.com, enter your site address and run the report.
3. Choose **Package for stores → Windows**. Fill in the package ID and publisher details
   from your Microsoft Partner Center account (one-time developer registration fee).
4. Download the `.msixbundle`, then submit it in Partner Center → Apps and games → New product → MSIX or PWA app.
5. The Store signs the package, so people don't see a SmartScreen warning.

Files involved: `app/manifest.ts`, `public/sw.js`, `public/offline.html`, `public/icon-*.png`, `components/pwa.tsx`.
