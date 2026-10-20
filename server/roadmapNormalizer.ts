export interface RoadmapResourceData {
  title: string;
  description: string;
  type: string;
  url: string;
}

export interface RoadmapWeekData {
  weekNumber: number;
  title: string;
  learningObjectives: string[];
  topics: string[];
  detailedExplanation: string;
  estimatedHours: string;
  resources: RoadmapResourceData[];
  practicalExercises: string[];
  weeklyAssignments: string[];
  projectMilestone?: string;
  expectedOutcomes: string[];
}

export interface RoadmapTopicData {
  stage: string;
  title: string;
  description: string;
  duration: string;
  resources: string[];
}

export interface RoadmapData {
  jobRole: string;
  targetLevel?: string;
  durationMonths: number;
  totalWeeks: number;
  weeks: RoadmapWeekData[];
  requiredSkills: string[];
  learningTopics: RoadmapTopicData[];
  progression: string[];
  interviewPreparation: string[];
  areasToImprove: string[];
}

export function cleanString(val: any, defaultVal = ''): string {
  if (typeof val === 'string') return val.trim();
  if (val === null || val === undefined) return defaultVal;
  return String(val).trim();
}

export function cleanStringArray(val: any, defaultList: string[] = []): string[] {
  if (!val) return [...defaultList];

  if (Array.isArray(val)) {
    const result: string[] = [];
    for (const item of val) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (val.length === 1 && trimmed.includes(',')) {
          trimmed
            .split(',')
            .map((s) => s.trim().replace(/^[-*•\d.]+\s*/, ''))
            .filter(Boolean)
            .forEach((s) => result.push(s));
        } else if (trimmed) {
          result.push(trimmed.replace(/^[-*•\d.]+\s*/, ''));
        }
      } else if (item && typeof item === 'object') {
        const str =
          (item as any).name ||
          (item as any).skill ||
          (item as any).title ||
          (item as any).topic ||
          (item as any).value ||
          (item as any).level ||
          (item as any).milestone ||
          (item as any).objective ||
          (item as any).task ||
          JSON.stringify(item);
        if (typeof str === 'string' && str.trim()) {
          result.push(str.trim().replace(/^[-*•\d.]+\s*/, ''));
        }
      } else if (item !== null && item !== undefined) {
        const str = String(item).trim();
        if (str) result.push(str.replace(/^[-*•\d.]+\s*/, ''));
      }
    }
    return result.length > 0 ? result : [...defaultList];
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [...defaultList];

    if (trimmed.includes('\n') || trimmed.includes('\r')) {
      const lines = trimmed
        .split(/[\r\n]+/)
        .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);
      if (lines.length > 0) return lines;
    }

    if (trimmed.includes('->') || trimmed.includes('→')) {
      const parts = trimmed
        .split(/->|→/)
        .map((p) => p.trim().replace(/^[-*•\d.]+\s*/, ''))
        .filter(Boolean);
      if (parts.length > 0) return parts;
    }

    const parts = trimmed
      .split(/[,;]+/)
      .map((p) => p.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(Boolean);
    if (parts.length > 0) return parts;

    return [trimmed.replace(/^[-*•\d.]+\s*/, '')];
  }

  return [...defaultList];
}

interface DomainProfile {
  category: string;
  coreSkills: string[];
  resourcePool: RoadmapResourceData[];
  themePhases: {
    title: string;
    topics: string[];
    objectives: string[];
    explanation: string;
    exercises: string[];
    assignments: string[];
    milestone: string;
    outcomes: string[];
  }[];
}

