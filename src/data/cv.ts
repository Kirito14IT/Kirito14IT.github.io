import type { Locale } from "@i18n/index";

const yizhangLiuProfileUrl = "https://ccds.fzu.edu.cn/info/1207" + "/11276.htm";
const xsafeclawUrl = "https://github.com/XSafeAI/XSafeClaw";
const teaiUrl = "https://teai.fudan.edu.cn/";
const xingjunMaUrl = "http://xingjunma.com/";
const tipUrl = "https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing";
const jingfengZhangUrl = "https://zjfheart.github.io/";
const gassUrl = "https://www.gass.ac.cn/gass/index.html";
const scamWebUrl = "https://anonymous.4open.science/r/ScamWeb-B710";
const usstAcmUrl = "https://cec.usst.edu.cn/2019/" + "0523/c6556a148258/page.htm";
const embeddedCompetitionUrl = "https://www.socchina.net/home";
const codeWisdomLabUrl = "http://www.se.fudan.edu.cn/";
const yiLiUrl = "http://www.se.fudan.edu.cn/#";

type Link = { label: string; url: string };
type RichText = string | { html: string };

export type NewsItem = {
  date: string;
  text?: string;
  html?: string;
  jumpTo?: string;
};

export type TimelineItem = {
  title?: string;
  titleUrl?: string;
  degree?: string;
  institution?: string;
  school?: string;
  organization?: string;
  organizationUrl?: string;
  period: string;
  details?: string[];
  tags?: string[];
  bullets?: RichText[];
  links?: Link[];
};

export type PublicationItem = {
  title: string;
  status: string;
  role: string;
  year: string;
  url?: string;
  tags: string[];
  ratings?: string[];
  frameworkImage?: string;
  frameworkAlt?: string;
  frameworkCaption?: string;
};

export type ServiceItem = {
  year: string;
  category: string;
  role: string;
  description: string;
};

export type CvData = {
  education: TimelineItem[];
  news: NewsItem[];
  workExperiences: TimelineItem[];
  experiences: TimelineItem[];
  publications: PublicationItem[];
  projects: Array<{ title: string; summary: string; tags: string[]; link?: string }>;
  awards: RichText[];
  services: ServiceItem[];
  skills: Array<{ group: string; items: string[] }>;
  learningProgress: Array<{ area: string; percent: number; summary: string }>;
};

