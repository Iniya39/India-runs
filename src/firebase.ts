/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword,
  updateProfile as realUpdateProfile,
  signInWithPopup as realSignInWithPopup,
  signOut as realSignOut,
  onAuthStateChanged as realOnAuthStateChanged,
  GoogleAuthProvider as RealGoogleAuthProvider
} from 'firebase/auth';
import { 
  getFirestore, 
  doc as realDoc, 
  getDoc as realGetDoc, 
  setDoc as realSetDoc, 
  updateDoc as realUpdateDoc, 
  serverTimestamp as realServerTimestamp,
  collection as realCollection,
  addDoc as realAddDoc,
  getDocs as realGetDocs,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  limit as realLimit,
  onSnapshot as realOnSnapshot
} from 'firebase/firestore';
import {
  getStorage,
  ref as realStorageRef,
  uploadBytes as realUploadBytes,
  getDownloadURL as realGetDownloadURL
} from 'firebase/storage';

// Environment variables from Vite (with fallback placeholder)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyPlaceholderForAppToBuild",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "talentsphere-applet.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "talentsphere-applet",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "talentsphere-applet.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

// Check if we should run in Mock / Demo Mode
const isPlaceholderKey = !import.meta.env.VITE_FIREBASE_API_KEY || 
  import.meta.env.VITE_FIREBASE_API_KEY === "AIzaSyFakeKeyPlaceholderForAppToBuild";

let useMock = isPlaceholderKey;
let realApp: any = null;
let realAuthInstance: any = null;
let realDbInstance: any = null;
let realStorageInstance: any = null;

if (!useMock) {
  try {
    realApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    realAuthInstance = getAuth(realApp);
    realDbInstance = getFirestore(realApp);
    realStorageInstance = getStorage(realApp);
  } catch (err) {
    console.warn("Firebase initialization failed, switching to mock mode:", err);
    useMock = true;
  }
}

export const isDemoMode = useMock;

// --- STATEFUL LOCALSTORAGE MOCK SYSTEM ---

const MOCK_USERS_KEY = "talentsphere_mock_users";
const MOCK_CURRENT_USER_KEY = "talentsphere_mock_current_user";
const MOCK_FIRESTORE_PREFIX = "talentsphere_mock_fs_";

interface MockUser {
  uid: string;
  email: string;
  password?: string;
  displayName: string;
  photoURL?: string;
}

const getMockUsers = (): MockUser[] => {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveMockUsers = (users: MockUser[]) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const getMockCurrentUser = (): MockUser | null => {
  try {
    const raw = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveMockCurrentUser = (user: MockUser | null) => {
  if (user) {
    localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_CURRENT_USER_KEY);
  }
};

// Listeners for auth state changes
const authListeners = new Set<(user: any) => void>();

// Exportable unified auth & db instances
export const auth: any = useMock ? {
  get currentUser() {
    const user = getMockCurrentUser();
    if (!user) return null;
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }
} : realAuthInstance;

export const db: any = useMock ? {
  _isMockDb: true
} : realDbInstance;

// Auth wrapper functions
export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  if (useMock) {
    authListeners.add(callback);
    // Trigger immediately with the current mock user
    const current = authInstance.currentUser;
    setTimeout(() => {
      if (authListeners.has(callback)) {
        callback(current);
      }
    }, 50);
    return () => {
      authListeners.delete(callback);
    };
  } else {
    return realOnAuthStateChanged(authInstance, callback);
  }
};

const triggerAuthListeners = () => {
  const current = auth.currentUser;
  authListeners.forEach((listener) => {
    try {
      listener(current);
    } catch (e) {
      console.error("Error in auth state changed listener", e);
    }
  });
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, password?: string) => {
  if (useMock) {
    const users = getMockUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      const err = new Error("Invalid email or password.");
      (err as any).code = 'auth/invalid-credential';
      throw err;
    }
    saveMockCurrentUser(user);
    triggerAuthListeners();
    return { user: { ...user } };
  } else {
    return realSignInWithEmailAndPassword(authInstance, email, password || '');
  }
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, password?: string) => {
  if (useMock) {
    const users = getMockUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      const err = new Error("An account with this email already exists.");
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }
    const newUser: MockUser = {
      uid: "mock-uid-" + Math.random().toString(36).substr(2, 9),
      email: email,
      password: password,
      displayName: email.split('@')[0],
      photoURL: ''
    };
    users.push(newUser);
    saveMockUsers(users);
    saveMockCurrentUser(newUser);
    triggerAuthListeners();
    return { user: { ...newUser } };
  } else {
    return realCreateUserWithEmailAndPassword(authInstance, email, password || '');
  }
};