// Curated verified authentic resources per domain
const DOMAIN_RESOURCES: Record<string, RoadmapResourceData[]> = {
  web_frontend: [
    {
      title: 'MDN Web Docs - JavaScript Guide',
      description: 'The definitive guide to JavaScript syntax, standard library, and runtime APIs.',
      type: 'Official Documentation',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    },
    {
      title: 'React Official Documentation',
      description: 'Comprehensive guide to modern React 19, Hooks, State, and Component Architecture.',
      type: 'Official Documentation',
      url: 'https://react.dev/learn',
    },
    {
      title: 'TypeScript Official Handbook',
      description: 'In-depth guide to static typing, interfaces, generics, and compiler configuration.',
      type: 'Official Documentation',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    },
    {
      title: 'JavaScript.info',
      description: 'From the basics to advanced topics with detailed explanations and exercises.',
      type: 'Interactive Guide',
      url: 'https://javascript.info/',
    },
    {
      title: 'Next.js Documentation',
      description: 'Learn App Router, Server Components, SSR, and production optimizations.',
      type: 'Official Documentation',
      url: 'https://nextjs.org/docs',
    },
    {
      title: 'web.dev by Google',
      description: 'Guidance from Google on web performance, accessibility, and modern CSS.',
      type: 'Best Practices',
      url: 'https://web.dev/learn',
    },
    {
      title: 'Frontend Masters Learning Paths',
      description: 'Expert-led video courses on deep JavaScript, CSS architecture, and frameworks.',
      type: 'Course Platform',
      url: 'https://frontendmasters.com/courses/',
    },
  ],
  backend_systems: [
    {
      title: 'Node.js Official Documentation',
      description: 'Runtime architecture, event loop, streams, buffers, and asynchronous APIs.',
      type: 'Official Documentation',
      url: 'https://nodejs.org/en/docs/guides',
    },
    {
      title: 'PostgreSQL Tutorial & Documentation',
      description: 'Relational data modeling, indexing, transactions, and performance tuning.',
      type: 'Official Documentation',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
    },
    {
      title: 'System Design Primer',
      description: 'Learn how to design large-scale, high-availability distributed systems.',
      type: 'Interview Resource',
      url: 'https://github.com/donnemartin/system-design-primer',
    },
    {
      title: 'Redis Documentation',
      description: 'In-memory data structures, caching patterns, pub/sub, and cluster design.',
      type: 'Official Documentation',
      url: 'https://redis.io/docs/',
    },
    {
      title: 'Docker Getting Started Guide',
      description: 'Containerization fundamentals, multi-stage builds, and Compose workflows.',
      type: 'Official Documentation',
      url: 'https://docs.docker.com/get-started/',
    },
    {
      title: 'Designing Data-Intensive Applications',
      description: 'Key principles behind reliable, scalable, and maintainable systems.',
      type: 'Architecture Guide',
      url: 'https://dataintensive.net/',
    },
  ],
  ai_ml: [
    {
      title: 'PyTorch Official Tutorials',
      description: 'Deep learning fundamentals, tensor operations, autograd, and neural networks.',
      type: 'Official Documentation',
      url: 'https://pytorch.org/tutorials/',
    },
    {
      title: 'Hugging Face NLP Course',
      description: 'Hands-on guide to Transformers, datasets, fine-tuning, and LLM tokenizers.',
      type: 'Interactive Course',
      url: 'https://huggingface.co/learn/nlp-course',
    },
    {
      title: 'Scikit-Learn User Guide',
      description: 'Machine learning algorithms, cross-validation, pipelines, and evaluation metrics.',
      type: 'Official Documentation',
      url: 'https://scikit-learn.org/stable/user_guide.html',
    },
    {
      title: 'LangChain Documentation',
      description: 'Building context-aware LLM applications, RAG pipelines, and autonomous agents.',
      type: 'Official Documentation',
      url: 'https://python.langchain.com/docs/get_started/introduction',
    },
    {
      title: 'Fast.ai Practical Deep Learning',
      description: 'Top-down deep learning course for computer vision, NLP, and model deployment.',
      type: 'Video Course',
      url: 'https://course.fast.ai/',
    },
    {
      title: 'DeepLearning.AI Short Courses',
      description: 'Industry-standard tutorials on GenAI, prompt engineering, and vector search.',
      type: 'Course Platform',
      url: 'https://www.deeplearning.ai/',
    },
  ],
  data_careers: [
    {
      title: 'Kaggle Learn Tutorials',
      description: 'Hands-on tracks for Python, SQL, Pandas, data visualization, and machine learning.',
      type: 'Practice Platform',
      url: 'https://www.kaggle.com/learn',
    },
    {
      title: 'Pandas User Guide',
      description: 'Official documentation for data wrangling, time series, grouping, and pivots.',
      type: 'Official Documentation',
      url: 'https://pandas.pydata.org/docs/user_guide/index.html',
    },
    {
      title: 'Apache Spark Documentation',
      description: 'Large-scale distributed data processing, DataFrames, and Spark SQL.',
      type: 'Official Documentation',
      url: 'https://spark.apache.org/docs/latest/',
    },
    {
      title: 'dbt (Data Build Tool) Documentation',
      description: 'Analytics engineering, SQL transformation workflows, and automated testing.',
      type: 'Official Documentation',
      url: 'https://docs.getdbt.com/docs/introduction',
    },
    {
      title: 'Microsoft Power BI Learning Path',
      description: 'Data modeling, DAX formulas, interactive dashboards, and business reporting.',
      type: 'Official Guide',
      url: 'https://learn.microsoft.com/en-us/power-bi/',
    },
  ],
  cloud_devops: [
    {
      title: 'AWS Getting Started Resource Center',
      description: 'Hands-on architectural tutorials covering EC2, S3, RDS, Lambda, and IAM.',
      type: 'Official Documentation',
      url: 'https://aws.amazon.com/getting-started/',
    },
    {
      title: 'Kubernetes Official Documentation & Tutorials',
      description: 'Pod lifecycle, Deployments, Services, Ingress, and cluster orchestration.',
      type: 'Official Documentation',
      url: 'https://kubernetes.io/docs/tutorials/',
    },
    {
      title: 'Terraform Official Documentation',
      description: 'Infrastructure as Code (IaC) syntax, state management, and cloud modules.',
      type: 'Official Documentation',
      url: 'https://developer.hashicorp.com/terraform/docs',
    },
    {
      title: 'Google Site Reliability Engineering Book',
      description: 'How Google runs production systems: SLOs, error budgets, and incident management.',
      type: 'Architecture Handbook',
      url: 'https://sre.google/sre-book/table-of-contents/',
    },
    {
      title: 'Prometheus Monitoring Documentation',
      description: 'Metrics collection, PromQL query syntax, alerts, and Grafana integration.',
      type: 'Official Documentation',
      url: 'https://prometheus.io/docs/introduction/overview/',
    },
  ],
  cybersecurity: [
    {
      title: 'OWASP Top 10 Web Application Security',
      description: 'The standard awareness document for developers regarding web application risks.',
      type: 'Security Standards',
      url: 'https://owasp.org/www-project-top-ten/',
    },
    {
      title: 'PortSwigger Web Security Academy',
      description: 'Free interactive security labs for SQLi, XSS, CSRF, and authentication bypasses.',
      type: 'Interactive Labs',
      url: 'https://portswigger.net/web-security',
    },
    {
      title: 'NIST Cybersecurity Framework',
      description: 'Guidelines, taxonomy, and standards to manage and reduce cybersecurity risk.',
      type: 'Official Framework',
      url: 'https://www.nist.gov/cyberframework',
    },
    {
      title: 'MITRE ATT&CK Matrix',
      description: 'Globally-accessible knowledge base of adversary tactics and techniques.',
      type: 'Threat Intelligence',
      url: 'https://attack.mitre.org/',
    },
  ],
  mobile_dev: [
    {
      title: 'Android Developers Official Guides',
      description: 'Modern Android with Jetpack Compose, Kotlin coroutines, and Architecture Components.',
      type: 'Official Documentation',
      url: 'https://developer.android.com/guide',
    },
    {
      title: 'Apple Developer Swift & SwiftUI Documentation',
      description: 'Declarative user interfaces, state management, and iOS app development.',
      type: 'Official Documentation',
      url: 'https://developer.apple.com/documentation/swiftui',
    },
    {
      title: 'Flutter Official Documentation',
      description: 'Cross-platform mobile apps with Dart, widget architecture, and state management.',
      type: 'Official Documentation',
      url: 'https://docs.flutter.dev/',
    },
    {
      title: 'React Native Documentation',
      description: 'Native mobile components, navigation, bridge architecture, and Expo tools.',
      type: 'Official Documentation',
      url: 'https://reactnative.dev/docs/getting-started',
    },
  ],
  testing_qa: [
    {
      title: 'Playwright Documentation',
      description: 'Fast and reliable end-to-end testing for modern web apps across all browsers.',
      type: 'Official Documentation',
      url: 'https://playwright.dev/docs/intro',
    },
    {
      title: 'Martin Fowler on Software Testing',
      description: 'Testing pyramid, unit testing, contract tests, and test-driven development (TDD).',
      type: 'Best Practices',
      url: 'https://martinfowler.com/testing/',
    },
    {
      title: 'Postman API Testing Guide',
      description: 'Automated REST API tests, assertions, mock servers, and CI collection runs.',
      type: 'Official Guide',
      url: 'https://learning.postman.com/docs/writing-scripts/test-scripts/',
    },
    {
      title: 'Cypress Documentation',
      description: 'Modern component and end-to-end testing with real-time browser execution.',
      type: 'Official Documentation',
      url: 'https://docs.cypress.io/',
    },
  ],
};

