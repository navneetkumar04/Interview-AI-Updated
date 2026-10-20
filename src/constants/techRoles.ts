// Curated 12 Tech Roles for Mock Interviews & Technical Evaluation

export interface TechRoleOption {
  id: string;
  name: string;
  shortName: string;
  category: 'Full Stack & Web' | 'Backend & Distributed' | 'Cloud & DevOps' | 'Data & AI' | 'Architecture & Systems' | 'Quality & Security';
  description: string;
  primarySkills: string[];
}

export const TECH_ROLES: TechRoleOption[] = [
  {
    id: 'fullstack-engineer',
    name: 'Full Stack Software Engineer',
    shortName: 'Full Stack Engineer',
    category: 'Full Stack & Web',
    description: 'React, Node.js/Express, REST/GraphQL APIs, database modeling, and state management.',
    primarySkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL / MongoDB', 'System Architecture'],
  },
  {
    id: 'frontend-engineer',
    name: 'Frontend Engineer (React / TypeScript / Next.js)',
    shortName: 'Frontend Engineer',
    category: 'Full Stack & Web',
    description: 'Modern component architecture, SSR/SSG with Next.js, state machines, and Core Web Vitals optimization.',
    primarySkills: ['React 19', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Web Performance'],
  },
  {
    id: 'backend-engineer',
    name: 'Backend Engineer (Node.js / Distributed Microservices)',
    shortName: 'Backend Engineer',
    category: 'Backend & Distributed',
    description: 'Event-driven architecture, distributed microservices, caching, concurrency, and high-throughput APIs.',
    primarySkills: ['Node.js', 'Express', 'Redis', 'Kafka / RabbitMQ', 'REST & gRPC'],
  },
  {
    id: 'cloud-devops-engineer',
    name: 'Cloud & DevOps Engineer (AWS / Docker / Kubernetes)',
    shortName: 'Cloud & DevOps',
    category: 'Cloud & DevOps',
    description: 'Container orchestration, CI/CD pipelines, Terraform IaC, multi-region AWS cloud networking, and security.',
    primarySkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD Pipelines'],
  },
  {
    id: 'data-engineer',
    name: 'Data Engineer (Python / Spark / Kafka / SQL)',
    shortName: 'Data Engineer',
    category: 'Data & AI',
    description: 'ETL/ELT data pipelines, streaming architecture, Apache Spark, Snowflake, and data warehouse modeling.',
    primarySkills: ['Python', 'Apache Spark', 'Apache Kafka', 'SQL Optimization', 'Airflow'],
  },
  {
    id: 'ml-ai-engineer',
    name: 'Machine Learning & AI Engineer (PyTorch / LLMs / GenAI)',
    shortName: 'ML & AI Engineer',
    category: 'Data & AI',
    description: 'RAG architectures, vector databases, LLM fine-tuning, embeddings, model quantization, and PyTorch.',
    primarySkills: ['PyTorch', 'Large Language Models', 'LangChain / LlamaIndex', 'Vector DBs (Pinecone/Chroma)', 'Python'],
  },
  {
    id: 'system-design-architect',
    name: 'System Design & Distributed Architect',
    shortName: 'System Architect',
    category: 'Architecture & Systems',
    description: 'High-availability distributed architectures, CAP theorem, database sharding, consensus protocols, and scale.',
    primarySkills: ['System Design', 'Distributed Consensus (Raft)', 'Database Sharding', 'Event Sourcing', 'High Availability'],
  },
  {
    id: 'sre-engineer',
    name: 'Site Reliability Engineer (SRE & Observability)',
    shortName: 'Site Reliability (SRE)',
    category: 'Cloud & DevOps',
    description: 'SLOs/SLAs, Prometheus/Grafana monitoring, distributed tracing (OpenTelemetry), and chaos engineering.',
    primarySkills: ['Prometheus & Grafana', 'OpenTelemetry Tracing', 'Incident Management', 'Chaos Engineering', 'Linux Internals'],
  },
  {
    id: 'mobile-app-engineer',
    name: 'Mobile Application Engineer (React Native / iOS / Android)',
    shortName: 'Mobile Engineer',
    category: 'Full Stack & Web',
    description: 'Cross-platform mobile development, native module bridging, offline data sync, and smooth animations.',
    primarySkills: ['React Native', 'TypeScript', 'iOS / Swift', 'Android / Kotlin', 'Offline Sync'],
  },
  {
    id: 'security-engineer',
    name: 'Cybersecurity & Application Security Engineer',
    shortName: 'Security Engineer',
    category: 'Quality & Security',
    description: 'OWASP Top 10 vulnerabilities, OAuth 2.0 / OpenID Connect, penetration testing, and zero-trust security.',
    primarySkills: ['AppSec & OWASP', 'OAuth 2.0 / JWT', 'Penetration Testing', 'Cryptography', 'Cloud Security'],
  },
  {
    id: 'qa-automation-architect',
    name: 'QA & Test Automation Architect (Playwright / Cypress)',
    shortName: 'QA Automation Lead',
    category: 'Quality & Security',
    description: 'End-to-end test automation frameworks, API contract testing, load testing, and CI/CD test gates.',
    primarySkills: ['Playwright', 'Cypress', 'Jest & Vitest', 'API Load Testing (k6)', 'CI/CD Test Automation'],
  },
  {
    id: 'database-architect',
    name: 'Database Administrator & Data Architect (PostgreSQL / MongoDB)',
    shortName: 'Database Architect',
    category: 'Architecture & Systems',
    description: 'Query planning and execution optimization, index strategies (B-Tree/GIN/BRIN), replication, and sharding.',
    primarySkills: ['PostgreSQL', 'MongoDB', 'Query Optimization (EXPLAIN)', 'Replication & Failover', 'ACID & Transactions'],
  },
];

// Flat array of strings for quick dropdowns and chips
export const TECH_ROLE_NAMES: string[] = TECH_ROLES.map((r) => r.name);
