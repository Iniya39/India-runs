import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  db
} from '../firebase';
import { 
  Send, 
  Lock, 
  MessageSquare, 
  Clock, 
  ArrowLeft, 
  Sparkles, 
  User, 
  ShieldAlert,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrivateChatProps {
  currentUserId: string;
  currentRole: 'candidate' | 'recruiter';
  userName: string;
  userAvatarUrl?: string;
  initialSelectedAppId?: string | null;
  onBackToHome?: () => void;
}

interface Conversation {
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

interface Message {
  id: string;
  senderUid: string;
  text: string;
  sentAt: any;
}

export const PrivateChat: React.FC<PrivateChatProps> = ({
  currentUserId,
  currentRole,
  userName,
  userAvatarUrl = '',
  initialSelectedAppId = null,
  onBackToHome
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLockedError, setIsLockedError] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all conversations
  useEffect(() => {
    setLoading(true);
    const convRef = collection(db, 'conversations');
    
    const unsubscribe = onSnapshot(convRef, (snapshot: any) => {
      const list: Conversation[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.candidateUid === currentUserId || data.recruiterUid === currentUserId) {
          list.push({
            id: doc.id,
            ...data
          } as Conversation);
        }
      });
      
      // Sort conversations by lastMessageAt descending
      list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      
      setConversations(list);
      setLoading(false);

      // If we have an initial selected applicationId, set it
      if (initialSelectedAppId) {
        const found = list.find(c => c.id === initialSelectedAppId);
        if (found) {
          setSelectedConv(found);
        } else {
          // Check if this conversation is indeed locked/gated
          checkIfConversationIsLocked(initialSelectedAppId);
        }
      }
    }, (err: any) => {
      console.error("Error loading conversations: ", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, initialSelectedAppId]);

  // Helper to verify if clicked conversation is gated/locked
  const checkIfConversationIsLocked = async (appId: string) => {
    try {
      const appRef = doc(db, 'applications', appId);
      const appSnap = await getDoc(appRef);
      if (appSnap.exists()) {
        const appData = appSnap.data();
        if (!appData.chatUnlocked) {
          setIsLockedError(true);
        }
      } else {
        // If no application exists, it is also locked
        setIsLockedError(true);
      }
    } catch (e) {
      setIsLockedError(true);
    }
  };

  // Subscribe to messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    setIsLockedError(false);

    // Mark as read when opening conversation
    const markAsRead = async () => {
      const convDocRef = doc(db, 'conversations', selectedConv.id);
      if (currentRole === 'candidate' && selectedConv.unreadByCandidate) {
        await updateDoc(convDocRef, { unreadByCandidate: false });
      } else if (currentRole === 'recruiter' && selectedConv.unreadByRecruiter) {
        await updateDoc(convDocRef, { unreadByRecruiter: false });
      }
    };
    markAsRead();

    // Setup listener
    const messagesRef = collection(db, `conversations/${selectedConv.id}/messages`);
    const messagesQuery = query(messagesRef, orderBy('sentAt', 'asc'));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot: any) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc: any) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(msgs);
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    });

    return () => unsubscribe();
  }, [selectedConv, currentRole]);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConv) return;

    const messageText = newMessageText.trim();
    setNewMessageText(''); // Optimistic clear

    try {
      const messagesRef = collection(db, `conversations/${selectedConv.id}/messages`);
      await addDoc(messagesRef, {
        senderUid: currentUserId,
        text: messageText,
        sentAt: serverTimestamp()
      });

      // Update parent conversation for snippet display and unread indicator
      const convDocRef = doc(db, 'conversations', selectedConv.id);
      await updateDoc(convDocRef, {
        lastMessage: messageText,
        lastMessageAt: new Date().toISOString(),
        unreadByCandidate: currentRole === 'recruiter',
        unreadByRecruiter: currentRole === 'candidate'
      });
    } catch (err) {
      console.error("Error sending message: ", err);
    }
  };

  const getOtherPartyName = (conv: Conversation) => {
    return currentRole === 'candidate' ? conv.recruiterName : conv.candidateName;
  };

  const getOtherPartyAvatar = (conv: Conversation) => {
    return currentRole === 'candidate' ? conv.recruiterAvatarUrl : conv.candidateAvatarUrl;
  };

  const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex bg-white rounded-2xl border border-border-warm shadow-warm-md overflow-hidden min-h-[580px] h-[calc(100vh-220px)] w-full">
      
      {/* LEFT PANEL: CONVERSATIONS LIST */}
      <div className={`w-full md:w-1/3 border-r border-border-warm flex flex-col h-full bg-surface/10 ${selectedConv || isLockedError ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border-warm bg-white shrink-0">
          <h2 className="font-sora font-extrabold text-sm sm:text-base text-text-navy tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent-purple" />
            <span>Secure Messenger</span>
          </h2>
          <p className="text-[11px] text-text-muted font-manrope mt-0.5">
            Real-time chat with matched counterparties
          </p>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-text-muted font-mono uppercase tracking-wider">Syncing inbox...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center text-text-muted mb-3 border border-border-warm/40">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="font-sora font-extrabold text-xs text-text-navy mb-1.5 uppercase tracking-wider">
                No active conversations
              </h4>
              <p className="text-xs text-text-muted font-manrope leading-relaxed max-w-xs">
                {currentRole === 'candidate' 
                  ? "Your active matches and unlocked conversation threads will show up here as soon as a mutual shortlist is confirmed."
                  : "No mutual matches established yet for this role. Shortlist matching candidates to unlock direct secure communication."
                }
              </p>
              {onBackToHome && (
                <button
                  onClick={onBackToHome}
                  className="mt-4 px-4 py-1.5 bg-border-warm/20 hover:bg-border-warm/40 text-text-navy text-xs font-bold rounded-lg transition"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => {
              const hasUnread = currentRole === 'candidate' ? conv.unreadByCandidate : conv.unreadByRecruiter;
              const isSelected = selectedConv?.id === conv.id;
              const otherPartyName = getOtherPartyName(conv);
              const otherPartyAvatar = getOtherPartyAvatar(conv);

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    setIsLockedError(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition flex gap-3 items-start border cursor-pointer relative ${
                    isSelected 
                      ? 'bg-accent-purple/5 border-accent-purple/20 shadow-warm-xs' 
                      : 'bg-white/60 hover:bg-white border-transparent hover:border-border-warm/40'
                  }`}
                >
                  {/* Unread indicator dot */}
                  {hasUnread && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-purple animate-ping" />
                  )}

                  <div className="relative shrink-0">
                    {otherPartyAvatar ? (
                      <img 
                        src={otherPartyAvatar} 
                        alt={otherPartyName} 
                        className="w-10 h-10 rounded-full object-cover border border-border-warm ring-2 ring-white"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-border-warm font-sora font-bold text-xs text-text-navy">
                        {otherPartyName.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    {hasUnread && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-purple border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <h3 className={`text-xs font-extrabold truncate ${hasUnread ? 'text-text-navy' : 'text-text-navy/80'}`}>
                        {otherPartyName}
                      </h3>
                      <span className="text-[10px] font-mono text-text-muted shrink-0">
                        {formatTimestamp(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-accent-purple truncate mt-0.5 font-mono">
                      {conv.jobTitle} @ {conv.companyName}
                    </div>

                    <p className={`text-xs truncate mt-1 leading-normal ${hasUnread ? 'text-text-navy font-bold' : 'text-text-muted font-manrope'}`}>
                      {conv.lastMessage || <span className="italic font-normal">No messages yet</span>}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT VIEWPORT */}
      <div className={`flex-1 flex flex-col h-full bg-white relative ${selectedConv || isLockedError ? 'flex' : 'hidden md:flex'}`}>
        
        {/* BLOCKED/LOCKED STATE PANEL */}
        {isLockedError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface/5">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 border border-red-100 mb-4 animate-bounce">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-sora font-extrabold text-sm text-text-navy uppercase tracking-wider mb-2">
              Conversation Locked
            </h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm font-manrope">
              This conversation isn't available yet. A private chat session is only unlocked when the candidate expresses interest AND the recruiter shortlists them.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setIsLockedError(false);
                  if (onBackToHome) onBackToHome();
                }}
                className="px-4 py-2 bg-text-navy text-white text-xs font-bold rounded-xl hover:bg-text-navy/90 transition shadow-warm-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : !selectedConv ? (
          /* NO CONVERSATION SELECTED EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface/5">
            <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center text-accent-purple border border-border-warm/40 mb-4 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-sora font-extrabold text-xs text-text-navy uppercase tracking-wider mb-1">
              Select a chat thread
            </h3>
            <p className="text-xs text-text-muted max-w-xs font-manrope">
              Select a conversation from the sidebar to start secure real-time messaging.
            </p>
          </div>
        ) : (
          /* ACTIVE CHAT WORKSPACE */
          <>
            {/* Active Thread Header */}
            <div className="px-5 py-4 border-b border-border-warm flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="md:hidden p-1 rounded-lg hover:bg-surface text-text-muted hover:text-text-navy transition mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative shrink-0">
                  {getOtherPartyAvatar(selectedConv) ? (
                    <img 
                      src={getOtherPartyAvatar(selectedConv)} 
                      alt={getOtherPartyName(selectedConv)} 
                      className="w-10 h-10 rounded-full object-cover border border-border-warm ring-2 ring-accent-purple/5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center border border-border-warm font-sora font-bold text-xs text-text-navy">
                      {getOtherPartyName(selectedConv).split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy leading-none truncate">
                      {getOtherPartyName(selectedConv)}
                    </h3>
                    <span className="text-[9px] font-extrabold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">Matched</span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 font-manrope truncate leading-none">
                    Discussing: <span className="font-bold text-accent-purple font-mono">{selectedConv.jobTitle}</span>
                  </p>
                </div>
              </div>

              {/* Security Shield Indicator */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted border border-border-warm/60 bg-surface px-2.5 py-1 rounded-full hidden sm:flex">
                <Clock className="w-3.5 h-3.5 text-accent-purple" />
                <span>End-to-End Secure Channel</span>
              </div>
            </div>

            {/* MESSAGE CHRONOLOGY WINDOW */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-page-gradient/30">
              <div className="flex items-center justify-center my-2">
                <span className="text-[9px] font-bold text-text-muted font-mono uppercase tracking-widest bg-border-warm/30 px-3 py-1 rounded-full">
                  Chat Session Unlocked
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
                  <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center text-text-muted mb-2">
                    <MessageSquare className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-sora font-extrabold text-xs text-text-navy mb-1">
                    Begin the dialogue
                  </h4>
                  <p className="text-xs text-text-muted font-manrope">
                    Send a secure message to initiate discussions regarding the {selectedConv.jobTitle} opportunity.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderUid === currentUserId;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Message Bubble */}
                        <div
                          className={`p-3 rounded-2xl text-xs font-medium leading-relaxed font-manrope ${
                            isMe
                              ? 'bg-text-navy text-white rounded-tr-xs shadow-warm-xs'
                              : 'bg-white text-text-navy rounded-tl-xs border border-border-warm shadow-warm-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                        {/* Meta info */}
                        <span className="text-[9px] font-mono font-bold text-text-muted mt-1 flex items-center gap-1">
                          {isMe ? userName : getOtherPartyName(selectedConv)}
                          <span>•</span>
                          {msg.sentAt ? formatTimestamp(msg.sentAt) : <span className="italic">sending...</span>}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* SEND CONSOLE CONTROL */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border-warm bg-white flex gap-3 items-center shrink-0">
              <input
                type="text"
                placeholder={`Type message to ${getOtherPartyName(selectedConv).split(' ')[0]}...`}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 bg-surface border border-border-warm/60 rounded-xl px-4 py-3 text-xs font-semibold font-manrope text-text-navy placeholder-text-muted focus:outline-hidden focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition shadow-warm-sm ${
                  newMessageText.trim()
                    ? 'bg-text-navy hover:bg-text-navy/95 text-white hover:scale-[1.02] cursor-pointer'
                    : 'bg-surface border border-border-warm/50 text-text-muted cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
