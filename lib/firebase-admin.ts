import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    // Path to service account file
    const serviceAccountPath = path.join(process.cwd(), 'sloth-c990a-firebase-adminsdk-fbsvc-16b8b23ae6.json');
    
    // Read the service account file
    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, 'utf8')
    );
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with service account file');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage();

export default admin;