function getDomainKey(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('ai') || r.includes('machine learning') || r.includes('llm') || r.includes('nlp') || r.includes('computer vision')) {
    return 'ai_ml';
  }
  if (r.includes('data') || r.includes('business intelligence') || r.includes('sql developer') || r.includes('database administrator')) {
    return 'data_careers';
  }
  if (r.includes('cloud') || r.includes('devops') || r.includes('reliability') || r.includes('system engineer')) {
    return 'cloud_devops';
  }
  if (r.includes('cyber') || r.includes('security') || r.includes('penetration')) {
    return 'cybersecurity';
  }
  if (r.includes('android') || r.includes('ios') || r.includes('flutter') || r.includes('mobile') || r.includes('react native')) {
    return 'mobile_dev';
  }
  if (r.includes('qa') || r.includes('test') || r.includes('sdet')) {
    return 'testing_qa';
  }
  if (r.includes('frontend') || r.includes('react') || r.includes('angular') || r.includes('next.js') || r.includes('mern')) {
    return 'web_frontend';
  }
  return 'backend_systems';
}

/**
 * Intelligent curriculum builder that generates exact week-wise breakdown tailored to role and duration.
 */
export function getCuratedRoadmap(role: string, durationMonths = 3): RoadmapData {
  const cleanRole = cleanString(role, 'Full Stack Software Engineer');
  const months = Math.min(6, Math.max(1, Number(durationMonths) || 3));
  const totalWeeks = months * 4;
  const domainKey = getDomainKey(cleanRole);
  const resourcePool = DOMAIN_RESOURCES[domainKey] || DOMAIN_RESOURCES['backend_systems'];

  // 24 modular theme blocks designed to expand or condense based on duration
  const modules = [
    {
      title: `${cleanRole} Foundations & Development Environment`,
      topics: ['Environment Setup', 'Core Syntax & Language Semantics', 'Version Control (Git)', 'Code Quality Tooling'],
      objectives: [
        `Configure production-ready workspace and developer tooling for ${cleanRole}`,
        'Master core language fundamentals, data types, and standard library conventions',
        'Establish branching models, linting configurations, and automated formatting',
      ],
      explanation: `Begin by establishing an industrial-grade developer environment tailored specifically for ${cleanRole}. Focus on core language internals, typing systems, memory/runtime semantics, and Git workflows.`,
      exercises: [
        `Initialize a Git repository and configure standard linters and formatters for ${cleanRole}`,
        'Build 5 targeted coding exercises demonstrating mastery of core idioms and edge cases',
      ],
      assignments: [`Submit a clean repository template configured with CI hooks and documentation for ${cleanRole}`],
      milestone: 'Foundational Environment Ready',
      outcomes: ['Fluency in essential language syntax and comfortable command-line workflow'],
    },
    {
      title: 'Data Structures, Algorithmic Patterns & Clean Code',
      topics: ['Time & Space Complexity', 'Common Data Structures', 'Clean Architecture', 'Refactoring Techniques'],
      objectives: [
        'Analyze Big-O runtime and space trade-offs in real-world scenarios',
        'Implement robust algorithmic patterns with clean naming and single-responsibility principles',
        'Write modular, self-documenting code with comprehensive unit test coverage',
      ],
      explanation: `Deepen your technical rigor by mastering fundamental data structures, memory trade-offs, and algorithmic patterns. Practice writing clean, maintainable code structured according to industry standards.`,
      exercises: [
        'Solve 4 algorithmic problem sets focused on practical lookup and aggregation patterns',
        'Refactor an unoptimized sample routine into a clean, test-driven implementation',
      ],
      assignments: ['Complete an algorithmic code review report justifying Big-O time and space trade-offs'],
      milestone: 'Algorithmic Fluency',
      outcomes: ['Confidence analyzing algorithmic trade-offs and writing idiomatic, clean code'],
    },
    {
      title: 'Core Architecture, Protocols & System Communication',
      topics: ['Network Protocols (HTTP/HTTPS, TCP/IP)', 'API Contract Design', 'Asynchronous Execution', 'Serialization'],
      objectives: [
        'Understand client-server architecture, status codes, headers, and payload serialization',
        'Design resilient API communication models and non-blocking I/O execution',
        'Handle network retries, timeouts, and error propagations gracefully',
      ],
      explanation: `Explore how modern systems communicate across network boundaries. Study asynchronous paradigms, event-driven loops, serialization formats (JSON, Protobuf), and protocol mechanics critical to ${cleanRole}.`,
      exercises: [
        'Implement an asynchronous service client with custom headers, rate limiting, and exponential backoff',
        'Simulate network latency and write unit tests for timeout edge cases',
      ],
      assignments: ['Draft an API specification contract complete with validation schemas and error definitions'],
      milestone: 'Protocol & API Mastery',
      outcomes: ['Ability to design robust network interfaces and handle asynchronous concurrency'],
    },
    {
      title: 'Mini-Project Integration, Testing & 1-Month Milestone',
      topics: ['Integrated Implementation', 'Unit & Integration Testing', 'Debugging & Logging', 'Basic Deployment'],
      objectives: [
        `Deliver a working end-to-end prototype highlighting core ${cleanRole} skills`,
        'Implement automated test suites with high statement and branch coverage',
        'Deploy the prototype to a cloud staging environment with live verification',
      ],
      explanation: `Consolidate all essential skills learned in the first month by building a realistic, working mini-application. Focus on solid tests, structured logging, and automated deployment.`,
      exercises: [
        `Build and test an end-to-end functional prototype for ${cleanRole}`,
        'Write comprehensive unit tests asserting both happy paths and edge cases',
      ],
      assignments: ['Deploy your working mini-project to a live staging environment with public URL documentation'],
      milestone: 'Month 1 Milestone: Functional Production Prototype',
      outcomes: ['A demonstrable, tested mini-project deployed live showcasing primary competencies'],
    },
    {
      title: 'Intermediate Frameworks & Modern Ecosystem Libraries',
      topics: ['Framework Internals', 'Lifecycle & Middleware', 'State Management', 'Dependency Injection'],
      objectives: [
        `Master the premier industry frameworks and toolkits used by ${cleanRole}`,
        'Understand lifecycle hooks, middleware chaining, and dependency management',
        'Apply modern state persistence and configuration injection patterns',
      ],
      explanation: `Transition from foundational concepts to advanced framework adoption. Explore the core design decisions, lifecycle events, and dependency injection mechanisms that power enterprise frameworks.`,
      exercises: [
        'Configure and run a multi-module framework project following official best practices',
        'Implement custom middleware handling request logging, tracing, and validation',
      ],
      assignments: ['Create a reusable framework module with strict typing and configuration validation'],
      milestone: 'Framework Proficiency',
      outcomes: ['Deep familiarity with framework lifecycle, middleware patterns, and ecosystem toolchains'],
    },
    {
      title: 'Database Architecture, Data Modeling & Query Optimization',
      topics: ['Relational & Document Modeling', 'Indexing Strategies', 'ACID Transactions', 'Query Optimization'],
      objectives: [
        'Design scalable database schemas with proper normalization and relationship cardinality',
        'Craft efficient indexes to accelerate complex filtering and join queries',
        'Implement ACID transactions with concurrency locks and idempotency keys',
      ],
      explanation: `Master the data tier: explore relational and document data storage, schema design, connection pooling, and performance profiling. Learn how to debug slow queries using EXPLAIN plans.`,
      exercises: [
        'Design a 5-entity database schema with migration scripts and seed data',
        'Profile an unindexed query, create composite indexes, and measure execution speedup',
      ],
      assignments: ['Submit a database optimization report with execution plans before and after indexing'],
      milestone: 'Data Tier Mastery',
      outcomes: ['Ability to model complex business domains and write high-performance queries'],
    },
    {
      title: 'Authentication, Authorization & Security Hardening',
      topics: ['JWT & Session Management', 'Role-Based Access Control (RBAC)', 'OWASP Mitigation', 'Secret Management'],
      objectives: [
        'Implement secure token-based authentication with refresh token rotation',
        'Enforce strict granular permissions and role-based access control policies',
        'Harden applications against OWASP Top 10 vulnerabilities (XSS, CSRF, Injection)',
      ],
      explanation: `Security is a paramount engineering responsibility. Study cryptographic hashing, secure cookie storage, OAuth2 flows, and defence-in-depth measures against common attack vectors.`,
      exercises: [
        'Build a secure auth module with bcrypt password hashing and rotating JWTs',
        'Audit code for SQL injection, cross-site scripting, and credential leaks',
      ],
      assignments: ['Implement an RBAC authorization middleware protecting sensitive business endpoints'],
      milestone: 'Security Architecture Certified',
      outcomes: ['Thorough understanding of authentication workflows and security threat mitigation'],
    },
    {
      title: 'End-to-End Capstone Project & 2-Month Milestone',
      topics: ['Full-Stack Integration', 'E2E Testing', 'Continuous Delivery', 'Portfolio Presentation'],
      objectives: [
        `Engineer a robust, full-featured capstone application for ${cleanRole}`,
        'Automate end-to-end user workflows using modern testing frameworks',
        'Deploy the capstone to production with SSL, automated CI/CD, and custom domain',
      ],
      explanation: `Culminate the first two months by designing and launching a comprehensive capstone application. Connect frontends, backends, databases, and authentication into a seamless production experience.`,
      exercises: [
        'Implement the core business workflows of your capstone application',
        'Write end-to-end test suites covering critical user conversion funnels',
      ],
      assignments: ['Publish your live capstone application with a complete architectural README and video demo'],
      milestone: 'Month 2 Milestone: Production Capstone Live',
      outcomes: ['A production-grade application running in the cloud with automated tests and CI/CD'],
    },
    {
      title: 'Advanced Architecture, State Management & Concurrency',
      topics: ['Event-Driven Architecture', 'Message Queues', 'Caching Strategies', 'Concurrency Models'],
      objectives: [
        'Implement distributed caching strategies (Cache-Aside, Write-Through) with Redis',
        'Decouple system components using asynchronous message brokers and worker queues',
        'Handle concurrent race conditions, distributed locks, and idempotency guarantees',
      ],
      explanation: `Study how high-scale systems manage state across distributed nodes. Learn about pub/sub systems, message queues, memory caching layers, and concurrency control.`,
      exercises: [
        'Integrate a Redis caching tier with automated cache invalidation upon entity mutations',
        'Implement an asynchronous worker queue processing background tasks with retry limits',
      ],
      assignments: ['Draft a caching and queue architecture diagram detailing latency and fallback behavior'],
      milestone: 'Advanced Architecture Certified',
      outcomes: ['Mastery of caching tiers, background queues, and asynchronous decoupling'],
    },
    {
      title: 'Containerization, Docker & Infrastructure as Code',
      topics: ['Docker Multi-stage Builds', 'Docker Compose', 'Container Security', 'IaC Principles'],
      objectives: [
        'Author minimal, secure Docker images using multi-stage builds',
        'Orchestrate multi-service environments locally using Docker Compose',
        'Define reproducible infrastructure configurations using code',
      ],
      explanation: `Containerization ensures reproducibility from local developer workstations to cloud production clusters. Learn container optimization, lightweight Alpine/Debian slim base images, and secret mounting.`,
      exercises: [
        'Dockerize an application reducing image footprint by over 60% with multi-stage builds',
        'Create a Docker Compose network combining application, database, and Redis cache',
      ],
      assignments: ['Write an automated container build script that scans for image vulnerabilities'],
      milestone: 'Containerization Fluency',
      outcomes: ['Proficiency with Docker ecosystems, container networking, and lightweight deployments'],
    },
    {
      title: 'Observability, Structured Logging, Metrics & Telemetry',
      topics: ['OpenTelemetry', 'Structured JSON Logging', 'Health Checks & Metrics', 'Distributed Tracing'],
      objectives: [
        'Instrument applications with OpenTelemetry for distributed request tracing',
        'Configure standardized structured JSON logging with correlation IDs',
        'Expose Prometheus-compatible /metrics and liveness/readiness health endpoints',
      ],
      explanation: `You cannot manage what you cannot measure. Understand observability: logging, metrics, and tracing. Build systems that proactively report their operational health and performance bottlenecks.`,
      exercises: [
        'Implement correlation ID propagation across all incoming requests and outgoing calls',
        'Create a Prometheus /metrics endpoint tracking latency percentiles (p50, p95, p99)',
      ],
      assignments: ['Configure a local Grafana dashboard visualizing real-time request rates and error ratios'],
      milestone: 'Production Observability Ready',
      outcomes: ['Ability to instrument, trace, and monitor distributed systems in production'],
    },
    {
      title: 'System Design Drills & 3-Month Interview Sprint',
      topics: ['Scalability Principles', 'System Design Whiteboarding', 'Mock Coding Drills', 'STAR Behavioral'],
      objectives: [
        `Solve high-level system design prompts relevant to ${cleanRole}`,
        'Perform live coding problem sprints explaining time and space complexity clearly',
        'Formulate behavioral scenarios addressing engineering conflicts and delivery deadlines',
      ],
      explanation: `Synthesize your technical knowledge for technical hiring bars. Practice whiteboarding scalable architectures, calculating throughput and storage needs, and delivering confident behavioral answers.`,
      exercises: [
        `Draw an end-to-end system design for a high-traffic ${cleanRole} platform`,
        'Practice 3 timed mock interview coding questions explaining trade-offs aloud',
      ],
      assignments: ['Complete a full recorded mock technical interview session and self-critique scorecard'],
      milestone: 'Month 3 Milestone: Interview Ready & System Design Certified',
      outcomes: ['Confidence answering architecture, live coding, and behavioral interview questions'],
    },
    {
      title: 'Microservices, API Gateways & Service Discovery',
      topics: ['Microservice Decomposition', 'API Gateway Patterns', 'gRPC vs REST', 'Circuit Breakers'],
      objectives: [
        'Decompose monolithic domains into bounded contexts and decoupled services',
        'Implement an API Gateway routing requests, terminating SSL, and enforcing rate limits',
        'Apply resilience patterns including circuit breakers, fallbacks, and bulkheads',
      ],
      explanation: `Explore microservice architectures, inter-service RPC protocols (gRPC, protocol buffers), API gateways, and fault isolation mechanisms that prevent cascading failures.`,
      exercises: [
        'Build a mini-service architecture with an API gateway and two decoupled microservices',
        'Simulate service degradation and verify circuit breaker opens and falls back gracefully',
      ],
      assignments: ['Author an RFC detailing domain boundaries and communication contracts for microservices'],
      milestone: 'Microservices Architecture',
      outcomes: ['Ability to architect, route, and protect decoupled microservice networks'],
    },
    {
      title: 'Performance Optimization, Profiling & Memory Tuning',
      topics: ['CPU & Memory Profiling', 'Flame Graphs', 'Bundle/Binary Optimization', 'Connection Pooling'],
      objectives: [
        'Identify CPU hotspots and memory leaks using interactive profilers and flame graphs',
        'Tune garbage collection, heap allocations, and database connection pools',
        'Optimize asset payloads, response compression, and network transfer sizes',
      ],
      explanation: `Shift focus toward extreme engineering efficiency. Learn how to profile execution bottlenecks, inspect memory retention paths, eliminate memory leaks, and optimize throughput under load.`,
      exercises: [
        'Profile an application under simulated 500 req/sec load and capture a CPU flame graph',
        'Resolve a deliberate memory leak and demonstrate flat memory profile across 10,000 requests',
      ],
      assignments: ['Submit a performance benchmarking report detailing latency reductions and resource savings'],
      milestone: 'High Performance Certified',
      outcomes: ['Empirical mastery of profiling tools, memory leak resolution, and latency tuning'],
    },
    {
      title: 'Advanced Testing: Load, Chaos & Contract Verification',
      topics: ['Load Testing (k6/JMeter)', 'Chaos Engineering', 'Pact Contract Testing', 'Fuzzing'],
      objectives: [
        'Author realistic load test scripts simulating peak traffic and stress conditions',
        'Execute consumer-driven contract tests to prevent breaking API changes',
        'Introduce chaos experiments testing system resilience during unexpected node terminations',
      ],
      explanation: `Verify that systems withstand adverse production conditions. Study load testing with k6 or JMeter, consumer-driven contract testing (Pact), and chaos engineering principles.`,
      exercises: [
        'Write a k6 script ramping up to 1,000 concurrent virtual users and measuring SLO thresholds',
        'Configure automated contract verification between frontend consumer and backend provider',
      ],
      assignments: ['Document a Chaos Engineering game day testing database failover with zero data loss'],
      milestone: 'Resilience Engineering Certified',
      outcomes: ['Confidence verifying system stability under extreme load and unexpected failures'],
    },
    {
      title: 'Enterprise Multi-Tier Project & 4-Month Milestone',
      topics: ['Enterprise Architecture', 'Multi-tenant Security', 'Production CI/CD', 'Documentation'],
      objectives: [
        `Deliver a complex multi-tier enterprise project tailored to ${cleanRole}`,
        'Integrate automated linting, security scans, unit tests, and smoke tests into CI/CD',
        'Author comprehensive developer documentation including architecture decision records (ADRs)',
      ],
      explanation: `Milestone 4: Deliver a comprehensive enterprise-grade solution featuring multi-tier separation, automated testing, observability, and infrastructure deployment pipelines.`,
      exercises: [
        'Implement enterprise security, role delegation, and audit logging in your project',
        'Build a zero-downtime deployment pipeline with automated rollback on health check failure',
      ],
      assignments: ['Publish the enterprise project repository with complete ADRs, API docs, and architecture diagrams'],
      milestone: 'Month 4 Milestone: Enterprise Production Platform',
      outcomes: ['A demonstrable enterprise application built to industrial production standards'],
    },
    {
      title: 'Cloud-Native Kubernetes & Cluster Orchestration',
      topics: ['Kubernetes Manifests', 'ConfigMaps & Secrets', 'Deployments & HPA', 'Ingress Controllers'],
      objectives: [
        'Author declarative Kubernetes deployment, service, and ingress manifests',
        'Configure Horizontal Pod Autoscaling (HPA) responding dynamically to CPU/memory metrics',
        'Safely manage runtime secrets and configuration outside container images',
      ],
      explanation: `Learn Kubernetes cluster orchestration: authoring Pod specs, Deployments, Services, ConfigMaps, and Ingress routing rules. Understand rollout strategies (RollingUpdate, Canary).`,
      exercises: [
        'Deploy an application into a local Kubernetes cluster (k3s/Minikube) with 3 replicas',
        'Simulate high load and demonstrate horizontal pod autoscaler scaling replicas to 6',
      ],
      assignments: ['Create Helm charts or Kustomize overlays for development, staging, and production environments'],
      milestone: 'Kubernetes Orchestration Ready',
      outcomes: ['Proficiency deploying, scaling, and managing containerized workloads on Kubernetes'],
    },
    {
      title: 'Event Streaming, Kafka & Distributed State',
      topics: ['Kafka Architecture', 'Topics & Partitions', 'Consumer Groups', 'Idempotent Consumers'],
      objectives: [
        'Understand partition keys, consumer offsets, and parallel stream processing in Kafka',
        'Build event-driven consumers with deduplication, dead-letter queues, and retries',
        'Implement transactional outbox patterns for reliable database-event synchronization',
      ],
      explanation: `Explore event streaming architectures with Apache Kafka or RabbitMQ. Study partition strategies, ordering guarantees, consumer rebalancing, and eventual consistency patterns.`,
      exercises: [
        'Set up a Kafka cluster and publish structured domain events with schema validation',
        'Build a resilient consumer group with dead-letter queue routing for failed messages',
      ],
      assignments: ['Implement the Transactional Outbox pattern ensuring 100% reliable event dispatching'],
      milestone: 'Event Streaming Certified',
      outcomes: ['Ability to build scalable, fault-tolerant event-driven streaming pipelines'],
    },
    {
      title: 'Production Hardening, SRE Principles & Disaster Recovery',
      topics: ['Disaster Recovery (RTO/RPO)', 'Backup Automation', 'Zero-Downtime Migration', 'Post-Mortems'],
      objectives: [
        'Establish recovery time objectives (RTO) and recovery point objectives (RPO)',
        'Execute zero-downtime database migrations using expand/contract patterns',
        'Author blameless post-mortem documents following production incident simulations',
      ],
      explanation: `Production readiness requires planning for inevitable failure. Study disaster recovery runbooks, multi-region failover, blue/green deployments, and constructive post-mortem culture.`,
      exercises: [
        'Perform a multi-phase database schema migration with zero downtime during active traffic',
        'Draft a comprehensive disaster recovery runbook for key services and databases',
      ],
      assignments: ['Write a detailed, blameless post-mortem analysis for a simulated production outage'],
      milestone: 'SRE Production Hardened',
      outcomes: ['Confidence managing critical production incidents and architecting disaster recovery'],
    },
    {
      title: 'Flagship Architecture Project & 5-Month Milestone',
      topics: ['Large-scale Integration', 'Telemetry Dashboards', 'Edge Cases', 'Executive Demo'],
      objectives: [
        `Complete a flagship technical application that demonstrates senior-level ${cleanRole} mastery`,
        'Demonstrate distributed tracing, zero-downtime rollouts, and automated alerting',
        'Present technical architectural decisions clearly to both engineering and executive audiences',
      ],
      explanation: `Month 5 milestone: Deliver a flagship technical project that exhibits senior-grade architecture, resilience, high availability, and comprehensive observability.`,
      exercises: [
        'Integrate end-to-end tracing across all microservices and database tiers in your flagship app',
        'Record a high-level architectural walkthrough highlighting scalability and security decisions',
      ],
      assignments: ['Deliver the complete flagship project code repository with live production URL and metrics'],
      milestone: 'Month 5 Milestone: Flagship Production Architecture',
      outcomes: ['A showcase-level system demonstrating advanced engineering maturity and leadership'],
    },
    {
      title: 'Open Source Contribution, Code Review & Tech Leadership',
      topics: ['Open Source Workflows', 'RFC Authoring', 'Engineering Mentorship', 'Code Review Mastery'],
      objectives: [
        'Contribute meaningful pull requests to reputable open source projects in your ecosystem',
        'Author a formal Request for Comments (RFC) proposing an architectural evolution',
        'Conduct rigorous, empathetic code reviews that elevate team quality and knowledge',
      ],
      explanation: `Great engineers don't just write code; they multiply team impact. Learn how to write architectural RFCs, review code constructively, and contribute to open source software.`,
      exercises: [
        'Fork a popular open source library in your stack, fix an issue, and submit a documented PR',
        'Write an architectural RFC evaluating two competing technologies with clear decision matrices',
      ],
      assignments: ['Review 3 complex pull requests providing thorough, constructive architectural feedback'],
      milestone: 'Engineering Leadership Ready',
      outcomes: ['Demonstrated ability to drive technical direction and contribute to broader developer ecosystems'],
    },
    {
      title: 'Advanced System Design & Distributed Trade-off Defense',
      topics: ['CAP Theorem & PACELC', 'Consensus Algorithms (Raft/Paxos)', 'Geo-Distributed Systems', 'Cost Optimization'],
      objectives: [
        'Defend architectural choices between strong consistency vs eventual consistency under partitions',
        'Design globally-distributed architectures with low-latency edge caching and data sharding',
        'Analyze cloud infrastructure cost models and optimize compute/storage efficiency',
      ],
      explanation: `Prepare for staff and senior architectural evaluations. Deep dive into the PACELC theorem, consensus protocols (Raft, Paxos), geo-replication, dynamic data sharding, and cost optimization.`,
      exercises: [
        'Design a globally distributed storage engine with multi-region replication and conflict resolution',
        'Model the cloud infrastructure monthly cost of serving 10M daily active users and optimize by 40%',
      ],
      assignments: ['Whiteboard and defend a 10M DAU system architecture during a live timed peer review'],
      milestone: 'Staff-Level Architecture Defense',
      outcomes: ['Mastery in defending deep architectural trade-offs, consensus models, and cloud economics'],
    },
    {
      title: 'Elite Technical Interview Drills & Behavioral Mastery',
      topics: ['Live Coding Sprints', 'High-Frequency Patterns', 'Executive Communication', 'Salary Negotiation'],
      objectives: [
        'Solve advanced technical problems with crystal-clear verbal reasoning under time pressure',
        'Master high-impact behavioral frameworks highlighting leadership, mentorship, and ownership',
        'Navigate technical offer evaluation, total compensation breakdown, and negotiation strategies',
      ],
      explanation: `Polish your interview readiness to peak performance. Practice real-time coding sprints, clear vocal communication, whiteboard trade-off framing, and strategic compensation negotiation.`,
      exercises: [
        'Complete 5 live timed algorithm sprints with full test coverage and complexity analysis',
        'Prepare 6 polished STAR stories covering project failures, technical disputes, and high-impact wins',
      ],
      assignments: ['Record a comprehensive behavioral and technical interview response reel for self-review'],
      milestone: 'Elite Interview Mastery',
      outcomes: ['Peak confidence and fluency across live technical, system design, and leadership interviews'],
    },
    {
      title: 'Career Launch, Portfolio Finalization & 6-Month Graduation',
      topics: ['Portfolio Showcase', 'Resume Optimization', 'Targeted Job Applications', 'Continuous Growth'],
      objectives: [
        `Publish a polished, professional developer portfolio highlighting verified ${cleanRole} projects`,
        'Optimize resume and online profiles with quantifiable business impact and technical metrics',
        'Establish a 12-month continuous learning and career advancement roadmap',
      ],
      explanation: `Graduation week! Finalize your engineering portfolio, publish live links to your capstone projects, polish your resume with quantifiable metrics, and launch your targeted career campaign.`,
      exercises: [
        `Publish your live portfolio website featuring code repositories and video walkthroughs for ${cleanRole}`,
        'Format your technical resume highlighting quantifiable impact (e.g. latency, throughput, scale)',
      ],
      assignments: ['Submit 10 targeted job applications or interview schedules with tailored cover briefs'],
      milestone: 'Month 6 Milestone: Career Graduation & Job Ready',
      outcomes: ['Complete transformation into a job-ready, high-impact professional with a verified portfolio'],
    },
  ];

  // Select the appropriate modules matching totalWeeks
  // For 4 weeks (1 month), use weeks [0, 1, 2, 3]
  // For 8 weeks (2 months), use weeks [0, 1, 2, 3, 4, 5, 6, 7]
  // For 12 weeks (3 months), use weeks [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  // For 16 weeks (4 months), use weeks [0..15]
  // For 20 weeks (5 months), use weeks [0..19]
  // For 24 weeks (6 months), use weeks [0..23]
  const selectedModules = modules.slice(0, totalWeeks);

  const generatedWeeks: RoadmapWeekData[] = selectedModules.map((m, idx) => {
    const weekNum = idx + 1;
    // Rotate and pick 2-3 relevant resources from resourcePool
    const r1 = resourcePool[idx % resourcePool.length];
    const r2 = resourcePool[(idx + 1) % resourcePool.length];
    const r3 = resourcePool[(idx + 2) % resourcePool.length];
    const uniqueResources = [r1, r2, r3].filter(
      (res, i, self) => self.findIndex((s) => s.url === res.url) === i
    );

    return {
      weekNumber: weekNum,
      title: m.title,
      learningObjectives: m.objectives,
      topics: m.topics,
      detailedExplanation: m.explanation,
      estimatedHours: '10-14 hours',
      resources: uniqueResources,
      practicalExercises: m.exercises,
      weeklyAssignments: m.assignments,
      projectMilestone: m.milestone,
      expectedOutcomes: m.outcomes,
    };
  });

  // Backward-compatible learning topics (stages)
  const fallbackTopics: RoadmapTopicData[] = [
    {
      stage: 'Phase 1: Deep Architectural Foundations',
      title: `${cleanRole} Core Runtime & Tooling`,
      description: `Master core runtime mechanics, language semantics, and memory profiling for ${cleanRole}.`,
      duration: `${Math.ceil(totalWeeks / 4)} Weeks`,
      resources: resourcePool.slice(0, 2).map((r) => r.title),
    },
    {
      stage: 'Phase 2: Scalable Architecture & Data Layer',
      title: 'Data Modeling, APIs & Asynchronous Communication',
      description: 'Implement distributed transactions, data modeling, caching tiers, and API contracts.',
      duration: `${Math.ceil(totalWeeks / 4)} Weeks`,
      resources: resourcePool.slice(2, 4).map((r) => r.title),
    },
    {
      stage: 'Phase 3: Production Engineering & Cloud Operations',
      title: 'Containerization, CI/CD & Observability',
      description: 'Configure telemetry pipelines, container orchestration, and zero-downtime rollouts.',
      duration: `${Math.ceil(totalWeeks / 4)} Weeks`,
      resources: resourcePool.slice(0, 3).map((r) => r.title),
    },
    {
      stage: 'Phase 4: Capstone Execution & Interview Mastery',
      title: 'System Design Whiteboarding & Live Coding Defense',
      description: 'Lead high-level system trade-off debates, technical mentoring, and interview sprints.',
      duration: `${Math.max(1, totalWeeks - Math.ceil(totalWeeks / 4) * 3)} Weeks`,
      resources: ['System Design Primer', 'LeetCode Interview Prep'],
    },
  ];

  return {
    jobRole: cleanRole,
    targetLevel: `${months} Months (${totalWeeks} Weeks)`,
    durationMonths: months,
    totalWeeks,
    weeks: generatedWeeks,
    requiredSkills: [
      `${cleanRole} Core Architecture & Best Practices`,
      'Data Modeling, Queries & Distributed Caching',
      'Security Hardening, OWASP & Access Control',
      'DevOps, CI/CD, Containerization & Cloud Deployment',
      'Observability, Telemetry & Performance Tuning',
    ],
    learningTopics: fallbackTopics,
    progression: [
      `Month 1: Core Fundamentals, Tooling & Mini-Project`,
      months >= 2 ? `Month 2: Modern Frameworks, Data Modeling & Production Capstone` : '',
      months >= 3 ? `Month 3: Advanced Architecture, Caching & System Design Drills` : '',
      months >= 4 ? `Month 4: Enterprise Multi-Tier Systems, Testing & Observability` : '',
      months >= 5 ? `Month 5: Kubernetes, Event Streaming & Flagship Architecture` : '',
      months >= 6 ? `Month 6: Open Source Leadership, System Defense & Career Graduation` : '',
    ].filter(Boolean),
    interviewPreparation: [
      `Practice live coding algorithms and data structures with time & space complexity justification`,
      `Whiteboard scalable architectures for ${cleanRole} addressing failure points and bottlenecks`,
      'Prepare behavioral examples using STAR framework covering engineering conflicts and project deadlines',
    ],
    areasToImprove: [
      'Avoid relying only on framework abstractions; master the underlying language runtime and network protocols',
      'Increase familiarity with production failure scenarios, circuit breaking, and graceful degradation',
      'Quantify engineering decisions in terms of latency (p99), throughput, and operational efficiency',
    ],
  };
}

