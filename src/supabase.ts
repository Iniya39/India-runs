/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigValid = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient: any = null;
let currentUser: any = null;
const authListeners = new Set<(user: any) => void>();
let isRestoringSession = false;

if (isConfigValid) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase Client initialized successfully.");

    // Restore session from localStorage for persistence
    const savedUid = localStorage.getItem('talentsphere_session_uid');
    if (savedUid) {
      isRestoringSession = true;
      supabaseClient
        .from('users')
        .select('*')
        .eq('id', savedUid)
        .maybeSingle()
        .then(({ data, error }: any) => {
          isRestoringSession = false;
          if (data && !error) {
            currentUser = {
              uid: data.id,
              email: data.email,
              displayName: data.displayName || data.email?.split('@')[0],
              role: data.role,
              onboardingComplete: data.onboardingComplete
            };
          }
          // trigger listeners
          for (const listener of authListeners) {
            listener(currentUser);
          }
        });
    }
  } catch (err) {
    console.error("Supabase initialization failed:", err);
  }
}

export const supabase = supabaseClient;

// Mock auth instance to satisfy compatibility
export const auth = {
  get currentUser() {
    return currentUser;
  },
  signOut: async () => {
    return signOut(auth);
  }
};

// --- DATABASE UTILS ---

const TABLE_COLUMNS: Record<string, string[]> = {
  users: ['id', 'email', 'displayName', 'role', 'onboardingComplete', 'companyId', 'password', 'createdAt'],
  candidateProfiles: ['id', 'uid', 'basics', 'skills', 'experience', 'education', 'projects', 'verification', 'onboardingStep', 'profileComplete', 'updatedAt'],
  companies: ['id', 'companyName', 'logoUrl', 'industry', 'companySize', 'companyWebsite', 'hiringContextNote', 'createdByUid', 'recruiterUids', 'createdAt'],
  jobs: ['id', 'title', 'companyName', 'logoUrl', 'logoBg', 'logoText', 'industry', 'companySize', 'location', 'jobType', 'experienceLevel', 'salary', 'matchScore', 'tags', 'description', 'pitch', 'postedDate', 'isReverseRecruitment', 'recruiterUid', 'createdAt'],
  applications: ['id', 'candidateUid', 'recruiterUid', 'jobId', 'candidateInterested', 'recruiterShortlisted', 'chatUnlocked', 'createdAt', 'updatedAt'],
  conversations: ['id', 'candidateUid', 'recruiterUid', 'jobId', 'candidateName', 'candidateAvatarUrl', 'recruiterName', 'recruiterAvatarUrl', 'jobTitle', 'companyName', 'lastMessage', 'lastMessageAt', 'unreadByCandidate', 'unreadByRecruiter'],
  messages: ['id', 'conversation_id', 'senderUid', 'text', 'sentAt'],
  notifications: ['id', 'user_id', 'title', 'message', 'read', 'createdAt']
};

function filterPayload(table: string, data: any) {
  const allowed = TABLE_COLUMNS[table];
  if (!allowed) return data;
  const filtered: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}

function parsePath(path: string) {
  const parts = path.split('/');
  if (parts.length === 1) {
    return { table: parts[0], id: null, conversation_id: null };
  }
  if (parts.length === 2) {
    return { table: parts[0], id: parts[1], conversation_id: null };
  }
  if (parts.length === 3 && parts[0] === 'conversations' && parts[2] === 'messages') {
    return { table: 'messages', id: null, conversation_id: parts[1] };
  }
  if (parts.length === 4 && parts[0] === 'conversations' && parts[2] === 'messages') {
    return { table: 'messages', id: parts[3], conversation_id: parts[1] };
  }
  return { table: parts[0], id: parts[parts.length - 1], conversation_id: null };
}

function handleSupabaseError(error: any, table: string) {
  if (error) {
    console.error(`[Supabase DB Error] Table: "${table}":`, error);
    console.error(JSON.stringify(error, null, 2));

    if (error.message) console.log("Message:", error.message);
    if (error.code) console.log("Code:", error.code);
    if (error.details) console.log("Details:", error.details);
    if (error.hint) console.log("Hint:", error.hint);

    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error(`[TalentSphere Help] The table "${table}" does not exist. Please run the SQL editor script in 'supabase_schema.sql' to create the required tables.`);
    }
    
    const detailedMessage = `Supabase DB Error (${table}): ${error.message || 'Unknown error'}. Code: ${error.code || ''}. Hint: ${error.hint || ''}. Details: ${error.details || ''}`;
    throw new Error(detailedMessage);
  }
}