const cvEn: CvData = {
  education: [
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
  ],
  news: [
    {
      date: "Aug 13, 2026",
      html:
        `Received the National First Prize at the National Finals of the <a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer">9th National College Student Embedded Chip and System Design Competition</a>.`
    },
    {
      date: "Aug 2026",
      html:
        `Submitted <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a> to AAAI 2027 after completing research on multimodal data curation, grounded annotation, benchmark design, and training-free fraud understanding.`
    },
    {
      date: "July 2026",
      html:
        `Joined <a href="${jingfengZhangUrl}" target="_blank" rel="noopener noreferrer">Advisor Jingfeng Zhang</a>'s RISE-AI Lab as a visiting student at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a> and began ICLR 2027-targeted research on a benchmark for persistent-memory poisoning in agents. The work adopts a victim-centered perspective to design evaluation cases and examines who ultimately bears the loss after an agent is compromised.`
    },
    {
      date: "July 2026",
      text:
        "Began serving as a reviewer for NeurIPS 2026, contributing to the peer-review process for research in machine learning and artificial intelligence."
    },
    {
      date: "June 2026",
      html:
        `Joined <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Advisor Xingjun Ma</a>'s team at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a> on an enterprise-oriented multi-agent secure collaboration project, contributing to requirements analysis, system design, implementation, and testing.`
    },
    {
      date: "Jan - Apr 2026",
      text:
        "Completed an International Organization Internship through the UNDP-administered UNV platform on mangrove responses to climate change and produced a review manuscript on blue carbon mitigation."
    },
    {
      date: "Mar - Jun 2026",
      html:
        `Worked on the <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a> agent safety project at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a>, focusing on runtime integration, controlled tool calls, and safety audit workflows.`
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
    },
    {
      date: "Jul 2025",
      jumpTo: "#awards-skills",
      text: "My chapter as an ACMer officially came to an end."
    },
    {
      date: "May 2024",
      html:
        `Joined the <a href="${usstAcmUrl}" target="_blank" rel="noopener noreferrer">ACM Programming Training Team at the University of Shanghai for Science and Technology</a> and began my ACM journey. Looking forward to the challenges ahead! 🚀`
    }
  ],
  workExperiences: [
    {
      title: "The Third Research Institute of the Ministry of Public Security - Cybersecurity Center (Shanghai), Research Engineer (Online)",
      period: "Apr 2026 - Present"
    },
    {
      title: "International Organization (United Nations Volunteers) - UNDP, Research Intern (Online)",
      period: "Jan 2026 - Apr 2026"
    },
    {
      title: "Meituan, Odd Jobs",
      period: "Jun 2023 - Sep 2023"
    }
  ],
  experiences: [
    {
      title: "Research Intern, ScamWeb Multimodal Fraud Benchmark",
      titleUrl: scamWebUrl,
      organization: "Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University & The Third Research Institute of the Ministry of Public Security",
      period: "Apr 2026 - Aug 2026",
      tags: ["AAAI 2027", "Multimodal Benchmark", "Cybersecurity", "Grounded Understanding", "Trustworthy AI"],
      bullets: [
        {
          html:
            `Conducted joint research at the <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University</a> and <a href="${gassUrl}" target="_blank" rel="noopener noreferrer">The Third Research Institute of the Ministry of Public Security</a>.`
        },
        {
          html:
            `Worked under the guidance of <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Advisor Xingjun Ma</a> and collaborated with postdoctoral researcher Dr. Nan Li on the full research lifecycle.`
        },
        "Co-developed ScamWeb, a multimodal and multilingual benchmark containing more than 10,000 curated webpages across 25 cyber-enabled fraud subtypes, including 3,416 expert-annotated fraudulent webpages with evidence regions and human-written rationales.",
        "Contributed to data collection and cleaning, fraud taxonomy and expert annotation protocol design, the ScamDet multimodal pipeline and prompts, evaluation metrics, full-scale experiments, manuscript writing, result analysis, and project implementation.",
        {
          html:
            `The completed work, <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a>, has been submitted to AAAI 2027.`
        }
      ],
      links: [
        { label: "ScamWeb Anonymous Repository", url: scamWebUrl },
        { label: "TEAI", url: teaiUrl },
        { label: "Third Research Institute of MPS", url: gassUrl },
        { label: "Advisor Xingjun Ma", url: xingjunMaUrl }
      ]
    },
    {
      title: "Research Intern, XSafeClaw Agent Runtime Safety",
      titleUrl: xsafeclawUrl,
      organization: "Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University",
      organizationUrl: teaiUrl,
      period: "Mar 2026 - Jun 2026",
      tags: ["TEAI", "Agent Safety", "Runtime Governance", "Open Source"],
      bullets: [
        {
          html:
            `Worked on <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a>, an open-source safety platform for local and multi-runtime agent systems, at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">TEAI, Fudan University</a>.`
        },
        {
          html:
            `Worked under the guidance of <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Advisor Xingjun Ma</a>, a Young Researcher and doctoral supervisor at Fudan University.`
        },
        "Implemented runtime integration for nanobot-style local agent sessions, including session discovery, controlled tool calls, and unified platform display.",
        "Contributed to risk control workflows, validation, and documentation for explainable agent governance."
      ],
      links: [
        { label: "XSafeClaw", url: xsafeclawUrl },
        { label: "TEAI", url: teaiUrl },
        { label: "Advisor Xingjun Ma", url: xingjunMaUrl }
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
      period: "Jan 2026 - Apr 2026",
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
            `This work led to our manuscript <a href="https://arxiv.org/abs/2606.04493" target="_blank" rel="noopener noreferrer">SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning</a>, currently under review at <a href="${tipUrl}" target="_blank" rel="noopener noreferrer">IEEE Transactions on Image Processing (TIP)</a> and available as an arXiv preprint.`
        }
      ],
      links: [
        { label: "FZU Key Lab", url: "https://ncip.fzu.edu.cn/xsdt.htm" },
        { label: "Dr. Yizhang Liu", url: yizhangLiuProfileUrl },
        { label: "IEEE TIP", url: tipUrl },
        { label: "SFMambaNet arXiv", url: "https://arxiv.org/abs/2606.04493" }
      ]
    },
    {
      title: "ACMer, ACM Programming Training Team",
      titleUrl: usstAcmUrl,
      organization: "University of Shanghai for Science and Technology",
      period: "May 2024 - Jul 2025",
      tags: ["ACM", "Competitive Programming", "Algorithms", "Data Structures"],
      bullets: [
        "Completed systematic training in algorithms, data structures, and contest problem solving.",
        "Earned a National First Prize in the 2025 RAICOM Robot Developer Competition, a Silver Award at the 2025 CCPC Shanghai Collegiate Programming Contest, and a National Second Prize in the 2025 LanQiao Cup C/C++ competition."
      ],
      links: [
        { label: "ACM Programming Training Team", url: usstAcmUrl }
      ]
    }
  ],
  publications: [
    {
      title: "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
      status: "Under review at AAAI 2027",
      role: "Co-first author",
      year: "2026",
      url: scamWebUrl,
      tags: ["Multimodal Benchmark", "Cyber-enabled Fraud", "Grounded Understanding", "Evidence Localization", "LLM-VLM", "Trustworthy AI"],
      frameworkImage: "/figures/scamweb-dataset-overview.png",
      frameworkAlt: "ScamWeb dataset overview showing data sources, webpage collection and recovery, processed multimodal artifacts, expert annotations, dataset composition, and representative samples.",
      frameworkCaption: "Dataset and annotation overview"
    },
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
      status: "arXiv preprint; under review at IEEE Transactions on Image Processing (TIP)",
      role: "First author",
      year: "2026",
      url: "https://doi.org/10.48550/arXiv.2606.04493",
      tags: ["Computer Vision", "Correspondence Pruning", "Mamba", "State Space Model", "Frequency Domain", "Graph Neural Networks", "Two-View Geometry"],
      ratings: ["SCI Zone 1", "CCF A"],
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
  ],
  projects: [
    {
      title: "XSafeClaw Agent Safety Platform",
      summary: "Runtime safety governance for agent systems, including trajectory collection, tool-call inspection, human approval, and risk auditing.",
      tags: ["Agent Safety", "Runtime", "Open Source"],
      link: xsafeclawUrl
    },
    {
      title: "VulnSeeker",
      summary: "Automated security analysis pipeline that combines CodeQL static analysis and LLM-based vulnerability classification.",
      tags: ["CodeQL", "Security", "LLM"]
    },
    {
      title: "Robust Deep-Learning Watermark Mobile Application",
      summary: "A cross-platform image copyright and identity authentication system combining neural watermarking models with mobile image processing.",
      tags: ["Watermarking", "Mobile", "Deep Learning"]
    }
  ],
  awards: [
    {
      html:
        `National First Prize, National Finals of the <a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer">9th National College Student Embedded Chip and System Design Competition</a> — Aug 13, 2026`
    },
    "National First Prize, RAICOM Robot Developer Competition, 2025",
    "National Second Prize, LanQiao Cup C/C++ Programming Contest, 2025",
    "Silver Award, CCPC Shanghai Collegiate Programming Contest, 2025",
    "National Encouragement Scholarship, Three-time Recipient",
    "National Third Prize, National English Competition for College Students, 2025",
    "Shanghai First Prize, National College Student Mathematics Competition, 2024",
    "First-author software copyright for a robust deep-learning watermark mobile application"
  ],
  services: [
    {
      year: "2026",
      category: "Peer Review",
      role: "Reviewer, NeurIPS 2026",
      description: "Contributing to rigorous peer evaluation for research in machine learning and artificial intelligence."
    }
  ],
  skills: [
    { group: "Research", items: ["AI safety", "LLM agents", "program analysis", "computer vision", "scientific writing"] },
    { group: "Programming", items: ["C/C++", "Python", "Java", "TypeScript", "Astro"] },
    { group: "Tools", items: ["CodeQL", "Git", "LaTeX", "Overleaf", "PyTorch", "TensorFlow"] },
    { group: "Language", items: ["English technical reading", "CET-4 and CET-6 passed"] }
  ],
  learningProgress: [
    {
      area: "AI Safety and LLM Agents",
      percent: 88,
      summary: "Focused on agent runtime governance, safety-constrained code generation, tool-call auditing, and human-in-the-loop risk control."
    },
    {
      area: "Software Security and Program Analysis",
      percent: 84,
      summary: "Built workflows around CodeQL, LLM-assisted vulnerability judgement, code context expansion, and post-generation security inspection."
    },
    {
      area: "Deep Learning and Multimodal Intelligence",
      percent: 82,
      summary: "Studied neural architectures for visual correspondence, spectral-frequency modeling, state space models, and robust image watermarking."
    },
    {
      area: "Algorithms and Systems Programming",
      percent: 86,
      summary: "Maintains strong C/C++ foundations through algorithmic problem solving, contest-style implementation, and performance-conscious coding."
    },
    {
      area: "Scientific Writing and Research Methodology",
      percent: 80,
      summary: "Practices literature synthesis, experiment design, manuscript organization, and cross-domain research communication."
    },
    {
      area: "Web Engineering and Research Prototyping",
      percent: 78,
      summary: "Uses TypeScript, Python, Git, LaTeX, and static-site tooling to turn research ideas into reproducible public artifacts."
    }
  ]
};