/**
 * Normalizes learning topics for backward compatibility.
 */
export function cleanLearningTopics(val: any, role: string): RoadmapTopicData[] {
  const fallback = getCuratedRoadmap(role, 3).learningTopics;
  if (!val || !Array.isArray(val) || val.length === 0) return fallback;

  return val.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return {
        stage: `Phase ${idx + 1}`,
        title: item,
        description: `Master key concepts and engineering principles for ${item}.`,
        duration: '3-4 Weeks',
        resources: ['Official Documentation', 'Recommended Guides'],
      };
    }
    return {
      stage: cleanString(item.stage || `Phase ${idx + 1}`),
      title: cleanString(item.title || item.topic, `Milestone ${idx + 1}`),
      description: cleanString(item.description, 'Comprehensive study and practical projects.'),
      duration: cleanString(item.duration, '3-4 Weeks'),
      resources: cleanStringArray(item.resources, ['Official Documentation']),
    };
  });
}

function normalizeResource(raw: any, fallbackUrl = 'https://developer.mozilla.org'): RoadmapResourceData {
  if (typeof raw === 'string') {
    return {
      title: raw.trim(),
      description: `Official documentation and learning guide for ${raw.trim()}`,
      type: 'Documentation',
      url: raw.startsWith('http') ? raw.trim() : fallbackUrl,
    };
  }

  const title = cleanString(raw?.title || raw?.name, 'Official Learning Documentation');
  const description = cleanString(raw?.description || raw?.desc, 'Essential documentation and practical examples.');
  const type = cleanString(raw?.type || raw?.category, 'Documentation');
  let url = cleanString(raw?.url || raw?.link);

  if (!url || !url.startsWith('http')) {
    url = fallbackUrl;
  }

  return { title, description, type, url };
}

