export const education = [
  {
    degree: "B.Eng. in Computer Science and Technology",
    institution: "University of Shanghai for Science and Technology",
    school: "School of Optical-Electrical and Computer Engineering",
    period: "Sep 2023 - Present",
    details: [
      "Core academic interests: software engineering, web application development, artificial intelligence, algorithms, and high-performance programming.",
      "Public profile focuses on research direction, project output, and technical growth rather than numeric course performance."
    ]
  }
];

export const news = [
  {
    date: "May 2026",
    text:
      "Completed an International Organization Internship through the UNV platform on mangrove responses to climate change and produced a review manuscript on blue carbon mitigation."
  },
  {
    date: "Apr 2026",
    text:
      "Joined the XSafeClaw agent safety project and worked on runtime integration, controlled tool calls, and safety audit workflows."
  },
  {
    date: "Feb 2026",
    text:
      "Started SafeCodeRL, a multi-agent reinforcement learning framework for safety-constrained LLM code generation."
  },
  {
    date: "Jan 2026",
    text:
      "Worked on VulnSeeker, combining CodeQL static analysis with LLM-based security judgement."
  },
  {
    date: "Sep 2025",
    text:
      "Started SFMambaNet research on spectral-frequency enhanced state space models for correspondence pruning."
  }
];

export const experiences = [
  {
    title: "Research Intern, XSafeClaw Agent Runtime Safety",
    organization: "Fudan Trusted Embodied AI Institute",
    period: "Apr 2026 - Present",
    tags: ["Agent Safety", "Runtime Governance", "Open Source"],
    bullets: [
      "Worked on XSafeClaw, an open-source safety platform for local and multi-runtime agent systems.",
      "Implemented runtime integration for nanobot-style local agent sessions, including session discovery, controlled tool calls, and unified platform display.",
      "Contributed to risk control workflows, validation, and documentation for explainable agent governance.",
      "The public XSafeClaw repository had 150 GitHub stars when this site plan was prepared."
    ],
    links: [{ label: "XSafeClaw", url: "https://github.com/XSafeAI/XSafeClaw" }]
  },
  {
    title: "Research Intern, VulnSeeker",
    organization: "Fudan Software Engineering Lab",
    period: "Jan 2026 - Mar 2026",
    tags: ["CodeQL", "LLM Security", "Program Analysis"],
    bullets: [
      "Built an automated code security analysis workflow that combines CodeQL static analysis with LLM-based vulnerability judgement.",
      "Designed prompt workflows for CodeQL and LLM interaction, including structured status codes for security decisions.",
      "Implemented code context expansion, vulnerability detection after code generation, and combined rule-based plus model-based assessment."
    ]
  },
  {
    title: "International Organization Internship, UNV Online Research Intern",
    organization: "Morobe Development Foundation Inc., Papua New Guinea",
    period: "Jan 31, 2026 - May 21, 2026",
    tags: ["UNV", "Climate Change", "Blue Carbon"],
    bullets: [
      "Completed an International Organization Internship through the UNV platform, supporting research on mangrove responses to climate change scenarios and blue carbon mitigation.",
      "Synthesized literature on sea-level rise, coastal squeeze, nutrient loading, carbon sequestration, and national climate policy.",
      "Produced a review manuscript titled Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation."
    ]
  },
  {
    title: "First-author Research, SafeCodeRL",
    organization: "Independent research collaboration",
    period: "Feb 2026 - Present",
    tags: ["AI Safety", "Reinforcement Learning", "LLM Code Generation"],
    bullets: [
      "Proposed SafeCodeRL, a multi-agent framework for dynamic safety constraints in LLM code generation.",
      "Designed a closed-loop collaboration workflow across five agents and a PPO-style constraint-aware policy.",
      "Reported a large reduction in high-risk vulnerable code generation while preserving functional correctness in the manuscript."
    ]
  },
  {
    title: "First-author Research, SFMambaNet",
    organization: "Multimedia Intelligent Computing and Security Lab",
    period: "Sep 2025 - Feb 2026",
    tags: ["State Space Models", "Computer Vision", "Correspondence Pruning"],
    bullets: [
      "Proposed SFMambaNet, a spectral-frequency enhanced selective state space model for correspondence pruning.",
      "Explored frequency-aware global context modeling as an efficient alternative to quadratic-complexity Transformer designs.",
      "Completed literature review, core idea design, experiments, and manuscript writing under faculty supervision."
    ]
  }
];

