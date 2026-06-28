-- SQL Database Schema for TalentSphere
-- Run this script in the SQL Editor of your Supabase Dashboard (https://supabase.com)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT,
  "displayName" TEXT,
  "role" TEXT,
  "onboardingComplete" BOOLEAN DEFAULT false,
  "companyId" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Ensure password column exists if table was already created
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- 2. Candidate Profiles Table
CREATE TABLE IF NOT EXISTS "candidateProfiles" (
  "id" TEXT PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "uid" TEXT,
  "basics" JSONB,
  "skills" JSONB,
  "experience" JSONB,
  "education" JSONB,
  "projects" JSONB,
  "verification" JSONB,
  "onboardingStep" INT DEFAULT 0,
  "profileComplete" BOOLEAN DEFAULT false,
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 3. Companies Table
CREATE TABLE IF NOT EXISTS "companies" (
  "id" TEXT PRIMARY KEY,
  "companyName" TEXT,
  "logoUrl" TEXT,
  "industry" TEXT,
  "companySize" TEXT,
  "companyWebsite" TEXT,
  "hiringContextNote" TEXT,
  "createdByUid" TEXT,
  "recruiterUids" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 4. Jobs Table
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "companyName" TEXT,
  "logoUrl" TEXT,
  "logoBg" TEXT,
  "logoText" TEXT,
  "industry" TEXT,
  "companySize" TEXT,
  "location" TEXT,
  "jobType" TEXT,
  "experienceLevel" TEXT,
  "salary" TEXT,
  "matchScore" INT,
  "tags" JSONB,
  "description" TEXT,
  "pitch" TEXT,
  "postedDate" TEXT,
  "isReverseRecruitment" BOOLEAN,
  "recruiterUid" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS "applications" (
  "id" TEXT PRIMARY KEY,
  "candidateUid" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "recruiterUid" TEXT,
  "jobId" TEXT,
  "candidateInterested" BOOLEAN DEFAULT false,
  "recruiterShortlisted" BOOLEAN DEFAULT false,
  "chatUnlocked" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 6. Conversations Table
CREATE TABLE IF NOT EXISTS "conversations" (
  "id" TEXT PRIMARY KEY,
  "candidateUid" TEXT,
  "recruiterUid" TEXT,
  "jobId" TEXT,
  "candidateName" TEXT,
  "candidateAvatarUrl" TEXT,
  "recruiterName" TEXT,
  "recruiterAvatarUrl" TEXT,
  "jobTitle" TEXT,
  "companyName" TEXT,
  "lastMessage" TEXT,
  "lastMessageAt" TIMESTAMPTZ DEFAULT now(),
  "unreadByCandidate" BOOLEAN DEFAULT false,
  "unreadByRecruiter" BOOLEAN DEFAULT false
);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" TEXT PRIMARY KEY,
  "conversation_id" TEXT REFERENCES "conversations"("id") ON DELETE CASCADE,
  "senderUid" TEXT,
  "text" TEXT,
  "sentAt" TIMESTAMPTZ DEFAULT now()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT,
  "message" TEXT,
  "read" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Make sure to create the storage buckets under the Storage tab in the Supabase Dashboard:
-- 1. Name: profile-photos, Policy: Public (Allow public read access, upload/update for authenticated users)
-- 2. Name: company-logos, Policy: Public (Allow public read access, upload/update for authenticated users)