// --- FIRESTORE ADAPTERS ---

export const doc = (dbInstance: any, collectionPath: string, ...documentIds: string[]) => {
  const fullPath = [collectionPath, ...documentIds].join('/');
  return {
    _isSupabaseRef: true,
    type: 'doc',
    path: fullPath,
    id: documentIds[documentIds.length - 1]
  };
};

export const getDoc = async (docRef: any) => {
  if (!isConfigValid) {
    throw new Error("Cannot execute database requests: invalid configuration.");
  }
  const { table, id } = parsePath(docRef.path);
  if (!id) {
    return { exists: () => false, data: () => null };
  }
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    handleSupabaseError(error, table);
  }

  return {
    exists: () => data !== null,
    data: () => data
  };
};

export const setDoc = async (docRef: any, data: any, options?: { merge?: boolean }) => {
  if (!isConfigValid) {
    throw new Error("Cannot execute database requests: invalid configuration.");
  }
  const { table, id } = parsePath(docRef.path);
  
  let cleanedData = { ...data };
  for (const key of Object.keys(cleanedData)) {
    const val = cleanedData[key];
    if (val && typeof val === 'object') {
      if (val._isAMockTimestamp || val._methodName === 'serverTimestamp') {
        cleanedData[key] = new Date().toISOString();
      }
    } else if (val === 'serverTimestamp') {
      cleanedData[key] = new Date().toISOString();
    }
  }

  let finalData: any = { id, ...cleanedData };

  if (options?.merge) {
    const existingDoc = await getDoc(docRef);
    const existing = existingDoc.exists() ? existingDoc.data() : {};
    finalData = { ...existing, ...cleanedData, id };
  }

  if (table === 'users') {
    finalData.id = id || finalData.id || auth?.currentUser?.uid;
    finalData.email = finalData.email || auth?.currentUser?.email || "";
    finalData.displayName = finalData.displayName || auth?.currentUser?.displayName || "";
    finalData.role = finalData.role || null;
    finalData.onboardingComplete = finalData.onboardingComplete === true;
    finalData.companyId = finalData.companyId || null;
  }

  // Filter payload to only include valid database columns
  finalData = filterPayload(table, finalData);

  console.log(`[Supabase setDoc Upsert Payload] Table: "${table}":`, finalData);

  const { error } = await supabase
    .from(table)
    .upsert(finalData);

  if (error) {
    handleSupabaseError(error, table);
  }
};

export const updateDoc = async (docRef: any, data: any) => {
  if (!isConfigValid) {
    throw new Error("Cannot execute database requests: invalid configuration.");
  }
  const { table, id } = parsePath(docRef.path);
  
  let cleanedData = { ...data };
  for (const key of Object.keys(cleanedData)) {
    const val = cleanedData[key];
    if (val && typeof val === 'object') {
      if (val._isAMockTimestamp || val._methodName === 'serverTimestamp') {
        cleanedData[key] = new Date().toISOString();
      }
    } else if (val === 'serverTimestamp') {
      cleanedData[key] = new Date().toISOString();
    }
  }

  // Filter payload to only include valid database columns
  let filteredData = filterPayload(table, cleanedData);

  console.log(`[Supabase updateDoc Payload] Table: "${table}", ID: "${id}":`, filteredData);

  const { error } = await supabase
    .from(table)
    .update(filteredData)
    .eq('id', id);

  if (error) {
    handleSupabaseError(error, table);
  }
};

export const serverTimestamp = () => {
  return { _isAMockTimestamp: true };
};

export const collection = (dbInstance: any, collectionPath: string) => {
  return {
    _isSupabaseRef: true,
    type: 'collection',
    path: collectionPath
  };
};

