import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Briefcase,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  X,
  Send,
  MessageSquare,
  Bookmark,
  Share2,
  Users,
  Plus,
  Trash2,
  RotateCcw,
  ArrowLeft,
  Sliders,
  Filter,
  Check,
  Building,
  DollarSign,
  UserCheck,
  ExternalLink,
  Lock,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown,
  GraduationCap,
  Code2,
  Github,
  Star,
  Pencil,
  Loader2
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import { NavBar, NavLinkItem } from '../components/NavBar';
import { PrivateChat } from '../components/PrivateChat';
import { syncApplicationState, getCandidateUid } from '../lib/chatUtils';
import { 
  db, 
  auth, 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  getDoc
} from '../firebase';

// Interfaces for recruiter structures
export interface RecruiterJob {
  id: string;
  title: string;
  postedDate: string;
  status: 'Active' | 'Closed';
  applicantsCount: number;
  tags: string[];
  description: string;
  salary: string;
  location: string;
  experienceLevel: string;
  jobType: string;
  topCandidates: {
    name: string;
    avatarUrl: string;
    title: string;
    matchScore: number;
    skills: string[];
    pitch: string;
    experience: string;
    location: string;
    desiredSalary: string;
    isVerified?: boolean;
    whyMatched?: string[];
    recentlyActive?: boolean;
  }[];
}

interface RecruiterHomeScreenProps {
  userData: { uid?: string; name?: string; email: string; companyName?: string; role?: string };
  onLogout: () => void;
  onNavigateToCompanySetup?: () => void;
}

// Sample candidates with realistic seed avatars and matching fields
const CANDIDATES_POOL = [
  {
    name: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    title: 'Senior Front-End Architect',
    matchScore: 98,
    skills: ['React 19', 'Tailwind v4', 'Vite', 'TypeScript'],
    experience: '8 years',
    location: 'SF / Remote',
    desiredSalary: '$195,000',
    pitch: 'Specializes in high-fidelity animations, micro-frontends, and rapid developer tooling. Active seeker.',
    isVerified: true,
    whyMatched: ['8 yrs React', 'Verified GitHub', 'System scaling expert'],
    recentlyActive: false
  },
  {
    name: 'Sarah Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    title: 'Lead Product Developer',
    matchScore: 95,
    skills: ['Next.js', 'PostgreSQL', 'AI Prompt Engineering', 'TypeScript'],
    experience: '6 years',
    location: 'Fully Remote',
    desiredSalary: '$200,000',
    pitch: 'Full-stack builder who ran product at YC backed developer workspace startup. Prefers remote.',
    isVerified: true,
    whyMatched: ['6 yrs exp', 'Next.js expert', 'AI Prompt certified'],
    recentlyActive: true
  },
  {
    name: 'Marcus Brody',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    title: 'Staff UI Engineer',
    matchScore: 92,
    skills: ['React', 'Framer Motion', 'Tailwind', 'CSS Canvases'],
    experience: '9 years',
    location: 'Austin, TX',
    desiredSalary: '$185,000',
    pitch: 'Obsessed with fluid interfaces and micro-interactions. Created popular open-source layouts.',
    isVerified: true,
    whyMatched: ['9 yrs exp', 'Verified GitHub', 'Framer Motion guru'],
    recentlyActive: false
  },
  {
    name: 'Emily Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    title: 'Senior Product Engineer',
    matchScore: 89,
    skills: ['Next.js', 'GraphQL', 'Node.js', 'Vite'],
    experience: '7 years',
    location: 'Fully Remote',
    desiredSalary: '$175,000',
    pitch: 'Passionate about bridging visual design and bulletproof server architecture.',
    isVerified: false,
    whyMatched: ['7 yrs exp', 'Next.js architecture', 'Lead 2 design systems'],
    recentlyActive: true
  },
  {
    name: 'Jordan Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    title: 'Full-Stack React Developer',
    matchScore: 84,
    skills: ['React', 'Node.js', 'Tailwind', 'Firebase'],
    experience: '5 years',
    location: 'New York, NY',
    desiredSalary: '$150,000',
    pitch: 'Fast-paced developer with strong focus on clean state engines and SaaS delivery.',
    isVerified: false,
    whyMatched: ['5 yrs exp', 'Vetted project history', 'Tailwind power-user'],
    recentlyActive: true
  }
];

const DEFAULT_RECRUITER_JOBS: RecruiterJob[] = [
  {
    id: 'rec-job-1',
    title: 'Staff React Engineer',
    postedDate: 'Posted 2 days ago',
    status: 'Active',
    applicantsCount: 24,
    tags: ['React 19', 'Next.js', 'Distributed Systems'],
    description: 'Lead front-end scaling efforts for our next-generation visual automation designer. Build responsive component systems that sync in real-time.',
    salary: '$195,000 - $220,000',
    location: 'SF / Remote',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[0], // Alex Rivera
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[2], // Marcus Brody
      CANDIDATES_POOL[3], // Emily Watson
    ]
  },
  {
    id: 'rec-job-2',
    title: 'Senior Front-End Architect',
    postedDate: 'Posted 5 days ago',
    status: 'Active',
    applicantsCount: 12,
    tags: ['Tailwind v4', 'Vite', 'TypeScript'],
    description: 'Architect a blisteringly fast multi-tenant dashboard system. Focus heavily on layout animations, rendering efficiency, and flawless visual typography.',
    salary: '$180,000 - $205,000',
    location: 'Fully Remote',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[2], // Marcus Brody
      CANDIDATES_POOL[3], // Emily Watson
    ]
  },
  {
    id: 'rec-job-3',
    title: 'Product Engineer (AI Systems)',
    postedDate: 'Posted 2 weeks ago',
    status: 'Closed',
    applicantsCount: 45,
    tags: ['Next.js', 'Generative AI', 'PostgreSQL'],
    description: 'Integrate multi-modal LLM features directly into the core workflow interface. Work closely with product designers to map raw models to delightful tools.',
    salary: '$160,000 - $190,000',
    location: 'Austin, TX',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[0], // Alex Rivera
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[3], // Emily Watson
      CANDIDATES_POOL[4], // Jordan Miller
    ]
  }
];