export const updateProfile = async (userInstance: any, profileData: { displayName?: string; photoURL?: string }) => {
  if (useMock) {
    const current = getMockCurrentUser();
    if (current) {
      if (profileData.displayName !== undefined) current.displayName = profileData.displayName;
      if (profileData.photoURL !== undefined) current.photoURL = profileData.photoURL;
      
      saveMockCurrentUser(current);
      
      // Update in stored users list as well
      const users = getMockUsers();
      const idx = users.findIndex(u => u.uid === current.uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...profileData };
        saveMockUsers(users);
      }
    }
    triggerAuthListeners();
    return;
  } else {
    return realUpdateProfile(userInstance, profileData);
  }
};

export const signInWithPopup = async (authInstance: any, provider: any) => {
  if (useMock) {
    const email = "google-demo@talentsphere.com";
    const users = getMockUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        uid: "mock-google-uid-123",
        email: email,
        displayName: "Google Demo Candidate",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
      };
      users.push(user);
      saveMockUsers(users);
    }
    saveMockCurrentUser(user);
    triggerAuthListeners();
    return { user: { ...user } };
  } else {
    return realSignInWithPopup(authInstance, provider);
  }
};

export const signOut = async (authInstance: any) => {
  if (useMock) {
    saveMockCurrentUser(null);
    triggerAuthListeners();
    return;
  } else {
    return realSignOut(authInstance);
  }
};

export class GoogleAuthProvider extends (useMock ? class {} : RealGoogleAuthProvider) {
  constructor() {
    super();
  }
}

// Firestore wrapper functions
export const doc = (dbInstance: any, collectionPath: string, ...documentIds: string[]) => {
  if (useMock) {
    const fullPath = [collectionPath, ...documentIds].join('/');
    return {
      _isMockRef: true,
      path: fullPath,
      id: documentIds[documentIds.length - 1]
    };
  } else {
    return realDoc(dbInstance, collectionPath, ...documentIds);
  }
};

export const getDoc = async (docRef: any) => {
  if (useMock) {
    const key = MOCK_FIRESTORE_PREFIX + docRef.path;
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : null;
    return {
      exists: () => data !== null,
      data: () => data
    };
  } else {
    try {
      return await realGetDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, 'get', docRef.path || null);
    }
  }
};

// --- MOCK SNAPSHOT LISTENERS SYSTEM ---
const dbListeners = new Set<(path: string) => void>();

const notifyDbChange = (path: string) => {
  dbListeners.forEach((listener) => {
    try {
      listener(path);
    } catch (e) {
      console.error("Error notifying DB listener", e);
    }
  });
};

export const setDoc = async (docRef: any, data: any, options?: { merge?: boolean }) => {
  if (useMock) {
    const key = MOCK_FIRESTORE_PREFIX + docRef.path;
    let finalData = data;
    if (options?.merge) {
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      finalData = { ...existing, ...data };
    }
    localStorage.setItem(key, JSON.stringify(finalData));
    notifyDbChange(docRef.path);
    return;
  } else {
    try {
      return await realSetDoc(docRef, data, options);
    } catch (error) {
      handleFirestoreError(error, 'write', docRef.path || null);
    }
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (useMock) {
    const key = MOCK_FIRESTORE_PREFIX + docRef.path;
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const finalData = { ...existing, ...data };
    localStorage.setItem(key, JSON.stringify(finalData));
    notifyDbChange(docRef.path);
    return;
  } else {
    try {
      return await realUpdateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, 'update', docRef.path || null);
    }
  }
};

export const serverTimestamp = () => {
  if (useMock) {
    return new Date().toISOString();
  } else {
    return realServerTimestamp();
  }
};

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: any = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  if (useMock) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as data URL"));
        }
      };
      reader.onerror = () => {
        reject(new Error("File reading error"));
      };
      reader.readAsDataURL(file);
    });
  } else {
    try {
      const path = `profilePhotos/${uid}/${file.name}`;
      const fileRef = realStorageRef(realStorageInstance, path);
      const snapshot = await realUploadBytes(fileRef, file);
      const downloadUrl = await realGetDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Storage Upload Error: ", error);
      throw error;
    }
  }
};

export const collection = (dbInstance: any, collectionPath: string) => {
  if (useMock) {
    return {
      _isMockRef: true,
      path: collectionPath
    };
  } else {
    return realCollection(dbInstance, collectionPath);
  }
};

