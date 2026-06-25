const yizhangLiuProfileUrl = "https://ccds.fzu.edu.cn/info/1207" + "/11276.htm";
const xsafeclawUrl = "https://github.com/XSafeAI/XSafeClaw";
const teaiUrl = "https://teai.fudan.edu.cn/";
const xingjunMaUrl = "http://xingjunma.com/";
const codeWisdomLabUrl = "http://www.se.fudan.edu.cn/";
const yiLiUrl = "http://www.se.fudan.edu.cn/#";

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
    date: "June 2026",
    text:
      "Started AAAI 2027-oriented research on multimodal phishing website detection, supporting literature review, novelty analysis, experiment design, model fine-tuning, and experimental validation."
  },
  {
    date: "June 2026",
    html:
      `Joined <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Dr. Xingjun Ma</a>'s team at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a> on an enterprise-oriented multi-agent secure collaboration project, contributing to requirements analysis, system design, implementation, and testing.`
  },
  {
    date: "May 2026",
    text:
      "Completed an International Organization Internship through the UNDP-administered UNV platform on mangrove responses to climate change and produced a review manuscript on blue carbon mitigation."
  },
  {
    date: "Apr 2026",
    html:
      `Joined the <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a> agent safety project at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a> and worked on runtime integration, controlled tool calls, and safety audit workflows.`
  },
  {
    date: "Feb 2026",
    text:
      "Started SafeCodeRL, a multi-agent reinforcement learning framework for safety-constrained LLM code generation."
  },
  {
    date: "Jan 2026",
    html:
      `Worked on VulnSeeker at the <a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer">Fudan Software Engineering (CodeWisdom) Lab</a>, combining CodeQL static analysis with LLM-based security judgement.`
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
    titleUrl: xsafeclawUrl,
    organization: "Institute of Trustworthy Embodied AI (TEAI), Fudan University",
    organizationUrl: teaiUrl,
    period: "Apr 2026 - Present",
    tags: ["TEAI", "Agent Safety", "Runtime Governance", "Open Source"],
    bullets: [
      {
        html:
          `Worked on <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a>, an open-source safety platform for local and multi-runtime agent systems, at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a>.`
      },
      {
        html:
          `Worked under the guidance of <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Dr. Xingjun Ma</a>, a Young Researcher and doctoral supervisor at Fudan University.`
      },
      "Implemented runtime integration for nanobot-style local agent sessions, including session discovery, controlled tool calls, and unified platform display.",
      "Contributed to risk control workflows, validation, and documentation for explainable agent governance."
    ],
    links: [
      { label: "XSafeClaw", url: xsafeclawUrl },
      { label: "TEAI", url: teaiUrl },
      { label: "Dr. Xingjun Ma", url: xingjunMaUrl }
    ]
  },
  {
    title: "Research Intern, VulnSeeker",
    organization: "Fudan Software Engineering (CodeWisdom) Lab",
    organizationUrl: codeWisdomLabUrl,
    period: "Jan 2026 - Mar 2026",
    tags: ["CodeWisdom", "CodeQL", "LLM Security", "Program Analysis"],
    bullets: [
      {
        html:
          `Conducted research at the <a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer">Fudan Software Engineering (CodeWisdom) Lab</a>, focusing on automated security analysis for generated and repository code.`
      },
      {
        html:
          `Worked under the guidance of <a href="${yiLiUrl}" target="_blank" rel="noopener noreferrer">Lecturer Yi Li</a> and collaborated with Qicai Chen, a Ph.D. student, on literature review, workflow design, and experimental validation.`
      },
      "Built a CodeQL-assisted vulnerability analysis workflow that combines static analysis, code context expansion, and LLM-based security judgement.",
      "Designed prompt workflows for CodeQL and LLM interaction, including structured status codes for vulnerability triage and post-generation security inspection."
    ],
    links: [
      { label: "CodeWisdom Lab", url: codeWisdomLabUrl },
      { label: "Lecturer Yi Li", url: yiLiUrl }
    ]
  },
  {
    title: "International Organization Internship, UNDP-administered UNV Online Research Intern",
    titleUrl: "https://www.undp.org/",
    organization: "Morobe Development Foundation Inc., Papua New Guinea",
    period: "Jan 31, 2026 - May 21, 2026",
    tags: ["UNDP", "UNV", "Climate Change", "Blue Carbon"],
    bullets: [
      "Completed an International Organization Internship through the UNDP-administered United Nations Volunteers (UNV) platform, supporting research on mangrove responses to climate change scenarios and blue carbon mitigation.",
      "The United Nations Volunteers (UNV) programme is administered by the United Nations Development Programme (UNDP).",
      "Synthesized literature on sea-level rise, coastal squeeze, nutrient loading, carbon sequestration, and national climate policy.",
      "Produced a review manuscript titled Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation."
    ],
    links: [
      { label: "UNDP", url: "https://www.undp.org/" },
      { label: "UNV", url: "https://www.unv.org/" },
      { label: "Task Assignment PDF", url: "/documents/unv/task-assignment.pdf" },
      { label: "Internship Certificate PDF", url: "/documents/unv/internship-certificate.pdf" },
      { label: "Thank-you Letter PDF", url: "/documents/unv/thank-you-letter.pdf" }
    ]
  },
  {
    title: "First-author Research, SafeCodeRL",
    organization: "Independent research collaboration",
    period: "Feb 2026 - Present",
    tags: ["AI Safety", "Multi-Agent Systems", "Constrained RL", "Secure Code Generation", "LLM Code Generation", "IoT/CPS Security", "Trustworthy AI"],
    bullets: [
      "Proposed SafeCodeRL, a multi-agent framework for dynamic safety constraints in LLM code generation.",
      "Designed a closed-loop collaboration workflow across five agents and a PPO-style constraint-aware policy.",
      "Reported a large reduction in high-risk vulnerable code generation while preserving functional correctness in the manuscript."
    ]
  },
  {
    title: "Research Intern, SFMambaNet",
    titleUrl: "https://arxiv.org/abs/2606.04493",
    organization: "Fujian Key Laboratory of Network Computing and Intelligent Information Processing, Fuzhou University",
    organizationUrl: "https://ncip.fzu.edu.cn/xsdt.htm",
    period: "Sep 2025 - Mar 2026",
    tags: ["Computer Vision", "Correspondence Pruning", "Mamba", "State Space Models", "Frequency Domain", "Two-View Geometry", "Outlier Rejection"],
    bullets: [
      {
        html:
          'Worked as a research intern at <a href="https://ncip.fzu.edu.cn/xsdt.htm" target="_blank" rel="noopener noreferrer">Fujian Key Laboratory of Network Computing and Intelligent Information Processing</a>, Fuzhou University, from September 2025 to March 2026.'
      },
      {
        html:
          `Worked closely with <a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer">Dr. Yizhang Liu</a>, a university-appointed Associate Research Fellow and graduate supervisor, on robust two-view correspondence pruning.`
      },
      {
        html:
          'This work led to our manuscript <a href="https://arxiv.org/abs/2606.04493" target="_blank" rel="noopener noreferrer">SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning</a>, submitted to IEEE Transactions on Circuits and Systems for Video Technology (TCSVT) and posted on arXiv in June 2026.'
      }
    ],
    links: [
      { label: "FZU Key Lab", url: "https://ncip.fzu.edu.cn/xsdt.htm" },
      { label: "Dr. Yizhang Liu", url: yizhangLiuProfileUrl },
      { label: "SFMambaNet arXiv", url: "https://arxiv.org/abs/2606.04493" }
    ]
  }
];

