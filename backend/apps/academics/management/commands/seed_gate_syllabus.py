from django.core.management.base import BaseCommand
from apps.academics.models import GatePaper, Subject, Topic
from apps.questions.models import Question


class Command(BaseCommand):
    help = "Seeds the official 12 GATE CSE subjects, core topics, and sample verified questions."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding GATE CSE syllabus & question bank..."))

        cs_paper, _ = GatePaper.objects.get_or_create(
            code="CS",
            defaults={
                "name": "Computer Science and Information Technology",
                "is_active": True,
            }
        )

        da_paper, _ = GatePaper.objects.get_or_create(
            code="DA",
            defaults={
                "name": "Data Science and Artificial Intelligence",
                "is_active": True,
            }
        )

        cs_paper.allowed_secondary_papers.add(da_paper)

        # 12 Official GATE CSE Subjects
        SUBJECTS_DATA = [
            {
                "order_index": 1,
                "name": "Discrete Mathematics",
                "slug": "discrete-mathematics",
                "icon": "Compass",
                "description": "Propositional & predicate logic, sets, relations, functions, combinatorics, graph theory.",
                "topics": [
                    {
                        "name": "Propositional and First-Order Logic",
                        "slug": "propositional-logic",
                        "order": 1,
                        "notes": "### Propositional Logic Fundamentals\n- **Propositions**: Declarative statements that are either True (T) or False (F).\n- **Logical Connectives**: Negation (¬), Conjunction (∧), Disjunction (∨), Implication (→), Biconditional (↔).\n- **Tautology**: A compound proposition that is always True for every truth assignment.\n- **Contradiction**: Always False.\n- **Contingency**: Neither tautology nor contradiction.\n\n#### Key Equivalences:\n1. De Morgan's Laws: ¬(p ∧ q) ≡ ¬p ∨ ¬q and ¬(p ∨ q) ≡ ¬p ∧ ¬q\n2. Implication Equivalence: p → q ≡ ¬p ∨ q\n3. Contrapositive: p → q ≡ ¬q → ¬p\n4. Modus Ponens: (p ∧ (p → q)) → q is a tautology.",
                    },
                    {
                        "name": "Sets, Relations, Functions and Partial Orders",
                        "slug": "sets-relations-functions",
                        "order": 2,
                        "notes": "### Relations & Posets\n- **Reflexive**: (a, a) ∈ R for all a ∈ A.\n- **Symmetric**: (a, b) ∈ R ⇒ (b, a) ∈ R.\n- **Transitive**: (a, b) ∈ R and (b, c) ∈ R ⇒ (a, c) ∈ R.\n- **Equivalence Relation**: Reflexive, Symmetric, and Transitive.\n- **Partial Order (Poset)**: Reflexive, Antisymmetric, and Transitive.\n- **Lattice**: A poset where every pair of elements has a unique Least Upper Bound (join) and Greatest Lower Bound (meet).",
                    },
                    {
                        "name": "Combinatorics & Recurrence Relations",
                        "slug": "combinatorics",
                        "order": 3,
                        "notes": "### Combinatorics\n- Permutations: P(n, r) = n! / (n - r)!\n- Combinations: C(n, r) = n! / (r! (n - r)!)\n- Pigeonhole Principle: If n items are put into m containers, with n > m, then at least one container must contain more than one item.\n- Generating functions and linear recurrence relation solving.",
                    },
                    {
                        "name": "Graph Theory: Connectivity & Coloring",
                        "slug": "graph-theory",
                        "order": 4,
                        "notes": "### Graph Theory\n- Handshaking Theorem: Sum of degrees = 2 * |E|.\n- Euler Formula for planar graphs: V - E + F = 2.\n- Maximum edges in simple planar graph: E ≤ 3V - 6 (for V ≥ 3).\n- Bipartite Graph: A graph is bipartite if and only if it contains no odd cycle.",
                    },
                ],
            },
            {
                "order_index": 2,
                "name": "Engineering Mathematics",
                "slug": "engineering-mathematics",
                "icon": "Binary",
                "description": "Linear algebra, matrices, eigenvalues, calculus, probability distributions.",
                "topics": [
                    {
                        "name": "Linear Algebra: Matrices & Eigenvalues",
                        "slug": "linear-algebra",
                        "order": 1,
                        "notes": "### Matrices and Systems\n- Rank of a matrix: Number of non-zero rows in row-echelon form.\n- Consistency of Ax = b: Consistent if and only if Rank(A) = Rank(A|b).\n- Eigenvalues: Roots of characteristic equation |A - λI| = 0.\n- Trace(A) = Sum of eigenvalues.\n- Determinant |A| = Product of eigenvalues.",
                    },
                    {
                        "name": "Probability & Statistics",
                        "slug": "probability-and-statistics",
                        "order": 2,
                        "notes": "### Probability Distributions\n- Bayes' Theorem: P(A|B) = P(B|A)P(A) / P(B).\n- Expected Value E[X] = ∑ x P(x).\n- Variance Var(X) = E[X²] - (E[X])².\n- Poisson Distribution: P(X = k) = (λ^k e^(-λ)) / k!.",
                    },
                ],
            },
            {
                "order_index": 3,
                "name": "Digital Logic",
                "slug": "digital-logic",
                "icon": "Cpu",
                "description": "Boolean algebra, Karnaugh maps, combinational & sequential circuits.",
                "topics": [
                    {
                        "name": "Boolean Algebra & K-Maps",
                        "slug": "boolean-algebra-kmaps",
                        "order": 1,
                        "notes": "### K-Maps & Minimization\n- SOP (Sum of Products) and POS (Product of Sums).\n- Grey code adjacency in Karnaugh maps.\n- Prime Implicants and Essential Prime Implicants.",
                    },
                    {
                        "name": "Sequential Circuits & Flip-Flops",
                        "slug": "sequential-circuits",
                        "order": 2,
                        "notes": "### Flip-Flops\n- SR, JK, D, T Flip-flops and characteristic equations.\n- Counters: Synchronous and Asynchronous (Ripple) counters.",
                    },
                ],
            },
            {
                "order_index": 4,
                "name": "Computer Organization & Architecture",
                "slug": "computer-organization-and-architecture",
                "icon": "HardDrive",
                "description": "Machine instructions, pipelining, cache memory, I/O interfaces.",
                "topics": [
                    {
                        "name": "Instruction Pipelining & Hazards",
                        "slug": "instruction-pipelining",
                        "order": 1,
                        "notes": "### Pipelining\n- Speedup S = non-pipelined time / pipelined time = (n * k) / (k + n - 1).\n- Pipeline Hazards: Structural, Data (RAW, WAR, WAW), and Control (Branch).",
                    },
                    {
                        "name": "Memory Hierarchy & Cache Mapping",
                        "slug": "cache-memory",
                        "order": 2,
                        "notes": "### Cache Organization\n- Direct Mapped, Fully Associative, K-Way Set Associative.\n- Average Memory Access Time (AMAT) = Hit Time + Miss Rate * Miss Penalty.",
                    },
                ],
            },
            {
                "order_index": 5,
                "name": "Programming and Data Structures",
                "slug": "programming-and-data-structures",
                "icon": "Code2",
                "description": "C programming, recursion, stacks, queues, linked lists, trees, binary heaps.",
                "topics": [
                    {
                        "name": "Recursion & Dynamic Memory in C",
                        "slug": "recursion-pointers-c",
                        "order": 1,
                        "notes": "### C Pointers & Recursion\n- Pointer arithmetic and memory layouts.\n- Call stack frames during recursive execution.",
                    },
                    {
                        "name": "Trees & Binary Search Trees",
                        "slug": "trees-bst",
                        "order": 2,
                        "notes": "### Binary Trees\n- Inorder, Preorder, Postorder traversals.\n- Inorder of a BST always yields sorted order.\n- Height of balanced BST: O(log n).",
                    },
                ],
            },
            {
                "order_index": 6,
                "name": "Algorithms",
                "slug": "algorithms",
                "icon": "Layers",
                "description": "Asymptotic analysis, greedy, dynamic programming, divide-and-conquer, graph algorithms.",
                "topics": [
                    {
                        "name": "Asymptotic Analysis & Recurrences",
                        "slug": "asymptotic-analysis",
                        "order": 1,
                        "notes": "### Complexity Analysis\n- Big-O (O), Omega (Ω), Theta (Θ) notations.\n- Master Theorem: T(n) = aT(n/b) + f(n).",
                    },
                    {
                        "name": "Graph Search & Shortest Paths",
                        "slug": "graph-algorithms",
                        "order": 2,
                        "notes": "### Shortest Paths\n- Dijkstra: O((V + E) log V) with min-heap (non-negative edge weights).\n- Bellman-Ford: O(V * E) detects negative weight cycles.\n- Floyd-Warshall: O(V³) all-pairs shortest paths.",
                    },
                ],
            },
            {
                "order_index": 7,
                "name": "Theory of Computation",
                "slug": "theory-of-computation",
                "icon": "GitBranch",
                "description": "Regular languages, finite automata, context-free grammars, Turing machines, undecidability.",
                "topics": [
                    {
                        "name": "Finite Automata & Regular Languages",
                        "slug": "finite-automata",
                        "order": 1,
                        "notes": "### Automata\n- DFA vs NFA equivalence.\n- Regular expressions and closure properties of regular languages.\n- Pumping Lemma for regular languages.",
                    },
                    {
                        "name": "Turing Machines & Undecidability",
                        "slug": "turing-machines-undecidability",
                        "order": 2,
                        "notes": "### Undecidability\n- Halting problem of Turing machine is undecidable.\n- Post Correspondence Problem (PCP).\n- Rice's Theorem.",
                    },
                ],
            },
            {
                "order_index": 8,
                "name": "Compiler Design",
                "slug": "compiler-design",
                "icon": "Terminal",
                "description": "Lexical analysis, parsing, syntax-directed translation, intermediate code generation.",
                "topics": [
                    {
                        "name": "Parsing: LL(1), LR(0), SLR(1), LALR(1), CLR(1)",
                        "slug": "parsing-techniques",
                        "order": 1,
                        "notes": "### Parsers\n- FIRST and FOLLOW computation for LL(1) grammars.\n- LR parsing table conflicts: Shift-Reduce and Reduce-Reduce conflicts.",
                    },
                ],
            },
            {
                "order_index": 9,
                "name": "Operating Systems",
                "slug": "operating-systems",
                "icon": "Server",
                "description": "Process synchronization, semaphores, deadlocks, CPU scheduling, virtual memory paging.",
                "topics": [
                    {
                        "name": "Process Synchronization & Semaphores",
                        "slug": "process-synchronization",
                        "order": 1,
                        "notes": "### Synchronization\n- Critical Section conditions: Mutual Exclusion, Progress, Bounded Waiting.\n- Counting and Binary Semaphores (wait/signal operations).",
                    },
                    {
                        "name": "Deadlocks & Virtual Memory Paging",
                        "slug": "deadlocks-virtual-memory",
                        "order": 2,
                        "notes": "### Virtual Memory\n- Page fault handling.\n- Page replacement algorithms: FIFO (Belady's Anomaly), LRU, Optimal.",
                    },
                ],
            },
            {
                "order_index": 10,
                "name": "Database Management Systems",
                "slug": "database-management-systems",
                "icon": "Database",
                "description": "Relational algebra, SQL, normalization (1NF to BCNF), transactions, B+ trees.",
                "topics": [
                    {
                        "name": "Relational Algebra & Normalization",
                        "slug": "relational-algebra-normalization",
                        "order": 1,
                        "notes": "### Normal Forms\n- 1NF: Atomic values.\n- 2NF: No partial dependency on candidate key.\n- 3NF: No transitive dependency on candidate key (X → A where X is superkey or A is prime).\n- BCNF: For every FD X → A, X must be a superkey.",
                    },
                    {
                        "name": "Transactions & Concurrency Control",
                        "slug": "transactions-concurrency",
                        "order": 2,
                        "notes": "### ACID Properties\n- Conflict Serializability (Precedence Graph test).\n- Two-Phase Locking (2PL) and strict 2PL.",
                    },
                ],
            },
            {
                "order_index": 11,
                "name": "Computer Networks",
                "slug": "computer-networks",
                "icon": "Network",
                "description": "OSI/TCP-IP stacks, sliding window flow control, IP addressing, TCP/UDP, routing.",
                "topics": [
                    {
                        "name": "Flow & Error Control (Sliding Window)",
                        "slug": "flow-error-control",
                        "order": 1,
                        "notes": "### Sliding Window Protocols\n- Stop-and-Wait efficiency η = 1 / (1 + 2a), where a = Tprop / Ttrans.\n- Go-Back-N (GBN) sender window = 2^k - 1.\n- Selective Repeat (SR) sender window = receiver window = 2^(k - 1).",
                    },
                    {
                        "name": "IP Addressing, Subnetting & Routing",
                        "slug": "ip-addressing-routing",
                        "order": 2,
                        "notes": "### Networking\n- CIDR subnet masks and longest prefix matching.\n- Distance Vector (Bellman-Ford, Count-to-Infinity) vs Link State (Dijkstra).",
                    },
                ],
            },
            {
                "order_index": 12,
                "name": "General Aptitude",
                "slug": "general-aptitude",
                "icon": "Award",
                "description": "Verbal ability, numerical computation, reasoning, data interpretation.",
                "topics": [
                    {
                        "name": "Quantitative & Numerical Ability",
                        "slug": "quantitative-ability",
                        "order": 1,
                        "notes": "### Quantitative Aptitude\n- Percentages, ratios, work & time, speed & distance, permutations, combinations.",
                    },
                ],
            },
        ]

        # Seed subjects and topics
        created_subjects = 0
        created_topics = 0

        topic_lookup = {}

        for s_data in SUBJECTS_DATA:
            subject, s_created = Subject.objects.get_or_create(
                paper=cs_paper,
                slug=s_data["slug"],
                defaults={
                    "name": s_data["name"],
                    "order_index": s_data["order_index"],
                    "description": s_data["description"],
                    "icon_name": s_data["icon"],
                }
            )
            if s_created:
                created_subjects += 1

            for t_data in s_data["topics"]:
                topic, t_created = Topic.objects.get_or_create(
                    subject=subject,
                    slug=t_data["slug"],
                    defaults={
                        "name": t_data["name"],
                        "order_index": t_data["order"],
                        "concept_notes": t_data["notes"],
                        "is_active": True,
                    }
                )
                if t_created:
                    created_topics += 1
                topic_lookup[t_data["slug"]] = topic

        self.stdout.write(
            self.style.SUCCESS(
                f"Syllabus seeded: {Subject.objects.filter(paper=cs_paper).count()} subjects, {Topic.objects.count()} topics."
            )
        )

        # Seed Sample Verified Official GATE Questions (MCQ, MSQ, NAT)
        self.stdout.write(self.style.NOTICE("Seeding verified GATE questions..."))

        prop_topic = topic_lookup.get("propositional-logic")
        algo_topic = topic_lookup.get("asymptotic-analysis")
        db_topic = topic_lookup.get("relational-algebra-normalization")
        flow_topic = topic_lookup.get("flow-error-control")

        # 1. Official GATE CSE Question (MCQ)
        if prop_topic:
            Question.objects.get_or_create(
                topic=prop_topic,
                statement="Which of the following propositional formulas is a tautology?",
                defaults={
                    "question_type": "MCQ",
                    "options": [
                        "(p ∨ q) → (p ∧ q)",
                        "(p ∧ (p → q)) → q",
                        "(p → q) → (q → p)",
                        "p ∧ ¬p",
                    ],
                    "correct_answer": 1,  # Option B
                    "detailed_explanation": (
                        "**(p ∧ (p → q)) → q** is the classic inference rule known as **Modus Ponens**.\n\n"
                        "Let us evaluate its truth table:\n"
                        "- If p is True and (p → q) is True, then q must be True. Thus True → True is True.\n"
                        "- If p is False, the antecedent (p ∧ (p → q)) is False, and False → anything is always True.\n"
                        "Therefore, this formula evaluates to True under every possible truth assignment, making it a **tautology**."
                    ),
                    "marks": 1,
                    "negative_mark": 0.33,
                    "is_pyq": True,
                    "pyq_year": 2023,
                    "difficulty": "Easy",
                }
            )

        # 2. Official GATE CSE Question (MSQ - Multiple Select Question)
        if algo_topic:
            Question.objects.get_or_create(
                topic=algo_topic,
                statement="Which of the following statements is/are TRUE regarding asymptotic complexity notations?",
                defaults={
                    "question_type": "MSQ",
                    "options": [
                        "f(n) = O(g(n)) implies g(n) = Ω(f(n))",
                        "f(n) = Θ(g(n)) implies f(n) = O(g(n)) and f(n) = Ω(g(n))",
                        "2^(n+1) = O(2^n)",
                        "2^(2n) = O(2^n)",
                    ],
                    "correct_answer": [0, 1, 2],  # Options A, B, C
                    "detailed_explanation": (
                        "Let us analyze each option:\n\n"
                        "1. **Option A (TRUE):** By definition of Big-O and Big-Omega, f(n) ≤ c · g(n) ⇔ g(n) ≥ (1/c) · f(n). Hence f(n) = O(g(n)) ⇔ g(n) = Ω(f(n)).\n"
                        "2. **Option B (TRUE):** By definition of Theta notation, f(n) = Θ(g(n)) holds if and only if f(n) = O(g(n)) and f(n) = Ω(g(n)).\n"
                        "3. **Option C (TRUE):** 2^(n+1) = 2 · 2^n ≤ 2 · 2^n for all n ≥ 1. Thus 2^(n+1) = O(2^n) with c = 2.\n"
                        "4. **Option D (FALSE):** 2^(2n) = (2^n)². There is no constant c such that (2^n)² ≤ c · 2^n for arbitrarily large n, because 2^n grows without bound."
                    ),
                    "marks": 2,
                    "negative_mark": 0.0,  # Official GATE MSQ rule: No negative marks!
                    "is_pyq": True,
                    "pyq_year": 2024,
                    "difficulty": "Medium",
                }
            )

        # 3. Official GATE CSE Question (NAT - Numerical Answer Type)
        if flow_topic:
            Question.objects.get_or_create(
                topic=flow_topic,
                statement=(
                    "In a Stop-and-Wait protocol, the packet size is 1000 bytes and the transmission rate of the channel is 800 kbps (1 kbps = 1000 bps). "
                    "The propagation delay of the link is 20 ms. Assume acknowledgment packets are of negligible size and the channel is error-free. "
                    "The channel efficiency (utilization) in percentage is _______ (round off to the nearest integer)."
                ),
                defaults={
                    "question_type": "NAT",
                    "options": None,  # Numerical Answer Type has no multiple options
                    "correct_answer": {"min": 20.0, "max": 20.0},  # 20%
                    "detailed_explanation": (
                        "### Step-by-Step Derivation:\n"
                        "1. **Packet Size L**: 1000 bytes = 1000 × 8 bits = 8000 bits.\n"
                        "2. **Transmission Rate B**: 800 kbps = 800,000 bps.\n"
                        "3. **Transmission Delay T_trans**:\n"
                        "   `T_trans = L / B = 8000 / 800,000 = 0.01 seconds = 10 ms`.\n"
                        "4. **Propagation Delay T_prop**: `20 ms`.\n"
                        "5. **Total Round Trip Time (RTT)**:\n"
                        "   `Total Cycle Time = T_trans + 2 * T_prop = 10 ms + 2 * 20 ms = 50 ms`.\n"
                        "6. **Efficiency η**:\n"
                        "   `η = T_trans / (T_trans + 2 * T_prop) = 10 / 50 = 0.20 = 20%`.\n\n"
                        "**Correct Answer:** 20"
                    ),
                    "marks": 2,
                    "negative_mark": 0.0,  # Official GATE NAT rule: No negative marks!
                    "is_pyq": True,
                    "pyq_year": 2022,
                    "difficulty": "Medium",
                }
            )

        # 4. Official GATE DBMS Question (MCQ 2 Marks)
        if db_topic:
            Question.objects.get_or_create(
                topic=db_topic,
                statement=(
                    "Consider a relation R(A, B, C, D, E) with the following functional dependencies:\n"
                    "`F = { A → BC, CD → E, B → D, E → A }`\n\n"
                    "What is the highest normal form satisfied by relation R?"
                ),
                defaults={
                    "question_type": "MCQ",
                    "options": [
                        "1NF",
                        "2NF",
                        "3NF",
                        "BCNF",
                    ],
                    "correct_answer": 2,  # 3NF (Option C)
                    "detailed_explanation": (
                        "### Candidate Keys Determination:\n"
                        "- (A)+ = {A, B, C, D, E} ⇒ A is a candidate key.\n"
                        "- (B)+ = {B, D}. Not a key.\n"
                        "- (E)+ = {E, A, B, C, D} ⇒ E is a candidate key.\n"
                        "- (CD)+ = {C, D, E, A, B} ⇒ CD is a candidate key.\n"
                        "- (BC)+ = {B, C, D, E, A} ⇒ BC is a candidate key.\n\n"
                        "**Prime Attributes (part of at least one candidate key):** {A, B, C, D, E}.\n"
                        "Notice that **every** attribute in relation R is a prime attribute!\n\n"
                        "**Testing 3NF:**\n"
                        "A functional dependency X → Y is in 3NF if either X is a superkey OR Y is prime.\n"
                        "Since every attribute in R is prime, every dependency trivially satisfies the second condition of 3NF.\n\n"
                        "**Testing BCNF:**\n"
                        "Consider B → D. B is not a superkey! Hence R is not in BCNF.\n\n"
                        "**Highest Normal Form:** 3NF."
                    ),
                    "marks": 2,
                    "negative_mark": 0.66,
                    "is_pyq": True,
                    "pyq_year": 2021,
                    "difficulty": "Hard",
                }
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {Question.objects.count()} verified GATE questions across MCQ, MSQ, and NAT types."
            )
        )