export const addDoc = async (collectionRef: any, data: any) => {
  if (useMock) {
    const generatedId = crypto.randomUUID();
    const docPath = `${collectionRef.path}/${generatedId}`;
    const key = MOCK_FIRESTORE_PREFIX + docPath;
    localStorage.setItem(key, JSON.stringify(data));
    notifyDbChange(collectionRef.path);
    return {
      id: generatedId,
      path: docPath
    };
  } else {
    try {
      return await realAddDoc(collectionRef, data);
    } catch (error) {
      handleFirestoreError(error, 'add', collectionRef.path || null);
    }
  }
};

export const uploadCompanyLogo = async (companyId: string, file: File): Promise<string> => {
  if (useMock) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file as data URL"));
        }
      };
      reader.onerror = () => {
        reject(new Error("File reading error"));
      };
      reader.readAsDataURL(file);
    });
  } else {
    try {
      const path = `companyLogos/${companyId}/${file.name}`;
      const fileRef = realStorageRef(realStorageInstance, path);
      const snapshot = await realUploadBytes(fileRef, file);
      const downloadUrl = await realGetDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Storage Upload Error: ", error);
      throw error;
    }
  }
};

export const getDocs = async (collectionRef: any) => {
  if (useMock) {
    let docs: any[] = [];
    const prefix = MOCK_FIRESTORE_PREFIX + collectionRef.path + '/';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const remaining = key.substring(prefix.length);
        // Ensure we only match immediate children (avoid nested subcollections matching flat listing)
        if (remaining.includes('/') && !collectionRef.path.includes('/messages')) {
          continue;
        }
        const id = remaining;
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          docs.push({
            id,
            path: collectionRef.path + '/' + id,
            data: () => data,
            exists: () => true
          });
        }
      }
    }

    // Apply mock queries if present
    if (collectionRef.queries) {
      for (const q of collectionRef.queries) {
        if (q.type === 'where') {
          docs = docs.filter(d => {
            const val = d.data()[q.field];
            if (q.operator === '==') return val === q.value;
            if (q.operator === 'array-contains') return Array.isArray(val) && val.includes(q.value);
            return true;
          });
        }
      }
      const orderByQ = collectionRef.queries.find((q: any) => q.type === 'orderBy');
      if (orderByQ) {
        docs.sort((a, b) => {
          const valA = a.data()[orderByQ.field];
          const valB = b.data()[orderByQ.field];
          if (valA === undefined || valB === undefined) return 0;
          if (valA < valB) return orderByQ.direction === 'desc' ? 1 : -1;
          if (valA > valB) return orderByQ.direction === 'desc' ? -1 : 1;
          return 0;
        });
      }
      const limitQ = collectionRef.queries.find((q: any) => q.type === 'limit');
      if (limitQ) {
        docs = docs.slice(0, limitQ.value);
      }
    }

    return {
      empty: docs.length === 0,
      forEach: (callback: (doc: any) => void) => {
        docs.forEach(callback);
      },
      docs
    };
  } else {
    try {
      return await realGetDocs(collectionRef);
    } catch (error) {
      handleFirestoreError(error, 'getDocs', collectionRef.path || null);
    }
  }
};

export const query = (ref: any, ...queryConstraints: any[]) => {
  if (useMock) {
    return {
      _isMockRef: true,
      path: ref.path,
      queries: queryConstraints
    };
  } else {
    return realQuery(ref, ...queryConstraints);
  }
};

export const where = (field: string, operator: string, value: any) => {
  if (useMock) {
    return { type: 'where', field, operator, value };
  } else {
    return realWhere(field, operator as any, value);
  }
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  if (useMock) {
    return { type: 'orderBy', field, direction };
  } else {
    return realOrderBy(field, direction);
  }
};

export const limit = (value: number) => {
  if (useMock) {
    return { type: 'limit', value };
  } else {
    return realLimit(value);
  }
};

export const onSnapshot = (ref: any, callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
  if (useMock) {
    const triggerCallback = async () => {
      try {
        if (ref._isMockRef && ref.path.split('/').length % 2 === 0 && !ref.queries) {
          const snap = await getDoc(ref);
          callback(snap);
        } else {
          const snap = await getDocs(ref);
          callback(snap);
        }
      } catch (err) {
        if (errorCallback) errorCallback(err);
      }
    };

    triggerCallback();

    const listener = (changedPath: string) => {
      if (changedPath.startsWith(ref.path)) {
        triggerCallback();
      }
    };

    dbListeners.add(listener);
    return () => {
      dbListeners.delete(listener);
    };
  } else {
    return realOnSnapshot(ref, callback, (error) => {
      if (errorCallback) {
        errorCallback(error);
      } else {
        handleFirestoreError(error, 'onSnapshot', ref.path || null);
      }
    });
  }
};

