import re

file_path = r"c:\Users\sanja\OneDrive\Desktop\India Runs\India-runs\src\screens\RecruiterHomeScreen.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
import_statement = "import { JobCreationFlow } from '../components/JobCreationFlow';\n"
content = content.replace(
    "import { PrivateChat } from '../components/PrivateChat';",
    "import { PrivateChat } from '../components/PrivateChat';\n" + import_statement
)

# Replace the SCREEN C section using regex
pattern = re.compile(
    r"(/\* ==================== SCREEN C: POST JOB SCREEN ==================== \*/\n\s*<motion\.div\n\s*key=\"recruiter-post-job\".*?)(?:</motion\.div>\n\s*\) : \()",
    re.DOTALL
)

replacement = """/* ==================== SCREEN C: POST JOB SCREEN ==================== */
            <motion.div
              key="recruiter-post-job"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl w-full mx-auto pb-16"
            >
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setActiveView('home')}
                  className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-navy self-start transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Recruiter Home
                </button>
              </div>
              <JobCreationFlow onPostJob={async (jobData) => {
                 try {
                   const tagsList = ['AI Processed'];
                   await addDoc(collection(db, 'jobs'), {
                     title: jobData.title || 'Untitled',
                     companyName: userData.companyName || 'TalentSphere',
                     logoUrl: '',
                     industry: 'Technology',
                     companySize: '11-50',
                     postedDate: 'Just now',
                     status: 'Active',
                     applicantsCount: 0,
                     tags: tagsList,
                     description: jobData.description,
                     salary: 'Negotiable',
                     location: 'Remote',
                     experienceLevel: 'Senior',
                     jobType: 'Full-time',
                     isReverseRecruitment: false,
                     recruiterUid: currentUserId,
                     createdAt: serverTimestamp()
                   });
                   triggerToast("Job posting is now live");
                   setActiveView('home');
                   // Reload page to refresh jobs list since we replaced the complex local state updater
                   setTimeout(() => window.location.reload(), 1500);
                 } catch (e) {
                   console.error("Error creating job posting:", e);
                   triggerToast("Error posting job");
                 }
              }} />
            </motion.div>
          ) : ("""

# Replace it
new_content = pattern.sub(replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement successful." if new_content != content else "No replacements made.")
