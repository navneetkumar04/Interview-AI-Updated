export interface QuestionGuidance {
  evaluationCriteria: string;
  keyPoints: string[];
  commonMistakes: string[];
  exampleStructure: string;
}

export interface InterviewQuestion {
  questionId: string;
  questionNumber: number;
  questionText: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  suggestedRole: string;
  guidance: QuestionGuidance;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // CATEGORY A: HR AND PERSONAL INTRODUCTION (1-10)
  {
    questionId: 'q1',
    questionNumber: 1,
    questionText: 'Tell me about yourself.',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Communication clarity, professional narrative, self-awareness, and relevance to the target job.',
      keyPoints: [
        'Present: Your current role, key technical focus, and primary responsibilities.',
        'Past: Relevant academic background, prior achievements, and key projects.',
        'Future: Why you are passionate about this role and company.',
      ],
      commonMistakes: [
        'Reciting your entire resume chronologically.',
        'Sharing unrelated personal life stories.',
        'Speaking longer than 2 minutes without focus.',
      ],
      exampleStructure: 'Present (current focus) -> Past (key technical accomplishments) -> Future (why this role excites you).',
    },
  },
  {
    questionId: 'q2',
    questionNumber: 2,
    questionText: 'Walk me through your resume.',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Ability to summarize career milestones, explain transitions, and highlight impact.',
      keyPoints: [
        'Focus on highlights and growth between roles.',
        'Mention tangible business or engineering results.',
        'Keep the walkthrough concise and forward-looking.',
      ],
      commonMistakes: ['Reading line by line without emphasizing achievements.', 'Failing to explain job changes.'],
      exampleStructure: 'Overview of educational foundation -> Career progression highlights -> Current specialization.',
    },
  },
  {
    questionId: 'q3',
    questionNumber: 3,
    questionText: 'What are your greatest strengths?',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Confidence, technical competence, and supporting evidence with real examples.',
      keyPoints: [
        'Pick 2-3 strengths directly applicable to the job (e.g. system debugging, architectural design).',
        'Back up each strength with a concrete project story.',
      ],
      commonMistakes: ['Listing generic adjectives without proof.', 'Naming strengths irrelevant to the role.'],
      exampleStructure: 'Identify strength -> Share a concrete situation where it drove impact -> Connect to target role.',
    },
  },
  {
    questionId: 'q4',
    questionNumber: 4,
    questionText: 'What is one weakness you are working to improve?',
    category: 'HR and Personal Introduction',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Humility, self-awareness, and proactive commitment to continuous self-improvement.',
      keyPoints: [
        'Choose a genuine professional skill gap (e.g., public speaking, estimating edge cases).',
        'Explain the concrete actions and tools you are taking to improve.',
      ],
      commonMistakes: ['Disguised strengths like "I work too hard".', 'Disclosing a deal-breaker weakness for the role.'],
      exampleStructure: 'State genuine weakness -> Explain recognition moment -> Detail remediation steps and current progress.',
    },
  },
  {
    questionId: 'q5',
    questionNumber: 5,
    questionText: 'Why should we hire you?',
    category: 'HR and Personal Introduction',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Value proposition, understanding of the company pain points, and role readiness.',
      keyPoints: [
        'Align your technical capabilities with the team immediate challenges.',
        'Highlight adaptability and team culture contribution.',
      ],
      commonMistakes: ['Focusing on what the company gives you instead of what you provide.', 'Generic statements.'],
      exampleStructure: 'Unique combination of skills -> Past track record of solving similar problems -> Enthusiastic commitment.',
    },
  },
  {
    questionId: 'q6',
    questionNumber: 6,
    questionText: 'Why do you want to work for our company?',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Company research, genuine passion, and cultural alignment.',
      keyPoints: [
        'Reference specific company products, mission, or engineering blog posts.',
        'Explain why their technical problems or industry position excites you.',
      ],
      commonMistakes: ['Admitting you know little about the company.', 'Focusing only on compensation or perks.'],
      exampleStructure: 'Specific product/tech admiration -> Cultural alignment -> How your goals merge with their roadmap.',
    },
  },
  {
    questionId: 'q7',
    questionNumber: 7,
    questionText: 'What motivates you?',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Internal drive, curiosity, work ethic, and team collaboration.',
      keyPoints: [
        'Discuss solving complex technical puzzles, delivering customer value, or mastering new tools.',
        'Tie motivation to sustainable engineering excellence.',
      ],
      commonMistakes: ['Answering solely with money or titles.', 'Sounding detached from craftsmanship.'],
      exampleStructure: 'Core passion -> Concrete scenario that energized you -> How you sustain that energy daily.',
    },
  },
  {
    questionId: 'q8',
    questionNumber: 8,
    questionText: 'Where do you see yourself in five years?',
    category: 'HR and Personal Introduction',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Ambition, commitment, realistic goal-setting, and career trajectory.',
      keyPoints: [
        'Outline technical mastery (e.g. Staff/Principal or Tech Lead path).',
        'Express desire to mentor others and take end-to-end system ownership.',
      ],
      commonMistakes: ['Saying "doing your job".', 'Expressing goals entirely outside software engineering.'],
      exampleStructure: 'Deepening domain expertise -> Expanding architectural leadership -> Multiplying team impact.',
    },
  },
  {
    questionId: 'q9',
    questionNumber: 9,
    questionText: 'Describe a challenge you faced and how you handled it.',
    category: 'HR and Personal Introduction',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Resilience, problem-solving methodology, emotional composure, and outcome.',
      keyPoints: [
        'Use the STAR method (Situation, Task, Action, Result).',
        'Highlight analytical troubleshooting and stakeholder communication.',
      ],
      commonMistakes: ['Blaming others.', 'Choosing a trivial challenge.'],
      exampleStructure: 'Situation context -> Obstacle encountered -> Actions taken -> Positive measurable outcome.',
    },
  },
  {
    questionId: 'q10',
    questionNumber: 10,
    questionText: 'Why did you choose your field of study?',
    category: 'HR and Personal Introduction',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Authentic interest in technology and continuous learning.',
      keyPoints: [
        'Describe the initial spark that drew you to computer science and programming.',
        'Explain how building real software confirmed your passion.',
      ],
      commonMistakes: ['Saying family forced you.', 'Showing lack of genuine curiosity.'],
      exampleStructure: 'Initial spark -> Early discovery project -> Lifelong fascination with automation and code.',
    },
  },

  // CATEGORY B: PROJECTS AND EXPERIENCE (11-20)
  {
    questionId: 'q11',
    questionNumber: 11,
    questionText: 'Explain your most important academic project.',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Technical depth, system architecture understanding, and clear communication.',
      keyPoints: [
        'State the core problem, architecture, stack choices, and your personal contributions.',
        'Quantify results (e.g. latency, users, test coverage).',
      ],
      commonMistakes: ['Describing the project vaguely without architecture.', 'Taking credit for team members work.'],
      exampleStructure: 'Project objective -> Architectural topology -> Your core modules -> Results achieved.',
    },
  },
  {
    questionId: 'q12',
    questionNumber: 12,
    questionText: 'What problem does your project solve?',
    category: 'Projects and Experience',
    difficulty: 'Beginner',
    suggestedRole: 'Full Stack Developer',
    guidance: {
      evaluationCriteria: 'Product thinking, user empathy, and business value articulation.',
      keyPoints: [
        'Identify target users and their pain points before your solution existed.',
        'Demonstrate how the application solved those pain points efficiently.',
      ],
      commonMistakes: ['Diving into code without explaining the purpose.', 'Building solutions looking for a problem.'],
      exampleStructure: 'User pain point -> Your solution approach -> Measurable efficiency gain.',
    },
  },
  {
    questionId: 'q13',
    questionNumber: 13,
    questionText: 'What technologies did you use and why?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'Full Stack Developer',
    guidance: {
      evaluationCriteria: 'Architectural trade-off justification over hype or novelty.',
      keyPoints: [
        'Justify why framework X or database Y was chosen over alternatives.',
        'Discuss constraints such as developer velocity, data schema flexibility, or performance.',
      ],
      commonMistakes: ['Saying "I used it because it was trendy".', 'Not knowing the downsides of chosen tools.'],
      exampleStructure: 'Stack overview -> Deep-dive trade-off for 1-2 key choices -> Lessons learned.',
    },
  },
  {
    questionId: 'q14',
    questionNumber: 14,
    questionText: 'What was your biggest technical challenge?',
    category: 'Projects and Experience',
    difficulty: 'Advanced',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Debugging capability, perseverance, and root-cause analysis.',
      keyPoints: [
        'Describe an architectural, performance, or concurrency bottleneck.',
        'Detail your systematic hypothesis-testing approach and final resolution.',
      ],
      commonMistakes: ['Choosing a minor syntax error.', 'Failing to explain how you fixed it.'],
      exampleStructure: 'Context -> Root cause identification -> Engineering solution -> Verification.',
    },
  },
  {
    questionId: 'q15',
    questionNumber: 15,
    questionText: 'How did you debug a difficult issue?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Methodical debugging, telemetry usage, and log analysis.',
      keyPoints: [
        'Explain step-by-step isolation: reproducing, analyzing logs, profiling, and fixing.',
        'Mention adding regression tests to prevent recurrence.',
      ],
      commonMistakes: ['Describing random trial-and-error guessing.', 'Neglecting automated regression tests.'],
      exampleStructure: 'Symptom -> Isolation methodology -> Root cause pinpoint -> Regression test.',
    },
  },
  {
    questionId: 'q16',
    questionNumber: 16,
    questionText: 'What would you improve in your project?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Critical thinking, technical debt awareness, and architectural maturity.',
      keyPoints: [
        'Highlight architectural improvements (e.g. caching, microservices, CI/CD, security).',
        'Show awareness of modern scalability limits in your initial design.',
      ],
      commonMistakes: ['Claiming the project was 100% flawless.', 'Lacking ideas for technical evolution.'],
      exampleStructure: 'Current limitation -> Ideal architectural enhancement -> Expected performance gain.',
    },
  },
  {
    questionId: 'q17',
    questionNumber: 17,
    questionText: 'How did you divide responsibilities in a team project?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Collaboration, interface contract agreement, and team delegation.',
      keyPoints: [
        'Describe establishing API contracts, Git branching conventions, and sprint planning.',
        'Explain how team strengths were leveraged while maintaining shared ownership.',
      ],
      commonMistakes: ['Working in silos without contract agreements.', 'Complaining about team members.'],
      exampleStructure: 'Contract definition -> Task breakdown -> Integration syncs -> Delivery.',
    },
  },
  {
    questionId: 'q18',
    questionNumber: 18,
    questionText: 'How did you test your project?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Quality assurance mindset, test automation, and test pyramid understanding.',
      keyPoints: [
        'Explain unit testing, integration testing, and end-to-end user journey validation.',
        'Mention mock data, CI/CD pipeline runs, and edge case coverage.',
      ],
      commonMistakes: ['Saying "I only tested manually in the browser".', 'No mention of automated tests.'],
      exampleStructure: 'Test pyramid approach -> Tools used (Jest/Pytest/Cypress) -> Automated pipeline integration.',
    },
  },
  {
    questionId: 'q19',
    questionNumber: 19,
    questionText: 'How would you explain your project to a non-technical person?',
    category: 'Projects and Experience',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Communication empathy, clarity, eliminating jargon, and analogical thinking.',
      keyPoints: [
        'Use simple real-world metaphors instead of database and framework jargon.',
        'Focus on the value delivered to human beings.',
      ],
      commonMistakes: ['Throwing around acronyms (REST, SQL, JWT).', 'Overcomplicating the message.'],
      exampleStructure: 'Relatable analogy -> Real-world problem solved -> Simple user benefit.',
    },
  },
  {
    questionId: 'q20',
    questionNumber: 20,
    questionText: 'What did you learn from your project?',
    category: 'Projects and Experience',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Growth mindset, reflection, and evolution as an engineer.',
      keyPoints: [
        'Highlight both technical insights (e.g. state management, indexing) and process insights (e.g. estimating, documentation).',
        'Explain how this learning shapes how you build software today.',
      ],
      commonMistakes: ['Saying you learned nothing new.', 'Focusing only on trivial syntax.'],
      exampleStructure: 'Key technical takeaway -> Key process takeaway -> Current engineering practice.',
    },
  },

  // CATEGORY C: PROGRAMMING FUNDAMENTALS (21-30)
  {
    questionId: 'q21',
    questionNumber: 21,
    questionText: 'What is the difference between a compiler and an interpreter?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Computer science fundamentals and execution lifecycle understanding.',
      keyPoints: [
        'Compiler: Translates whole code ahead of time into machine/bytecode (e.g. C++, Rust, Java javac). Fast runtime, slower build.',
        'Interpreter: Translates and executes line by line at runtime (e.g. Python, early JS). Immediate feedback, slower execution.',
        'Mention modern JIT compilers (e.g. V8, JVM) that blend both.',
      ],
      commonMistakes: ['Thinking Java is purely compiled or JS is purely interpreted without mentioning JIT/bytecode.'],
      exampleStructure: 'Definitions -> Compilation vs Execution trade-offs -> JIT hybrid examples.',
    },
  },
  {
    questionId: 'q22',
    questionNumber: 22,
    questionText: 'Explain the difference between a stack and a queue.',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Data structure fundamentals and real-world system applications.',
      keyPoints: [
        'Stack: LIFO (Last-In, First-Out). Operations: push, pop (O(1)). Uses: call stack, undo/redo.',
        'Queue: FIFO (First-In, First-Out). Operations: enqueue, dequeue (O(1)). Uses: print spooler, message queues.',
      ],
      commonMistakes: ['Mixing up LIFO and FIFO.', 'Failing to mention time complexity of operations.'],
      exampleStructure: 'Principles -> Complexity -> Practical system applications.',
    },
  },
  {
    questionId: 'q23',
    questionNumber: 23,
    questionText: 'What is object-oriented programming?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Software paradigm principles and modular code organization.',
      keyPoints: [
        'OOP models real-world entities into reusable objects holding data (attributes) and behavior (methods).',
        'Promotes modularity, code reuse, and separation of concerns.',
      ],
      commonMistakes: ['Listing the 4 pillars without explaining the core paradigm rationale.'],
      exampleStructure: 'Paradigm definition -> Objects vs Classes -> Modularity benefits.',
    },
  },
  {
    questionId: 'q24',
    questionNumber: 24,
    questionText: 'Explain encapsulation, inheritance, polymorphism, and abstraction.',
    category: 'Programming Fundamentals',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Comprehensive grasp of the 4 OOP pillars with distinct examples.',
      keyPoints: [
        'Encapsulation: Bundling data and restricting direct access via access modifiers/getters/setters.',
        'Abstraction: Hiding complex internal logic and exposing clean interfaces.',
        'Inheritance: Mechanism where child class derives properties/behaviors from parent.',
        'Polymorphism: Ability of an entity to take multiple forms (compile-time overloading, runtime overriding).',
      ],
      commonMistakes: ['Confusing abstraction with encapsulation.'],
      exampleStructure: 'Define each pillar with a simple concrete code analogy.',
    },
  },
  {
    questionId: 'q25',
    questionNumber: 25,
    questionText: 'What is the difference between an array and a linked list?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Memory layout, cache locality, and algorithmic time complexity.',
      keyPoints: [
        'Array: Contiguous memory allocation. O(1) random access, O(n) insert/delete at arbitrary position. Great cache locality.',
        'Linked List: Non-contiguous nodes with pointers. O(n) access, O(1) insert/delete once node reference is known. Memory overhead for pointers.',
      ],
      commonMistakes: ['Forgetting memory locality and CPU caching benefits of arrays.'],
      exampleStructure: 'Memory topology -> Time complexities comparison -> When to choose which.',
    },
  },
  {
    questionId: 'q26',
    questionNumber: 26,
    questionText: 'What is recursion?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Recursive thinking, call stack understanding, and termination safety.',
      keyPoints: [
        'Function calling itself until reaching a defined base case.',
        'Must have: 1) Base case, 2) Recursive case progressing toward base case.',
        'Risks: Stack overflow if base case is omitted or recursion is too deep.',
      ],
      commonMistakes: ['Omitting the base case in code examples.', 'Not mentioning call stack memory consumption.'],
      exampleStructure: 'Definition -> Two essential components -> Call stack mechanics -> Memory trade-offs.',
    },
  },
  {
    questionId: 'q27',
    questionNumber: 27,
    questionText: 'What is the difference between pass-by-value and pass-by-reference?',
    category: 'Programming Fundamentals',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Memory management, pointer/reference semantics, and side effects.',
      keyPoints: [
        'Pass-by-value: Copy of actual value is passed; modifications inside function do not affect original caller.',
        'Pass-by-reference: Memory address/reference is passed; mutations alter the original variable.',
        'Clarify how language handles objects (e.g. JavaScript passes references by value).',
      ],
      commonMistakes: ['Assuming JavaScript is strictly pass-by-reference for objects without understanding reference copies.'],
      exampleStructure: 'Definitions -> Mutation effects -> Language-specific nuances.',
    },
  },
  {
    questionId: 'q28',
    questionNumber: 28,
    questionText: 'What is exception handling?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Error resilience, program stability, and clean failure modes.',
      keyPoints: [
        'Mechanism to handle runtime errors gracefully without crashing the application.',
        'Try, catch, finally, throw blocks.',
        'Distinguish between recoverable operational errors and unrecoverable programmer errors.',
      ],
      commonMistakes: ['Catching exceptions and silently swallowing them without logging.'],
      exampleStructure: 'Purpose -> Flow (try/catch/finally) -> Best practices for logging and graceful degradation.',
    },
  },
  {
    questionId: 'q29',
    questionNumber: 29,
    questionText: 'What is the difference between a process and a thread?',
    category: 'Programming Fundamentals',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Operating system concurrency, memory isolation, and context switching.',
      keyPoints: [
        'Process: Independent execution environment with its own isolated memory space. Heavyweight.',
        'Thread: Lightweight unit of execution within a process sharing the same address space and heap. Each thread has its own stack.',
        'Communication: Processes use IPC (sockets/pipes); threads use shared memory (requiring mutexes/locks).',
      ],
      commonMistakes: ['Thinking threads do not share heap memory.'],
      exampleStructure: 'Memory isolation comparison -> Creation & context switch overhead -> Communication differences.',
    },
  },
  {
    questionId: 'q30',
    questionNumber: 30,
    questionText: 'What is time complexity?',
    category: 'Programming Fundamentals',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Big-O notation understanding and algorithmic efficiency evaluation.',
      keyPoints: [
        'Mathematical characterization of how algorithm runtime grows relative to input size n.',
        'Big-O represents upper bound worst-case scenario.',
        'Common classes: O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n).',
      ],
      commonMistakes: ['Confusing time complexity with exact clock execution seconds.'],
      exampleStructure: 'Definition -> Why hardware-independent scaling matters -> Common Big-O hierarchy.',
    },
  },

  // CATEGORY D: DATA STRUCTURES AND ALGORITHMS (31-40)
  {
    questionId: 'q31',
    questionNumber: 31,
    questionText: 'What is the difference between linear search and binary search?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Search algorithm mechanics, prerequisites, and logarithmic complexity.',
      keyPoints: [
        'Linear Search: Scans elements sequentially. O(n) time. Works on unsorted collections.',
        'Binary Search: Divide-and-conquer on sorted data. O(log n) time. Requires sorted array.',
      ],
      commonMistakes: ['Forgetting that binary search strictly requires sorted data.'],
      exampleStructure: 'Prerequisites -> Algorithm mechanics -> Complexity comparison.',
    },
  },
  {
    questionId: 'q32',
    questionNumber: 32,
    questionText: 'Explain how a hash table works.',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Hash functions, collision resolution, and amortized complexity.',
      keyPoints: [
        'Maps keys to array indices using a deterministic hash function.',
        'Provides average O(1) lookup, insertion, and deletion.',
        'Collision resolution: Chaining (linked lists/trees) vs Open Addressing (linear/quadratic probing).',
      ],
      commonMistakes: ['Claiming hash tables are always O(1) without mentioning O(n) worst-case under severe collisions.'],
      exampleStructure: 'Hash function purpose -> Average vs worst-case complexity -> Collision handling techniques.',
    },
  },
  {
    questionId: 'q33',
    questionNumber: 33,
    questionText: 'What is the difference between a binary tree and a binary search tree?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Tree invariants, search properties, and balancing.',
      keyPoints: [
        'Binary Tree: Each node has at most two children without ordering constraints.',
        'Binary Search Tree (BST): Strict ordering invariant (left child < parent < right child).',
        'Lookup: BST average O(log n), degraded O(n) if unbalanced. Balanced trees (AVL, Red-Black) guarantee O(log n).',
      ],
      commonMistakes: ['Assuming all binary search trees are automatically balanced.'],
      exampleStructure: 'Structural definition -> Invariant rule -> Complexity and balancing.',
    },
  },
  {
    questionId: 'q34',
    questionNumber: 34,
    questionText: 'What is the difference between BFS and DFS?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Graph traversal algorithms, data structures used, and appropriate use cases.',
      keyPoints: [
        'BFS (Breadth-First Search): Level-by-level traversal using a Queue (FIFO). Ideal for shortest paths in unweighted graphs.',
        'DFS (Depth-First Search): Explores as deep as possible before backtracking using a Stack or recursion. Ideal for topological sort, cycle detection.',
      ],
      commonMistakes: ['Mixing up queue vs stack for BFS and DFS.'],
      exampleStructure: 'Traversal methodology -> Supporting data structure -> Best use cases.',
    },
  },
  {
    questionId: 'q35',
    questionNumber: 35,
    questionText: 'Explain the time complexity of common sorting algorithms.',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Comparative algorithm analysis, stability, and space complexity.',
      keyPoints: [
        'Bubble/Selection/Insertion Sort: O(n^2) average/worst.',
        'Merge Sort: O(n log n) all cases. O(n) auxiliary space. Stable.',
        'Quick Sort: O(n log n) average, O(n^2) worst. In-place.',
      ],
      commonMistakes: ['Claiming Quick Sort is always O(n log n) without knowing worst-case.'],
      exampleStructure: 'Divide-and-conquer vs quadratic sorts -> Time and space trade-off table.',
    },
  },
  {
    questionId: 'q36',
    questionNumber: 36,
    questionText: 'How would you detect a cycle in a linked list?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Two-pointer technique (Floyd Cycle-Finding Algorithm) and space optimization.',
      keyPoints: [
        'Floyd Tortoise and Hare: slow pointer advances 1 step, fast pointer advances 2 steps.',
        'If pointers meet, a cycle exists. If fast reaches null, no cycle.',
        'O(n) time and O(1) space, superior to a hash set approach (O(n) space).',
      ],
      commonMistakes: ['Suggesting only hash sets without knowing the O(1) space two-pointer approach.'],
      exampleStructure: 'Naïve hash set solution -> Optimal Floyd algorithm -> Complexity justification.',
    },
  },
  {
    questionId: 'q37',
    questionNumber: 37,
    questionText: 'How would you find duplicates in an array?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Beginner',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Time vs space trade-off awareness.',
      keyPoints: [
        'Method 1: Hash Set -> O(n) time, O(n) space.',
        'Method 2: In-place sorting first -> O(n log n) time, O(1) space.',
        'Discuss when values are bounded (e.g. 1 to n) using index negation for O(n) time, O(1) space.',
      ],
      commonMistakes: ['Presenting only an O(n^2) brute force nested loop.'],
      exampleStructure: 'Brute force vs Hash Set vs In-place sorting trade-offs.',
    },
  },
  {
    questionId: 'q38',
    questionNumber: 38,
    questionText: 'How would you reverse a linked list?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Pointer manipulation, iterative and recursive implementation.',
      keyPoints: [
        'Iterative: Maintain prev, current, next pointers. In each step, point current.next to prev, advance pointers.',
        'Time: O(n), Space: O(1).',
      ],
      commonMistakes: ['Losing reference to the next node before repointing the link.'],
      exampleStructure: 'Pointer strategy -> Loop invariants -> Base cases (empty or single node).',
    },
  },
  {
    questionId: 'q39',
    questionNumber: 39,
    questionText: 'What is dynamic programming?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Advanced',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Optimal substructure, overlapping subproblems, and memoization/tabulation.',
      keyPoints: [
        'Optimization technique solving subproblems once and caching solutions.',
        'Two key properties: Overlapping subproblems and Optimal substructure.',
        'Top-Down with Memoization (recursion + cache) vs Bottom-Up Tabulation (iterative).',
      ],
      commonMistakes: ['Confusing divide-and-conquer (independent subproblems) with dynamic programming.'],
      exampleStructure: 'Core concept -> 2 requirements -> Top-down vs Bottom-up comparison.',
    },
  },
  {
    questionId: 'q40',
    questionNumber: 40,
    questionText: 'How would you approach a problem you have never seen before?',
    category: 'Data Structures and Algorithms',
    difficulty: 'Intermediate',
    suggestedRole: 'Software Engineer',
    guidance: {
      evaluationCriteria: 'Structured problem solving, clarifying questions, and communication.',
      keyPoints: [
        '1. Clarify requirements, constraints, and edge cases.',
        '2. Walk through a small manual example.',
        '3. State a working brute-force solution and analyze its complexity.',
        '4. Optimize using appropriate data structures.',
        '5. Write clean code and test with edge cases.',
      ],
      commonMistakes: ['Immediately coding without understanding requirements.', 'Silent thinking without explaining thought process.'],
      exampleStructure: 'Step-by-step interview problem-solving framework.',
    },
  },

  // CATEGORY E: DATABASES AND BACKEND (41-50)
  {
    questionId: 'q41',
    questionNumber: 41,
    questionText: 'What is the difference between SQL and NoSQL databases?',
    category: 'Databases and Backend',
    difficulty: 'Intermediate',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Data modeling paradigms, schema flexibility, ACID transactions, and horizontal scaling.',
      keyPoints: [
        'SQL (Relational): Structured schemas, tables, ACID compliance, complex JOINs (PostgreSQL, MySQL). Scale vertically.',
        'NoSQL: Flexible schemas, documents/key-value/graphs (MongoDB, Redis, Cassandra). Designed for horizontal scaling.',
      ],
      commonMistakes: ['Saying NoSQL is always faster than SQL without qualifying query patterns.'],
      exampleStructure: 'Schema & consistency comparison -> Scaling models -> Selection criteria.',
    },
  },
  {
    questionId: 'q42',
    questionNumber: 42,
    questionText: 'What is a primary key?',
    category: 'Databases and Backend',
    difficulty: 'Beginner',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Relational database integrity, uniqueness, and indexing.',
      keyPoints: [
        'Column (or set of columns) that uniquely identifies each row in a database table.',
        'Constraints: Must contain UNIQUE values and cannot contain NULL values.',
        'Automatically creates a clustered/unique index to accelerate lookups.',
      ],
      commonMistakes: ['Confusing primary key with foreign key or unique key (which permits one null).'],
      exampleStructure: 'Definition -> Uniqueness and Not-Null rules -> Physical index creation.',
    },
  },
  {
    questionId: 'q43',
    questionNumber: 43,
    questionText: 'What is a database index?',
    category: 'Databases and Backend',
    difficulty: 'Intermediate',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'B-Tree data structures, query acceleration, and write overhead trade-offs.',
      keyPoints: [
        'Data structure (typically B-Tree) that speeds up data retrieval without scanning every row.',
        'Trade-off: Fast reads (O(log n) vs O(n)), but adds storage overhead and slows down INSERT/UPDATE/DELETE.',
      ],
      commonMistakes: ['Recommending indexing every single column in a table.'],
      exampleStructure: 'B-Tree structure -> Read optimization -> Write performance trade-offs.',
    },
  },
  {
    questionId: 'q44',
    questionNumber: 44,
    questionText: 'Explain database normalization.',
    category: 'Databases and Backend',
    difficulty: 'Intermediate',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Relational design, data redundancy elimination, and normal forms (1NF, 2NF, 3NF).',
      keyPoints: [
        'Process of organizing data to reduce redundancy and improve data integrity.',
        '1NF: Atomic values, unique records.',
        '2NF: 1NF + no partial dependency on composite key.',
        '3NF: 2NF + no transitive dependency.',
        'Denormalization trade-off for read-heavy systems.',
      ],
      commonMistakes: ['Memorizing normal form names without understanding dependencies.'],
      exampleStructure: 'Goals -> Step-by-step 1NF to 3NF -> When to denormalize.',
    },
  },
  {
    questionId: 'q45',
    questionNumber: 45,
    questionText: 'What is a REST API?',
    category: 'Databases and Backend',
    difficulty: 'Beginner',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Architectural constraints, statelessness, and HTTP verb alignment.',
      keyPoints: [
        'Representational State Transfer architectural style.',
        'Statelessness, client-server separation, uniform resource identification via URIs.',
        'Standard HTTP methods (GET, POST, PUT, DELETE) with standard status codes.',
      ],
      commonMistakes: ['Putting verbs in URLs (e.g. /getUser instead of GET /users).'],
      exampleStructure: 'Core constraints -> Resource-oriented URL design -> HTTP verbs and status codes.',
    },
  },
  {
    questionId: 'q46',
    questionNumber: 46,
    questionText: 'Explain HTTP GET, POST, PUT, PATCH, and DELETE.',
    category: 'Databases and Backend',
    difficulty: 'Beginner',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'HTTP verb semantics, idempotency, and payload safety.',
      keyPoints: [
        'GET: Retrieve resource. Safe and idempotent.',
        'POST: Create resource. Neither safe nor idempotent.',
        'PUT: Replace entire resource. Idempotent.',
        'PATCH: Partially modify resource. Non-idempotent by default.',
        'DELETE: Remove resource. Idempotent.',
      ],
      commonMistakes: ['Confusing PUT (complete replacement) with PATCH (partial update).'],
      exampleStructure: 'Verb definition -> Idempotency and safety matrix -> Typical status code returns.',
    },
  },
  {
    questionId: 'q47',
    questionNumber: 47,
    questionText: 'What is authentication versus authorization?',
    category: 'Databases and Backend',
    difficulty: 'Beginner',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Security fundamentals and identity management.',
      keyPoints: [
        'Authentication (AuthN): Verifying WHO you are (passwords, MFA, biometrics).',
        'Authorization (AuthZ): Verifying WHAT permissions you have (RBAC, claims, scopes).',
      ],
      commonMistakes: ['Mixing up 401 Unauthorized (unauthenticated) with 403 Forbidden (unauthorized).'],
      exampleStructure: 'Definitions -> Real-world airport passport vs boarding pass analogy -> Implementation in APIs.',
    },
  },
  {
    questionId: 'q48',
    questionNumber: 48,
    questionText: 'What is middleware in Express.js?',
    category: 'Databases and Backend',
    difficulty: 'Intermediate',
    suggestedRole: 'Node.js Developer',
    guidance: {
      evaluationCriteria: 'Request-response lifecycle, pipeline chaining, and error handling.',
      keyPoints: [
        'Functions that have access to req, res, and the next middleware function in the request cycle.',
        'Uses: Authentication, logging, body parsing, CORS, validation, rate limiting.',
        'Calling next() or terminating the response.',
      ],
      commonMistakes: ['Forgetting to call next() or return after sending a response.'],
      exampleStructure: 'Definition -> Signature (req, res, next) -> Pipeline order importance -> Error-handling middleware.',
    },
  },
  {
    questionId: 'q49',
    questionNumber: 49,
    questionText: 'What is the difference between synchronous and asynchronous programming?',
    category: 'Databases and Backend',
    difficulty: 'Beginner',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'I/O blocking, thread utilization, and event-driven architecture.',
      keyPoints: [
        'Synchronous: Blocking execution. Next operation waits until previous completes.',
        'Asynchronous: Non-blocking. Initiates task and continues; notification via callbacks/promises/async-await upon completion.',
        'Essential for high-concurrency network and database I/O.',
      ],
      commonMistakes: ['Confusing asynchronous with multi-threaded parallelism.'],
      exampleStructure: 'Blocking vs non-blocking -> Call stack vs event loop -> Throughput implications.',
    },
  },
  {
    questionId: 'q50',
    questionNumber: 50,
    questionText: 'How would you handle errors in a backend API?',
    category: 'Databases and Backend',
    difficulty: 'Intermediate',
    suggestedRole: 'Backend Developer',
    guidance: {
      evaluationCriteria: 'Defensive engineering, structured error responses, and security information leakage.',
      keyPoints: [
        'Centralized global error middleware.',
        'Return standard JSON error payloads (status, message, code).',
        'Use appropriate HTTP status codes (400, 401, 403, 404, 500).',
        'Never leak stack traces or internal database credentials in production.',
      ],
      commonMistakes: ['Returning 200 OK with an error body.', 'Leaking raw database exceptions to clients.'],
      exampleStructure: 'Validation layer -> Service exceptions -> Centralized middleware -> Sanitized response.',
    },
  },

  // CATEGORY F: WEB DEVELOPMENT AND TOOLS (51-60)
  {
    questionId: 'q51',
    questionNumber: 51,
    questionText: 'What happens when you enter a URL in a browser?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'Full Stack Developer',
    guidance: {
      evaluationCriteria: 'End-to-end networking, browser rendering pipeline, and protocols.',
      keyPoints: [
        '1. DNS Lookup (browser cache -> OS -> resolver) resolves IP.',
        '2. TCP 3-way handshake + TLS negotiation.',
        '3. HTTP GET request sent; server processes and returns response.',
        '4. Browser parsing: HTML -> DOM tree, CSS -> CSSOM tree, combined into Render Tree.',
        '5. Layout and Paint to screen.',
      ],
      commonMistakes: ['Skipping DNS or TLS handshake.', 'Skipping browser rendering pipeline (DOM/CSSOM).'],
      exampleStructure: 'DNS resolution -> Network connection -> Server response -> Browser rendering.',
    },
  },
  {
    questionId: 'q52',
    questionNumber: 52,
    questionText: 'What is the difference between HTML, CSS, and JavaScript?',
    category: 'Web Development and Tools',
    difficulty: 'Beginner',
    suggestedRole: 'Frontend Developer',
    guidance: {
      evaluationCriteria: 'Separation of concerns in web development.',
      keyPoints: [
        'HTML: Structure and semantics (nouns/skeleton).',
        'CSS: Presentation, layout, and styling (adjectives/appearance).',
        'JavaScript: Interactivity, state, and dynamic behavior (verbs/actions).',
      ],
      commonMistakes: ['Failing to mention semantic HTML accessibility benefits.'],
      exampleStructure: 'House building or human body analogy -> Respective roles in web applications.',
    },
  },
  {
    questionId: 'q53',
    questionNumber: 53,
    questionText: 'What is the virtual DOM?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'Frontend Developer',
    guidance: {
      evaluationCriteria: 'React internals, reconciliation, and rendering performance.',
      keyPoints: [
        'Lightweight in-memory JavaScript representation of the real DOM.',
        'When state changes, new Virtual DOM tree is created and diffed against previous tree (Reconciliation).',
        'Batches minimal set of actual DOM updates to avoid expensive reflows and repaints.',
      ],
      commonMistakes: ['Claiming Virtual DOM is always faster than direct vanilla DOM manipulation.'],
      exampleStructure: 'Definition -> Diffing algorithm -> Batching DOM mutations for performance.',
    },
  },
  {
    questionId: 'q54',
    questionNumber: 54,
    questionText: 'Explain React props and state.',
    category: 'Web Development and Tools',
    difficulty: 'Beginner',
    suggestedRole: 'Frontend Developer',
    guidance: {
      evaluationCriteria: 'Component data flow, immutability, and state management.',
      keyPoints: [
        'Props: Inputs passed down from parent to child. Read-only / immutable by child.',
        'State: Internal mutable data managed within the component that triggers re-renders when updated.',
      ],
      commonMistakes: ['Attempting to mutate props directly in child components.'],
      exampleStructure: 'Props (external input) vs State (internal memory) -> Re-rendering triggers.',
    },
  },
  {
    questionId: 'q55',
    questionNumber: 55,
    questionText: 'What are React hooks?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'Frontend Developer',
    guidance: {
      evaluationCriteria: 'Functional components, lifecycle management, and rules of hooks.',
      keyPoints: [
        'Functions allowing functional components to hook into React state and lifecycle.',
        'Common hooks: useState, useEffect, useContext, useMemo, useCallback, useRef.',
        'Rules of Hooks: Only call at top level, only call from React functions.',
      ],
      commonMistakes: ['Calling hooks inside conditional blocks or loops.'],
      exampleStructure: 'Purpose -> Core built-in hooks -> Rules and custom hook creation.',
    },
  },
  {
    questionId: 'q56',
    questionNumber: 56,
    questionText: 'What is the purpose of Git?',
    category: 'Web Development and Tools',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Distributed version control, collaboration, and code history integrity.',
      keyPoints: [
        'Distributed Version Control System (DVCS) tracking changes in source code over time.',
        'Enables concurrent team collaboration via branching and merging.',
        'Maintains immutable history for rollbacks and auditing.',
      ],
      commonMistakes: ['Confusing Git (the tool) with GitHub (the cloud hosting service).'],
      exampleStructure: 'DVCS concept -> Branching workflow -> Collaboration benefits.',
    },
  },
  {
    questionId: 'q57',
    questionNumber: 57,
    questionText: 'What is the difference between Git merge and Git rebase?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Commit history management and team workflow best practices.',
      keyPoints: [
        'Merge: Preserves complete commit history with a merge commit. Non-destructive.',
        'Rebase: Rewrites commit history by moving branch base, creating a linear history.',
        'Golden Rule of Rebase: Never rebase a shared public branch.',
      ],
      commonMistakes: ['Rebasing shared main branch disrupting collaborators.'],
      exampleStructure: 'Merge mechanics -> Rebase mechanics -> Pros/cons and team rules.',
    },
  },
  {
    questionId: 'q58',
    questionNumber: 58,
    questionText: 'How would you debug a frontend API request failure?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'Frontend Developer',
    guidance: {
      evaluationCriteria: 'Browser DevTools proficiency, network tab analysis, and error diagnosis.',
      keyPoints: [
        'Inspect Network tab: Request URL, headers, payload, response code, and response body.',
        'Check Console for CORS errors or client-side parsing failures.',
        'Test the endpoint independently in Postman or cURL.',
      ],
      commonMistakes: ['Guessing in code without inspecting the browser network tab.'],
      exampleStructure: 'Network tab inspection -> Status code interpretation -> Isolation test.',
    },
  },
  {
    questionId: 'q59',
    questionNumber: 59,
    questionText: 'What is CORS?',
    category: 'Web Development and Tools',
    difficulty: 'Intermediate',
    suggestedRole: 'Full Stack Developer',
    guidance: {
      evaluationCriteria: 'Browser security mechanisms and same-origin policy.',
      keyPoints: [
        'Cross-Origin Resource Sharing: Browser security feature based on Same-Origin Policy (SOP).',
        'Restricts web pages from making requests to a different domain, port, or protocol.',
        'Server must send Access-Control-Allow-Origin headers; browsers send preflight OPTIONS requests.',
      ],
      commonMistakes: ['Thinking CORS is an error rather than a security specification.'],
      exampleStructure: 'Same-Origin Policy -> Preflight OPTIONS request -> Required server headers.',
    },
  },
  {
    questionId: 'q60',
    questionNumber: 60,
    questionText: 'How would you secure a web application?',
    category: 'Web Development and Tools',
    difficulty: 'Advanced',
    suggestedRole: 'Full Stack Developer',
    guidance: {
      evaluationCriteria: 'OWASP Top 10 awareness and defense-in-depth security practices.',
      keyPoints: [
        'Input validation & parameterized queries (prevent SQL injection).',
        'Output encoding & sanitization (prevent XSS).',
        'HTTPS with secure cookies (HttpOnly, SameSite, Secure).',
        'Rate limiting, CSRF tokens, and security headers (CSP, HSTS).',
      ],
      commonMistakes: ['Relying only on frontend validation for security.'],
      exampleStructure: 'Authentication & transport -> Input sanitization -> Defensive HTTP headers.',
    },
  },

  // CATEGORY G: BEHAVIORAL AND SITUATIONAL QUESTIONS (61-70)
  {
    questionId: 'q61',
    questionNumber: 61,
    questionText: 'Describe a time you worked under pressure.',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Prioritization, emotional composure, communication, and delivery under tight deadlines.',
      keyPoints: [
        'Use STAR method: Set the context of the tight deadline or production emergency.',
        'Focus on how you prioritized critical tasks and communicated with stakeholders.',
      ],
      commonMistakes: ['Admitting panic or cutting corners on critical quality.'],
      exampleStructure: 'High-pressure situation -> Triage and prioritization -> Execution -> Successful delivery.',
    },
  },
  {
    questionId: 'q62',
    questionNumber: 62,
    questionText: 'Tell me about a time you received constructive criticism.',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Coachability, lack of defensiveness, and active behavioral change.',
      keyPoints: [
        'Describe constructive feedback received from a peer or manager (e.g., code review, documentation).',
        'Show gratitude, understand the perspective, and explain how you applied it permanently.',
      ],
      commonMistakes: ['Claiming you have never received criticism.', 'Defending why the feedback was wrong.'],
      exampleStructure: 'Feedback received -> Self-reflection -> Action taken -> Lasting improvement.',
    },
  },
  {
    questionId: 'q63',
    questionNumber: 63,
    questionText: 'How do you prioritize multiple deadlines?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Time management frameworks, business impact alignment, and proactive communication.',
      keyPoints: [
        'Use frameworks (e.g. Eisenhower Matrix, urgency vs impact).',
        'Proactively communicate with stakeholders early if deadlines are in conflict.',
      ],
      commonMistakes: ['Silently working overtime without flagging conflicting priorities.'],
      exampleStructure: 'Evaluation framework -> Stakeholder alignment -> Execution and status tracking.',
    },
  },
  {
    questionId: 'q64',
    questionNumber: 64,
    questionText: 'What would you do if you disagreed with a teammate?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Conflict resolution, objectivity, data-driven decisions, and "disagree and commit".',
      keyPoints: [
        'Focus on shared project goals, not personal ego.',
        'Gather objective data, benchmarks, or prototypes to evaluate options.',
        'Commit fully to the team decision once made.',
      ],
      commonMistakes: ['Escalating immediately to management without 1-on-1 dialogue.', 'Holding grudges.'],
      exampleStructure: 'Disagreement context -> Private constructive conversation -> Objective evaluation -> Unified commitment.',
    },
  },
  {
    questionId: 'q65',
    questionNumber: 65,
    questionText: 'How do you learn a technology you have never used?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Self-directed learning, official documentation usage, and hands-on experimentation.',
      keyPoints: [
        'Read official docs and architectural concepts before copy-pasting tutorials.',
        'Build a small sandbox proof-of-concept project testing edge cases.',
      ],
      commonMistakes: ['Relying solely on outdated video tutorials without reading official docs.'],
      exampleStructure: 'Official docs review -> Sandbox prototype -> Best practices and production adoption.',
    },
  },
  {
    questionId: 'q66',
    questionNumber: 66,
    questionText: 'What would you do if you could not solve a production bug?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Time-boxing, asking for help, documentation, and minimizing customer downtime.',
      keyPoints: [
        'Time-box individual debugging (e.g., 1-2 hours).',
        'Prepare a structured brief of what you tried and error logs before escalating.',
        'Engage teammates or senior engineers collaboratively.',
      ],
      commonMistakes: ['Suffering in silence for days without asking for help.'],
      exampleStructure: 'Systematic troubleshooting -> Time-boxing -> Collaborative escalation -> Solution & post-mortem.',
    },
  },
  {
    questionId: 'q67',
    questionNumber: 67,
    questionText: 'How do you respond when you make a mistake?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Accountability, immediate remediation, transparency, and blameless post-mortems.',
      keyPoints: [
        'Own the mistake immediately without shifting blame.',
        'Focus first on fixing the issue/mitigating user impact.',
        'Perform a blameless post-mortem and add guardrails/tests to prevent recurrence.',
      ],
      commonMistakes: ['Hiding mistakes or blaming external dependencies.'],
      exampleStructure: 'Ownership & notification -> Immediate remediation -> Root cause guardrail implementation.',
    },
  },
  {
    questionId: 'q68',
    questionNumber: 68,
    questionText: 'Describe a time you demonstrated initiative.',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Proactivity, leadership without authority, and identifying unmet needs.',
      keyPoints: [
        'Identify a process bottleneck, missing automation, or tech debt you solved unprompted.',
        'Show how it helped the team save time or prevent errors.',
      ],
      commonMistakes: ['Describing work that was simply assigned to you.'],
      exampleStructure: 'Unmet need identified -> Unprompted action taken -> Positive team impact.',
    },
  },
  {
    questionId: 'q69',
    questionNumber: 69,
    questionText: 'How would you handle an unclear requirement?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Intermediate',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Proactive communication, requirement gathering, and documenting assumptions.',
      keyPoints: [
        'Never code blindly on ambiguous requirements.',
        'Draft clarifying questions and document proposed assumptions.',
        'Schedule a quick sync with product managers or stakeholders to validate.',
      ],
      commonMistakes: ['Assuming without verifying and building the wrong feature.'],
      exampleStructure: 'Recognize ambiguity -> Propose structured options/assumptions -> Stakeholder confirmation.',
    },
  },
  {
    questionId: 'q70',
    questionNumber: 70,
    questionText: 'What questions would you ask the interviewer?',
    category: 'Behavioral and Situational Questions',
    difficulty: 'Beginner',
    suggestedRole: 'All Roles',
    guidance: {
      evaluationCriteria: 'Engagement, curiosity about engineering culture, and reverse evaluation of team fit.',
      keyPoints: [
        'Ask about team deployment frequency, code review culture, and engineering velocity.',
        'Ask what the most impactful challenge facing the team in the next 6 months is.',
        'Ask how success is measured in this role.',
      ],
      commonMistakes: ['Saying "I have no questions".', 'Asking only about vacation days.'],
      exampleStructure: '3 thoughtful questions covering engineering culture, technical challenges, and team expectations.',
    },
  },
];

export const QUESTION_CATEGORIES = [
  'HR and Personal Introduction',
  'Projects and Experience',
  'Programming Fundamentals',
  'Data Structures and Algorithms',
  'Databases and Backend',
  'Web Development and Tools',
  'Behavioral and Situational Questions',
];

export function getAllQuestions(): InterviewQuestion[] {
  return INTERVIEW_QUESTIONS;
}

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return INTERVIEW_QUESTIONS.find((q) => q.questionId === id);
}

export function searchQuestions(query: string): InterviewQuestion[] {
  if (!query || !query.trim()) return INTERVIEW_QUESTIONS;
  const q = query.toLowerCase().trim();
  return INTERVIEW_QUESTIONS.filter(
    (item) =>
      item.questionText.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.suggestedRole.toLowerCase().includes(q)
  );
}
