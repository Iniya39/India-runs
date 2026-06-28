import random
import json
import uuid
from datetime import datetime, timedelta

# Seed data lists
first_names = [
    # Tamil
    "Karthik", "Vignesh", "Saravanan", "Anbarasan", "Murugan", "Selvam", "Rajan", "Vijay", "Balaji", "Sundar", 
    "Priya", "Divya", "Abirami", "Janani", "Meena", "Senthil", "Elango", "Arun", "Hari", "Mani",
    # Telugu
    "Srinivas", "Venkatesh", "Mahesh", "Suresh", "Naresh", "Sai", "Pawan", "Kalyan", "Ravi", "Kiran",
    "Lakshmi", "Ramya", "Kavitha", "Harika", "Sriya", "Anusha", "Pranathi", "Bhaskar", "Chaitanya", "Nikhil",
    # Kannada
    "Puneeth", "Yash", "Darshan", "Sudeep", "Manjunath", "Ramesh", "Harish", "Kiran", "Chethan", "Naveen",
    "Swathi", "Ashwini", "Kavya", "Nidhi", "Meghana", "Shruthi", "Girish", "Prashanth", "Sandeep", "Umesh",
    # Malayalam
    "Rahul", "Akhil", "Amal", "Jithu", "Vishnu", "Renjith", "Midhun", "Sreejith", "Arjun", "Manu",
    "Anjali", "Parvathy", "Sruthy", "Reshma", "Gopika", "Dhanya", "Anoop", "Deepak", "Faisal", "Thomas"
]

last_names = [
    # Tamil
    "Kumar", "Raj", "Mani", "Sekar", "Chandran", "Devi", "Priya", "Balan", "Prabhu", "Srinivasan",
    # Telugu
    "Rao", "Reddy", "Naidu", "Chowdary", "Prasad", "Murthy", "Sastry", "Raju", "Verma", "Teja",
    # Kannada
    "Gowda", "Hegde", "Bhat", "Nayak", "Shetty", "Karanth", "Acharya", "Joshi", "Patil", "Desai",
    # Malayalam
    "Nair", "Menon", "Pillai", "Kurup", "Nambiar", "Joseph", "Varghese", "Kurian", "Panicker", "Shenoy"
]

locations = ["Chennai", "Bangalore", "Hyderabad", "Kochi", "Coimbatore", "Mysore"]

skills_pools = [
    ["React", "Node.js", "JavaScript", "HTML5", "CSS3", "Git"],
    ["Python", "Django", "PostgreSQL", "Docker", "AWS", "REST APIs"],
    ["Java", "Spring Boot", "MySQL", "Hibernate", "Microservices"],
    ["Angular", "TypeScript", "Node.js", "MongoDB", "Express"],
    ["Flutter", "Dart", "Firebase", "State Management", "Mobile UI"],
    ["React Native", "JavaScript", "iOS", "Android", "Redux"],
    ["Data Science", "Python", "Pandas", "NumPy", "Scikit-Learn", "SQL"],
    ["DevOps", "Kubernetes", "Docker", "Jenkins", "Terraform", "Ansible"]
]

education_degrees = ["B.E", "B.Tech", "M.Tech", "MCA", "B.Sc"]
departments = ["Computer Science", "Information Technology", "Software Engineering", "Computer Applications"]
colleges = ["Anna University", "RV College of Engineering", "JNTU Hyderabad", "CUSAT Kochi", "PSG Tech Coimbatore", "NIE Mysore"]

summaries = [
    "Passionate Software Engineer with a strong foundation in building scalable web applications. Experienced in modern JavaScript frameworks and database design.",
    "Detail-oriented developer specializing in backend architectures and API integrations. Committed to writing clean, maintainable, and efficient code.",
    "Full Stack Developer with a track record of delivering user-centric web and mobile applications. Skilled in both frontend design and backend services.",
    "Enthusiastic computer science graduate looking to leverage technical skills in a challenging software development role.",
    "Experienced mobile app developer focusing on cross-platform frameworks. Adept at transforming UI/UX designs into high-performance applications."
]

job_titles = ["Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Engineer", "App Developer", "DevOps Engineer"]
companies_pool = ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Zoho", "Freshworks"]

def generate_random_date():
    days_ago = random.randint(1, 90)
    date = datetime.now() - timedelta(days=days_ago)
    return date.strftime('%Y-%m-%d %H:%M:%S+00')

# Generate data
users = []
profiles = []
emails_seen = set()