/**
 * Normalizes arbitrary AI output into a strict week-wise roadmap.
 * Guarantees compliance with IRoadmap schema and exact totalWeeks count.
 */
export function normalizeRoadmapData(
  raw: any,
  role: string,
  durationMonthsOrLevel: number | string = 3
): RoadmapData {
  const safeData = raw && typeof raw === 'object' ? raw : {};
  const cleanRole = cleanString(safeData.jobRole || role, role || 'Full Stack Software Engineer');

  // Parse durationMonths safely
  let durationMonths = 3;
  if (typeof durationMonthsOrLevel === 'number') {
    durationMonths = durationMonthsOrLevel;
  } else if (typeof durationMonthsOrLevel === 'string') {
    const parsed = parseInt(durationMonthsOrLevel, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
      durationMonths = parsed;
    }
  } else if (safeData.durationMonths) {
    const parsed = parseInt(String(safeData.durationMonths), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
      durationMonths = parsed;
    }
  }

  durationMonths = Math.min(6, Math.max(1, durationMonths));
  const expectedWeeks = durationMonths * 4;

  // Generate fallback base to borrow authentic content or missing weeks if needed
  const curatedBase = getCuratedRoadmap(cleanRole, durationMonths);

  // Parse & normalize weeks array
  let weeks: RoadmapWeekData[] = [];
  const rawWeeks = Array.isArray(safeData.weeks)
    ? safeData.weeks
    : Array.isArray(safeData.weeklyRoadmap)
    ? safeData.weeklyRoadmap
    : Array.isArray(safeData.curriculum)
    ? safeData.curriculum
    : [];

  if (rawWeeks.length > 0) {
    weeks = rawWeeks.map((item: any, idx: number) => {
      const weekNum = idx + 1;
      const fallbackItem = curatedBase.weeks[idx] || curatedBase.weeks[curatedBase.weeks.length - 1];

      const title = cleanString(
        item.title || item.weekTitle || item.name || item.topic,
        fallbackItem.title
      );

      const learningObjectives = cleanStringArray(
        item.learningObjectives || item.objectives || item.goals,
        fallbackItem.learningObjectives
      );

      const topics = cleanStringArray(
        item.topics || item.topicsToLearn || item.skills,
        fallbackItem.topics
      );

      const detailedExplanation = cleanString(
        item.detailedExplanation || item.explanation || item.description || item.overview,
        fallbackItem.detailedExplanation
      );

      const estimatedHours = cleanString(
        item.estimatedHours || item.hours || item.studyHours,
        fallbackItem.estimatedHours
      );

      let resources: RoadmapResourceData[] = [];
      const rawResources = item.resources || item.links || item.materials;
      if (Array.isArray(rawResources) && rawResources.length > 0) {
        resources = rawResources.map((r: any, rIdx: number) => {
          const fallbackRes = fallbackItem.resources[rIdx % fallbackItem.resources.length];
          return normalizeResource(r, fallbackRes.url);
        });
      } else {
        resources = [...fallbackItem.resources];
      }

      const practicalExercises = cleanStringArray(
        item.practicalExercises || item.exercises || item.codingTasks || item.practice,
        fallbackItem.practicalExercises
      );

      const weeklyAssignments = cleanStringArray(
        item.weeklyAssignments || item.assignments || item.tasks,
        fallbackItem.weeklyAssignments
      );

      const projectMilestone = cleanString(
        item.projectMilestone || item.milestone || item.project,
        fallbackItem.projectMilestone || ''
      );

      const expectedOutcomes = cleanStringArray(
        item.expectedOutcomes || item.outcomes || item.expectedOutcome,
        fallbackItem.expectedOutcomes
      );

      return {
        weekNumber: weekNum,
        title,
        learningObjectives,
        topics,
        detailedExplanation,
        estimatedHours,
        resources,
        practicalExercises,
        weeklyAssignments,
        projectMilestone,
        expectedOutcomes,
      };
    });
  }

  // Ensure EXACTLY expectedWeeks weeks
  if (weeks.length < expectedWeeks) {
    // Fill remaining weeks from curated base
    for (let i = weeks.length; i < expectedWeeks; i++) {
      const template = curatedBase.weeks[i] || curatedBase.weeks[curatedBase.weeks.length - 1];
      weeks.push({
        ...template,
        weekNumber: i + 1,
      });
    }
  } else if (weeks.length > expectedWeeks) {
    weeks = weeks.slice(0, expectedWeeks);
  }

  // Fix week numbers to be 1..expectedWeeks
  weeks.forEach((w, i) => {
    w.weekNumber = i + 1;
  });

  const requiredSkills = cleanStringArray(
    safeData.requiredSkills || safeData.skills,
    curatedBase.requiredSkills
  );

  const progression = cleanStringArray(
    safeData.progression || safeData.milestones,
    curatedBase.progression
  );

  const interviewPreparation = cleanStringArray(
    safeData.interviewPreparation || safeData.interviewPrep,
    curatedBase.interviewPreparation
  );

  const areasToImprove = cleanStringArray(
    safeData.areasToImprove || safeData.improvements,
    curatedBase.areasToImprove
  );

  const learningTopics = cleanLearningTopics(
    safeData.learningTopics || safeData.stages,
    cleanRole
  );

  return {
    jobRole: cleanRole,
    targetLevel: `${durationMonths} Months (${expectedWeeks} Weeks)`,
    durationMonths,
    totalWeeks: expectedWeeks,
    weeks,
    requiredSkills,
    learningTopics,
    progression,
    interviewPreparation,
    areasToImprove,
  };
}
