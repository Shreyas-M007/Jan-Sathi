import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.storageBucket);

export function getFirebaseStorage() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getStorage(app);
}

export async function uploadImageToFirebase(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
  const storage = getFirebaseStorage();
  const safeName = `reports/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storageRef = ref(storage, safeName);
  
  await uploadBytes(storageRef, buffer, { contentType: mimeType });
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}
