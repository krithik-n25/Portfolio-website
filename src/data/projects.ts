import type { ImageMetadata } from "astro";
import awHero from "../assets/agentic-whiteboard/hero.png";
import awDashboard from "../assets/agentic-whiteboard/dashboard.jpg";
import awWhiteboard from "../assets/agentic-whiteboard/whiteboard.png";

export interface Project {
  title: string;
  tag: string;
  badge: string;
  role?: string;
  lead: string;
  points: string[];
  /** "Key facts" metrics (animated counters). */
  facts?: [string, string][];
  /** "Results" metrics (animated counters) plus a footnote. */
  metrics?: [string, string][];
  metricsNote?: string;
  shots?: { src: ImageMetadata; alt: string }[];
  stack: string[];
  link?: { label: string; href: string };
  /** Live demo URL. The button only shows when this is an http(s) URL. */
  demo?: string;
  /** Inline SVG artwork for the card. */
  art: string;
}

/** Index of the card shown at the front of the carousel on load. */
export const initialProject = 2;

/** Carousel order: Solar, Margdarshak, VoltSync (front), DAU, CortexNews, Agentic Whiteboard. */
export const projects: Project[] = [
  {
    title: "Solar Power Prediction System",
    tag: "Sunshine, forecasted",
    badge: "Project 04",
    lead: "An AI-powered platform that predicts solar energy generation using real-time NASA POWER weather data, with panel simulation and revenue estimation.",
    points: [
      "ML-based solar energy prediction.",
      "Real-time NASA POWER API integration.",
      "Solar panel configuration and simulation.",
      "Energy output and revenue analytics dashboard.",
      "REST APIs and interactive visualizations.",
    ],
    stack: ["Python", "FastAPI", "Flask", "Scikit-learn", "Chart.js"],
    art: '<svg viewBox="0 0 200 120"><circle cx="60" cy="40" r="18"/><path d="M60 10v8M60 62v8M30 40h8M82 40h8M39 19l6 6M81 61l-6-6M81 19l-6 6M39 61l6-6"/><path d="M96 104l12-34h72l12 34zM102 88h98M130 70l-6 34M156 70l-2 34"/></svg>',
  },
  {
    title: "Margdarshak",
    tag: "Multilingual AI health triage",
    badge: "Winner · Aetrix 2026 · PDEU",
    lead: "An AI healthcare triage platform that improves preliminary healthcare access in rural India. Built in a 36-hour hackathon.",
    points: [
      "WhatsApp and web chatbot with voice and text input that classifies symptoms into Emergency, Clinic Visit or Self-Care.",
      "Supports Hindi, Gujarati, Marathi, Tamil and English, with no app installation needed.",
      "Fast symptom assessment with triage recommendations and GPS-based hospital suggestions.",
      "ASHA worker and admin dashboard for tracking and analytics.",
    ],
    stack: ["AI/ML", "Multilingual NLP", "Voice AI", "WhatsApp", "Dashboard"],
    art: '<svg viewBox="0 0 200 120"><rect x="64" y="6" width="72" height="108" rx="12"/><path d="M94 96h12M100 30v28M86 44h28"/><path d="M40 40a22 22 0 0 0-14 20M160 40a22 22 0 0 1 14 20" stroke-dasharray="3 5"/></svg>',
  },
  {
    title: "VoltSync",
    tag: "AI-orchestrated EV charging & grid sync",
    badge: "HackOut 2026",
    lead: "An autonomous EV-charging orchestration platform that bridges explosive charging demand and regional grid stability, using multi-agent intelligence, dynamic tariffs and renewable synchronization.",
    points: [
      "One platform, three consoles: EV Driver, Charge Point Operator and Grid Operator, each with a role-tailored dashboard.",
      "AI Energy Orchestrator with a live 3D digital twin: change renewable availability or grid stress and watch energy flow from solar to grid to EV battery.",
      "Four specialist agents (Driver, Renewable, Grid, Cost & Carbon) analyze live telemetry, and a central orchestrator turns them into one explainable charging plan, for example waiting 45 minutes to charge during the solar peak.",
      "134+ charging stations across major Indian metros, 24-hour smart scheduling by price and carbon intensity, and WhatsApp session alerts through Twilio.",
      "Operator console for queues, port health and power-draw analytics; grid console with 9 regional zones, renewable curves, dynamic tariffs and one-click grid-event simulation.",
    ],
    metrics: [
      ["34.2%", "charging shifted to green hours"],
      ["28.7%", "cost savings from dynamic tariffs"],
      ["~42 ms", "average API response"],
      ["134", "stations seeded"],
      ["<450 ms", "grid event broadcast"],
    ],
    metricsNote: "Figures as reported in the project README.",
    stack: [
      "React 18",
      "Vite",
      "Tailwind CSS",
      "Clerk",
      "TanStack Query",
      "Recharts",
      "FastAPI",
      "Python 3.12",
      "SQLAlchemy",
      "Pydantic",
      "Twilio",
    ],
    link: { label: "View on GitHub", href: "https://github.com/krithik-n25/Hackout2026" },
    art: '<svg viewBox="0 0 200 120"><path d="M112 6L68 66h30l-12 48 46-62h-30z"/><circle cx="100" cy="60" r="52" stroke-dasharray="3 6"/><path d="M8 100l22-22 18 10 26-30"/></svg>',
  },
  {
    title: "DAU Campus Agent",
    tag: "AI-powered campus support agent",
    badge: "AI project · 2026",
    lead: "A campus support agent that answers student queries using university policies and student records, and escalates to a human when the stakes are high.",
    points: [
      "RAG with pgvector, PostgreSQL-based student lookup and human-in-the-loop escalation built on LangGraph.",
      "Next.js + Python interface with Gemini, Groq fallback, Supabase and Langfuse.",
      "Automated evaluation and reliability testing to prevent incorrect high-impact decisions.",
      "Tool-based agent workflow for policy retrieval, student record access and automated support-ticket generation.",
      "Checkpointing and observability with Supabase and Langfuse to monitor agent runs and keep workflows reliable.",
    ],
    stack: ["Python", "LangGraph", "Next.js", "PostgreSQL", "Supabase", "pgvector", "Gemini", "Groq", "Langfuse"],
    art: '<svg viewBox="0 0 200 120"><rect x="14" y="12" width="104" height="38" rx="8"/><path d="M30 26h56M30 36h34"/><rect x="82" y="64" width="104" height="38" rx="8"/><path d="M98 78h56M98 88h72"/><circle cx="168" cy="26" r="9"/><path d="M168 35v14M168 49l-10 14"/></svg>',
  },
  {
    title: "CortexNews",
    tag: "AI-powered news intelligence & automated briefing system",
    badge: "Project 05",
    lead: "An AI-powered news aggregation platform that collects AI and technology updates from multiple sources, filters irrelevant and duplicate articles, and uses Groq-powered LLMs to generate concise, insight-driven daily briefings. It automatically delivers personalized news digests through WhatsApp.",
    points: [
      "Multi-source news aggregation using NewsAPI and RSS feeds.",
      "Intelligent filtering and article deduplication.",
      "Groq-powered summaries, key insights and technology trends.",
      "Persistent article history and insights using SQLAlchemy and SQLite.",
      "Automated WhatsApp briefings using Twilio.",
      "Scheduled news collection and delivery using APScheduler.",
      "Modular, automated end-to-end processing pipeline.",
    ],
    stack: [
      "Python",
      "Groq API",
      "NewsAPI",
      "RSS",
      "SQLAlchemy",
      "SQLite",
      "Twilio API",
      "WhatsApp Automation",
      "APScheduler",
      "REST APIs",
    ],
    link: { label: "View on GitHub", href: "https://github.com/krithik-n25/CortexNews" },
    art: '<svg viewBox="0 0 200 120"><rect x="34" y="10" width="132" height="100" rx="8"/><path d="M52 32h56M52 46h96M52 58h96M52 70h60"/><rect x="124" y="26" width="24" height="12" rx="2"/><circle cx="150" cy="92" r="9"/><path d="M146 92l3 3 6-6"/></svg>',
  },
  {
    title: "Agentic Whiteboard",
    tag: "AI whiteboard that turns a text prompt into an editable diagram",
    badge: "Personal Project",
    role: "Solo developer",
    lead: "An AI whiteboard on an infinite Excalidraw canvas. You describe a flowchart, architecture diagram, mind map or wireframe, and the AI draws it as normal editable shapes. You can also paste code and get a flowchart of it.",
    points: [
      "Five diagram types from a single prompt: flowchart, architecture diagram, mind map, web wireframe and mobile wireframe, returned as editable Excalidraw elements with arrows routed by code so they avoid boxes.",
      "Code to flowchart: paste up to 200 lines, the AI produces a Mermaid flowchart drawn on the board, and clicking a step highlights the matching lines of code.",
      "Provider fallback: Groq is the primary model and Gemini is the fallback if Groq is rate limited or down.",
      "Usage control: 10 AI credits per user per month, refunded automatically if a generation fails.",
      "Boards autosave to Neon PostgreSQL, show preview cards on a dashboard, export as PNG and can be shared as a view only link.",
    ],
    facts: [
      ["5", "diagram types"],
      ["200", "line limit for code to flowchart"],
      ["10", "AI credits per user per month"],
      ["2", "AI providers (Groq, Gemini fallback)"],
    ],
    shots: [
      { src: awHero, alt: "Agentic Whiteboard landing page" },
      { src: awDashboard, alt: "Dashboard with board preview cards" },
      { src: awWhiteboard, alt: "Whiteboard with an AI-generated architecture diagram and flowchart" },
    ],
    stack: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Excalidraw",
      "Groq",
      "Gemini",
      "Clerk",
      "Neon",
      "Drizzle ORM",
      "Vercel",
    ],
    link: { label: "View on GitHub", href: "https://github.com/krithik-n25/Agentic-whiteboard" },
    demo: "PASTE_MY_VERCEL_URL_HERE",
    art: '<svg viewBox="0 0 200 120"><rect x="10" y="8" width="180" height="104" rx="10"/><rect x="28" y="24" width="44" height="22" rx="5"/><rect x="128" y="24" width="44" height="22" rx="5"/><path d="M72 35h54M120 31l6 4-6 4"/><path d="M100 62l18 14-18 14-18-14z"/><path d="M50 46v30h30M74 72l6 4-6 4M150 46v30h-30M126 72l-6 4 6 4"/><path d="M168 86v16M160 94h16"/></svg>',
  },
];
