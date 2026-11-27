export interface Experience {
  period: string;
  role: string;
  org: string;
  points: string[];
  tags?: string[];
}

export const experience: Experience[] = [
  {
    period: "Jan 2025 – Present",
    role: "AI/ML Engineer Intern",
    org: "Royal Technosoft P. Limited · Hybrid",
    points: [
      "Hands-on AI/ML internship covering Python, data analysis, classical ML, deep learning, NLP and production deployment.",
      "Built an automated data cleaner, EDA dashboard, customer segmentation system, end-to-end ML pipeline and NLP text classifier.",
      "Working with PyTorch, HuggingFace Transformers, BERT, LoRA/QLoRA, LangChain, RAG architecture, Docker and MLflow.",
      "Developing a capstone AI product with a full deployment pipeline and documentation.",
    ],
  },
  {
    period: "Jun 17 – Jul 2, 2026",
    role: "Social Impact Intern",
    org: "Ognaj Adarsh Primary School · Government School, Ahmedabad",
    points: [
      "Completed a 15-day internship at a government primary school in Ognaj, Ahmedabad.",
      "Introduced primary school students to the fundamentals of computers and artificial intelligence.",
      "Led awareness sessions on pollution, global warming, ethics and digital responsibility.",
      "Contributed to a food distribution drive and tree plantation initiative within the school.",
    ],
  },
  {
    period: "Jul – Aug 2025",
    role: "GenAI-Powered Data Analytics Job Simulation",
    org: "Forage",
    points: [
      "Performed exploratory data analysis and risk profiling to identify patterns and high-risk customer segments.",
      "Built AI-based delinquency prediction models to support data-driven collections decisions.",
      "Developed a business report and data storytelling strategy to communicate insights, and designed an AI-driven collections strategy using predictive analytics.",
    ],
    tags: [
      "Python",
      "Data Analytics",
      "Predictive Modeling",
      "GenAI",
      "Risk Profiling",
      "Data Visualization",
      "Data Storytelling",
      "Business Analytics",
    ],
  },
];
