# Security Specification

## Data Invariants
1. **User Profile Authenticity**: A `/users/{userId}` document can only be managed by the authenticated user whose `uid` matches `{userId}`.
2. **User Profile Fields**: The user document must only contain permitted keys (`email`, `displayName`, `createdAt`, `role`, `onboardingComplete`) with the correct data types.
3. **Candidate Profile Authenticity**: A `/candidateProfiles/{userId}` document must only be managed by the authenticated user whose `uid` matches `{userId}` and must have an internal `uid` property that matches the authenticated user's ID.
4. **Candidate Profile Structure**: A candidate profile must follow the strict structural format with standard types: `basics` (map), `skills` (list), `experience` (list), `education` (list), `projects` (list), `verification` (map), `onboardingStep` (integer 1-5), `profileComplete` (boolean).
5. **Role Validity**: The `role` field on a user document can only be set to `candidate` or `recruiter`, or remain `null` before onboarding selection.

---

## The "Dirty Dozen" Payloads (Exploits to Block)

### Payload 1: User Identity Spoofing
- **Description**: Attacker tries to write a `users/victim_uid` document while authenticated as `attacker_uid`.
- **Payload**:
  ```json
  {
    "email": "attacker@example.com",
    "displayName": "Attacker",
    "createdAt": "2026-06-27T00:00:00Z"
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 2: User Privilege Escalation (Ghost Fields)
- **Description**: Attacker tries to inject a custom admin role or system flag.
- **Payload**:
  ```json
  {
    "email": "user@example.com",
    "displayName": "Regular User",
    "createdAt": "2026-06-27T00:00:00Z",
    "role": "admin",
    "isAdmin": true
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 3: User Value Poisoning
- **Description**: Attacker tries to write a non-string value for `email`.
- **Payload**:
  ```json
  {
    "email": true,
    "displayName": "Poisoned Email"
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 4: Candidate Profile Identity Hijacking
- **Description**: Attacker tries to create a `/candidateProfiles/victim_uid` document while logged in as `attacker_uid`.
- **Payload**:
  ```json
  {
    "uid": "victim_uid",
    "basics": {},
    "skills": [],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 5: Candidate Profile Internal UID Mismatch
- **Description**: Attacker tries to create `/candidateProfiles/attacker_uid` but sets the internal `uid` field to `victim_uid` to spoof references.
- **Payload**:
  ```json
  {
    "uid": "victim_uid",
    "basics": {},
    "skills": [],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 6: Candidate Profile Ghost Fields
- **Description**: Attacker tries to inject unauthorized verification/approval fields.
- **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "basics": {},
    "skills": [],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false,
    "isSystemVerified": true
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 7: Candidate Profile Out-of-bounds Onboarding Step
- **Description**: Attacker tries to set an invalid onboarding step number like `6` or `-1`.
- **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "basics": {},
    "skills": [],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 6,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 8: Candidate Profile Type Poisoning (Skills)
- **Description**: Attacker tries to set the skills list to an arbitrary map or string to crash UI.
- **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "basics": {},
    "skills": { "react": true },
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 9: Candidate Profile Unbounded Lists (Denial of Wallet Guard)
- **Description**: Attacker tries to submit a giant skills list to blow up document limits.
- **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "basics": {},
    "skills": [ /* 1000 items */ ],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 10: Candidate Profile Type Poisoning (Basics)
- **Description**: Attacker sets `basics` to a string instead of a map.
- **Payload**:
  ```json
  {
    "uid": "attacker_uid",
    "basics": "just a string",
    "skills": [],
    "experience": [],
    "education": [],
    "projects": [],
    "verification": {},
    "onboardingStep": 1,
    "profileComplete": false
  }
  ```
- **Expectation**: `PERMISSION_DENIED`

### Payload 11: Attempt to Read Another User's Private Settings
- **Description**: Unauthenticated client attempts to query the list of users or read specific user details.
- **Expectation**: `PERMISSION_DENIED`

### Payload 12: Candidate Profile Immutable UID Change
- **Description**: Attempt to modify the immutable `uid` field on a profile during update.
- **Expectation**: `PERMISSION_DENIED`

---

## Test Runner Definition (`firestore.rules.test.ts` specification)

A secure environment should run tests matching:
```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Verification test harness that models the Dirty Dozen assertions against firestore.rules
```