export const publications = [
  {
    title: "SafeCodeRL: A Multi-Agent Reinforcement Learning Framework for Safety-Constrained LLM Code Generation",
    status: "Published on June 2, 2026",
    role: "First author",
    year: "2026",
    tags: ["AI Safety", "Multi-Agent Systems", "Constrained Reinforcement Learning", "Secure Code Generation", "LLM", "IoT/CPS Security", "Trustworthy AI", "Vulnerability Mitigation"],
    ratings: ["SCI Zone 3", "CCF C"],
    frameworkImage: "/figures/safecoderl-framework.png",
    frameworkAlt: "SafeCodeRL framework diagram showing IoT/CPS contexts, a five-agent closed loop, constraint-aware optimization, and training pipeline."
  },
  {
    title: "SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning",
    status: "arXiv preprint and under review",
    role: "First author",
    year: "2026",
    url: "https://doi.org/10.48550/arXiv.2606.04493",
    tags: ["Computer Vision", "Correspondence Pruning", "Mamba", "State Space Model", "Frequency Domain", "Graph Neural Networks", "Two-View Geometry"],
    ratings: ["SCI Zone 1", "CCF B"],
    frameworkImage: "/figures/sfmambanet-framework.png",
    frameworkAlt: "SFMambaNet framework diagram showing pruning blocks, local spectral-geometric feature extraction, spectral-global aggregation, and verification."
  },
  {
    title: "Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation",
    status: "review manuscript",
    role: "Author",
    year: "2026",
    url: "https://www.undp.org/",
    tags: ["UNDP", "UNV", "Climate Change", "Blue Carbon"],
    frameworkImage: "/figures/mangrove-carbon-dynamics.png",
    frameworkAlt: "Conceptual model of carbon dynamics in mature mangrove ecosystems, showing net primary productivity, carbon sequestration, carbon efflux, and tidal carbon export pathways."
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