export const publications = [
  {
    title: "SafeCodeRL: A Multi-Agent Reinforcement Learning Framework for Safety-Constrained LLM Code Generation",
    status: "Published on June 2, 2026",
    role: "First author",
    year: "2026",
    tags: ["AI Safety", "LLM", "Code Generation"],
    ratings: ["SCI Zone 3", "CCF C"],
    frameworkImage: "/figures/safecoderl-framework.png",
    frameworkAlt: "SafeCodeRL framework diagram showing IoT/CPS contexts, a five-agent closed loop, constraint-aware optimization, and training pipeline."
  },
  {
    title: "SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning",
    status: "arXiv preprint and under review",
    role: "First author",
    year: "2026",
    tags: ["Computer Vision", "State Space Model"],
    ratings: ["SCI Zone 1", "CCF B"],
    frameworkImage: "/figures/sfmambanet-framework.png",
    frameworkAlt: "SFMambaNet framework diagram showing pruning blocks, local spectral-geometric feature extraction, spectral-global aggregation, and verification."
  },
  {
    title: "Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation",
    status: "review manuscript",
    role: "Author",
    year: "2026",
    tags: ["Climate Change", "Blue Carbon", "UNV"]
  }
];

export const projects = [
  {
    title: "XSafeClaw Agent Safety Platform",
    summary:
      "Runtime safety governance for agent systems, including trajectory collection, tool-call inspection, human approval, and risk auditing.",
    tags: ["Agent Safety", "Runtime", "Open Source"],
    link: "https://github.com/XSafeAI/XSafeClaw"
  },
  {
    title: "VulnSeeker",
    summary:
      "Automated security analysis pipeline that combines CodeQL static analysis and LLM-based vulnerability classification.",
    tags: ["CodeQL", "Security", "LLM"]
  },
  {
    title: "Robust Deep-Learning Watermark Mobile Application",
    summary:
      "A cross-platform image copyright and identity authentication system combining neural watermarking models with mobile image processing.",
    tags: ["Watermarking", "Mobile", "Deep Learning"]
  }
];

export const awards = [
  "National First Prize, RAICOM Robot Developer Competition, 2025",
  "National Second Prize, LanQiao Cup C/C++ Programming Contest, 2025",
  "Silver Award, CCPC Shanghai Collegiate Programming Contest, 2025",
  "National Third Prize, National English Competition for College Students, 2025",
  "Shanghai First Prize, National College Student Mathematics Competition, 2024",
  "First-author software copyright for a robust deep-learning watermark mobile application"
];

export const skills = [
  {
    group: "Research",
    items: ["AI safety", "LLM agents", "program analysis", "computer vision", "scientific writing"]
  },
  {
    group: "Programming",
    items: ["C/C++", "Python", "Java", "TypeScript", "Astro"]
  },
  {
    group: "Tools",
    items: ["CodeQL", "Git", "LaTeX", "Overleaf", "PyTorch", "TensorFlow"]
  },
  {
    group: "Language",
    items: ["English technical reading", "CET-4 and CET-6 passed"]
  }
];

export const learningProgress = [
  {
    area: "AI Safety and LLM Agents",
    percent: 88,
    summary:
      "Focused on agent runtime governance, safety-constrained code generation, tool-call auditing, and human-in-the-loop risk control."
  },
  {
    area: "Software Security and Program Analysis",
    percent: 84,
    summary:
      "Built workflows around CodeQL, LLM-assisted vulnerability judgement, code context expansion, and post-generation security inspection."
  },
  {
    area: "Deep Learning and Multimodal Intelligence",
    percent: 82,
    summary:
      "Studied neural architectures for visual correspondence, spectral-frequency modeling, state space models, and robust image watermarking."
  },
  {
    area: "Algorithms and Systems Programming",
    percent: 86,
    summary:
      "Maintains strong C/C++ foundations through algorithmic problem solving, contest-style implementation, and performance-conscious coding."
  },
  {
    area: "Scientific Writing and Research Methodology",
    percent: 80,
    summary:
      "Practices literature synthesis, experiment design, manuscript organization, and cross-domain research communication."
  },
  {
    area: "Web Engineering and Research Prototyping",
    percent: 78,
    summary:
      "Uses TypeScript, Python, Git, LaTeX, and static-site tooling to turn research ideas into reproducible public artifacts."
  }
];
