/**
 * Simulated AI generator for Job Descriptions.
 */

export const generateMockJobDescription = async (jobTitle: string): Promise<string> => {
  // Simulate network delay for AI generation (1.5 - 2.5 seconds)
  const delay = Math.floor(Math.random() * 1000) + 1500;
  await new Promise(resolve => setTimeout(resolve, delay));

  const title = jobTitle.trim() || 'AI/ML Engineer Intern';
  
  return `Job Description

Job Title:
${title}

About the Company:
We are building next-generation AI solutions that help businesses automate workflows, improve decision-making, and create intelligent digital experiences. Our team values innovation, collaboration, and continuous learning.

Role Overview:
We are looking for an enthusiastic ${title} to join our engineering team. You will work on real-world applications, collaborate with experienced developers, and contribute to products from research to deployment.

Key Responsibilities:
• Develop and train machine learning models.
• Work with structured and unstructured datasets.
• Perform data cleaning and feature engineering.
• Build AI-powered applications using Python.
• Optimize model performance.
• Collaborate with frontend and backend teams.
• Participate in code reviews.
• Document technical work.
• Research emerging AI technologies.
• Assist in deploying AI models.

Required Qualifications:

Education:
Bachelor's degree pursuing/completed in:
• Computer Science
• Artificial Intelligence
• Data Science
• Information Technology
• Electronics
• Mechatronics
• Related field

Technical Skills:
• Python
• Machine Learning
• Deep Learning fundamentals
• SQL
• Git
• Data Structures & Algorithms

Preferred Skills:
• TensorFlow or PyTorch
• OpenCV
• NLP
• FastAPI
• Docker
• AWS/Azure/GCP
• LangChain
• Vector Databases
• RAG
• LLMs

Soft Skills:
• Strong analytical thinking
• Excellent communication
• Problem-solving mindset
• Team collaboration
• Quick learner
• Attention to detail

What You'll Learn:
• Production AI development
• Model deployment
• Cloud integration
• Software engineering best practices
• Agile development
• Industry-standard workflows

Requirements:
• Laptop with good internet connection
• Available for internship duration
• Passion for AI and technology

Internship Details:
• Position: ${title}
• Type: Internship
• Mode: Remote / Hybrid / On-site
• Duration: 3–6 Months
• Stipend: ₹XX,XXX/month (if applicable)
• Location: City, State
• Joining: Immediate / Flexible

Benefits:
• Mentorship from experienced engineers
• Hands-on real-world projects
• Internship Certificate
• Letter of Recommendation (based on performance)
• Flexible working hours
• Networking opportunities
• Potential full-time opportunity

Selection Process:
• Resume Screening
• Technical Assessment
• Technical Interview
• HR Discussion
• Offer Letter

How to Apply:
Send your:
• Resume
• Portfolio/GitHub
• LinkedIn Profile
• Cover Letter (Optional)

to:
Email: careers@company.com

Subject:
Application for ${title} – [Your Name]

Equal Opportunity Statement:
We are an equal opportunity employer and celebrate diversity. We are committed to creating an inclusive environment for all employees regardless of race, gender, religion, disability, or background.`;
};