export const addDoc = async (collectionRef: any, data: any) => {
  if (!isConfigValid) {
    throw new Error("Cannot execute database requests: invalid configuration.");
  }
  const { table, conversation_id } = parsePath(collectionRef.path);
  const generatedId = crypto.randomUUID();

  let cleanedData = { ...data };
  for (const key of Object.keys(cleanedData)) {
    const val = cleanedData[key];
    if (val && typeof val === 'object') {
      if (val._isAMockTimestamp || val._methodName === 'serverTimestamp') {
        cleanedData[key] = new Date().toISOString();
      }
    } else if (val === 'serverTimestamp') {
      cleanedData[key] = new Date().toISOString();
    }
  }

  let payload: any = { id: generatedId, ...cleanedData };
  if (conversation_id) {
    payload.conversation_id = conversation_id;
  }

  if (table === 'users') {
    payload.id = payload.id || generatedId || auth?.currentUser?.uid;
    payload.email = payload.email || auth?.currentUser?.email || "";
    payload.displayName = payload.displayName || auth?.currentUser?.displayName || "";
    payload.role = payload.role || null;
    payload.onboardingComplete = payload.onboardingComplete === true;
    payload.companyId = payload.companyId || null;
  }

  // Filter payload to only include valid database columns
  payload = filterPayload(table, payload);

  console.log(`[Supabase addDoc Insert Payload] Table: "${table}":`, payload);

  const { error } = await supabase
    .from(table)
    .insert(payload);

  if (error) {
    handleSupabaseError(error, table);
  }

  return {
    id: generatedId,
    path: `${collectionRef.path}/${generatedId}`
  };
};

export const getDocs = async (collectionRef: any) => {
  if (!isConfigValid) {
    throw new Error("Cannot execute database requests: invalid configuration.");
  }
  const { table, conversation_id } = parsePath(collectionRef.path);
  let sbQuery: any = supabase.from(table).select('*');

  if (conversation_id) {
    sbQuery = sbQuery.eq('conversation_id', conversation_id);
  }

  if (collectionRef.queries) {
    for (const q of collectionRef.queries) {
      if (q.type === 'where') {
        if (q.operator === '==') {
          sbQuery = sbQuery.eq(q.field, q.value);
        } else if (q.operator === 'array-contains') {
          sbQuery = sbQuery.contains(q.field, JSON.stringify([q.value]));
        }
      } else if (q.type === 'orderBy') {
        sbQuery = sbQuery.order(q.field, { ascending: q.direction === 'asc' });
      } else if (q.type === 'limit') {
        sbQuery = sbQuery.limit(q.value);
      }
    }
  }

  const { data, error } = await sbQuery;
  if (error) {
    handleSupabaseError(error, table);
  }

  const docs = (data || []).map((row: any) => ({
    id: row.id,
    path: `${collectionRef.path}/${row.id}`,
    data: () => row,
    exists: () => true
  }));

  return {
    empty: docs.length === 0,
    forEach: (callback: (doc: any) => void) => {
      docs.forEach(callback);
    },
    docs
  };
};

export const query = (ref: any, ...queryConstraints: any[]) => {
  return {
    _isSupabaseRef: true,
    type: 'query',
    path: ref.path,
    queries: queryConstraints
  };
};

