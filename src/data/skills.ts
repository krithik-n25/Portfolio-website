export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    group: "AI & ML",
    items: [
      "LLM Integration (OpenAI API, Gemini API)",
      "Prompt Engineering",
      "Data Preprocessing",
      "Scikit-Learn",
      "Python AI Libraries",
      "LangGraph",
      "Agentic AI",
    ],
  },
  { group: "Languages", items: ["Python", "JavaScript", "C/C++", "HTML5", "CSS3"] },
  { group: "Backend", items: ["Django", "Flask", "FastAPI", "REST APIs", "Authentication"] },
  { group: "Frontend", items: ["Basic React", "DOM scripting", "Responsive UI", "API Integration"] },
  { group: "Databases", items: ["PostgreSQL", "SQLite", "Supabase", "Redis"] },
  {
    group: "Core competencies",
    items: [
      "Data Structures & Algorithms",
      "Object-Oriented Programming",
      "Debugging",
      "API Design",
      "System Design Basics",
    ],
  },
  {
    group: "Developer tools",
    items: ["Git", "GitHub", "VS Code", "Postman", "Swagger", "Docker (learning)"],
  },
  { group: "Deployment & cloud", items: ["Vercel", "GitHub Actions"] },
];