const CANDIDATE_DETAILED_INFO: Record<string, {
  education: { school: string; degree: string; dates: string }[];
  experience: { company: string; role: string; dates: string; description: string }[];
  projects: { title: string; description: string; demoUrl?: string; role: string; tags: string[] }[];
  githubSummary: { status: string; repos: number; summary: string };
  whyMatchedExpanded: string[];
  cannedResponses: Record<string, string>;
  defaultResponse: string;
}> = {
  'Alex Rivera': {
    whyMatchedExpanded: [
      '✓ 8 years of React experience (exceeds senior requirement of 5+ years)',
      '✓ Active GitHub profile with 14 connected repositories and daily contributions',
      '✓ Designed and scaled micro-frontends at Stripe, improving compile times by 40%',
      '✓ Highly active candidate, currently open to immediate onboarding'
    ],
    experience: [
      {
        company: 'Stripe',
        role: 'Senior Front-End Architect',
        dates: '2021 - Present',
        description: 'Led core dashboard architecture scaling. Created internal design tokens parser and migrated 4 legacy apps to React 18 & Vite. Mentored 6 junior devs.'
      },
      {
        company: 'Vercel',
        role: 'Core UI Engineer',
        dates: '2019 - 2021',
        description: 'Co-developed key performance optimization tools for Next.js middleware. Focused on high-fidelity animations and developer tools.'
      },
      {
        company: 'Airbnb',
        role: 'Software Engineer (Frontend)',
        dates: '2017 - 2019',
        description: 'Worked on internationalization layout rendering. Maintained internal atomic CSS utilities.'
      }
    ],
    education: [
      {
        school: 'Stanford University',
        degree: 'B.S. in Computer Science',
        dates: '2013 - 2017'
      }
    ],
    projects: [
      {
        title: 'Framer Motion Pro layouts',
        description: 'Open-source layouts for fluid dashboards with auto-responsive layouts.',
        role: 'Creator & Maintainer',
        demoUrl: 'https://github.com/alexrivera/framer-motion-layouts',
        tags: ['React', 'Framer Motion', 'Vite']
      },
      {
        title: 'Vite-Plugin-Bundle-Analyzer',
        description: 'A tool to visually audit micro-frontends bundle sizes in web worker environments.',
        role: 'Author',
        demoUrl: 'https://github.com/alexrivera/vite-plugin-bundle',
        tags: ['TypeScript', 'Vite', 'Build Tools']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 14,
      summary: '14 active repositories analyzed. Outstanding contributions to Framer Motion and Vite ecosystem. Strong daily activity in the last 6 months.'
    },
    cannedResponses: {
      'How many years of React experience?': 'Alex has 8 years of deep React experience, spanning from early class components to modern React 19 concurrent features. He specializes in performance optimization and design systems.',
      'What certifications does this candidate have?': 'Alex has a B.S. in Computer Science from Stanford University and has spoken at React Conf on advanced micro-frontends.',
      'Summarize their project experience': 'Alex has built open-source tools with millions of downloads, including Vercel utility kits and advanced Framer Motion layouts. His work is characterized by exceptional visual polish and speed.'
    },
    defaultResponse: "Alex Rivera is a top-tier frontend architect with deep expertise in UI engineering. According to his parsed portfolio, he would be an excellent fit for scaling complex UI systems."
  },
  'Sarah Chen': {
    whyMatchedExpanded: [
      '✓ 6 years of product development experience at high-growth startups',
      '✓ Next.js expert with extensive full-stack PostgreSQL and AI model integrations',
      '✓ Former founding engineer and product lead at a YC-backed developer workspace startup',
      '✓ Exceptional scores on prompt engineering and full-stack architecture reviews'
    ],
    experience: [
      {
        company: 'Linear Space (YC S21)',
        role: 'Lead Product Developer & Founding Engineer',
        dates: '2021 - 2024',
        description: 'Built core real-time collaborative workspace canvas from scratch using Next.js and WebSockets. Oversaw database layout migrations and vector search pipelines.'
      },
      {
        company: 'Retool',
        role: 'Full-Stack Developer',
        dates: '2019 - 2021',
        description: 'Developed critical drag-and-drop workflow components. Integrated third-party integrations engine and improved query editor load speeds.'
      }
    ],
    education: [
      {
        school: 'UC Berkeley',
        degree: 'B.S. in Electrical Engineering & Computer Sciences (EECS)',
        dates: '2015 - 2019'
      }
    ],
    projects: [
      {
        title: 'PromptFlow AI',
        description: 'Visual playground for testing and versioning generative LLM pipelines.',
        role: 'Solo Developer',
        demoUrl: 'https://github.com/sarahchen/promptflow',
        tags: ['Next.js', 'PostgreSQL', 'AI']
      },
      {
        title: 'SyncState-WS',
        description: 'Ultralight real-time collaborative canvas state sync library using custom WebSockets.',
        role: 'Creator',
        demoUrl: 'https://github.com/sarahchen/syncstate',
        tags: ['TypeScript', 'WebSockets']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 28,
      summary: '28 active repositories. High activity in vector embeddings and local LLM integrations. Frequent contributor to LangChain.'
    },
    cannedResponses: {
      'How many years of React experience?': 'Sarah has 6 years of experience building modern React and Next.js applications, with a heavy focus on complex local states and rich, interactive canvas layers.',
      'What certifications does this candidate have?': 'Sarah holds an EECS degree from UC Berkeley and is certified in Advanced Machine Learning and LLM Engineering.',
      'Summarize their project experience': 'Sarah has built full visual playgrounds for generative AI, high-throughput WebSocket sync engines, and led product engineering at a YC startup. She bridges robust backend structures with beautiful frontend designs.'
    },
    defaultResponse: "Sarah Chen is a highly versatile product developer. She is excellent at translating nebulous AI and database requirements into clean, production-grade web interfaces."
  },
  'Marcus Brody': {
    whyMatchedExpanded: [
      '✓ 9 years of pure visual engineering and UI systems development',
      '✓ Absolute master of Framer Motion, CSS Canvas rendering, and micro-interactions',
      '✓ Well-known open-source layout creator with multiple viral Tailwind templates',
      '✓ Strong background scaling frontends for interactive enterprise software'
    ],
    experience: [
      {
        company: 'Figma',
        role: 'Staff UI Engineer',
        dates: '2020 - Present',
        description: 'Led UI revitalization for the community sharing portal. Built custom spring-physics layout engines and visual components. Reduced bundle size by 30%.'
      },
      {
        company: 'Webflow',
        role: 'Senior Interaction Engineer',
        dates: '2017 - 2020',
        description: 'Designed and built the core interaction builder interface. Created reusable physics-based visual libraries.'
      }
    ],
    education: [
      {
        school: 'Rhode Island School of Design (RISD)',
        degree: 'BFA in Industrial Design & Digital Media',
        dates: '2011 - 2015'
      }
    ],
    projects: [
      {
        title: 'Springy UI',
        description: 'Physics-based React animation engine optimized for 120Hz display refresh rates.',
        role: 'Creator',
        demoUrl: 'https://github.com/marcusbrody/springy-ui',
        tags: ['React', 'Framer Motion', 'WebGL']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 19,
      summary: '19 active repositories. Significant impact on community UI frameworks. Heavy commits to animations, shaders, and creative canvas tools.'
    },
    cannedResponses: {
      'How many years of React experience?': 'Marcus has 9 years of UI development experience, prioritizing highly aesthetic design engineering, layout mechanics, and animation systems.',
      'What certifications does this candidate have?': 'Marcus holds a BFA from RISD and blends technical software architecture with high-fidelity digital design principles.',
      'Summarize their project experience': 'Marcus created Springy UI (a performance-optimized physics-based web rendering helper) and led core interaction components at Figma and Webflow.'
    },
    defaultResponse: "Marcus Brody is a world-class Visual Engineer. If your application requires breathtaking animations, responsive typography, and tactile interactions, Marcus is your candidate."
  },
  'Emily Watson': {
    whyMatchedExpanded: [
      '✓ 7 years of full-stack experience bridging layout design and server architectures',
      '✓ Built and maintained complex GraphQL APIs and scalable Next.js server routers',
      '✓ Designed and deployed 2 complete component design systems adopted by 100+ devs',
      '✓ Fully remote expert with excellent collaborative communication reviews'
    ],
    experience: [
      {
        company: 'Supabase',
        role: 'Senior Product Engineer',
        dates: '2021 - Present',
        description: 'Built the client dashboard query editor, visual database modeler, and integrated GraphQL query interface. Managed automated testing suites.'
      },
      {
        company: 'Gatsby',
        role: 'Core Architect',
        dates: '2019 - 2021',
        description: 'Designed unified developer tooling templates and GraphQL data layers. Guided migrations to hybrid rendering schemas.'
      }
    ],
    education: [
      {
        school: 'University of Washington',
        degree: 'B.S. in Informatics',
        dates: '2014 - 2018'
      }
    ],
    projects: [
      {
        title: 'SchemaCraft',
        description: 'Visual database schema generator that instantly outputs TypeScript and PostgreSQL DDL.',
        role: 'Author',
        demoUrl: 'https://github.com/emilywatson/schemacraft',
        tags: ['Next.js', 'GraphQL', 'Tailwind']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 22,
      summary: '22 repositories. Strong activity in developer tools, GraphQL compilers, and static-site generating engines.'
    },
    cannedResponses: {
      'How many years of React experience?': 'Emily has 7 years of full-stack engineering experience, specializing in advanced server components, GraphQL data pipelines, and database modeling dashboards.',
      'What certifications does this candidate have?': 'Emily holds a B.S. in Informatics from UW and is an active technical writer on modern rendering topologies.',
      'Summarize their project experience': 'Emily has engineered complex dashboard layers for Supabase, authored open-source schema parsers, and established comprehensive design systems from the ground up.'
    },
    defaultResponse: "Emily Watson is an outstanding Senior Product Engineer. She is exceptionally comfortable connecting intricate server schemas with clean, beautiful UI components."
  },
  'Jordan Miller': {
    whyMatchedExpanded: [
      '✓ 5 years of experience delivering high-velocity React & Tailwind apps',
      '✓ Deep expertise in clean state management (Redux, Zustand, React Query)',
      '✓ Proven track record with responsive, accessible visual design guidelines',
      '✓ High-impact SaaS builder who thrives in fast-paced startup workflows'
    ],
    experience: [
      {
        company: 'Veed.io',
        role: 'Full-Stack React Developer',
        dates: '2022 - Present',
        description: 'Engineered web video editor timeline controls. Leveraged Zustand for zero-latency video playhead state tracking. Scaled exports dashboard.'
      },
      {
        company: 'ProductHunt',
        role: 'Frontend Engineer',
        dates: '2021 - 2022',
        description: 'Optimized infinite scroll feeds and active user notifications. Re-implemented Tailwind v3 CSS migration.'
      }
    ],
    education: [
      {
        school: 'Texas A&M University',
        degree: 'B.S. in Computer Science',
        dates: '2017 - 2021'
      }
    ],
    projects: [
      {
        title: 'StateSync-Play',
        description: 'Visual devtool for debugging complex Zustand and React Query state side-effects in real-time.',
        role: 'Creator',
        demoUrl: 'https://github.com/jordanmiller/statesync',
        tags: ['Zustand', 'React', 'Tailwind']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 11,
      summary: '11 repositories. Focus on state machine visualizations, Tailwind CSS plugins, and media playhead controls.'
    },
    cannedResponses: {
      'How many years of React experience?': 'Jordan has 5 years of hands-on React experience, specializing in clean state structures, performance debugging, and high-quality SaaS features.',
      'What certifications does this candidate have?': 'Jordan has a B.S. in Computer Science from Texas A&M and is a certified Web Accessibility specialist (IAAP).',
      'Summarize their project experience': 'Jordan engineered low-latency timing state managers at Veed.io and authored visual debuggers for Zustand. He is a productivity multiplier for startup teams.'
    },
    defaultResponse: "Jordan Miller is an efficient, reliable product engineer who excels in building highly interactive state-driven dashboards and SaaS workflows."
  }
};

const getCandidateDetails = (name: string, fallbackTitle: string, fallbackExperience: string, fallbackLocation: string) => {
  if (CANDIDATE_DETAILED_INFO[name]) {
    return CANDIDATE_DETAILED_INFO[name];
  }
  return {
    whyMatchedExpanded: [
      `✓ Fully matches requirements for ${fallbackTitle}`,
      `✓ Verified ${fallbackExperience} of industry experience`,
      `✓ Based in or remote-friendly from ${fallbackLocation}`,
      `✓ Demonstrates strong potential and verified technical portfolio`
    ],
    experience: [
      {
        company: 'Enterprise Solutions Inc.',
        role: fallbackTitle || 'Senior Software Engineer',
        dates: '2022 - Present',
        description: 'Designed and deployed scalable front-end systems. Managed 3 internal codebases and led transition to Vite.'
      },
      {
        company: 'SaaS Startup Lab',
        role: 'Full Stack Engineer',
        dates: '2019 - 2022',
        description: 'Developed client-facing portal and integrated analytical dashboards. Managed state flow.'
      }
    ],
    education: [
      {
        school: 'State University',
        degree: 'B.S. in Computer Science',
        dates: '2015 - 2019'
      }
    ],
    projects: [
      {
        title: 'Dashboard Starter Pro',
        description: 'A pre-configured frontend dashboard template focusing on strict layout mechanics.',
        role: 'Sole Creator',
        tags: ['React', 'TypeScript', 'Tailwind']
      }
    ],
    githubSummary: {
      status: 'Connected',
      repos: 8,
      summary: '8 active repositories analyzed. Consistent contribution history and tidy code formatting standards.'
    },
    cannedResponses: {
      'How many years of React experience?': `This candidate has ${fallbackExperience} of solid development experience, with a core emphasis on React ecosystem tools.`,
      'What certifications does this candidate have?': 'Certified Scrum Developer (CSD) and holds a degree in Computer Science.',
      'Summarize their project experience': 'Has built customizable admin dashboards, data visualizers, and state-synced web configurations.'
    },
    defaultResponse: `This candidate is a strong contender with ${fallbackExperience} of solid experience. They show high competence in modern frontend patterns.`
  };
};

export const RecruiterHomeScreen: React.FC<RecruiterHomeScreenProps> = ({
  userData,
  onLogout,
  onNavigateToCompanySetup,
}) => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'candidates' | 'messages' | 'company-settings'>('home');
  const [activeView, setActiveView] = useState<'home' | 'ranking' | 'post-job'>('home');
  
  // Jobs List State
  const [jobs, setJobs] = useState<RecruiterJob[]>(DEFAULT_RECRUITER_JOBS);
  const [selectedJob, setSelectedJob] = useState<RecruiterJob | null>(null);

  // --- JOB POSTING SCREEN STATE LAYER ---
  const [jobForm, setJobForm] = useState({
    title: '',
    department: '',
    employmentType: 'Full-time', // "Full-time", "Part-time", "Contract", "Internship"
    location: '',
    locationType: 'Remote', // "Remote", "Hybrid", "On-site"
    experienceLevel: 'Senior', // "Entry", "Mid", "Senior", "Lead"
    description: '',
    salaryMin: '',
    salaryMax: '',
    salaryPublic: true,
    requiredSkills: [] as string[],
    aiParsedRequirements: null as {
      hardRequirements: string[];
      softRequirements: string[];
      impliedSeniority: string;
      impliedContext: string;
    } | null,
    status: 'active' as 'draft' | 'active'
  });

  const [skillInput, setSkillInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingHardIndex, setEditingHardIndex] = useState<number | null>(null);
  const [editingHardValue, setEditingHardValue] = useState('');
  const [editingSoftIndex, setEditingSoftIndex] = useState<number | null>(null);
  const [editingSoftValue, setEditingSoftValue] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successAnimationType, setSuccessAnimationType] = useState<'draft' | 'post'>('post');

  const resetJobForm = () => {
    setJobForm({
      title: '',
      department: '',
      employmentType: 'Full-time',
      location: '',
      locationType: 'Remote',
      experienceLevel: 'Senior',
      description: '',
      salaryMin: '',
      salaryMax: '',
      salaryPublic: true,
      requiredSkills: [],
      aiParsedRequirements: null,
      status: 'active'
    });
    setSkillInput('');
    setIsAnalyzing(false);
    setEditingHardIndex(null);
    setEditingHardValue('');
    setEditingSoftIndex(null);
    setEditingSoftValue('');
  };

  const handleAddRequiredSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanSkill = skillInput.trim().replace(/,/g, '');
      if (cleanSkill && !jobForm.requiredSkills.includes(cleanSkill)) {
        setJobForm((prev) => ({
          ...prev,
          requiredSkills: [...prev.requiredSkills, cleanSkill],
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveRequiredSkill = (tag: string) => {
    setJobForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== tag),
    }));
  };

  const runMockAiParse = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const lowercaseTitle = jobForm.title.toLowerCase();
      const lowercaseDesc = jobForm.description.toLowerCase();

      let hard = ['TypeScript', 'React 18/19', 'Modern CSS & Tailwind'];
      let soft = ['Excellent communication skills', 'Proactive problem solver', 'Enjoys mentoring junior engineers'];
      let seniority = jobForm.experienceLevel;
      let context = 'Fast-paced, high-collaboration product engineering team';

      if (lowercaseTitle.includes('front') || lowercaseTitle.includes('react') || lowercaseTitle.includes('ui') || lowercaseDesc.includes('front') || lowercaseDesc.includes('ui')) {
        hard = ['React 18/19', 'TypeScript', 'Tailwind CSS & responsive design', 'State management (Zustand/Redux)'];
        soft = ['Eye for high-fidelity animations and details', 'Collaboration with UX Designers', 'User-centric product mindset'];
        if (!seniority) seniority = 'Mid';
        context = 'Modern front-end engineering workspace with rapid iterations';
      } else if (lowercaseTitle.includes('back') || lowercaseTitle.includes('node') || lowercaseTitle.includes('api') || lowercaseDesc.includes('back') || lowercaseDesc.includes('database')) {
        hard = ['Node.js & Express / NestJS', 'PostgreSQL or MySQL', 'RESTful & GraphQL API Design', 'Redis & caching strategies'];
        soft = ['Strong logical & database schema reasoning', 'Writes clean, well-tested clean code', 'Monitors performance and server health'];
        if (!seniority) seniority = 'Senior';
        context = 'Infrastructure & data management team prioritizing reliability and throughput';
      } else if (lowercaseTitle.includes('full') || lowercaseDesc.includes('full')) {
        hard = ['Next.js / Full-Stack React', 'Node.js & PostgreSQL', 'TypeScript & schema validation', 'Cloud hosting & deployment pipelines'];
        soft = ['Bridges the gap between complex schemas and interactive UI', 'Highly adaptable generalist developer', 'Strong product shipping velocity'];
        if (!seniority) seniority = 'Mid-Senior';
        context = 'Cross-functional agile product team launching greenfield features';
      }

      // Add typing details
      if (lowercaseDesc.includes('rust')) hard.push('Rust programming language');
      if (lowercaseDesc.includes('python')) hard.push('Python & data scripting');
      if (lowercaseDesc.includes('docker')) hard.push('Docker containerization');
      if (lowercaseDesc.includes('next.js') && !hard.includes('Next.js / Full-Stack React')) hard.push('Next.js framework');

      setJobForm((prev) => ({
        ...prev,
        aiParsedRequirements: {
          hardRequirements: hard,
          softRequirements: soft,
          impliedSeniority: `Implied: ${seniority}`,
          impliedContext: `Sounds like: ${context}`
        }
      }));
      setIsAnalyzing(false);
    }, 2000);
  };
  
  // Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  
  // UI filter states (Global)
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterExperience, setFilterExperience] = useState('All');
  const [filterSkill, setFilterSkill] = useState('All');

  // --- AI RANKING SCREEN STATE LAYER ---
  const [layoutMode, setLayoutMode] = useState<'card' | 'list'>('card');
  const [rankingSearchQuery, setRankingSearchQuery] = useState('');
  const [rankingExperienceRange, setRankingExperienceRange] = useState<string>('All'); // 'All', '0-2', '3-5', '5-10', '10+'
  const [rankingMinMatchScore, setRankingMinMatchScore] = useState<number>(0); // 0, 70, 85, 95
  const [rankingVerificationOnly, setRankingVerificationOnly] = useState<boolean>(false);
  const [rankingSortBy, setRankingSortBy] = useState<string>('Best match'); // 'Best match', 'Most experience', 'Recently active'

  // Local interactive visual state tracking
  const [shortlistedNames, setShortlistedNames] = useState<string[]>([]);
  const [passedNames, setPassedNames] = useState<string[]>([]);

  // Pagination for candidates in AI Ranking
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3;
  
  // Interaction states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePitchCandidate, setActivePitchCandidate] = useState<any | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [isSubmittingPitch, setIsSubmittingPitch] = useState(false);
  const [pitchSuccess, setPitchSuccess] = useState(false);

  // Candidate detail drawer & RAG chat states
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<any | null>(null);
  const [drawerChatInput, setDrawerChatInput] = useState('');
  const [drawerChatHistory, setDrawerChatHistory] = useState<{ sender: 'recruiter' | 'ai'; text: string; timestamp: Date }[]>([]);
  const [drawerIsThinking, setDrawerIsThinking] = useState(false);

  // Secure Direct Chat states
  const [selectedAppIdForChat, setSelectedAppIdForChat] = useState<string | null>(null);
  const [isMutualInterest, setIsMutualInterest] = useState(false);

  // Sync / listen to mutual interest in real-time
  useEffect(() => {
    if (!selectedCandidateForDrawer) {
      setIsMutualInterest(false);
      return;
    }
    // Fallback if no selectedJob is active yet
    const activeJobId = selectedJob?.id || 'job-1';
    const candidateUid = getCandidateUid(selectedCandidateForDrawer.name);
    const appId = `${candidateUid}_${activeJobId}`;
    const appRef = doc(db, 'applications', appId);

    const unsubscribe = onSnapshot(appRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const appData = docSnap.data();
        setIsMutualInterest(!!appData.chatUnlocked);
      } else {
        setIsMutualInterest(false);
      }
    });

    return () => unsubscribe();
  }, [selectedCandidateForDrawer, selectedJob]);

  // Notifications
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Nav bar links configuration (Recruiter style)
  const navLinks: NavLinkItem[] = [
    {
      label: 'Home',
      href: '#home',
      active: activeTab === 'home' && activeView === 'home',
      onClick: () => {
        setActiveTab('home');
        setActiveView('home');
        setSelectedJob(null);
      }
    },
    {
      label: 'Candidates',
      href: '#candidates',
      active: activeTab === 'candidates' || activeView === 'ranking',
      onClick: () => {
        setActiveTab('candidates');
        // Automatically open the first active job ranking or general search ranking
        const firstActive = jobs.find(j => j.status === 'Active') || jobs[0];
        if (firstActive) {
          setSelectedJob(firstActive);
          setActiveView('ranking');
        } else {
          // If no jobs, show ranking with null context (general candidate pool)
          setSelectedJob(null);
          setActiveView('ranking');
        }
        triggerToast("Viewing AI Candidate Matchmaking Pool");
      }
    },
    {
      label: 'Messages',
      href: '#messages',
      active: activeTab === 'messages',
      onClick: () => {
        setActiveTab('messages');
        setSelectedAppIdForChat(null);
      }
    },
    {
      label: 'Company Settings',
      href: '#company-settings',
      active: activeTab === 'company-settings',
      onClick: () => {
        setActiveTab('company-settings');
        if (onNavigateToCompanySetup) {
          onNavigateToCompanySetup();
        } else {
          triggerToast("Navigate to Company Setup Screen");
        }
      }
    }
  ];

  // Global search submission -> Navigates to AI Ranking Screen
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    
    // Choose a job context if possible, or leave it as general search ranking
    const matchedJob = jobs.find(j => 
      j.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      j.tags.some(t => t.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    );
    
    setSelectedJob(matchedJob || null);
    setActiveView('ranking');
    setActiveTab('candidates');
    triggerToast(`Searching AI matches for "${globalSearchQuery}"`);
  };

  // Delete Job Posting (for demonstrating Empty State)
  const handleDeleteJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobs(prev => prev.filter(job => job.id !== id));
    triggerToast("Job posting deleted");
  };

  // Restore Default Jobs (for convenience in Empty State)
  const handleRestoreDefaultJobs = () => {
    setJobs(DEFAULT_RECRUITER_JOBS);
    triggerToast("Restored demo job listings");
  };

  // Action: Open Rank candidates for specific job
  const handleViewRankedCandidates = (job: RecruiterJob) => {
    setSelectedJob(job);
    setActiveView('ranking');
    setActiveTab('candidates');
    triggerToast(`Opening match analysis for ${job.title}`);
  };

  // Action: Submit Direct Pitch to Candidate
  const handleSendDirectPitch = () => {
    if (!activePitchCandidate) return;
    setIsSubmittingPitch(true);
    
    setTimeout(() => {
      setIsSubmittingPitch(false);
      setPitchSuccess(true);
      triggerToast(`Direct pitch submitted to ${activePitchCandidate.name}!`);
      
      // Clear after visual delay
      setTimeout(() => {
        setActivePitchCandidate(null);
        setPitchSuccess(false);
        setPitchText('');
      }, 1800);
    }, 1200);
  };

  // Candidates list inside the AI Ranking Screen, filtered based on query and UI selections
  const displayCandidates = (selectedJob ? selectedJob.topCandidates : CANDIDATES_POOL).filter(cand => {
    // Quick search query filter
    const matchesSearch = globalSearchQuery 
      ? cand.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        cand.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        cand.skills.some(s => s.toLowerCase().includes(globalSearchQuery.toLowerCase()))
      : true;
    
    // UI selections
    const matchesLocation = filterLocation === 'All' 
      ? true 
      : filterLocation === 'SF / Remote' 
        ? cand.location.includes('SF') || cand.location.includes('Remote')
        : filterLocation === 'Fully Remote'
          ? cand.location === 'Fully Remote'
          : cand.location.includes(filterLocation);

    const matchesExperience = filterExperience === 'All'
      ? true
      : filterExperience === 'Senior'
        ? parseInt(cand.experience) >= 6
        : parseInt(cand.experience) < 6;

    const matchesSkill = filterSkill === 'All'
      ? true
      : cand.skills.includes(filterSkill);

    return matchesSearch && matchesLocation && matchesExperience && matchesSkill;
  });

  // --- AI RANKING SCREEN ADVANCED FILTERING & SORTING LAYER ---
  const activeRankingJob = selectedJob || jobs[0] || DEFAULT_RECRUITER_JOBS[0];
  const rawRankingCandidates = activeRankingJob ? activeRankingJob.topCandidates : CANDIDATES_POOL;

  const filteredRankingCandidates = rawRankingCandidates.filter(cand => {
    // A. Filter by local search query: "Search candidates by name or skill"
    const matchesSearch = rankingSearchQuery
      ? cand.name.toLowerCase().includes(rankingSearchQuery.toLowerCase()) ||
        cand.skills.some(skill => skill.toLowerCase().includes(rankingSearchQuery.toLowerCase())) ||
        cand.title.toLowerCase().includes(rankingSearchQuery.toLowerCase())
      : true;

    // B. Experience Range filter: "0-2 yrs", "3-5 yrs", "5-10 yrs", "10+ yrs"
    let matchesExperience = true;
    const years = parseInt(cand.experience) || 0;
    if (rankingExperienceRange === '0-2') {
      matchesExperience = years <= 2;
    } else if (rankingExperienceRange === '3-5') {
      matchesExperience = years >= 3 && years <= 5;
    } else if (rankingExperienceRange === '5-10') {
      matchesExperience = years >= 5 && years <= 10;
    } else if (rankingExperienceRange === '10+') {
      matchesExperience = years >= 10;
    }

    // C. Minimum Match Score: "70%+", "85%+", "95%+"
    let matchesScore = true;
    if (rankingMinMatchScore > 0) {
      matchesScore = cand.matchScore >= rankingMinMatchScore;
    }

    // D. Verification Status
    const matchesVerification = rankingVerificationOnly ? !!cand.isVerified : true;

    return matchesSearch && matchesExperience && matchesScore && matchesVerification;
  });

  // Sort candidates
  const sortedRankingCandidates = [...filteredRankingCandidates].sort((a, b) => {
    if (rankingSortBy === 'Most experience') {
      const expA = parseInt(a.experience) || 0;
      const expB = parseInt(b.experience) || 0;
      return expB - expA;
    } else if (rankingSortBy === 'Recently active') {
      const activeA = a.recentlyActive ? 1 : 0;
      const activeB = b.recentlyActive ? 1 : 0;
      return activeB - activeA || b.matchScore - a.matchScore;
    } else {
      // Best match (default)
      return b.matchScore - a.matchScore;
    }
  });

  // Calculate active filter states
  const isRankingFilterActive = 
    rankingSearchQuery !== '' ||
    rankingExperienceRange !== 'All' ||
    rankingMinMatchScore > 0 ||
    rankingVerificationOnly;

  let activeRankingFilterCount = 0;
  if (rankingSearchQuery !== '') activeRankingFilterCount++;
  if (rankingExperienceRange !== 'All') activeRankingFilterCount++;
  if (rankingMinMatchScore > 0) activeRankingFilterCount++;
  if (rankingVerificationOnly) activeRankingFilterCount++;

  // Clear filters helper
  const handleClearRankingFilters = () => {
    setRankingSearchQuery('');
    setRankingExperienceRange('All');
    setRankingMinMatchScore(0);
    setRankingVerificationOnly(false);
    setRankingSortBy('Best match');
    setCurrentPage(1);
    triggerToast("Cleared all active filters");
  };

  // Drawer action helper functions
  const handleOpenCandidateDrawer = (cand: any) => {
    setSelectedCandidateForDrawer(cand);
    setDrawerChatInput('');
    setDrawerChatHistory([]);
    setDrawerIsThinking(false);
    triggerToast(`Opened profile details for ${cand.name}`);
  };

  const handleSendDrawerChatMessage = (messageText: string) => {
    if (!messageText.trim() || !selectedCandidateForDrawer) return;

    // 1. Add user message
    const userMsg = {
      sender: 'recruiter' as const,
      text: messageText,
      timestamp: new Date()
    };
    setDrawerChatHistory(prev => [...prev, userMsg]);
    setDrawerChatInput('');
    setDrawerIsThinking(true);

    // 2. Simulate smart RAG response
    const details = getCandidateDetails(
      selectedCandidateForDrawer.name,
      selectedCandidateForDrawer.title,
      selectedCandidateForDrawer.experience,
      selectedCandidateForDrawer.location
    );

    // Let's find if we have a canned reply
    let reply = details.defaultResponse;
    const lowerMsg = messageText.toLowerCase();

    if (lowerMsg.includes('experience') || lowerMsg.includes('year') || lowerMsg.includes('how long')) {
      reply = details.cannedResponses['How many years of React experience?'];
    } else if (lowerMsg.includes('certification') || lowerMsg.includes('degree') || lowerMsg.includes('education') || lowerMsg.includes('school')) {
      reply = details.cannedResponses['What certifications does this candidate have?'];
    } else if (lowerMsg.includes('project') || lowerMsg.includes('portfolio') || lowerMsg.includes('work') || lowerMsg.includes('built')) {
      reply = details.cannedResponses['Summarize their project experience'];
    }

    setTimeout(() => {
      const aiMsg = {
        sender: 'ai' as const,
        text: reply,
        timestamp: new Date()
      };
      setDrawerChatHistory(prev => [...prev, aiMsg]);
      setDrawerIsThinking(false);
    }, 1000);
  };

  // Pagination slice
  const paginatedCandidates = sortedRankingCandidates.slice(0, currentPage * itemsPerPage);
  const hasMoreCandidates = sortedRankingCandidates.length > paginatedCandidates.length;

  // Toggle Shortlist action
  const handleToggleShortlist = (candidateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const candidateUid = getCandidateUid(candidateName);
    const activeJobId = selectedJob?.id || 'job-1';
    const recruiterUid = userData.uid || auth.currentUser?.uid || 'mock-recruiter-uid';

    if (shortlistedNames.includes(candidateName)) {
      setShortlistedNames(prev => prev.filter(name => name !== candidateName));
      triggerToast(`Removed ${candidateName} from shortlist`);
      
      syncApplicationState(candidateUid, recruiterUid, activeJobId, {
        recruiterShortlisted: false
      }).catch(err => console.error("Error syncing shortlist status:", err));
    } else {
      setShortlistedNames(prev => [...prev, candidateName]);
      // If candidate was in passed names, remove them
      setPassedNames(prev => prev.filter(name => name !== candidateName));
      triggerToast(`Shortlisted ${candidateName}!`);

      // Find candidate avatar
      const candObj = (selectedJob ? selectedJob.topCandidates : CANDIDATES_POOL).find(c => c.name === candidateName);

      syncApplicationState(candidateUid, recruiterUid, activeJobId, {
        recruiterShortlisted: true,
        candidateName: candidateName,
        candidateAvatarUrl: candObj?.avatarUrl || '',
        recruiterName: userData.name || 'Elena Rostova',
        recruiterAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
        jobTitle: selectedJob?.title || 'Staff React Engineer',
        companyName: selectedJob?.companyName || 'Quantum Dynamics'
      }).catch(err => console.error("Error syncing shortlist status:", err));
    }
  };

  // Toggle Pass action
  const handleTogglePass = (candidateName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const candidateUid = getCandidateUid(candidateName);
    const activeJobId = selectedJob?.id || 'job-1';
    const recruiterUid = userData.uid || auth.currentUser?.uid || 'mock-recruiter-uid';

    if (passedNames.includes(candidateName)) {
      setPassedNames(prev => prev.filter(name => name !== candidateName));
      triggerToast(`Restored profile of ${candidateName}`);
    } else {
      setPassedNames(prev => [...prev, candidateName]);
      // If candidate was shortlisted, remove them
      setShortlistedNames(prev => prev.filter(name => name !== candidateName));
      triggerToast(`Passed profile: ${candidateName}`);

      syncApplicationState(candidateUid, recruiterUid, activeJobId, {
        recruiterShortlisted: false
      }).catch(err => console.error("Error syncing pass status:", err));
    }
  };

  return (
    <div className="min-h-screen bg-page-gradient overflow-x-hidden font-manrope pb-12">
      
      {/* 1. PERSISTENT NAV BAR */}
      <NavBar 
        links={navLinks}
        user={{
          name: userData.name || 'Anonymous Recruiter',
          email: userData.email,
        }}
        onLogout={onLogout}
        onProfileClick={() => triggerToast("Viewing Profile Modal")}
        onSettingsClick={onNavigateToCompanySetup}
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-navy text-white px-5 py-3 rounded-full shadow-warm-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-accent-purple" />
            <span className="text-xs font-semibold font-manrope">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {activeTab === 'messages' ? (
          <motion.div
            key="messages-tab-recruiter"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <PrivateChat
              currentUserId={userData.uid || auth.currentUser?.uid || 'mock-recruiter-uid'}
              currentRole="recruiter"
              userName={userData.name || 'Anonymous Recruiter'}
              initialSelectedAppId={selectedAppIdForChat || undefined}
              onBackToHome={() => {
                setActiveTab('home');
                setActiveView('home');
                setSelectedAppIdForChat(null);
              }}
            />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
          {activeView === 'home' ? (
            
            /* ==================== SCREEN A: RECRUITER HOME ==================== */
            <motion.div
              key="recruiter-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              
              {/* Header Greeting & Analytics Intro */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight">
                    Recruiter Console: <span className="text-gradient-purple">{userData.companyName || 'TalentSphere Workspace'}</span>
                  </h1>
                  <p className="font-manrope text-sm text-text-muted mt-1">
                    Manage active hiring mandates, track incoming applicants, and initiate secure AI matches.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {jobs.length < DEFAULT_RECRUITER_JOBS.length && (
                    <button
                      onClick={handleRestoreDefaultJobs}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-warm bg-white text-xs font-bold text-text-muted hover:text-text-navy transition cursor-pointer"
                      title="Reset demo data"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Demo
                    </button>
                  )}
                  <div className="flex items-center gap-2 bg-purple-50 border border-accent-purple/10 px-4 py-2 rounded-2xl shadow-warm-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-purple"></span>
                    </span>
                    <span className="text-xs font-bold text-text-navy font-manrope">Hiring Engine: Active</span>
                  </div>
                </div>
              </div>

              {/* 2. SEARCH BAR (GLOBAL CANDIDATE QUICK SEARCH) */}
              <form onSubmit={handleGlobalSearchSubmit} className="w-full flex flex-col gap-3">
                <div className="relative flex items-center">
                  <div className="absolute left-4.5 text-text-muted pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search candidates by name, skill, or role..."
                    className="w-full pl-12 pr-14 py-3.5 bg-white border border-border-warm rounded-full font-manrope text-sm text-text-navy focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/10 shadow-warm-sm hover:border-accent-purple/35 transition-all duration-300"
                  />
                  
                  {/* Filter Toggle Icon (UI only for global, can toggle filters row below) */}
                  <button
                    type="button"
                    onClick={() => setShowSearchFilters(!showSearchFilters)}
                    className={`absolute right-3.5 p-2 rounded-full border cursor-pointer transition-all ${
                      showSearchFilters || filterLocation !== 'All' || filterExperience !== 'All' || filterSkill !== 'All'
                        ? 'border-accent-purple bg-accent-purple/10 text-accent-purple'
                        : 'border-border-warm bg-white text-text-muted hover:bg-border-warm/30 hover:text-text-navy'
                    }`}
                    title="Toggle filters"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Collapsible UI-only Search Filters */}
                <AnimatePresence>
                  {showSearchFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl border border-border-warm shadow-warm-md p-4 flex flex-col gap-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Candidate Location</label>
                          <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Locations</option>
                            <option value="SF / Remote">SF / Remote</option>
                            <option value="Fully Remote">Fully Remote</option>
                            <option value="New York, NY">New York, NY</option>
                            <option value="Austin, TX">Austin, TX</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Experience Range</label>
                          <select
                            value={filterExperience}
                            onChange={(e) => setFilterExperience(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Experience Ranges</option>
                            <option value="Senior">Senior level (6+ years)</option>
                            <option value="Mid">Mid level (&lt; 6 years)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Key Tech Stack</label>
                          <select
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Core Skills</option>
                            <option value="React 19">React 19</option>
                            <option value="Next.js">Next.js</option>
                            <option value="TypeScript">TypeScript</option>
                            <option value="Framer Motion">Framer Motion</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-border-warm/40 pt-3 text-[10px] text-text-muted">
                        <span>Filters will apply to the AI Ranking screen upon searching.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterLocation('All');
                            setFilterExperience('All');
                            setFilterSkill('All');
                            setGlobalSearchQuery('');
                          }}
                          className="font-bold text-accent-purple hover:underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* 3. HEADER ROW & PRIMARY ACTION */}
              <div className="flex items-center justify-between border-b border-border-warm/30 pb-3">
                <div className="flex flex-col">
                  <h2 className="font-sora font-extrabold text-lg text-text-navy">
                    New Hiring
                  </h2>
                  <p className="text-xs text-text-muted">
                    Your active job mandates mapped to TalentSphere candidate profiles.
                  </p>
                </div>
                
                <Button 
                  variant="primary" 
                  onClick={() => { resetJobForm(); setActiveView('post-job'); }}
                  className="px-4 py-2 text-xs font-bold shadow-warm-sm bg-brand-gradient hover:scale-[1.01]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Post a new job
                </Button>
              </div>

              {/* 4. JOB CARDS GRID (or EMPTY STATE) */}
              {jobs.length === 0 ? (
                
                /* ==================== EMPTY STATE ==================== */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 px-6 bg-white border-2 border-dashed border-border-warm rounded-3xl text-center max-w-2xl mx-auto w-full flex flex-col items-center gap-4 shadow-warm-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-accent-purple border border-accent-purple/15">
                    <Building className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-sora font-bold text-text-navy">You haven't posted a job yet</h3>
                    <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                      Post your first opening and let our secure AI matchmaker scout, score, and queue pre-vetted tech talent.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <Button 
                      variant="primary" 
                      onClick={() => { resetJobForm(); setActiveView('post-job'); }}
                      className="px-6 py-2.5 text-xs font-bold bg-brand-gradient shadow-warm-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Post your first job opening
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={handleRestoreDefaultJobs}
                      className="px-4 py-2.5 text-xs font-bold border-border-warm text-text-muted hover:text-text-navy"
                    >
                      Restore Demo Jobs
                    </Button>
                  </div>
                </motion.div>

              ) : (

                /* ==================== ACTIVE LISTINGS GRID ==================== */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="bg-white border border-border-warm hover:border-accent-purple/35 hover:shadow-warm-md transition-all duration-300 p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Title, Posted Date, Status Badge */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-sora font-extrabold text-base sm:text-lg text-text-navy leading-snug">
                              {job.title}
                            </h3>
                            <span className="font-manrope text-xs text-text-muted block mt-0.5">
                              {job.postedDate}
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <Badge 
                            text={job.status} 
                            variant={job.status === 'Active' ? 'green' : 'muted'} 
                            className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5"
                          />
                        </div>

                        {/* Salary and Location Details bar */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-text-muted mb-4 border-b border-border-warm/30 pb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-accent-purple" />
                            {job.location}
                          </span>
                          <span className="text-text-navy font-bold">{job.salary}</span>
                        </div>

                        {/* Job Description Snapshot */}
                        <p className="font-manrope text-xs text-text-muted leading-relaxed line-clamp-2 mb-5">
                          {job.description}
                        </p>

                        {/* APPLICANT COUNT ROW - HIGHLIGHTED PROMINENTLY */}
                        <div className="flex items-center justify-between gap-4 bg-purple-50/30 border border-accent-purple/5 p-3 rounded-2xl mb-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Total Applicants</span>
                              <span className="text-sm font-extrabold text-text-navy font-sora">
                                {job.applicantsCount} applicants
                              </span>
                            </div>
                          </div>

                          {/* Stacked circular Avatar list of top ranks */}
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-2">
                              {job.topCandidates.slice(0, 4).map((cand, idx) => (
                                <div key={idx} className="relative ring-2 ring-white rounded-full overflow-hidden">
                                  <Avatar 
                                    src={cand.avatarUrl} 
                                    alt={cand.name} 
                                    size="sm" 
                                    className="w-7 h-7"
                                  />
                                </div>
                              ))}
                            </div>
                            
                            {/* Overflow Indicator (+19 pattern) */}
                            {job.applicantsCount > 4 && (
                              <span className="text-[10px] font-extrabold text-text-navy bg-border-warm/60 px-2 py-0.5 rounded-full font-sora border border-white">
                                +{job.applicantsCount - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Primary action / Secondary action */}
                      <div className="flex items-center justify-between gap-4 mt-2">
                        {/* Edit job - Secondary Link */}
                        <button
                          onClick={() => triggerToast(`Edit Job details modal for "${job.title}" (Placeholder)`)}
                          className="text-xs font-semibold text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
                        >
                          Edit job
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Trash button helper */}
                          <button
                            onClick={(e) => handleDeleteJob(job.id, e)}
                            className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-border-warm/40 bg-white"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* View ranked candidates button */}
                          <Button
                            variant="primary"
                            onClick={() => handleViewRankedCandidates(job)}
                            className="py-2 px-4 text-xs font-bold bg-accent-purple shadow-warm-sm hover:scale-[1.01]"
                          >
                            View ranked candidates
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                    </Card>
                  ))}
                </div>
              )}

            </motion.div>

          ) : activeView === 'post-job' ? (

            /* ==================== SCREEN C: POST JOB SCREEN ==================== */
            <motion.div
              key="recruiter-post-job"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl w-full mx-auto flex flex-col gap-8 pb-16"
            >
              {/* Back button and title header */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-navy self-start transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Recruiter Home
                </button>
                <div className="mt-2">
                  <h1 className="font-sora font-extrabold text-2xl sm:text-3xl text-text-navy tracking-tight">
                    Post a new job
                  </h1>
                  <p className="font-manrope text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                    Write it naturally — our AI reads between the lines to understand what you actually need.
                  </p>
                </div>
              </div>

              {/* Form Card or Success Animation */}
              {showSuccessAnimation ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-border-warm rounded-3xl p-8 text-center shadow-warm-lg flex flex-col items-center gap-5 py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-warm-sm">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h2 className="font-sora font-bold text-lg sm:text-xl text-text-navy">
                      {successAnimationType === 'post' ? 'Job Posted Successfully!' : 'Draft Saved Successfully!'}
                    </h2>
                    <p className="font-manrope text-xs sm:text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
                      {successAnimationType === 'post' 
                        ? 'Your hiring mandate is live! Our AI matching engine is scanning the tech talent pool for your next perfect fit.' 
                        : 'Your progress has been preserved as a draft. You can access and publish it anytime from your dashboard.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-accent-purple bg-accent-purple/5 px-3.5 py-1.5 rounded-full animate-pulse mt-1">
                    <Sparkles className="w-4 h-4" />
                    Analyzing & mapping candidates...
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <Card className="flex flex-col gap-6 p-6 sm:p-8 shadow-warm-md" id="post-job-form-card">
                    {/* Job Title and Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Job Title <span className="text-accent-orange">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Senior Frontend Engineer"
                          value={jobForm.title}
                          onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Department / Team <span className="text-text-muted font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Core Product, Growth"
                          value={jobForm.department}
                          onChange={(e) => setJobForm(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                        />
                      </div>
                    </div>

                    {/* Employment Type Pill Select */}
                    <div className="flex flex-col gap-2">
                      <label className="font-manrope text-xs font-bold text-text-navy">
                        Employment Type <span className="text-accent-orange">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Full-time', 'Part-time', 'Contract', 'Internship'].map((type) => {
                          const isSelected = jobForm.employmentType === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => setJobForm(prev => ({ ...prev, employmentType: type }))}
                              className={`px-4 py-2 rounded-full text-xs font-manrope font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-accent-purple text-white border-accent-purple shadow-warm-sm'
                                  : 'bg-surface border-border-warm text-text-muted hover:text-text-navy hover:bg-border-warm/20'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Location Field & Pill Select */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Location <span className="text-accent-orange">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. San Francisco, CA"
                          value={jobForm.location}
                          onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Workplace Arrangement <span className="text-accent-orange">*</span>
                        </label>
                        <div className="flex gap-2 h-full items-center">
                          {['Remote', 'Hybrid', 'On-site'].map((type) => {
                            const isSelected = jobForm.locationType === type;
                            return (
                              <button
                                type="button"
                                key={type}
                                onClick={() => setJobForm(prev => ({ ...prev, locationType: type }))}
                                className={`flex-1 py-2 rounded-full text-xs font-manrope font-bold transition-all border cursor-pointer text-center ${
                                  isSelected
                                    ? 'bg-accent-purple text-white border-accent-purple shadow-warm-sm'
                                    : 'bg-surface border-border-warm text-text-muted hover:text-text-navy hover:bg-border-warm/20'
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Experience Level Required Pill Select */}
                    <div className="flex flex-col gap-2">
                      <label className="font-manrope text-xs font-bold text-text-navy">
                        Experience Level required <span className="text-accent-orange">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Entry', 'Mid', 'Senior', 'Lead'].map((level) => {
                          const isSelected = jobForm.experienceLevel === level;
                          return (
                            <button
                              type="button"
                              key={level}
                              onClick={() => setJobForm(prev => ({ ...prev, experienceLevel: level }))}
                              className={`px-4 py-2 rounded-full text-xs font-manrope font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-accent-purple text-white border-accent-purple shadow-warm-sm'
                                  : 'bg-surface border-border-warm text-text-muted hover:text-text-navy hover:bg-border-warm/20'
                              }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Job Description TextArea */}
                    <div className="flex flex-col gap-1.5 bg-purple-50/10 border border-purple-100/30 p-4 sm:p-5 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <label className="font-manrope text-xs font-bold text-text-navy flex items-center gap-1">
                          Job Description <span className="text-accent-orange">*</span>
                          <span className="text-[10px] font-semibold text-accent-purple bg-accent-purple/5 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> AI Enabled
                          </span>
                        </label>
                        <span className="text-[10px] text-text-muted font-mono">{jobForm.description.length} chars</span>
                      </div>
                      <textarea
                        required
                        rows={10}
                        placeholder="Describe the role, responsibilities, and what success looks like. Write naturally — mention team context, must-haves, and nice-to-haves in your own words."
                        value={jobForm.description}
                        onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-3 bg-white border border-border-warm rounded-xl font-manrope text-xs sm:text-sm focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all leading-relaxed shadow-inner"
                      />
                      <p className="text-[10px] sm:text-xs text-text-muted italic leading-relaxed mt-1">
                        Give this description most of your details. Our semantic parser reads tone, context, and implied tooling to score incoming pre-vetted engineers.
                      </p>
                    </div>

                    {/* Salary Range with internal-only public toggle */}
                    <div className="border-t border-border-warm/30 pt-4 flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Salary Range <span className="text-text-muted font-normal">(Optional)</span>
                        </label>

                        {/* Don't display publicly toggle */}
                        <button
                          type="button"
                          onClick={() => setJobForm(prev => ({ ...prev, salaryPublic: !prev.salaryPublic }))}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-text-navy hover:text-accent-purple transition-colors cursor-pointer self-start sm:self-auto bg-surface px-2.5 py-1 rounded-full border border-border-warm/60"
                        >
                          {jobForm.salaryPublic ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Displaying Publicly
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-text-muted">
                              <Lock className="w-3.5 h-3.5 text-text-muted" /> Internal-only (Private)
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <DollarSign className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            placeholder="Min"
                            value={jobForm.salaryMin}
                            onChange={(e) => setJobForm(prev => ({ ...prev, salaryMin: e.target.value }))}
                            className="w-full pl-7 pr-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                          />
                        </div>
                        <span className="text-text-muted text-xs font-bold font-mono">to</span>
                        <div className="relative flex-1">
                          <DollarSign className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            placeholder="Max"
                            value={jobForm.salaryMax}
                            onChange={(e) => setJobForm(prev => ({ ...prev, salaryMax: e.target.value }))}
                            className="w-full pl-7 pr-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Required Skills Tag Input */}
                    <div className="border-t border-border-warm/30 pt-4 flex flex-col gap-2.5">
                      <div>
                        <label className="font-manrope text-xs font-bold text-text-navy">
                          Required Skills <span className="text-text-muted font-normal">(Optional but encouraged)</span>
                        </label>
                        <p className="font-manrope text-text-muted text-[10px] sm:text-xs mt-0.5">
                          Optional — our AI extracts skills from your description too, but you can add ones it might miss. Type and press <kbd className="bg-border-warm/50 px-1 py-0.5 rounded font-mono text-[9px] font-bold">Enter</kbd> or <kbd className="bg-border-warm/50 px-1 py-0.5 rounded font-mono text-[9px] font-bold">,</kbd>.
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="e.g. Next.js, Rust, Docker, Kubernetes"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddRequiredSkill}
                        className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-colors"
                      />

                      {/* Skills Tags List */}
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {jobForm.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-manrope font-semibold bg-accent-purple/10 text-accent-purple border border-accent-purple/25 shadow-warm-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveRequiredSkill(skill)}
                              className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-accent-purple/20 hover:text-accent-purple transition-all font-bold text-[9px] cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* AI PARSE PREVIEW COMPONENT OR TRIGGER */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-navy flex items-center gap-1 uppercase tracking-wider font-sora">
                          <Sparkles className="w-3.5 h-3.5 text-accent-purple animate-pulse" /> AI Evaluation Sandbox
                        </span>
                        <span className="text-[10px] text-text-muted">Simulate our semantic engine analysis on your current draft.</span>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={runMockAiParse}
                        disabled={isAnalyzing || !jobForm.title || !jobForm.description}
                        className="px-3.5 py-1.5 text-xs font-bold border-accent-purple/40 text-accent-purple hover:bg-purple-50/50 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Analyzing Draft...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Shimmer skeleton loading state */}
                    {isAnalyzing && (
                      <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-warm-sm animate-pulse flex flex-col gap-4">
                        <div className="h-4 bg-border-warm/50 rounded-full w-2/5"></div>
                        <div className="space-y-2.5">
                          <div className="h-3 bg-border-warm/40 rounded-full w-full"></div>
                          <div className="h-3 bg-border-warm/40 rounded-full w-5/6"></div>
                          <div className="h-3 bg-border-warm/40 rounded-full w-4/5"></div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <div className="h-6 bg-border-warm/40 rounded-full w-20"></div>
                          <div className="h-6 bg-border-warm/40 rounded-full w-28"></div>
                        </div>
                      </div>
                    )}

                    {/* Results Card styled distinctly (soft gradient-tinted border / FloatingInfoCard style) */}
                    {jobForm.aiParsedRequirements && !isAnalyzing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 sm:p-6 bg-gradient-to-br from-purple-50/40 via-orange-50/20 to-white border border-accent-purple/30 rounded-2xl shadow-warm-md flex flex-col gap-4.5 relative overflow-hidden"
                      >
                        {/* Elegant background tint details */}
                        <div className="absolute right-0 top-0 w-24 h-24 bg-accent-purple/5 rounded-full blur-xl pointer-events-none" />
                        <div className="absolute left-10 bottom-0 w-20 h-20 bg-accent-orange/5 rounded-full blur-xl pointer-events-none" />

                        <div className="flex items-center justify-between border-b border-border-warm/30 pb-2">
                          <span className="text-xs font-extrabold text-text-navy font-sora tracking-tight flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" />
                            Here's what we understood:
                          </span>
                          <span className="text-[10px] text-text-muted font-manrope italic">
                            Adjust anything below if incorrect.
                          </span>
                        </div>

                        {/* Badges row: Seniority + Team context */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-purple bg-accent-purple/10 px-2.5 py-1 rounded-full border border-accent-purple/15">
                            {jobForm.aiParsedRequirements.impliedSeniority}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8a5200] bg-[#fff8e1] px-2.5 py-1 rounded-full border border-[#ffe082]/30">
                            {jobForm.aiParsedRequirements.impliedContext}
                          </span>
                        </div>

                        {/* Stacks Grid: Hard vs Soft */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                          {/* Hard requirements list */}
                          <div className="flex flex-col gap-2.5 bg-white/70 backdrop-blur-sm border border-border-warm/60 p-3.5 rounded-xl font-manrope">
                            <span className="text-[10px] font-bold text-text-navy uppercase tracking-wider flex items-center justify-between border-b border-border-warm/20 pb-1 font-sora">
                              Hard requirements
                              <span className="text-[9px] font-medium text-text-muted italic lowercase">Hover items to edit</span>
                            </span>
                            <div className="space-y-1.5">
                              {jobForm.aiParsedRequirements.hardRequirements.map((item, idx) => (
                                <div key={`hard-${idx}`} className="flex items-center justify-between group py-1 border-b border-border-warm/10">
                                  {editingHardIndex === idx ? (
                                    <div className="flex items-center gap-2 flex-grow">
                                      <input
                                        type="text"
                                        value={editingHardValue}
                                        onChange={(e) => setEditingHardValue(e.target.value)}
                                        className="flex-grow px-2 py-1 border border-accent-purple/30 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-purple font-manrope font-semibold"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const updated = [...jobForm.aiParsedRequirements!.hardRequirements];
                                            updated[idx] = editingHardValue;
                                            setJobForm(prev => ({
                                              ...prev,
                                              aiParsedRequirements: {
                                                ...prev.aiParsedRequirements!,
                                                hardRequirements: updated
                                              }
                                            }));
                                            setEditingHardIndex(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...jobForm.aiParsedRequirements!.hardRequirements];
                                          updated[idx] = editingHardValue;
                                          setJobForm(prev => ({
                                            ...prev,
                                            aiParsedRequirements: {
                                              ...prev.aiParsedRequirements!,
                                              hardRequirements: updated
                                            }
                                          }));
                                          setEditingHardIndex(null);
                                        }}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingHardIndex(null)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start gap-2 flex-grow">
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-[11px] text-text-navy font-manrope font-medium leading-relaxed">{item}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingHardIndex(idx);
                                            setEditingHardValue(item);
                                          }}
                                          className="text-[9px] text-accent-purple hover:underline font-bold"
                                        >
                                          Not quite right?
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = jobForm.aiParsedRequirements!.hardRequirements.filter((_, i) => i !== idx);
                                            setJobForm(prev => ({
                                              ...prev,
                                              aiParsedRequirements: {
                                                ...prev.aiParsedRequirements!,
                                                hardRequirements: updated
                                              }
                                            }));
                                          }}
                                          className="p-0.5 text-red-400 hover:text-red-600 transition"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                              
                              {/* Add extra hard requirement trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...jobForm.aiParsedRequirements!.hardRequirements, 'New Requirement'];
                                  setJobForm(prev => ({
                                    ...prev,
                                    aiParsedRequirements: {
                                      ...prev.aiParsedRequirements!,
                                      hardRequirements: updated
                                    }
                                  }));
                                  setEditingHardIndex(updated.length - 1);
                                  setEditingHardValue('New Requirement');
                                }}
                                className="text-[10px] text-accent-purple hover:text-accent-purple/80 font-bold flex items-center gap-0.5 mt-2 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 animate-pulse" /> Add item
                              </button>
                            </div>
                          </div>

                          {/* Soft requirements list */}
                          <div className="flex flex-col gap-2.5 bg-white/70 backdrop-blur-sm border border-border-warm/60 p-3.5 rounded-xl font-manrope">
                            <span className="text-[10px] font-bold text-text-navy uppercase tracking-wider flex items-center justify-between border-b border-border-warm/20 pb-1 font-sora">
                              Soft & Nice-To-Haves
                              <span className="text-[9px] font-medium text-text-muted italic lowercase">Hover items to edit</span>
                            </span>
                            <div className="space-y-1.5">
                              {jobForm.aiParsedRequirements.softRequirements.map((item, idx) => (
                                <div key={`soft-${idx}`} className="flex items-center justify-between group py-1 border-b border-border-warm/10">
                                  {editingSoftIndex === idx ? (
                                    <div className="flex items-center gap-2 flex-grow">
                                      <input
                                        type="text"
                                        value={editingSoftValue}
                                        onChange={(e) => setEditingSoftValue(e.target.value)}
                                        className="flex-grow px-2 py-1 border border-accent-purple/30 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-accent-purple font-manrope font-semibold"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const updated = [...jobForm.aiParsedRequirements!.softRequirements];
                                            updated[idx] = editingSoftValue;
                                            setJobForm(prev => ({
                                              ...prev,
                                              aiParsedRequirements: {
                                                ...prev.aiParsedRequirements!,
                                                softRequirements: updated
                                              }
                                            }));
                                            setEditingSoftIndex(null);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...jobForm.aiParsedRequirements!.softRequirements];
                                          updated[idx] = editingSoftValue;
                                          setJobForm(prev => ({
                                            ...prev,
                                            aiParsedRequirements: {
                                              ...prev.aiParsedRequirements!,
                                              softRequirements: updated
                                            }
                                          }));
                                          setEditingSoftIndex(null);
                                        }}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingSoftIndex(null)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start gap-2 flex-grow">
                                        <Star className="w-3.5 h-3.5 text-[#ffb300] fill-[#ffb300] shrink-0 mt-0.5" />
                                        <span className="text-[11px] text-text-navy font-manrope font-medium leading-relaxed">{item}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingSoftIndex(idx);
                                            setEditingSoftValue(item);
                                          }}
                                          className="text-[9px] text-accent-purple hover:underline font-bold"
                                        >
                                          Not quite right?
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = jobForm.aiParsedRequirements!.softRequirements.filter((_, i) => i !== idx);
                                            setJobForm(prev => ({
                                              ...prev,
                                              aiParsedRequirements: {
                                                ...prev.aiParsedRequirements!,
                                                softRequirements: updated
                                              }
                                            }));
                                          }}
                                          className="p-0.5 text-red-400 hover:text-red-600 transition"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}

                              {/* Add extra soft requirement trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...jobForm.aiParsedRequirements!.softRequirements, 'New Preference'];
                                  setJobForm(prev => ({
                                    ...prev,
                                    aiParsedRequirements: {
                                      ...prev.aiParsedRequirements!,
                                      softRequirements: updated
                                    }
                                  }));
                                  setEditingSoftIndex(updated.length - 1);
                                  setEditingSoftValue('New Preference');
                                }}
                                className="text-[10px] text-accent-purple hover:text-accent-purple/80 font-bold flex items-center gap-0.5 mt-2 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5 animate-pulse" /> Add item
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* BOTTOM ACTIONS */}
                  <div className="flex items-center justify-between gap-4 border-t border-border-warm/30 pt-6">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // Save as draft - requires minimal fields, status set to Draft
                        setSuccessAnimationType('draft');
                        setShowSuccessAnimation(true);
                        
                        setTimeout(() => {
                          const formattedSalary = jobForm.salaryMin || jobForm.salaryMax 
                            ? `$${jobForm.salaryMin ? Number(jobForm.salaryMin).toLocaleString() : '0'} - $${jobForm.salaryMax ? Number(jobForm.salaryMax).toLocaleString() : 'Negotiable'}`
                            : 'Negotiable';

                          const newJob: RecruiterJob = {
                            id: `rec-job-${Date.now()}`,
                            title: jobForm.title || 'Untitled Draft Job',
                            postedDate: 'Just now',
                            status: 'Closed', // Draft status
                            applicantsCount: 0,
                            tags: jobForm.requiredSkills.length > 0 ? jobForm.requiredSkills : ['Draft'],
                            description: jobForm.description || 'Draft description.',
                            salary: formattedSalary,
                            location: `${jobForm.location || 'Anywhere'} (${jobForm.locationType})`,
                            experienceLevel: jobForm.experienceLevel,
                            jobType: jobForm.employmentType,
                            topCandidates: [CANDIDATES_POOL[1], CANDIDATES_POOL[2]]
                          };
                          
                          setJobs(prev => [newJob, ...prev]);
                          setShowSuccessAnimation(false);
                          setActiveView('home');
                          triggerToast("Draft saved successfully");
                        }, 2500);
                      }}
                      className="px-5 py-2.5 text-xs font-bold border-border-warm text-text-muted hover:text-text-navy cursor-pointer"
                    >
                      Save as draft
                    </Button>

                    <Button
                      variant="primary"
                      disabled={!jobForm.title || !jobForm.employmentType || !jobForm.location || !jobForm.experienceLevel || !jobForm.description}
                      onClick={() => {
                        // Post job
                        setSuccessAnimationType('post');
                        setShowSuccessAnimation(true);
                        
                        setTimeout(() => {
                          const formattedSalary = jobForm.salaryMin || jobForm.salaryMax 
                            ? (jobForm.salaryPublic 
                                ? `$${jobForm.salaryMin ? Number(jobForm.salaryMin).toLocaleString() : '0'} - $${jobForm.salaryMax ? Number(jobForm.salaryMax).toLocaleString() : 'Negotiable'}`
                                : 'Not displayed publicly')
                            : 'Negotiable';

                          const tagsList = jobForm.requiredSkills.length > 0 
                            ? jobForm.requiredSkills 
                            : (jobForm.aiParsedRequirements ? jobForm.aiParsedRequirements.hardRequirements.slice(0, 3) : ['Full-Stack']);

                          const matchedCandidates = CANDIDATES_POOL.filter(cand => 
                            cand.skills.some(sk => tagsList.includes(sk))
                          );
                          const finalMatches = matchedCandidates.length > 0 
                            ? matchedCandidates 
                            : [CANDIDATES_POOL[0], CANDIDATES_POOL[1]];

                          const newJob: RecruiterJob = {
                            id: `rec-job-${Date.now()}`,
                            title: jobForm.title,
                            postedDate: 'Just now',
                            status: 'Active',
                            applicantsCount: 0,
                            tags: tagsList,
                            description: jobForm.description,
                            salary: formattedSalary,
                            location: `${jobForm.location} (${jobForm.locationType})`,
                            experienceLevel: jobForm.experienceLevel,
                            jobType: jobForm.employmentType,
                            topCandidates: finalMatches
                          };

                          setJobs(prev => [newJob, ...prev]);
                          setShowSuccessAnimation(false);
                          setActiveView('home');
                          triggerToast("Job posting is now live");
                        }, 2500);
                      }}
                      className="px-6 py-2.5 text-xs font-bold bg-brand-gradient shadow-warm-sm cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Post job
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

          ) : (

            /* ==================== SCREEN B: AI RANKING SCREEN ==================== */
            <motion.div
              key="recruiter-ranking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* TOP — APP SHELL: BACK ROW */}
              <div className="flex items-center justify-between border-b border-border-warm/30 pb-3">
                <button
                  onClick={() => {
                    setActiveView('home');
                    setActiveTab('home');
                  }}
                  className="flex items-center gap-2 text-xs font-extrabold text-text-muted hover:text-accent-purple transition-all cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span>Back to</span>
                  <span className="font-sora text-text-navy group-hover:text-accent-purple font-extrabold">
                    {activeRankingJob.title}
                  </span>
                </button>
                <div className="text-[10px] font-mono font-bold text-text-muted bg-border-warm/20 px-2 py-0.5 rounded-full">
                  Job ID: {activeRankingJob.id}
                </div>
              </div>

              {/* HEADER AREA */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight leading-tight">
                    {activeRankingJob.title}
                  </h1>
                  <p className="font-manrope text-sm text-text-muted mt-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent-purple fill-accent-purple/10" />
                    <span>{sortedRankingCandidates.length} candidates ranked by AI fit</span>
                    <span className="text-border-warm">•</span>
                    <span>{activeRankingJob.applicantsCount} total applicants</span>
                  </p>
                </div>

                {/* Card View vs. List View Toggle Switcher */}
                <div className="flex items-center bg-border-warm/30 p-1 rounded-xl self-start md:self-auto shadow-inner">
                  <button
                    onClick={() => {
                      setLayoutMode('card');
                      triggerToast("Switched to Card Grid view");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutMode === 'card'
                        ? 'bg-white text-text-navy shadow-warm-sm'
                        : 'text-text-muted hover:text-text-navy'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Card view</span>
                  </button>
                  <button
                    onClick={() => {
                      setLayoutMode('list');
                      triggerToast("Switched to dense List view");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutMode === 'list'
                        ? 'bg-white text-text-navy shadow-warm-sm'
                        : 'text-text-muted hover:text-text-navy'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List view</span>
                  </button>
                </div>
              </div>

              {/* SEARCH BAR (Filters current job candidates only) */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search candidates by name or skill in this job..."
                  value={rankingSearchQuery}
                  onChange={(e) => {
                    setRankingSearchQuery(e.target.value);
                    setCurrentPage(1); // reset pagination
                  }}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-border-warm rounded-2xl font-manrope text-sm text-text-navy focus:outline-none focus:ring-2 focus:ring-accent-purple/10 focus:border-accent-purple shadow-warm-sm hover:border-accent-purple/20 transition-all"
                />
                {rankingSearchQuery && (
                  <button
                    onClick={() => {
                      setRankingSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-navy"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* FILTER PANEL */}
              <div className="flex flex-col gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-accent-purple" />
                    <span className="text-xs font-bold font-sora text-text-navy uppercase tracking-wider">
                      Search Filters
                    </span>
                    {isRankingFilterActive && (
                      <span className="bg-accent-purple text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-warm-sm animate-pulse">
                        {activeRankingFilterCount} active
                      </span>
                    )}
                  </div>

                  {isRankingFilterActive && (
                    <button
                      onClick={handleClearRankingFilters}
                      className="text-xs font-extrabold text-accent-purple hover:text-accent-purple/80 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear filters</span>
                    </button>
                  )}
                </div>

                {/* Inline filter selects and pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {/* Experience Range Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-navy font-mono uppercase tracking-wider">Experience Level</label>
                    <div className="relative">
                      <select
                        value={rankingExperienceRange}
                        onChange={(e) => {
                          setRankingExperienceRange(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-surface border border-border-warm rounded-xl px-3 py-2 text-xs text-text-navy font-semibold pr-8 appearance-none focus:outline-none focus:border-accent-purple transition"
                      >
                        <option value="All">All Experience Levels</option>
                        <option value="0-2">Junior (0-2 yrs)</option>
                        <option value="3-5">Mid-level (3-5 yrs)</option>
                        <option value="5-10">Senior (5-10 yrs)</option>
                        <option value="10+">Principal / Lead (10+ yrs)</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Minimum Match Score Pills */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-navy font-mono uppercase tracking-wider">Min Match Score</label>
                    <div className="flex gap-1">
                      {([0, 70, 85, 95] as const).map((score) => (
                        <button
                          key={score}
                          onClick={() => {
                            setRankingMinMatchScore(score);
                            setCurrentPage(1);
                          }}
                          className={`flex-1 py-2 text-[10px] font-extrabold font-mono rounded-xl border transition-all cursor-pointer ${
                            rankingMinMatchScore === score
                              ? 'bg-accent-purple border-accent-purple text-white shadow-warm-sm'
                              : 'bg-surface border-border-warm text-text-muted hover:border-accent-purple/40 hover:text-text-navy'
                          }`}
                        >
                          {score === 0 ? 'Any' : `${score}%+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verification Status Pill Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-navy font-mono uppercase tracking-wider">Identity Verification</label>
                    <div className="flex rounded-xl bg-surface p-0.5 border border-border-warm">
                      <button
                        onClick={() => {
                          setRankingVerificationOnly(false);
                          setCurrentPage(1);
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                          !rankingVerificationOnly
                            ? 'bg-white text-text-navy shadow-warm-sm'
                            : 'text-text-muted hover:text-text-navy'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setRankingVerificationOnly(true);
                          setCurrentPage(1);
                        }}
                        className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          rankingVerificationOnly
                            ? 'bg-white text-accent-purple shadow-warm-sm'
                            : 'text-text-muted hover:text-text-navy'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Verified Only</span>
                      </button>
                    </div>
                  </div>

                  {/* Sort By Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-text-navy font-mono uppercase tracking-wider">Sort Candidates</label>
                    <div className="relative">
                      <select
                        value={rankingSortBy}
                        onChange={(e) => {
                          setRankingSortBy(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-surface border border-border-warm rounded-xl px-3 py-2 text-xs text-text-navy font-semibold pr-8 appearance-none focus:outline-none focus:border-accent-purple transition"
                      >
                        <option value="Best match">Best match (AI)</option>
                        <option value="Most experience">Most experience</option>
                        <option value="Recently active">Recently active</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CANDIDATES LISTING ROW (Vetted Candidates List or Grid) */}
              {sortedRankingCandidates.length === 0 ? (
                /* EMPTY/NO-RESULTS STATE */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 px-6 bg-white border border-dashed border-border-warm rounded-3xl text-center max-w-xl mx-auto w-full flex flex-col items-center gap-4 shadow-warm-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-accent-purple border border-accent-purple/15">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-sora font-bold text-text-navy">No candidates match these filters</h3>
                    <p className="text-xs text-text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Try resetting your experience levels, lowering the match score limit, or broadening your candidate search terms.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleClearRankingFilters}
                    className="mt-2 px-5 py-2 text-xs font-bold bg-accent-purple hover:scale-[1.01]"
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              ) : layoutMode === 'card' ? (
                /* CARD VIEW (default grid layout) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCandidates.map((cand, idx) => {
                    const isShortlisted = shortlistedNames.includes(cand.name);
                    const isPassed = passedNames.includes(cand.name);

                    return (
                      <motion.div
                        key={cand.name}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: isPassed ? 0.5 : 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.05, 0.25) }}
                        className="h-full"
                      >
                        <div
                          onClick={() => handleOpenCandidateDrawer(cand)}
                          className={`group h-full bg-white border rounded-3xl shadow-warm-sm p-5 flex flex-col justify-between hover:shadow-warm-md hover:border-accent-purple/30 transition-all duration-300 relative cursor-pointer ${
                            isShortlisted ? 'border-accent-purple ring-2 ring-accent-purple/10 bg-purple-50/5' : 'border-border-warm'
                          }`}
                        >
                          {/* Top part */}
                          <div>
                            {/* Avatar & Matching score row */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  src={cand.avatarUrl}
                                  alt={cand.name}
                                  size="md"
                                  className={`ring-2 ${
                                    isShortlisted ? 'ring-accent-purple' : 'ring-border-warm'
                                  }`}
                                />
                                <div>
                                  <div className="flex items-center gap-1">
                                    <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy tracking-tight">
                                      {cand.name}
                                    </h3>
                                    {cand.isVerified && (
                                      <span className="text-emerald-500" title="Identity and code verified">
                                        <CheckCircle2 className="w-4 h-4 fill-emerald-50 text-emerald-500" />
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-manrope text-[11px] text-text-muted mt-0.5 line-clamp-1">
                                    {cand.title}
                                  </p>
                                </div>
                              </div>

                              {/* Prominent prominent match score badge */}
                              <div className="text-right shrink-0">
                                <span className="inline-flex items-center gap-1 font-mono font-extrabold text-xs text-white bg-gradient-to-r from-accent-purple to-accent-orange px-3 py-1 rounded-full shadow-warm-sm">
                                  {cand.matchScore}% match
                                </span>
                              </div>
                            </div>

                            {/* Experience and Location bar */}
                            <div className="flex items-center gap-3 text-[11px] font-medium text-text-muted mb-3.5 bg-surface/50 border border-border-warm/30 rounded-xl px-2.5 py-1.5">
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-accent-purple" />
                                {cand.experience}
                              </span>
                              <span className="text-border-warm">|</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-accent-purple" />
                                {cand.location}
                              </span>
                              <span className="text-border-warm">|</span>
                              <span className="font-bold text-text-navy">{cand.desiredSalary}</span>
                            </div>

                            {/* Pitch text / Bio snippet */}
                            <p className="font-manrope text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">
                              {cand.pitch}
                            </p>

                            {/* 3 Why Matched evidence tags */}
                            <div className="mb-5 flex flex-col gap-1.5 border-t border-border-warm/20 pt-3">
                              <span className="text-[9px] font-bold text-accent-purple uppercase tracking-wider font-mono">
                                Match Evidence:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(cand.whyMatched || cand.skills.slice(0, 3)).map((tag, tIdx) => (
                                  <Badge
                                    key={tIdx}
                                    text={tag}
                                    variant="purple"
                                    className="text-[9.5px] font-bold px-2 py-0.5 border border-accent-purple/10"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Actions Footer */}
                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-warm/35">
                            <button
                              onClick={(e) => handleTogglePass(cand.name, e)}
                              className={`flex-1 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                isPassed
                                  ? 'bg-red-50 border-red-200 text-red-600'
                                  : 'border-border-warm text-text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50/40'
                              }`}
                            >
                              <span>{isPassed ? 'Passed ✕' : 'Pass'}</span>
                            </button>

                            <button
                              onClick={(e) => handleToggleShortlist(cand.name, e)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-warm-sm flex items-center justify-center gap-1 ${
                                isShortlisted
                                  ? 'bg-success-green border border-success-green text-white'
                                  : 'bg-brand-gradient text-white hover:scale-[1.01]'
                              }`}
                            >
                              {isShortlisted ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                  <span>Shortlisted ✓</span>
                                </>
                              ) : (
                                <span>Shortlist</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* LIST VIEW (alternate denser table-like format) */
                <div className="bg-white rounded-3xl border border-border-warm shadow-warm-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border-warm/40 bg-surface/50 text-text-navy font-bold text-xs uppercase font-mono tracking-wider">
                          <th className="py-4.5 px-5">Candidate Name</th>
                          <th className="py-4.5 px-4 text-center">Match Score</th>
                          <th className="py-4.5 px-4 text-center">Experience</th>
                          <th className="py-4.5 px-4">Key Evidence / Skills</th>
                          <th className="py-4.5 px-4 text-center">Verified</th>
                          <th className="py-4.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCandidates.map((cand, idx) => {
                          const isShortlisted = shortlistedNames.includes(cand.name);
                          const isPassed = passedNames.includes(cand.name);

                          return (
                            <tr
                              key={cand.name}
                              onClick={() => handleOpenCandidateDrawer(cand)}
                              className={`border-b border-border-warm/30 hover:bg-purple-50/10 transition-colors cursor-pointer group ${
                                isShortlisted ? 'bg-purple-50/15' : ''
                              } ${isPassed ? 'opacity-50' : ''}`}
                            >
                              {/* Avatar + name */}
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={cand.avatarUrl}
                                    alt={cand.name}
                                    size="sm"
                                    className="ring-2 ring-border-warm/40"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-sora font-extrabold text-sm text-text-navy leading-none">
                                        {cand.name}
                                      </span>
                                    </div>
                                    <span className="font-manrope text-[11px] text-text-muted mt-1 block">
                                      {cand.title}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Match score */}
                              <td className="py-4 px-4 text-center">
                                <span className="inline-flex items-center font-mono font-extrabold text-xs text-white bg-gradient-to-r from-accent-purple to-accent-orange px-2.5 py-0.5 rounded-full shadow-warm-sm">
                                  {cand.matchScore}%
                                </span>
                              </td>

                              {/* Experience */}
                              <td className="py-4 px-4 text-center">
                                <span className="font-manrope text-xs font-bold text-text-navy">
                                  {cand.experience}
                                </span>
                                <span className="block text-[10px] text-text-muted mt-0.5">
                                  {cand.location}
                                </span>
                              </td>

                              {/* Key evidence tags (truncated) */}
                              <td className="py-4 px-4">
                                <div className="flex flex-wrap gap-1.5 max-w-sm">
                                  {(cand.whyMatched || cand.skills.slice(0, 3)).map((tag, tIdx) => (
                                    <Badge
                                      key={tIdx}
                                      text={tag}
                                      variant="purple"
                                      className="text-[9px] font-bold px-1.5 py-0"
                                    />
                                  ))}
                                </div>
                              </td>

                              {/* Verification icon */}
                              <td className="py-4 px-4 text-center">
                                {cand.isVerified ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 mx-auto fill-emerald-50" />
                                ) : (
                                  <span className="text-text-muted text-xs font-semibold">-</span>
                                )}
                              </td>

                              {/* Actions footer (small buttons on right) */}
                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                  {/* Pass Action */}
                                  <button
                                    onClick={(e) => handleTogglePass(cand.name, e)}
                                    className={`p-1.5 border rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition cursor-pointer ${
                                      isPassed ? 'bg-red-50 border-red-200 text-red-600' : 'border-border-warm text-text-muted'
                                    }`}
                                    title="Pass candidate"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Shortlist Action */}
                                  <button
                                    onClick={(e) => handleToggleShortlist(cand.name, e)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-warm-sm transition cursor-pointer ${
                                      isShortlisted
                                        ? 'bg-success-green text-white'
                                        : 'bg-brand-gradient text-white hover:scale-[1.01]'
                                    }`}
                                  >
                                    {isShortlisted ? 'Shortlisted ✓' : 'Shortlist'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAGINATION / LOAD MORE */}
              {hasMoreCandidates && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCurrentPage(prev => prev + 1);
                      triggerToast("Loaded additional ranked candidates");
                    }}
                    className="px-6 py-2.5 text-xs font-bold border-border-warm bg-white text-text-navy hover:bg-surface hover:shadow-warm-sm flex items-center gap-1"
                  >
                    <span>Load more candidates</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        )}

      </main>

      {/* 5. RECRUITER PITCH OUTBOX OVERLAY MODAL */}
      <AnimatePresence>
        {activePitchCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmittingPitch) setActivePitchCandidate(null);
              }}
              className="absolute inset-0 bg-text-navy/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-border-warm shadow-warm-xl p-6 sm:p-7 z-10 flex flex-col gap-4.5"
            >
              <button
                onClick={() => setActivePitchCandidate(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-border-warm/20 text-text-muted hover:text-text-navy transition cursor-pointer"
                disabled={isSubmittingPitch}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-3 pb-3 border-b border-border-warm/40">
                <Avatar src={activePitchCandidate.avatarUrl} alt={activePitchCandidate.name} size="sm" className="ring-2 ring-accent-purple/10" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy">
                      Pitch {activePitchCandidate.name}
                    </h3>
                    <Badge text="98% Match" variant="purple" className="text-[9px] px-2 py-0" />
                  </div>
                  <p className="font-manrope text-xs text-text-muted mt-0.5">
                    Anonymous Outreach for: {selectedJob ? selectedJob.title : 'Talent Pool Opportunity'}
                  </p>
                </div>
              </div>

              {!pitchSuccess ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-text-navy uppercase tracking-wider">
                      <span>Confidential Proposals Note</span>
                      <span className="text-[9px] text-accent-purple bg-purple-50 px-2 py-0.5 rounded-full font-bold">1 Credit</span>
                    </div>
                    
                    <p className="text-xs text-text-muted leading-relaxed mb-1 bg-surface border border-border-warm p-3 rounded-2xl">
                      Outreach is kept <strong>completely private</strong>. Your corporate brand is masked under confidential vectors until this pre-qualified candidate accepts.
                    </p>

                    <textarea
                      value={pitchText}
                      onChange={(e) => setPitchText(e.target.value)}
                      placeholder="Compose your customized pitch message..."
                      className="w-full px-3.5 py-3 bg-surface border border-border-warm rounded-2xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all h-32 resize-none leading-relaxed"
                      disabled={isSubmittingPitch}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-warm/40 mt-1">
                    <Button
                      variant="secondary"
                      onClick={() => setActivePitchCandidate(null)}
                      className="py-1.5 px-4 text-xs"
                      disabled={isSubmittingPitch}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSendDirectPitch}
                      className="py-1.5 px-5 text-xs font-bold bg-accent-purple shadow-warm-sm"
                      disabled={isSubmittingPitch || !pitchText.trim()}
                    >
                      {isSubmittingPitch ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending Out...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          Send Confidential Proposal
                        </span>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* Success screen */
                <div className="text-center py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center text-success-green border border-success-green/10">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-navy">Confidential Pitch Sent Successfully!</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                      {activePitchCandidate.name} has been notified anonymously. You will be alerted the second they agree to unlock full profile credentials.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SLIDE-IN CANDIDATE DRAWER & RAG CHAT */}
      <AnimatePresence>
        {selectedCandidateForDrawer && (() => {
          const cand = selectedCandidateForDrawer;
          const isShortlisted = shortlistedNames.includes(cand.name);
          const isPassed = passedNames.includes(cand.name);
          
          // Get deep mock detail data
          const details = getCandidateDetails(cand.name, cand.title, cand.experience, cand.location);

          // Find current sorted list index to construct Prev / Next triggers
          const currentIndex = sortedRankingCandidates.findIndex(c => c.name === cand.name);
          const prevCand = currentIndex > 0 ? sortedRankingCandidates[currentIndex - 1] : null;
          const nextCand = currentIndex < sortedRankingCandidates.length - 1 ? sortedRankingCandidates[currentIndex + 1] : null;

          return (
            <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
              {/* Dimmed Background Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCandidateForDrawer(null)}
                className="absolute inset-0 bg-text-navy/40 backdrop-blur-xs cursor-pointer"
              />

              {/* Slider Panel Container */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="relative w-full md:w-[72%] lg:w-[68%] xl:w-[64%] h-full bg-page-gradient shadow-warm-xl flex flex-col z-10 border-l border-border-warm"
              >
                {/* DRAWER HEADER BAR */}
                <div className="flex items-center justify-between border-b border-border-warm/40 bg-white px-5 sm:px-6 py-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCandidateForDrawer(null)}
                      className="p-2 rounded-xl hover:bg-border-warm/20 text-text-muted hover:text-text-navy transition cursor-pointer"
                      title="Close Details"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-accent-purple font-mono tracking-wider block">Candidate Intelligence Vetting</span>
                      <h2 className="font-sora text-sm sm:text-base font-extrabold text-text-navy">
                        Profile overview of {cand.name}
                      </h2>
                    </div>
                  </div>

                  {/* Navigation Arrows & Action Trigger Row */}
                  <div className="flex items-center gap-2">
                    {/* Previous Candidate */}
                    <button
                      onClick={() => {
                        if (prevCand) {
                          handleOpenCandidateDrawer(prevCand);
                        }
                      }}
                      disabled={!prevCand}
                      className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                        prevCand
                          ? 'border-border-warm bg-white text-text-navy hover:bg-surface hover:shadow-warm-sm'
                          : 'border-border-warm/35 bg-white/40 text-text-muted/40 cursor-not-allowed'
                      }`}
                      title={prevCand ? `Previous: ${prevCand.name}` : "No previous candidates"}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {/* Next Candidate */}
                    <button
                      onClick={() => {
                        if (nextCand) {
                          handleOpenCandidateDrawer(nextCand);
                        }
                      }}
                      disabled={!nextCand}
                      className={`p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition cursor-pointer ${
                        nextCand
                          ? 'border-border-warm bg-white text-text-navy hover:bg-surface hover:shadow-warm-sm'
                          : 'border-border-warm/35 bg-white/40 text-text-muted/40 cursor-not-allowed'
                      }`}
                      title={nextCand ? `Next: ${nextCand.name}` : "No more candidates"}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="hidden sm:inline">Next</span>
                    </button>
                  </div>
                </div>

                {/* DRAWER CONTENT LAYOUT */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  
                  {/* LEFT SIDE: FULL CANDIDATE PROFILE (Scrollable independently) */}
                  <div className="flex-1 md:w-[55%] overflow-y-auto custom-scrollbar p-5 sm:p-6 flex flex-col gap-6 bg-white/40 border-r border-border-warm/20">
                    
                    {/* HEADER BLOCK Card */}
                    <div className="bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar src={cand.avatarUrl} alt={cand.name} size="lg" className="ring-4 ring-accent-purple/10" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h1 className="font-sora text-lg sm:text-xl font-extrabold text-text-navy leading-none">
                                {cand.name}
                              </h1>
                              {cand.isVerified && (
                                <span className="text-emerald-500 flex items-center" title="Identity & portfolio verified">
                                  <CheckCircle2 className="w-5 h-5 fill-emerald-50 text-emerald-500" />
                                </span>
                              )}
                            </div>
                            <p className="font-manrope text-xs text-accent-purple font-extrabold mt-1">
                              {cand.title}
                            </p>
                            <p className="font-manrope text-[11px] text-text-muted mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-accent-purple" />
                              <span>{cand.location}</span>
                              <span className="text-border-warm">•</span>
                              <span>Desired: {cand.desiredSalary}</span>
                            </p>
                          </div>
                        </div>

                        {/* Match score Badge */}
                        <div className="bg-brand-gradient p-0.5 rounded-full shadow-warm-md shrink-0">
                          <div className="bg-white px-3.5 py-1.5 rounded-full text-center">
                            <span className="text-[10px] uppercase font-extrabold font-mono text-text-muted block leading-none">AI Score</span>
                            <span className="text-lg font-extrabold bg-gradient-to-r from-accent-purple to-accent-orange bg-clip-text text-transparent font-sora">
                              {cand.matchScore}% Fit
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio Pitch */}
                      <div className="bg-surface/50 p-3.5 rounded-xl border border-border-warm/40 text-xs sm:text-sm text-text-muted font-manrope leading-relaxed">
                        <span className="font-extrabold text-[10px] text-accent-purple uppercase block tracking-wider mb-1">Introduction Pitch</span>
                        "{cand.pitch}"
                      </div>
                    </div>

                    {/* WHY THIS MATCH SECTION */}
                    <div className="flex flex-col gap-2 bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-accent-purple fill-accent-purple/10" />
                        <span>Why this candidate matched</span>
                      </h3>
                      <div className="flex flex-col gap-2.5 mt-2">
                        {details.whyMatchedExpanded.map((evidence, eIdx) => (
                          <div key={eIdx} className="flex items-start gap-2 text-xs sm:text-sm font-manrope text-text-muted leading-relaxed">
                            <span className="text-emerald-500 shrink-0 font-extrabold mt-0.5">✓</span>
                            <span>{evidence}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SKILLS SECTION */}
                    <div className="flex flex-col gap-2.5 bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider">
                        Verified Technical Capabilities
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {cand.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="text-xs font-semibold bg-accent-purple/5 text-accent-purple border border-accent-purple/10 px-3 py-1 rounded-full font-manrope"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* EXPERIENCE SECTION */}
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-accent-purple" />
                        <span>Work History</span>
                      </h3>
                      <div className="flex flex-col gap-4 mt-1">
                        {details.experience.map((exp, expIdx) => (
                          <div
                            key={expIdx}
                            className={`flex flex-col gap-1.5 ${
                              expIdx < details.experience.length - 1 ? 'border-b border-border-warm/30 pb-4' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy">
                                  {exp.role}
                                </h4>
                                <span className="text-[11px] font-bold text-accent-purple font-manrope">
                                  {exp.company}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-text-muted bg-border-warm/20 px-2 py-0.5 rounded-full shrink-0">
                                {exp.dates}
                              </span>
                            </div>
                            <p className="font-manrope text-xs text-text-muted leading-relaxed">
                              {exp.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PROJECTS SECTION */}
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-accent-purple" />
                        <span>Featured Code Portfolio</span>
                      </h3>
                      <div className="flex flex-col gap-4 mt-1">
                        {details.projects.map((proj, projIdx) => (
                          <div
                            key={projIdx}
                            className={`flex flex-col gap-2 ${
                              projIdx < details.projects.length - 1 ? 'border-b border-border-warm/30 pb-4' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy flex items-center gap-1.5">
                                  <span>{proj.title}</span>
                                  {proj.demoUrl && (
                                    <a
                                      href={proj.demoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-accent-purple hover:scale-105 transition-transform"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Open GitHub Project"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </h4>
                                <span className="text-[10px] font-bold text-text-muted font-mono uppercase tracking-wide">
                                  {proj.role}
                                </span>
                              </div>
                            </div>
                            <p className="font-manrope text-xs text-text-muted leading-relaxed">
                              {proj.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {proj.tags.map(t => (
                                <span key={t} className="text-[9px] font-mono font-extrabold text-text-navy bg-border-warm/30 px-2 py-0.5 rounded-md">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* EDUCATION SECTION */}
                    <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4.5 h-4.5 text-accent-purple" />
                        <span>Education</span>
                      </h3>
                      <div className="flex flex-col gap-3 mt-1">
                        {details.education.map((edu, eduIdx) => (
                          <div key={eduIdx} className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy">
                                {edu.degree}
                              </h4>
                              <span className="text-[11px] font-semibold text-text-muted font-manrope">
                                {edu.school}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-text-muted bg-border-warm/20 px-2 py-0.5 rounded-full shrink-0">
                              {edu.dates}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GITHUB VERIFICATION SUMMARY */}
                    <div className="flex flex-col gap-2.5 bg-gradient-to-r from-purple-50/50 to-orange-50/20 p-5 rounded-2xl border border-border-warm shadow-warm-sm">
                      <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Github className="w-4 h-4 text-accent-purple" />
                        <span>GitHub Audit Vetting Status</span>
                      </h3>
                      <div className="flex flex-col gap-1.5 mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-text-navy font-mono uppercase tracking-wider">
                            Status: {details.githubSummary.status}
                          </span>
                        </div>
                        <p className="font-manrope text-xs text-text-muted leading-relaxed">
                          {details.githubSummary.summary}
                        </p>
                      </div>
                    </div>

                    {/* STICKY DRAWER BASE ACTIONS (Shortlist & Pass syncing state) */}
                    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-1 bg-gradient-to-t from-white via-white to-white/0 flex gap-3 z-10">
                      <button
                        onClick={(e) => {
                          handleTogglePass(cand.name, e);
                        }}
                        className={`flex-1 py-3 border rounded-2xl text-xs font-extrabold shadow-warm-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isPassed
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-white border-border-warm text-text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50/40'
                        }`}
                      >
                        <span>{isPassed ? 'Passed (Unlock) ✕' : 'Pass Profile'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          handleToggleShortlist(cand.name, e);
                        }}
                        className={`flex-1 py-3 rounded-2xl text-xs font-extrabold shadow-warm-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isShortlisted
                            ? 'bg-success-green text-white border-none'
                            : 'bg-brand-gradient text-white hover:scale-[1.01]'
                        }`}
                      >
                        {isShortlisted ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3px]" />
                            <span>Shortlisted ✓</span>
                          </>
                        ) : (
                          <span>Shortlist Candidate</span>
                        )}
                      </button>
                    </div>

                    {/* Mutual Interest Message Button */}
                    <AnimatePresence>
                      {isMutualInterest && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              const candidateUid = getCandidateUid(cand.name);
                              const activeJobId = selectedJob?.id || 'job-1';
                              setSelectedAppIdForChat(`${candidateUid}_${activeJobId}`);
                              setActiveTab('messages');
                              setSelectedCandidateForDrawer(null);
                              triggerToast(`Opening private chat with ${cand.name}...`);
                            }}
                            className="w-full py-3 bg-accent-purple hover:bg-accent-purple/90 text-white rounded-2xl text-xs font-extrabold shadow-warm-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-accent-purple/10 hover:scale-[1.01]"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Message {cand.name.split(' ')[0]}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  {/* RIGHT SIDE: RAG CHAT PANEL (Fixed/Sticky while profile scrolls) */}
                  <div className="w-full md:w-[45%] flex flex-col h-[50vh] md:h-full bg-white border-t md:border-t-0 border-border-warm">
                    
                    {/* CHAT PANEL HEADER */}
                    <div className="px-5 sm:px-6 py-4 border-b border-border-warm/40 bg-surface/50 flex items-center gap-2.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                        <Sparkles className="w-4 h-4 fill-accent-purple/10" />
                      </div>
                      <div>
                        <h3 className="font-sora font-extrabold text-xs sm:text-sm text-text-navy leading-tight flex items-center gap-1">
                          <span>Ask about</span>
                          <span className="text-accent-purple">{cand.name.split(' ')[0]}</span>
                        </h3>
                        <p className="text-[10px] font-manrope text-text-muted">
                          AI answers using their verified profile data
                        </p>
                      </div>
                    </div>

                    {/* CHAT MESSAGES PANEL */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3.5 bg-gradient-to-b from-surface/20 to-white">
                      
                      {/* If empty chat history, show suggestions */}
                      {drawerChatHistory.length === 0 && (
                        <div className="flex-1 flex flex-col justify-center py-6 px-2">
                          <div className="text-center mb-5">
                            <MessageSquare className="w-7 h-7 text-accent-purple/20 mx-auto mb-2" />
                            <h4 className="font-sora font-bold text-xs text-text-navy">Instant Context Intelligence</h4>
                            <p className="text-[11px] font-manrope text-text-muted max-w-[200px] mx-auto mt-1 leading-relaxed">
                              Ask specific technical depth questions. Tap a chip to run instant profile lookup.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            {[
                              'How many years of React experience?',
                              'What certifications does this candidate have?',
                              'Summarize their project experience'
                            ].map((suggested, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleSendDrawerChatMessage(suggested)}
                                className="w-full text-left bg-white border border-border-warm hover:border-accent-purple/40 hover:bg-purple-50/20 p-2.5 rounded-xl text-[11px] font-bold text-text-navy transition cursor-pointer shadow-warm-sm flex items-center justify-between group"
                              >
                                <span>{suggested}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-purple transition-transform group-hover:translate-x-0.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      {drawerChatHistory.map((msg, mIdx) => {
                        const isAI = msg.sender === 'ai';
                        return (
                          <motion.div
                            key={mIdx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2.5 max-w-[85%] ${
                              isAI ? 'self-start' : 'self-end flex-row-reverse'
                            }`}
                          >
                            {/* Sparkle avatar for AI */}
                            {isAI && (
                              <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0 self-end mb-1">
                                <Sparkles className="w-3.5 h-3.5 fill-accent-purple/10" />
                              </div>
                            )}

                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed font-manrope ${
                                isAI
                                  ? 'bg-purple-50/40 border border-border-warm text-text-navy rounded-bl-none shadow-warm-xs'
                                  : 'bg-brand-gradient text-white rounded-br-none shadow-warm-sm font-semibold'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Thinking Loader */}
                      {drawerIsThinking && (
                        <div className="flex gap-2.5 max-w-[85%] self-start items-end">
                          <div className="w-6 h-6 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple shrink-0">
                            <Sparkles className="w-3.5 h-3.5 fill-accent-purple/10" />
                          </div>
                          <div className="bg-purple-50/40 border border-border-warm p-3 rounded-2xl rounded-bl-none shadow-warm-xs">
                            <div className="flex gap-1 items-center justify-center py-1 px-1.5">
                              <span className="w-1.5 h-1.5 bg-accent-purple/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                              <span className="w-1.5 h-1.5 bg-accent-purple/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                              <span className="w-1.5 h-1.5 bg-accent-purple/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* INPUT AREA */}
                    <div className="px-4 py-3 border-t border-border-warm/40 bg-white shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendDrawerChatMessage(drawerChatInput);
                        }}
                        className="flex gap-2 items-center"
                      >
                        <input
                          type="text"
                          placeholder={`Ask about ${cand.name.split(' ')[0]}...`}
                          value={drawerChatInput}
                          onChange={(e) => setDrawerChatInput(e.target.value)}
                          disabled={drawerIsThinking}
                          className="flex-1 bg-surface border border-border-warm rounded-xl px-3 py-2 text-xs font-manrope text-text-navy placeholder:text-text-muted focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition"
                        />
                        <button
                          type="submit"
                          disabled={drawerIsThinking || !drawerChatInput.trim()}
                          className={`p-2 rounded-xl text-white shadow-warm-sm transition cursor-pointer ${
                            drawerChatInput.trim() && !drawerIsThinking
                              ? 'bg-brand-gradient hover:scale-105'
                              : 'bg-border-warm/60 text-text-muted/40 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                      {/* Small Disclaimer */}
                      <p className="text-[9px] text-text-muted font-manrope mt-2 text-center select-none">
                        Answers are generated from this candidate\'s profile data and may not capture full context.
                      </p>
                    </div>

                  </div>

                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