export const where = (field: string, operator: string, value: any) => {
  return { type: 'where', field, operator, value };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit = (value: number) => {
  return { type: 'limit', value };
};

export const onSnapshot = (ref: any, callback: (snapshot: any) => void, errorCallback?: (error: any) => void) => {
  if (!isConfigValid) {
    return () => {};
  }
  
  const triggerCallback = async () => {
    try {
      if (ref.type === 'doc') {
        const snap = await getDoc(ref);
        callback(snap);
      } else {
        const snap = await getDocs(ref);
        callback(snap);
      }
    } catch (err) {
      if (errorCallback) {
        errorCallback(err);
      } else {
        console.error("onSnapshot fetch error:", err);
      }
    }
  };

  triggerCallback();

  const { table, id, conversation_id } = parsePath(ref.path);
  let filterStr = undefined;
  if (conversation_id) {
    filterStr = `conversation_id=eq.${conversation_id}`;
  } else if (ref.type === 'doc') {
    filterStr = `id=eq.${id}`;
  }

  const channel = supabase
    .channel(`${table}-changes-${Math.random().toString(36).substr(2, 9)}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filterStr
      },
      () => {
        triggerCallback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// --- FILE UPLOADS / STORAGE ---

export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  if (!isConfigValid) {
    throw new Error("Cannot execute storage upload: invalid configuration.");
  }
  try {
    const ext = file.name.split('.').pop();
    const path = `candidates/${uid}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('profile_pics')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("[Supabase Storage Error] profile_pics upload failed:", error);
      throw new Error(`Profile photo upload failed: ${error.message || 'Bucket might not exist or is set to private'}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile_pics')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Profile photo upload failed:", error);
    throw error;
  }
};

export const uploadCompanyLogo = async (companyId: string, file: File): Promise<string> => {
  if (!isConfigValid) {
    throw new Error("Cannot execute storage upload: invalid configuration.");
  }
  try {
    const ext = file.name.split('.').pop();
    const path = `companies/${companyId}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('profile_pics')
      .upload(path, file, { upsert: true });

    if (error) {
      console.error("[Supabase Storage Error] profile_pics upload failed:", error);
      throw new Error(`Company logo upload failed: ${error.message || 'Bucket might not exist or is set to private'}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile_pics')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Company logo upload failed:", error);
    throw error;
  }
};

export const db: any = {
  _isSupabaseDb: true
};

// Auth wrappers (Custom Database-only authentication to bypass rate limits)
export const onAuthStateChanged = (authInstance: any, callback: (user: any) => void) => {
  if (!isConfigValid) {
    return () => {};
  }
  authListeners.add(callback);
  if (!isRestoringSession) {
    callback(currentUser);
  }
  return () => {
    authListeners.delete(callback);
  };
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, password?: string) => {
  if (!isConfigValid) {
    throw new Error("Supabase is not configured.");
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password || '')
    .maybeSingle();

  if (error) {
    console.error("Login select error:", error);
    const msg = error.message || "Failed to query user record";
    const detailedMsg = error.details ? `${msg} (${error.details})` : msg;
    const err = new Error(detailedMsg);
    (err as any).code = error.code;
    throw err;
  }

  if (!data) {
    const err = new Error("Invalid email or password");
    (err as any).code = 'auth/invalid-credential';
    throw err;
  }

  const user = {
    uid: data.id,
    email: data.email,
    displayName: data.displayName || email.split('@')[0],
    role: data.role,
    onboardingComplete: data.onboardingComplete
  };

  currentUser = user;
  localStorage.setItem('talentsphere_session_uid', data.id);
  
  for (const listener of authListeners) {
    listener(currentUser);
  }

  return { user };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, password?: string) => {
  if (!isConfigValid) {
    throw new Error("Supabase is not configured.");
  }

  // Check if user already exists
  const { data: existing, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (checkError) {
    console.error("Signup email check error:", checkError);
    const msg = checkError.message || "Failed to check email availability";
    const detailedMsg = checkError.details ? `${msg} (${checkError.details})` : msg;
    const err = new Error(detailedMsg);
    (err as any).code = checkError.code;
    throw err;
  }

  if (existing) {
    const err = new Error("Email already in use");
    (err as any).code = 'auth/email-already-in-use';
    throw err;
  }

  const generatedId = crypto.randomUUID();
  const displayName = email.split('@')[0];

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: generatedId,
      email,
      password: password || '',
      displayName,
      onboardingComplete: false
    });

  if (insertError) {
    console.error("Signup insert error:", insertError);
    const msg = insertError.message || "Failed to create user record";
    const detailedMsg = insertError.details ? `${msg} (${insertError.details})` : msg;
    const err = new Error(detailedMsg);
    (err as any).code = insertError.code;
    throw err;
  }

  const user = {
    uid: generatedId,
    email,
    displayName,
    role: null,
    onboardingComplete: false
  };

  currentUser = user;
  localStorage.setItem('talentsphere_session_uid', generatedId);

  for (const listener of authListeners) {
    listener(currentUser);
  }

  return { user };
};

export const updateProfile = async (userInstance: any, profileData: { displayName?: string; photoURL?: string }) => {
  if (!isConfigValid) {
    throw new Error("Supabase is not configured.");
  }
  if (!currentUser) return;

  const { error } = await supabase
    .from('users')
    .update({
      displayName: profileData.displayName
    })
    .eq('id', currentUser.uid);

  if (error) throw error;
  
  currentUser.displayName = profileData.displayName || currentUser.displayName;
  
  for (const listener of authListeners) {
    listener(currentUser);
  }
};

export const signInWithPopup = async (authInstance: any, provider: any): Promise<any> => {
  throw new Error("Social Sign-In is disabled for database authentication.");
};

export const signOut = async (authInstance: any) => {
  currentUser = null;
  localStorage.removeItem('talentsphere_session_uid');
  for (const listener of authListeners) {
    listener(currentUser);
  }
};

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
}