const cvZh: CvData = {
  education: [
    {
      degree: "工学学士，计算机科学与技术",
      institution: "上海理工大学",
      school: "光电信息与计算机工程学院",
      period: "2023年9月 - 至今",
      details: [
        "主要学术兴趣包括软件工程、Web 应用开发、人工智能、算法与高性能程序设计。",
        "公开主页重点展示研究方向、项目成果与技术成长，不展示具体课程分数或绩点。"
      ]
    }
  ],
  news: [
    {
      date: "2026年8月13日",
      html:
        `获得<a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer">第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛</a>全国一等奖。`
    },
    {
      date: "2026年8月",
      html:
        `完成 <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a> 的多模态数据整理、落地式标注、基准设计与免训练诈骗理解研究，并投稿至 AAAI 2027。`
    },
    {
      date: "2026年7月",
      html:
        `加入<a href="${jingfengZhangUrl}" target="_blank" rel="noopener noreferrer">导师张景锋</a>的 RISE-AI Lab，在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">复旦大学可信具身智能研究院（TEAI）</a>担任访问学生，开展以 ICLR 2027 为投稿目标的智能体持久性记忆投毒评测基准研究。该工作从受害者视角设计评测案例，并分析智能体遭受攻击后最终由谁承担损失。`
    },
    {
      date: "2026年7月",
      text: "开始担任 NeurIPS 2026 审稿人，参与机器学习与人工智能研究的同行评审工作。"
    },
    {
      date: "2026年6月",
      html:
        `加入<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">导师马兴军</a>在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">复旦大学可信具身智能研究院（TEAI）</a>的团队，参与面向企业的多智能体安全协作项目，负责需求分析、系统设计、实现与测试。`
    },
    {
      date: "2026年1月 - 4月",
      text: "通过由 UNDP 管理的 UNV 平台完成国际组织实习，研究红树林对气候变化的响应，并产出蓝碳减缓方向的综述手稿。"
    },
    {
      date: "2026年3月 - 6月",
      html:
        `在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">复旦大学可信具身智能研究院（TEAI）</a>参与 <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a> 智能体安全项目，聚焦运行时接入、受控工具调用与安全审计流程。`
    },
    {
      date: "2026年2月",
      text: "启动 SafeCodeRL 研究，探索面向安全约束大语言模型代码生成的多智能体强化学习框架。"
    },
    {
      date: "2026年1月",
      html:
        `在<a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer">复旦大学软件工程（CodeWisdom）实验室</a>开展 VulnSeeker 研究，将 CodeQL 静态分析与基于 LLM 的安全判断相结合。`
    },
    {
      date: "2025年9月",
      text: "启动 SFMambaNet 研究，探索用于对应关系剪枝的谱频增强状态空间模型。"
    },
    {
      date: "2025年7月",
      jumpTo: "#awards-skills",
      text: "我的 ACMer 身份正式退役。"
    },
    {
      date: "2024年5月",
      html:
        `加入<a href="${usstAcmUrl}" target="_blank" rel="noopener noreferrer">上海理工大学 ACM 程序设计集训队</a>，开启了我的 ACM 生涯。期待接下来的挑战！🚀`
    }
  ],
  workExperiences: [
    {
      title: "公安部第三研究所-网安中心部门（上海），科研工程师（线上）",
      period: "2026年4月 - 至今"
    },
    {
      title: "国际组织（联合国志愿人员组织）- UNDP，研究实习生（线上）",
      period: "2026年1月 - 2026年4月"
    },
    {
      title: "美团，打零工",
      period: "2023年6月 - 2023年9月"
    }
  ],
  experiences: [
    {
      title: "科研实习生，ScamWeb 多模态诈骗网页基准",
      titleUrl: scamWebUrl,
      organization: "复旦大学可信具身智能研究院（TEAI）与公安部第三研究所",
      period: "2026年4月 - 8月",
      tags: ["AAAI 2027", "多模态基准", "网络安全", "落地式理解", "可信人工智能"],
      bullets: [
        {
          html:
            `在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">复旦大学可信具身智能研究院（TEAI）</a>与<a href="${gassUrl}" target="_blank" rel="noopener noreferrer">公安部第三研究所</a>开展联合研究。`
        },
        {
          html:
            `在<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">导师马兴军</a>指导下，与博士后李楠合作完成完整研究流程。`
        },
        "共同构建 ScamWeb 多模态、多语言基准，收录 25 类网络诈骗场景下超过 10,000 个筛选网页，其中 3,416 个诈骗网页由专家标注证据区域并撰写解释。",
        "参与数据采集与清洗、诈骗分类体系与专家标注协议设计、ScamDet 多模态流程与提示词设计、评测指标、全量实验、论文写作、结果分析及项目实现。",
        {
          html:
            `相关工作 <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a> 已投稿至 AAAI 2027。`
        }
      ],
      links: [
        { label: "ScamWeb 匿名仓库", url: scamWebUrl },
        { label: "复旦大学 TEAI", url: teaiUrl },
        { label: "公安部第三研究所", url: gassUrl },
        { label: "导师马兴军", url: xingjunMaUrl }
      ]
    },
    {
      title: "科研实习生，XSafeClaw 智能体运行时安全",
      titleUrl: xsafeclawUrl,
      organization: "复旦大学可信具身智能研究院（TEAI）",
      organizationUrl: teaiUrl,
      period: "2026年3月 - 6月",
      tags: ["TEAI", "智能体安全", "运行时治理", "开源"],
      bullets: [
        {
          html:
            `在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer">复旦大学可信具身智能研究院（TEAI）</a>参与 <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer">XSafeClaw</a>，该项目是面向本地与多运行时智能体系统的开源安全平台。`
        },
        {
          html:
            `在复旦大学青年研究员、博士生导师<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">导师马兴军</a>指导下开展工作。`
        },
        "实现 nanobot 风格本地智能体会话的运行时接入，包括会话发现、受控工具调用与统一平台展示。",
        "参与风险控制流程、验证工作与可解释智能体治理文档建设。"
      ],
      links: [
        { label: "XSafeClaw", url: xsafeclawUrl },
        { label: "复旦大学 TEAI", url: teaiUrl },
        { label: "导师马兴军", url: xingjunMaUrl }
      ]
    },
    {
      title: "科研实习生，VulnSeeker",
      organization: "复旦大学软件工程（CodeWisdom）实验室",
      organizationUrl: codeWisdomLabUrl,
      period: "2026年1月 - 3月",
      tags: ["CodeWisdom", "CodeQL", "LLM 安全", "程序分析"],
      bullets: [
        {
          html:
            `在<a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer">复旦大学软件工程（CodeWisdom）实验室</a>开展科研实习，研究生成代码与仓库代码的自动化安全分析。`
        },
        {
          html:
            `在<a href="${yiLiUrl}" target="_blank" rel="noopener noreferrer">李昳讲师</a>指导下，与博士生陈启才合作完成文献调研、流程设计与实验验证。`
        },
        "构建结合静态分析、代码上下文扩展与 LLM 安全判断的 CodeQL 辅助漏洞分析流程。",
        "设计 CodeQL 与 LLM 协同提示流程，包括用于漏洞分诊和生成后安全检查的结构化状态码。"
      ],
      links: [
        { label: "CodeWisdom 实验室", url: codeWisdomLabUrl },
        { label: "李昳讲师", url: yiLiUrl }
      ]
    },
    {
      title: "国际组织实习：UNDP 管理的 UNV 在线科研实习生",
      titleUrl: "https://www.undp.org/",
      organization: "巴布亚新几内亚 Morobe Development Foundation Inc.",
      period: "2026年1月 - 4月",
      tags: ["UNDP", "UNV", "气候变化", "蓝碳"],
      bullets: [
        "通过由 UNDP 管理的联合国志愿人员组织（UNV）平台完成国际组织实习，支持红树林对气候变化情景响应与蓝碳减缓研究。",
        "联合国志愿人员组织（UNV）项目由联合国开发计划署（UNDP）管理。",
        "综合梳理海平面上升、海岸挤压、营养物负荷、碳封存与国家气候政策相关文献。",
        "完成综述手稿 Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation。"
      ],
      links: [
        { label: "UNDP", url: "https://www.undp.org/" },
        { label: "UNV", url: "https://www.unv.org/" },
        { label: "任务说明 PDF", url: "/documents/unv/task-assignment.pdf" },
        { label: "实习证书 PDF", url: "/documents/unv/internship-certificate.pdf" },
        { label: "感谢信 PDF", url: "/documents/unv/thank-you-letter.pdf" }
      ]
    },
    {
      title: "第一作者研究，SafeCodeRL",
      organization: "独立科研合作",
      period: "2026年2月 - 至今",
      tags: ["人工智能安全", "多智能体系统", "约束强化学习", "安全代码生成", "LLM 代码生成", "IoT/CPS 安全", "可信人工智能"],
      bullets: [
        "提出 SafeCodeRL，一种面向大语言模型代码生成动态安全约束的多智能体框架。",
        "设计由五个智能体组成的闭环协作流程与 PPO 风格的约束感知策略。",
        "论文报告结果显示，该方法在保持代码功能正确性的同时显著减少高风险漏洞代码生成。"
      ]
    },
    {
      title: "科研实习生，SFMambaNet",
      titleUrl: "https://arxiv.org/abs/2606.04493",
      organization: "福州大学福建省网络计算与智能信息处理重点实验室",
      organizationUrl: "https://ncip.fzu.edu.cn/xsdt.htm",
      period: "2025年9月 - 2026年3月",
      tags: ["计算机视觉", "对应关系剪枝", "Mamba", "状态空间模型", "频域", "双视图几何", "外点剔除"],
      bullets: [
        {
          html:
            '于 2025 年 9 月至 2026 年 3 月在福州大学<a href="https://ncip.fzu.edu.cn/xsdt.htm" target="_blank" rel="noopener noreferrer">福建省网络计算与智能信息处理重点实验室</a>担任科研实习生。'
        },
        {
          html:
            `与校聘副研究员、研究生导师<a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer">刘一璋博士</a>紧密合作，研究鲁棒双视图对应关系剪枝。`
        },
        {
          html:
            `相关工作 <a href="https://arxiv.org/abs/2606.04493" target="_blank" rel="noopener noreferrer">SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning</a> 正在 <a href="${tipUrl}" target="_blank" rel="noopener noreferrer">IEEE Transactions on Image Processing (TIP)</a> 审稿，并已发布 arXiv 预印本。`
        }
      ],
      links: [
        { label: "福州大学重点实验室", url: "https://ncip.fzu.edu.cn/xsdt.htm" },
        { label: "刘一璋博士", url: yizhangLiuProfileUrl },
        { label: "IEEE TIP", url: tipUrl },
        { label: "SFMambaNet arXiv", url: "https://arxiv.org/abs/2606.04493" }
      ]
    },
    {
      title: "ACMer，ACM 程序设计集训队",
      titleUrl: usstAcmUrl,
      organization: "上海理工大学",
      period: "2024年5月 - 2025年7月",
      tags: ["ACM", "程序设计竞赛", "算法", "数据结构"],
      bullets: [
        "系统训练算法、数据结构与竞赛问题求解能力。",
        "期间获得 2025 年睿抗机器人开发者大赛国家级一等奖、2025 年 CCPC 上海站银奖以及 2025 年蓝桥杯 C/C++ 组全国二等奖。"
      ],
      links: [
        { label: "ACM 程序设计集训队", url: usstAcmUrl }
      ]
    }
  ],
  publications: [
    {
      title: "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
      status: "AAAI 2027 在投",
      role: "共同第一作者",
      year: "2026",
      url: scamWebUrl,
      tags: ["多模态基准", "网络诈骗", "落地式理解", "证据定位", "LLM-VLM", "可信人工智能"],
      frameworkImage: "/figures/scamweb-dataset-overview.png",
      frameworkAlt: "ScamWeb 数据集概览，包括数据来源、网页采集与恢复、多模态处理结果、专家标注、数据集构成和代表性样本。",
      frameworkCaption: "数据集与标注概览"
    },
    {
      title: "SafeCodeRL: A Multi-Agent Reinforcement Learning Framework for Safety-Constrained LLM Code Generation",
      status: "发表于 2026 年 6 月 2 日",
      role: "第一作者",
      year: "2026",
      tags: ["人工智能安全", "多智能体系统", "约束强化学习", "安全代码生成", "LLM", "IoT/CPS 安全", "可信人工智能", "漏洞缓解"],
      ratings: ["SCI 三区", "CCF C"],
      frameworkImage: "/figures/safecoderl-framework.png",
      frameworkAlt: "SafeCodeRL 框架图，展示 IoT/CPS 任务上下文、五智能体闭环、约束感知优化与训练流程。"
    },
    {
      title: "SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning",
      status: "arXiv 预印本；IEEE Transactions on Image Processing (TIP) 在投",
      role: "第一作者",
      year: "2026",
      url: "https://doi.org/10.48550/arXiv.2606.04493",
      tags: ["计算机视觉", "对应关系剪枝", "Mamba", "状态空间模型", "频域", "图神经网络", "双视图几何"],
      ratings: ["SCI 一区", "CCF A"],
      frameworkImage: "/figures/sfmambanet-framework.png",
      frameworkAlt: "SFMambaNet 框架图，展示剪枝模块、局部谱几何特征提取、谱全局聚合与验证模块。"
    },
    {
      title: "Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation",
      status: "综述手稿",
      role: "作者",
      year: "2026",
      url: "https://www.undp.org/",
      tags: ["UNDP", "UNV", "气候变化", "蓝碳"],
      frameworkImage: "/figures/mangrove-carbon-dynamics.png",
      frameworkAlt: "成熟红树林生态系统碳动态概念模型，展示净初级生产力、碳封存、碳排放与潮汐碳输出路径。"
    }
  ],
  projects: [
    {
      title: "XSafeClaw Agent Safety Platform",
      summary: "面向智能体系统的运行时安全治理，包括轨迹采集、工具调用检查、人工审批与风险审计。",
      tags: ["智能体安全", "运行时", "开源"],
      link: xsafeclawUrl
    },
    {
      title: "VulnSeeker",
      summary: "结合 CodeQL 静态分析与 LLM 漏洞分类的自动化安全分析流程。",
      tags: ["CodeQL", "安全", "LLM"]
    },
    {
      title: "Robust Deep-Learning Watermark Mobile Application",
      summary: "结合神经水印模型与移动端图像处理的跨平台图像版权及身份认证系统。",
      tags: ["数字水印", "移动应用", "深度学习"]
    }
  ],
  awards: [
    {
      html:
        `<a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer">第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛</a>全国一等奖（2026年8月13日）`
    },
    "2025 年睿抗机器人开发者大赛国家级一等奖",
    "2025 年蓝桥杯 C/C++ 程序设计竞赛全国二等奖",
    "2025 年中国大学生程序设计竞赛（CCPC）上海站银奖",
    "国家励志奖学金（3 次）",
    "2025 年全国大学生英语竞赛全国三等奖",
    "2024 年全国大学生数学竞赛上海市一等奖",
    "深度学习鲁棒水印移动应用软件著作权（第一作者）"
  ],
  services: [
    {
      year: "2026",
      category: "同行评审",
      role: "NeurIPS 2026 审稿人",
      description: "参与机器学习与人工智能研究的严谨同行评审工作。"
    }
  ],
  skills: [
    { group: "研究", items: ["人工智能安全", "LLM 智能体", "程序分析", "计算机视觉", "科研写作"] },
    { group: "编程", items: ["C/C++", "Python", "Java", "TypeScript", "Astro"] },
    { group: "工具", items: ["CodeQL", "Git", "LaTeX", "Overleaf", "PyTorch", "TensorFlow"] },
    { group: "语言", items: ["英文技术文献阅读", "已通过 CET-4 与 CET-6"] }
  ],
  learningProgress: [
    {
      area: "人工智能安全与 LLM 智能体",
      percent: 88,
      summary: "重点学习智能体运行时治理、安全约束代码生成、工具调用审计与人在回路的风险控制。"
    },
    {
      area: "软件安全与程序分析",
      percent: 84,
      summary: "围绕 CodeQL、LLM 辅助漏洞判断、代码上下文扩展与生成后安全检查构建实践流程。"
    },
    {
      area: "深度学习与多模态智能",
      percent: 82,
      summary: "学习视觉对应关系神经架构、谱频建模、状态空间模型与鲁棒图像水印。"
    },
    {
      area: "算法与系统程序设计",
      percent: 86,
      summary: "通过算法竞赛、问题求解与性能导向编程保持扎实的 C/C++ 基础。"
    },
    {
      area: "科研写作与研究方法",
      percent: 80,
      summary: "持续训练文献综合、实验设计、论文组织与跨领域科研表达能力。"
    },
    {
      area: "Web 工程与研究原型开发",
      percent: 78,
      summary: "使用 TypeScript、Python、Git、LaTeX 与静态网站工具，将研究想法转化为可复现的公开成果。"
    }
  ]
};

export const cvByLocale: Record<Locale, CvData> = { en: cvEn, zh: cvZh };
export const getCvData = (locale: Locale) => cvByLocale[locale];

export const {
  education,
  news,
  workExperiences,
  experiences,
  publications,
  projects,
  awards,
  services,
  skills,
  learningProgress
} = cvEn;
