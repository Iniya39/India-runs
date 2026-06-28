import { doc, getDoc, setDoc, db } from '../firebase';

// Helper to generate a stable mock candidate UID based on name
export function getCandidateUid(name: string): string {
  return `mock-candidate-uid-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

export interface ApplicationDoc {
  candidateUid: string;
  recruiterUid: string;
  jobId: string;
  candidateInterested: boolean;
  recruiterShortlisted: boolean;
  chatUnlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDoc {
  id: string;
  candidateUid: string;
  recruiterUid: string;
  jobId: string;
  candidateName: string;
  candidateAvatarUrl: string;
  recruiterName: string;
  recruiterAvatarUrl: string;
  jobTitle: string;
  companyName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadByCandidate: boolean;
  unreadByRecruiter: boolean;
}

// Sync application state and conditionally unlock conversation thread
export async function syncApplicationState(
  candidateUid: string,
  recruiterUid: string,
  jobId: string,
  data: {
    candidateInterested?: boolean;
    recruiterShortlisted?: boolean;
    candidateName?: string;
    candidateAvatarUrl?: string;
    recruiterName?: string;
    recruiterAvatarUrl?: string;
    jobTitle?: string;
    companyName?: string;
  }
) {
  const appId = `${candidateUid}_${jobId}`;
  const appRef = doc(db, 'applications', appId);
  const appSnap = await getDoc(appRef);
  
  let existing: Partial<ApplicationDoc> = {
    candidateInterested: false,
    recruiterShortlisted: false,
    candidateUid,
    recruiterUid,
    jobId,
    createdAt: new Date().toISOString()
  };
  
  if (appSnap.exists()) {
    existing = { ...existing, ...appSnap.data() };
  }
  
  const nextInterested = data.candidateInterested !== undefined ? data.candidateInterested : (existing.candidateInterested ?? false);
  const nextShortlisted = data.recruiterShortlisted !== undefined ? data.recruiterShortlisted : (existing.recruiterShortlisted ?? false);
  const isUnlocked = nextInterested && nextShortlisted;
  
  const finalAppDoc = {
    ...existing,
    candidateInterested: nextInterested,
    recruiterShortlisted: nextShortlisted,
    chatUnlocked: isUnlocked,
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(appRef, finalAppDoc);
  
  if (isUnlocked) {
    // Create/update conversations document
    const convRef = doc(db, 'conversations', appId);
    const convSnap = await getDoc(convRef);
    
    const convData = convSnap.exists() ? convSnap.data() : {};
    
    const finalConvDoc: ConversationDoc = {
      id: appId,
      candidateUid,
      recruiterUid,
      jobId,
      candidateName: data.candidateName || convData.candidateName || 'Anonymous Candidate',
      candidateAvatarUrl: data.candidateAvatarUrl || convData.candidateAvatarUrl || '',
      recruiterName: data.recruiterName || convData.recruiterName || 'Anonymous Recruiter',
      recruiterAvatarUrl: data.recruiterAvatarUrl || convData.recruiterAvatarUrl || '',
      jobTitle: data.jobTitle || convData.jobTitle || 'Opportunity',
      companyName: data.companyName || convData.companyName || 'TalentSphere',
      lastMessage: convData.lastMessage || '',
      lastMessageAt: convData.lastMessageAt || new Date().toISOString(),
      unreadByCandidate: convData.unreadByCandidate !== undefined ? convData.unreadByCandidate : false,
      unreadByRecruiter: convData.unreadByRecruiter !== undefined ? convData.unreadByRecruiter : false,
    };
    
    // Update properties with latest values if provided
    if (data.candidateName) finalConvDoc.candidateName = data.candidateName;
    if (data.candidateAvatarUrl) finalConvDoc.candidateAvatarUrl = data.candidateAvatarUrl;
    if (data.recruiterName) finalConvDoc.recruiterName = data.recruiterName;
    if (data.recruiterAvatarUrl) finalConvDoc.recruiterAvatarUrl = data.recruiterAvatarUrl;
    if (data.jobTitle) finalConvDoc.jobTitle = data.jobTitle;
    if (data.companyName) finalConvDoc.companyName = data.companyName;
    
    await setDoc(convRef, finalConvDoc);
  }
}