for i in range(200):
    # Unique Name and Email
    while True:
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        full_name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{random.randint(10, 999)}@gmail.com"
        if email not in emails_seen:
            emails_seen.add(email)
            break
            
    uid = str(uuid.uuid4())
    created_at = generate_random_date()
    
    # User record
    users.append({
        "id": uid,
        "email": email,
        "displayName": full_name,
        "role": "candidate",
        "onboardingComplete": True,
        "companyId": None,
        "password": "$2b$10$hashedpasswordexample",
        "createdAt": created_at
    })
    
    # Profile details
    exp_years = random.choices([0, 1, 2, 3, 4, 5, 6, 7, 8, 10], weights=[20, 20, 20, 15, 10, 5, 4, 3, 2, 1])[0]
    loc = random.choice(locations)
    skills = random.choice(skills_pools)
    edu_degree = random.choice(education_degrees)
    edu_dept = random.choice(departments)
    edu_college = random.choice(colleges)
    summary = random.choice(summaries)
    
    basics = {
        "name": full_name,
        "email": email,
        "location": loc,
        "headline": f"{random.choice(job_titles)} | {exp_years} Years Exp",
        "aboutMe": summary,
        "yearsExperience": exp_years
    }
    
    # Work history
    experience_list = []
    if exp_years > 0:
        comp = random.choice(companies_pool)
        role = random.choice(job_titles)
        experience_list.append({
            "company": comp,
            "role": role,
            "startDate": "2023-01",
            "endDate": "Present",
            "description": f"Developed and maintained core features using {', '.join(skills[:3])}."
        })
        
    # Education history
    education_list = [{
        "school": edu_college,
        "degree": edu_degree,
        "fieldOfStudy": edu_dept,
        "startYear": "2019",
        "endYear": "2023"
    }]
    
    # Project history
    project_list = [{
        "title": f"Personal {random.choice(skills)} Project",
        "description": "Built a responsive dashboard application with real-time data sync.",
        "technologies": skills[:3]
    }]
    
    profiles.append({
        "id": uid,
        "uid": uid,
        "basics": basics,
        "skills": skills,
        "experience": experience_list,
        "education": education_list,
        "projects": project_list,
        "verification": {"githubConnected": random.choice([True, False])},
        "onboardingStep": 4,
        "profileComplete": True
    })

# Write SQL file
with open("c:/Users/HP/TalentSphere/seed_data.sql", "w", encoding="utf-8") as f:
    f.write("-- Seed data for TalentSphere candidate users, profiles and applications\n\n")
    
    # Users inserts
    f.write("-- 1. Insert Users\n")
    for u in users:
        f.write(f"INSERT INTO \"users\" (\"id\", \"email\", \"displayName\", \"role\", \"onboardingComplete\", \"password\", \"createdAt\") VALUES \n")
        f.write(f"('{u['id']}', '{u['email']}', '{u['displayName']}', '{u['role']}', {str(u['onboardingComplete']).lower()}, '{u['password']}', '{u['createdAt']}');\n")
    
    f.write("\n-- 2. Insert Candidate Profiles\n")
    for p in profiles:
        basics_json = json.dumps(p['basics']).replace("'", "''")
        skills_json = json.dumps(p['skills']).replace("'", "''")
        exp_json = json.dumps(p['experience']).replace("'", "''")
        edu_json = json.dumps(p['education']).replace("'", "''")
        proj_json = json.dumps(p['projects']).replace("'", "''")
        verif_json = json.dumps(p['verification']).replace("'", "''")
        
        f.write(f"INSERT INTO \"candidateProfiles\" (\"id\", \"uid\", \"basics\", \"skills\", \"experience\", \"education\", \"projects\", \"verification\", \"onboardingStep\", \"profileComplete\", \"updatedAt\") VALUES \n")
        f.write(f"('{p['id']}', '{p['uid']}', '{basics_json}'::jsonb, '{skills_json}'::jsonb, '{exp_json}'::jsonb, '{edu_json}'::jsonb, '{proj_json}'::jsonb, '{verif_json}'::jsonb, {p['onboardingStep']}, {str(p['profileComplete']).lower()}, now());\n")
        
    # Generate 50 job applications
    f.write("\n-- 3. Insert Job Applications\n")
    candidate_ids = [u['id'] for u in users]
    for _ in range(50):
        cand_id = random.choice(candidate_ids)
        job_id = str(uuid.uuid4())
        recruiter_id = str(uuid.uuid4())
        app_id = f"{job_id}_{cand_id}"
        applied_at = generate_random_date()
        
        f.write(f"INSERT INTO \"applications\" (\"id\", \"candidateUid\", \"recruiterUid\", \"jobId\", \"candidateInterested\", \"recruiterShortlisted\", \"chatUnlocked\", \"createdAt\", \"updatedAt\") VALUES \n")
        f.write(f"('{app_id}', '{cand_id}', '{recruiter_id}', '{job_id}', true, false, false, '{applied_at}', '{applied_at}');\n")

print("Seed data SQL file generated successfully at c:/Users/HP/TalentSphere/seed_data.sql")
