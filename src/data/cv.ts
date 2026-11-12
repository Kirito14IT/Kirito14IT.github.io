import type { Locale } from "@i18n/index";

const yizhangLiuProfileUrl = "https://ccds.fzu.edu.cn/info/1207" + "/11276.htm";
const fzuKeyLabUrl = "https://ncip.fzu.edu.cn/index.htm";
const xsafeclawUrl = "https://github.com/XSafeAI/XSafeClaw";
const vulnseekerUrl = "https://github.com/Kirito14IT/VulnSeeker";
const sfmambanetCodeUrl = "https://github.com/Kirito14IT/SFMambaNet";
const teaiUrl = "https://teai.fudan.edu.cn/";
const xingjunMaUrl = "http://xingjunma.com/";
const yuGangJiangUrl = "https://baike.baidu.com/item/%E5%A7%9C%E8%82%B2%E5%88%9A/22131913";
const tipUrl = "https://signalprocessingsociety.org/publications-resources/ieee-transactions-image-processing";
const jingfengZhangUrl = "https://zjfheart.github.io/";
const gassUrl = "https://www.gass.ac.cn/gass/index.html";
const scamWebUrl = "https://anonymous.4open.science/r/ScamWeb-B710";
const scamWebDatasetUrl = "https://huggingface.co/datasets/kirco567/ScamWeb-Dataset";
const usstAcmUrl = "https://cec.usst.edu.cn/2019/" + "0523/c6556a148258/page.htm";
const embeddedCompetitionUrl = "https://www.socchina.net/home";
const codeWisdomLabUrl = "http://www.se.fudan.edu.cn/";
const yiLiUrl = "http://www.se.fudan.edu.cn/#";
const logitechMouseFixRepoUrl = "https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep";
const logitechMouseFixIssueUrl = "https://github.com/Logitech/cpg-docs/issues/25";
const aiSafetyHotUrl = "https://github.com/wuyoscar/AISafetyHot";
const promptSpiderUrl = "https://github.com/Kirito14IT/prompt-spider-ui";
const memHarmBenchTitle = "MemHarmBench: Evaluating Cross-Session Prompt Injection in Memory-Persistent AI Agents";
const cstTitle = "CST: Lightweight Risk Triage with Source-Grounded Evidence for Web Discussions";
const memHarmBenchPaperUrl = "https://arxiv.org/abs/2611.01700";
const memHarmBenchCodeUrl = "https://github.com/Kirito14IT/MemHarmBench";
const cstPaperUrl = "https://arxiv.org/abs/2611.01710";
const cstCodeUrl = "https://github.com/Kirito14IT/CST-MIL";
const safeCodeRlTitle = "SafeCodeRL: Security-Constrained Multi-Agent Reinforcement Learning for Trustworthy LLM-Generated IoT/CPS Software";
const safeCodeRlPaperUrl = "/papers/safecoderl.pdf";

const publicationCredits = {
  memHarmBench: {
    authors: ["Zhihua Wang", "Yunhao Feng", "Yifeng Gao", "Rui Pan", "Baiheng Zhao", "Zixing Chen", "Xingjun Ma"],
    correspondingAuthor: "Xingjun Ma",
    date: "2026.11.01"
  },
  cst: {
    authors: ["Zhihua Wang", "Yifeng Gao", "Yunhao Feng", "Rui Pan", "Baiheng Zhao", "Zixing Chen", "Nan Li"],
    correspondingAuthor: "Yifeng Gao",
    date: "2026.11.01"
  },
  scamWeb: {
    authors: ["Nan Li", "Zhihua Wang", "Ziyang Chen", "Yunhao Feng", "Songyang Wu"],
    coFirstAuthors: ["Nan Li", "Zhihua Wang"],
    correspondingAuthor: "Songyang Wu",
    homepageRatings: ["AAAI 2027", "CCF A"],
    date: "2026.08"
  },
  safeCodeRl: {
    authors: ["Zhihua Wang", "Junfan Chen", "Zixiang Wei", "Lan Lin", "Guoxiang Tong"],
    correspondingAuthor: "Guoxiang Tong",
    date: "2026.06.02"
  },
  sfmambaNet: {
    authors: ["Zhihua Wang", "Yanping Li", "Yizhang Liu"],
    homepageAuthors: ["Zhihua Wang", "Yifeng Gao", "Yanping Li", "Yizhang Liu"],
    correspondingAuthor: "Yanping Li",
    date: "2026.06.03"
  },
  mangrove: { authors: ["Zhihua Wang"], date: "2026" }
} as const;

type Link = { label: string; url: string; logo?: string };
type RichText = string | { html: string };
export type StarRepo = "wuyoscar/AISafetyHot" | "Kirito14IT/prompt-spider-ui" | "XSafeAI/XSafeClaw";

export type NewsMediaItem = { src: string; alt: string; caption: string; width: number; height: number };

export type NewsItem = {
  date: string;
  emoji?: string;
  text?: string;
  html?: string;
  jumpTo?: string;
  starRepos?: StarRepo[];
  links?: Link[];
  media?: NewsMediaItem;
};

export type TimelineItem = {
  title?: string;
  summary?: string;
  titleUrl?: string;
  degree?: string;
  institution?: string;
  school?: string;
  organization?: string;
  organizationUrl?: string;
  period: string;
  details?: RichText[];
  tags?: string[];
  bullets?: RichText[];
  links?: Link[];
  starRepos?: StarRepo[];
};

export type PublicationItem = {
  title: string;
  authors: readonly string[];
  homepageAuthors?: readonly string[];
  correspondingAuthor?: string;
  coFirstAuthors?: readonly string[];
  status: string;
  homepageStatus?: string;
  role: string;
  date: string;
  url?: string;
  links?: Link[];
  datasetDownloads?: { repo: string; fallback: number };
  tags: string[];
  ratings?: readonly string[];
  homepageRatings?: readonly string[];
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
      degree: "Incoming CS M.S. Student",
      institution: "Fudan University",
      period: "2027.09 – 2030.06 (expected)",
      details: [
        { html: `Advisor: <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Xingjun Ma</a>.` },
        { html: `Lab Director: <a href="${yuGangJiangUrl}" target="_blank" rel="noopener noreferrer">Yu-Gang Jiang (Vice President, Fudan University)</a>.` },
        "Lab and institute: Fudan Vision and Learning Lab (FVL) and Institute of Trustworthy Embodied AI (TEAI)."
      ],
      links: [
        { label: "Fudan FVL", url: "https://fvl.fudan.edu.cn/", logo: "/github-profile/fudan-university-logo.png" },
        { label: "TEAI", url: "https://teai.fudan.edu.cn/#/", logo: "/github-profile/fudan-teai-logo.png" }
      ]
    },
    {
      degree: "B.Eng. in Computer Science and Technology (in progress)",
      institution: "University of Shanghai for Science and Technology",
      school: "School of Optical-Electrical and Computer Engineering",
      period: "2023.09 – 2027.06",
      details: [
        "Class of 2023; currently a senior undergraduate.",
        "Core academic interests: software engineering, web application development, artificial intelligence, algorithms, and high-performance programming."
      ]
    }
  ],
  news: [
    {
      date: "2026.11.04",
      emoji: "📣",
      html: `<a href="${memHarmBenchPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>MemHarmBench</strong></a> was recommended by Shanghai Innovation Institute and featured in MiraclePlus's <strong>Alpha Sight</strong>.`,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "Code", url: memHarmBenchCodeUrl }],
      media: {
        src: "/news/memharmbench-alpha-sight-recommendation-20261104.png",
        alt: "Alpha Sight's 2026.11.04 digest recommending MemHarmBench, highlighted in the original screenshot.",
        caption: "Alpha Sight recommendation · View screenshot",
        width: 1328,
        height: 992
      }
    },
    {
      date: "2026.10.26",
      emoji: "📄",
      html: `The code for <a href="${memHarmBenchPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>${memHarmBenchTitle}</strong></a> is publicly available on GitHub, and the paper is available on arXiv.`,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "Code", url: memHarmBenchCodeUrl }]
    },
    {
      date: "2026.10.26",
      emoji: "📄",
      html: `The code for <a href="${cstPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>${cstTitle}</strong></a> is publicly available on GitHub, and the paper is available on arXiv.`,
      links: [{ label: "arXiv", url: cstPaperUrl }, { label: "Code", url: cstCodeUrl }]
    },
    {
      date: "2026.10.21",
      emoji: "🛠️",
      html:
        `Published a <a href="${logitechMouseFixRepoUrl}" target="_blank" rel="noopener noreferrer"><strong>Logitech mouse sleep/wake investigation and recovery scripts</strong></a>, documenting receiver power-loss behavior and the initial filter-driver hypothesis that later testing ruled out. Updated the attribution in the <a href="${logitechMouseFixIssueUrl}" target="_blank" rel="noopener noreferrer">upstream issue</a>.`
    },
    {
      date: "2026.10",
      emoji: "💻",
      starRepos: ["wuyoscar/AISafetyHot", "Kirito14IT/prompt-spider-ui"],
      html: `Participated in the open-source projects <a href="${aiSafetyHotUrl}" target="_blank" rel="noopener noreferrer"><strong>AISafetyHot</strong></a> and <a href="${promptSpiderUrl}" target="_blank" rel="noopener noreferrer"><strong>prompt-spider-ui</strong></a> during China's National Day holiday. Many thanks to my collaborators for their support and ideas.`
    },
    {
      date: "2026.08.13",
      emoji: "🏆",
      html:
        `Received the <strong>National First Prize</strong> at the National Finals of the <a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer"><strong>9th National College Student Embedded Chip and System Design Competition</strong></a>.`
    },
    {
      date: "2026.08",
      emoji: "🔎",
      html:
        `Completed research on multimodal data curation, grounded annotation, benchmark design, and training-free fraud understanding for <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer"><strong>ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</strong></a>.`
    },
    {
      date: "2026.07",
      emoji: "💼",
      html:
        `Joined <a href="${jingfengZhangUrl}" target="_blank" rel="noopener noreferrer"><strong>Advisor Jingfeng Zhang</strong></a>'s RISE-AI Lab as a visiting student at <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>TEAI, Fudan University</strong></a> and began research on MemHarmBench, a benchmark for persistent-memory poisoning in agents. The work adopts a victim-centered perspective to design evaluation cases and examines who ultimately bears the loss after an agent is compromised.`
    },
    {
      date: "2026.07",
      emoji: "📝",
      html:
        "Began serving as a <strong>reviewer for NeurIPS 2026</strong>, contributing to the peer-review process for research in machine learning and artificial intelligence."
    },
    {
      date: "2026.06",
      emoji: "🤝",
      html:
        `At <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>TEAI, Fudan University</strong></a>, under the guidance of <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer"><strong>Advisor Xingjun Ma</strong></a>, I participated in an enterprise-oriented multi-agent secure collaboration project, contributing to requirements analysis, system design, implementation, and testing.`
    },
    {
      date: "2026.01 – 2026.04",
      emoji: "🌿",
      html:
        "Completed an <strong>International Organization Internship</strong> through the <strong>UNDP-administered UNV platform</strong> on mangrove responses to climate change and produced a review manuscript on blue carbon mitigation."
    },
    {
      date: "2026.03 – 2026.06",
      emoji: "🛡️",
      starRepos: ["XSafeAI/XSafeClaw"],
      html:
        `Joined <a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>TEAI, Fudan University</strong></a> and, under the guidance of <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer"><strong>Advisor Xingjun Ma</strong></a>, worked on the <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer"><strong>XSafeClaw</strong></a> agent safety project, focusing on runtime integration, controlled tool calls, and safety audit workflows.`
    },
    {
      date: "2026.02",
      emoji: "🔬",
      html:
        "Started <strong>SafeCodeRL</strong>, a multi-agent reinforcement learning framework for safety-constrained LLM code generation."
    },
    {
      date: "2026.01",
      emoji: "🔍",
      html:
        `Worked on VulnSeeker at the <a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer"><strong>Fudan Software Engineering (CodeWisdom) Lab</strong></a>, combining CodeQL static analysis with LLM-based security judgement.`
    },
    {
      date: "2025.09",
      emoji: "💼",
      html:
        `Joined the <a href="${fzuKeyLabUrl}" target="_blank" rel="noopener noreferrer"><strong>Fujian Key Laboratory of Network Computing and Intelligent Information Processing</strong></a> at Fuzhou University and, under the guidance of <a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer"><strong>Advisor Yizhang Liu</strong></a>, began SFMambaNet research on spectral-frequency enhanced state space models for correspondence pruning.`
    },
    {
      date: "2025.07",
      emoji: "🎓",
      jumpTo: "#awards-skills",
      html: "My chapter as an <strong>ACMer</strong> officially came to an end."
    },
    {
      date: "2024.05",
      emoji: "🚀",
      html:
        `Joined the <a href="${usstAcmUrl}" target="_blank" rel="noopener noreferrer"><strong>ACM Programming Training Team at the University of Shanghai for Science and Technology</strong></a> and began my ACM journey. Looking forward to the challenges ahead! 🚀`
    }
  ],
  workExperiences: [
    {
      title: "AI Research Intern, Key Laboratory of Information Network Security, Ministry of Public Security (Third Research Institute, Shanghai)",
      period: "2026.04 – present",
      bullets: [
        { html: "<strong>Advisor:</strong> Songyang Wu" },
        { html: "<strong>Project 1:</strong> Independently built a pipeline for joint analysis of webpage text, images, and URLs and localization of fraud evidence, producing <strong>one sole-first-author paper</strong>." },
        { html: "<strong>Project 2:</strong> Designed a <strong>lightweight algorithm for short-text risk-topic discovery</strong>, combining character and frozen semantic features to aggregate risk evidence from group chats and enable rapid CPU-based screening." }
      ]
    },
    {
      title: "International Organization (United Nations Volunteers) - UNDP, Research Intern (Online)",
      period: "2026.01 – 2026.04"
    },
    {
      title: "Meituan, Odd Jobs",
      period: "2023.06 – 2023.09"
    }
  ],
  experiences: [
    {
      title: "Research Intern, MemHarmBench and CST",
      summary: "Built MemHarmBench for cross-session memory poisoning and CST for CPU-based risk triage.",
      organization: "Institute of Trustworthy Embodied AI (TEAI), Fudan University · FVL Laboratory · Shanghai Innovation Institute",
      period: "2026.08 – 2026.11",
      tags: ["Agent Safety", "Memory Poisoning", "Risk Triage", "Source-Grounded Evidence", "First Author"],
      bullets: [
        { html: `Advised by <a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">Xingjun Ma</a> and <a href="${yuGangJiangUrl}" target="_blank" rel="noopener noreferrer">Yu-Gang Jiang (Vice President, Fudan University)</a>.` },
        { html: "<strong>MemHarmBench:</strong> Built an exposure–trigger benchmark for cross-session memory poisoning with <strong>288 case environments</strong> (24 attack templates × 12 business scenarios) and 12 target categories. On samples retaining malicious rules, indirect attack success reached <strong>59.38%–76.39%</strong>." },
        { html: "<strong>CST:</strong> Designed a lightweight algorithm for short-text risk-topic discovery, combining character-level and frozen semantic features to aggregate risk evidence from group chats for rapid CPU screening and source-grounded review." }
      ],
      links: [
        { label: "MemHarmBench · arXiv", url: memHarmBenchPaperUrl },
        { label: "MemHarmBench · Code", url: memHarmBenchCodeUrl },
        { label: "CST · arXiv", url: cstPaperUrl },
        { label: "CST · Code", url: cstCodeUrl }
      ]
    },
    {
      title: "Research Intern, ScamWeb Multimodal Fraud Benchmark",
      summary: "Co-developed a multilingual fraud benchmark with expert-annotated evidence and explanations.",
      titleUrl: scamWebUrl,
      organization: "Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University & The Third Research Institute of the Ministry of Public Security",
      period: "2026.04 – 2026.08",
      tags: ["Multimodal Benchmark", "Cybersecurity", "Grounded Understanding", "Trustworthy AI"],
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
            `The research manuscript is titled <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a>.`
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
      summary: "Integrated local agent sessions with controlled tool calls and runtime safety audits.",
      starRepos: ["XSafeAI/XSafeClaw"],
      titleUrl: xsafeclawUrl,
      organization: "Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University",
      organizationUrl: teaiUrl,
      period: "2026.03 – 2026.06",
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
      summary: "Combined CodeQL analysis, code context, and LLM judgement for vulnerability triage.",
      titleUrl: vulnseekerUrl,
      organization: "Fudan Software Engineering (CodeWisdom) Lab",
      organizationUrl: codeWisdomLabUrl,
      period: "2026.01 – 2026.03",
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
        { label: "VulnSeeker Code", url: vulnseekerUrl },
        { label: "CodeWisdom Lab", url: codeWisdomLabUrl },
        { label: "Lecturer Yi Li", url: yiLiUrl }
      ]
    },
    {
      title: "International Organization Internship, UNDP-administered UNV Online Research Intern",
      summary: "Reviewed mangrove responses to climate change and blue carbon mitigation through UNV.",
      titleUrl: "https://www.undp.org/",
      organization: "Morobe Development Foundation Inc., Papua New Guinea",
      period: "2026.01 – 2026.04",
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
      summary: "Designed a five-agent, constraint-aware RL workflow for secure LLM code generation.",
      organization: "Independent research collaboration",
      period: "2026.02 – 2026.05",
      tags: ["AI Safety", "Multi-Agent Systems", "Constrained RL", "Secure Code Generation", "LLM Code Generation", "IoT/CPS Security", "Trustworthy AI"],
      bullets: [
        "Proposed SafeCodeRL, a multi-agent framework for dynamic safety constraints in LLM code generation.",
        "Designed a closed-loop collaboration workflow across five agents and a PPO-style constraint-aware policy.",
        "Reported a large reduction in high-risk vulnerable code generation while preserving functional correctness in the manuscript."
      ]
    },
    {
      title: "Research Intern, SFMambaNet",
      summary: "Explored spectral-frequency state space models for robust two-view correspondence pruning.",
      titleUrl: "https://arxiv.org/abs/2606.04493",
      organization: "Fujian Key Laboratory of Network Computing and Intelligent Information Processing, Fuzhou University",
      organizationUrl: fzuKeyLabUrl,
      period: "2025.09 – 2026.03",
      tags: ["Computer Vision", "Correspondence Pruning", "Mamba", "State Space Models", "Frequency Domain", "Two-View Geometry", "Outlier Rejection"],
      bullets: [
        {
          html:
            `Worked as a research intern at <a href="${fzuKeyLabUrl}" target="_blank" rel="noopener noreferrer">Fujian Key Laboratory of Network Computing and Intelligent Information Processing</a>, Fuzhou University (2025.09 – 2026.03).`
        },
        {
          html:
            `Worked closely with <a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer">Advisor Yizhang Liu</a>, a university-appointed Associate Research Fellow and graduate supervisor, on robust two-view correspondence pruning.`
        },
        {
          html:
            `This work led to our manuscript <a href="https://arxiv.org/abs/2606.04493" target="_blank" rel="noopener noreferrer">SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning</a>, currently under review at <a href="${tipUrl}" target="_blank" rel="noopener noreferrer">IEEE Transactions on Image Processing (TIP)</a> and available as an arXiv preprint.`
        }
      ],
      links: [
        { label: "SFMambaNet Code", url: sfmambanetCodeUrl },
        { label: "FZU Key Lab", url: fzuKeyLabUrl },
        { label: "Advisor Yizhang Liu", url: yizhangLiuProfileUrl },
        { label: "IEEE TIP", url: tipUrl },
        { label: "SFMambaNet arXiv", url: "https://arxiv.org/abs/2606.04493" }
      ]
    },
    {
      title: "ACMer, ACM Programming Training Team",
      summary: "Trained in algorithms and data structures; earned national and regional programming awards.",
      titleUrl: usstAcmUrl,
      organization: "University of Shanghai for Science and Technology",
      period: "2024.05 – 2025.07",
      tags: ["ACM", "Competitive Programming", "Algorithms", "Data Structures"],
      bullets: [
        "Completed systematic training in algorithms, data structures, and contest problem solving.",
        "Earned a National First Prize in the 2025 RAICOM Robot Developer Competition, a Silver Award at the 2025 ACM Shanghai Collegiate Programming Contest, and a National Second Prize in the 2025 LanQiao Cup C/C++ competition."
      ],
      links: [
        { label: "ACM Programming Training Team", url: usstAcmUrl }
      ]
    }
  ],
  publications: [
    {
      ...publicationCredits.memHarmBench,
      title: memHarmBenchTitle,
      status: "Submitted to WWW 2027 · arXiv preprint",
      homepageStatus: "arXiv preprint",
      role: "First author",
      url: memHarmBenchPaperUrl,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "Code", url: memHarmBenchCodeUrl }],
      tags: ["LLM Agents", "Persistent Memory", "Cross-Session Prompt Injection", "Victim-Centric Evaluation", "Agent Safety", "Benchmark"],
      frameworkImage: "/figures/memharmbench-cross-session-en.webp",
      frameworkAlt: "MemHarmBench Figure 1: an instruction from an external note is retained in memory; after the note is removed, a new session completes the expense summary but changes its recipient to the attacker's choice.",
      frameworkCaption: "Figure 1 · Cross-session prompt injection can remain hidden behind successful task completion."
    },
    {
      ...publicationCredits.cst,
      title: cstTitle,
      status: "Submitted to WWW 2027 · arXiv preprint",
      homepageStatus: "arXiv preprint",
      role: "First author",
      url: cstPaperUrl,
      links: [{ label: "arXiv", url: cstPaperUrl }, { label: "Code", url: cstCodeUrl }],
      tags: ["Risk Triage", "Source-Grounded Evidence", "Web Discussions", "Multilingual NLP", "CPU Inference"],
      frameworkImage: "/figures/cst-framework-original.png",
      frameworkAlt: "Original CST framework diagram: source-local context, lightweight feature fusion and topic discovery, risk triage, and source-grounded evidence for review.",
      frameworkCaption: "CST framework · Original figure from the paper."
    },
    {
      ...publicationCredits.scamWeb,
      title: "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
      status: "AAAI 2027; Will be accepted(accept*4)",
      role: "Co-first author",
      url: scamWebUrl,
      links: [{ label: "Hugging Face", url: scamWebDatasetUrl }],
      datasetDownloads: { repo: "kirco567/ScamWeb-Dataset", fallback: 839 },
      tags: ["Multimodal Benchmark", "Cyber-enabled Fraud", "Grounded Understanding", "Evidence Localization", "LLM-VLM", "Trustworthy AI"],
      frameworkImage: "/figures/scamweb-dataset-overview.png",
      frameworkAlt: "ScamWeb dataset overview showing data sources, webpage collection and recovery, processed multimodal artifacts, expert annotations, dataset composition, and representative samples.",
      frameworkCaption: "Dataset and annotation overview"
    },
    {
      ...publicationCredits.safeCodeRl,
      title: safeCodeRlTitle,
      status: "Sensors, 26(11), 3502",
      role: "First author",
      url: safeCodeRlPaperUrl,
      tags: ["AI Safety", "Multi-Agent Systems", "Constrained Reinforcement Learning", "Secure Code Generation", "LLM", "IoT/CPS Security", "Trustworthy AI", "Vulnerability Mitigation"],
      ratings: ["SCI Zone 3", "CCF C"],
      frameworkImage: "/figures/safecoderl-framework.png",
      frameworkAlt: "SafeCodeRL framework diagram showing IoT/CPS contexts, a five-agent closed loop, constraint-aware optimization, and training pipeline."
    },
    {
      ...publicationCredits.sfmambaNet,
      title: "SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning",
      status: "Under review at IEEE Transactions on Image Processing (TIP) · arXiv preprint",
      role: "First author",
      url: "https://doi.org/10.48550/arXiv.2606.04493",
      links: [{ label: "arXiv", url: "https://arxiv.org/abs/2606.04493" }, { label: "GitHub", url: sfmambanetCodeUrl }],
      tags: ["Computer Vision", "Correspondence Pruning", "Mamba", "State Space Model", "Frequency Domain", "Graph Neural Networks", "Two-View Geometry"],
      ratings: ["SCI Zone 1", "CCF A"],
      frameworkImage: "/figures/sfmambanet-framework.png",
      frameworkAlt: "SFMambaNet framework diagram showing pruning blocks, local spectral-geometric feature extraction, spectral-global aggregation, and verification."
    },
    {
      ...publicationCredits.mangrove,
      title: "Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation",
      status: "UNDP / UNV review manuscript",
      role: "Sole author",
      url: "/papers/mangrove-paper.pdf",
      links: [
        { label: "Paper", url: "/papers/mangrove-paper.pdf" },
        { label: "Certificate", url: "/papers/unv-certificate.pdf" },
        { label: "Thanks", url: "/papers/unv-thanks.pdf" },
        { label: "Assignment", url: "/papers/unv-assignment.pdf" }
      ],
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
      tags: ["CodeQL", "Security", "LLM"],
      link: vulnseekerUrl
    },
    {
      title: "Robust Deep-Learning Watermark Mobile Application",
      summary: "A cross-platform image copyright and identity authentication system combining neural watermarking models with mobile image processing.",
      tags: ["Watermarking", "Mobile", "Deep Learning"]
    }
  ],
  awards: [
    { html: `<strong>Silver Award</strong>, <time datetime="2025">2025</time> <strong>ACM</strong> Shanghai Collegiate Programming Contest` },
    { html: `<strong>National First Prize</strong>, RAICOM Robot Developer Competition, <time datetime="2025">2025</time>` },
    { html: `<strong>National Second Prize</strong>, LanQiao Cup C/C++ Programming Contest, <time datetime="2025">2025</time>` },
    {
      html:
        `<strong>National First Prize</strong>, National Finals of the 9th National College Student Embedded Chip and System Design Competition, <time datetime="2026">2026</time>`
    },
    { html: `<strong>National Second Prize</strong>, National Computer Competency Challenge (2 awards)` },
    "National Encouragement Scholarship, Five-time Recipient",
    "Scholarships: First Class (2 awards), Second Class (3 awards), Third Class (2 awards)",
    { html: `National Third Prize, National English Competition for College Students, <time datetime="2025">2025</time>` },
    { html: `Shanghai First Prize, National College Student Mathematics Competition, <time datetime="2024">2024</time>` },
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
      degree: "计算机科学硕士研究生（即将入学）",
      institution: "复旦大学",
      period: "2027.09 – 2030.06（预计）",
      details: [
        { html: `导师：<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">马兴军</a>。` },
        { html: `实验室负责人：<a href="${yuGangJiangUrl}" target="_blank" rel="noopener noreferrer">姜育刚（复旦大学副校长）</a>。` },
        "实验室与研究机构：复旦大学视觉与学习实验室（FVL）、可信具身智能研究院（TEAI）。"
      ],
      links: [
        { label: "Fudan FVL", url: "https://fvl.fudan.edu.cn/", logo: "/github-profile/fudan-university-logo.png" },
        { label: "TEAI", url: "https://teai.fudan.edu.cn/#/", logo: "/github-profile/fudan-teai-logo.png" }
      ]
    },
    {
      degree: "工学学士，计算机科学与技术（在读）",
      institution: "上海理工大学",
      school: "光电信息与计算机工程学院",
      period: "2023.09 – 2027.06",
      details: [
        "2023 级本科生，目前大四在读。",
        "主要学术兴趣包括软件工程、Web 应用开发、人工智能、算法与高性能程序设计。"
      ]
    }
  ],
  news: [
    {
      date: "2026.11.04",
      emoji: "📣",
      html: `<a href="${memHarmBenchPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>MemHarmBench</strong></a> 获得上海创智学院论文推荐，并获奇绩创坛「<strong>奇绩信号 Alpha Sight</strong>」推荐。`,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "代码", url: memHarmBenchCodeUrl }],
      media: {
        src: "/news/memharmbench-alpha-sight-recommendation-20261104.png",
        alt: "奇绩信号 Alpha Sight 于 2026.11.04 推荐 MemHarmBench 的原始截图，红框标注相关条目。",
        caption: "Alpha Sight 推荐截图 · 点击查看大图",
        width: 1328,
        height: 992
      }
    },
    {
      date: "2026.10.26",
      emoji: "📄",
      html: `<a href="${memHarmBenchPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>${memHarmBenchTitle}</strong></a> 的代码已在 GitHub 公开，论文已发布于 arXiv。`,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "代码", url: memHarmBenchCodeUrl }]
    },
    {
      date: "2026.10.26",
      emoji: "📄",
      html: `<a href="${cstPaperUrl}" target="_blank" rel="noopener noreferrer"><strong>${cstTitle}</strong></a> 的代码已在 GitHub 公开，论文已发布于 arXiv。`,
      links: [{ label: "arXiv", url: cstPaperUrl }, { label: "代码", url: cstCodeUrl }]
    },
    {
      date: "2026.10.21",
      emoji: "🛠️",
      html:
        `公开了<a href="${logitechMouseFixRepoUrl}" target="_blank" rel="noopener noreferrer"><strong>罗技鼠标待机后失灵的排查记录与恢复脚本</strong></a>，记录接收器掉电后的异常表现，以及后续测试推翻最初过滤驱动归因的过程，并在<a href="${logitechMouseFixIssueUrl}" target="_blank" rel="noopener noreferrer">上游问题报告</a>中更正说明。`
    },
    {
      date: "2026.10",
      emoji: "💻",
      starRepos: ["wuyoscar/AISafetyHot", "Kirito14IT/prompt-spider-ui"],
      html: `国庆期间参与开源项目 <a href="${aiSafetyHotUrl}" target="_blank" rel="noopener noreferrer"><strong>AISafetyHot</strong></a> 和 <a href="${promptSpiderUrl}" target="_blank" rel="noopener noreferrer"><strong>prompt-spider-ui</strong></a>。 感谢合作者的支持与启发。`
    },
    {
      date: "2026.08.13",
      emoji: "🏆",
      html:
        `获得<a href="${embeddedCompetitionUrl}" target="_blank" rel="noopener noreferrer"><strong>第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛</strong></a><strong>全国一等奖</strong>。`
    },
    {
      date: "2026.08",
      emoji: "🔎",
      html:
        `完成 <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer"><strong>ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</strong></a> 的多模态数据整理、落地式标注、基准设计与免训练诈骗理解研究。`
    },
    {
      date: "2026.07",
      emoji: "💼",
      html:
        `加入<a href="${jingfengZhangUrl}" target="_blank" rel="noopener noreferrer"><strong>导师张景锋</strong></a>的 RISE-AI Lab，在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>复旦大学可信具身智能研究院（TEAI）</strong></a>担任访问学生，启动 MemHarmBench 智能体持久性记忆投毒评测基准研究。该工作从受害者视角设计评测案例，并分析智能体遭受攻击后最终由谁承担损失。`
    },
    {
      date: "2026.07",
      emoji: "📝",
      html: "开始担任 <strong>NeurIPS 2026 审稿人</strong>，参与机器学习与人工智能研究的同行评审工作。"
    },
    {
      date: "2026.06",
      emoji: "🤝",
      html:
        `在<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>复旦大学可信具身智能研究院（TEAI）</strong></a>的团队中，在<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer"><strong>导师马兴军</strong></a>指导下，参与面向企业的多智能体安全协作项目，负责需求分析、系统设计、实现与测试。`
    },
    {
      date: "2026.01 – 2026.04",
      emoji: "🌿",
      html: "通过由 <strong>UNDP</strong> 管理的 <strong>UNV 平台</strong>完成国际组织实习，研究红树林对气候变化的响应，并产出蓝碳减缓方向的综述手稿。"
    },
    {
      date: "2026.03 – 2026.06",
      emoji: "🛡️",
      starRepos: ["XSafeAI/XSafeClaw"],
      html:
        `加入<a href="${teaiUrl}" target="_blank" rel="noopener noreferrer"><strong>复旦大学可信具身智能研究院（TEAI）</strong></a>，在<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer"><strong>马兴军老师</strong></a>的指导下，参与 <a href="${xsafeclawUrl}" target="_blank" rel="noopener noreferrer"><strong>XSafeClaw</strong></a> 智能体安全项目，聚焦运行时接入、受控工具调用与安全审计流程。`
    },
    {
      date: "2026.02",
      emoji: "🔬",
      html: "启动 <strong>SafeCodeRL</strong> 研究，探索面向安全约束大语言模型代码生成的多智能体强化学习框架。"
    },
    {
      date: "2026.01",
      emoji: "🔍",
      html:
        `在<a href="${codeWisdomLabUrl}" target="_blank" rel="noopener noreferrer"><strong>复旦大学软件工程（CodeWisdom）实验室</strong></a>开展 VulnSeeker 研究，将 CodeQL 静态分析与基于 LLM 的安全判断相结合。`
    },
    {
      date: "2025.09",
      emoji: "💼",
      html:
        `加入福州大学<a href="${fzuKeyLabUrl}" target="_blank" rel="noopener noreferrer"><strong>福建省网络计算与智能信息处理重点实验室</strong></a>，在<a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer"><strong>导师刘翼章</strong></a>指导下启动 SFMambaNet 研究，探索用于对应关系剪枝的谱频增强状态空间模型。`
    },
    {
      date: "2025.07",
      emoji: "🎓",
      jumpTo: "#awards-skills",
      html: "我的 <strong>ACMer</strong> 身份正式退役。"
    },
    {
      date: "2024.05",
      emoji: "🚀",
      html:
        `加入<a href="${usstAcmUrl}" target="_blank" rel="noopener noreferrer"><strong>上海理工大学 ACM 程序设计集训队</strong></a>，开启了我的 ACM 生涯。期待接下来的挑战！🚀`
    }
  ],
  workExperiences: [
    {
      title: "信息网络安全公安部重点实验室（公安部第三研究所，上海），AI 研究实习生",
      period: "2026.04 – 至今",
      bullets: [
        { html: "<strong>导师：</strong>吴松洋" },
        { html: "<strong>项目 1：</strong>独立构建网页图文与 URL 联合分析及诈骗证据定位流程，完成<strong>独立一作论文 1 篇</strong>。" },
        { html: "<strong>项目 2：</strong>设计<strong>轻量级短文本风险主题发现算法</strong>，融合字符与冻结语义特征，聚合群聊风险证据，支持 CPU 快速筛查。" }
      ]
    },
    {
      title: "国际组织（联合国志愿人员组织）- UNDP，研究实习生（线上）",
      period: "2026.01 – 2026.04"
    },
    {
      title: "美团，打零工",
      period: "2023.06 – 2023.09"
    }
  ],
  experiences: [
    {
      title: "科研实习生，MemHarmBench 与 CST",
      summary: "构建跨会话记忆投毒基准 MemHarmBench，以及支持 CPU 快速风险分诊的 CST。",
      organization: "复旦大学可信具身智能研究院（TEAI） · FVL 实验室 · 上海创智学院",
      period: "2026.08 – 2026.11",
      tags: ["智能体安全", "记忆投毒", "风险分诊", "来源可追溯证据", "第一作者"],
      bullets: [
        { html: `导师：<a href="${xingjunMaUrl}" target="_blank" rel="noopener noreferrer">马兴军</a>、<a href="${yuGangJiangUrl}" target="_blank" rel="noopener noreferrer">姜育刚（复旦大学副校长）</a>。` },
        { html: "<strong>MemHarmBench：</strong>构建面向跨会话记忆投毒的“暴露–触发”安全基准，覆盖 <strong>288 个案例环境</strong>（24 个攻击模板 × 12 个业务场景）和 12 类目标；在恶意规则留存样本中，间接攻击成功率达 <strong>59.38%–76.39%</strong>。" },
        { html: "<strong>CST：</strong>设计轻量级短文本风险主题发现算法，融合字符与冻结语义特征，聚合群聊风险证据，支持 CPU 快速筛查和来源可追溯的人工复核。" }
      ],
      links: [
        { label: "MemHarmBench · arXiv", url: memHarmBenchPaperUrl },
        { label: "MemHarmBench · 代码", url: memHarmBenchCodeUrl },
        { label: "CST · arXiv", url: cstPaperUrl },
        { label: "CST · 代码", url: cstCodeUrl }
      ]
    },
    {
      title: "科研实习生，ScamWeb 多模态诈骗网页基准",
      summary: "共同构建多语言诈骗网页基准，提供专家标注的证据区域与解释。",
      titleUrl: scamWebUrl,
      organization: "复旦大学可信具身智能研究院（TEAI）与公安部第三研究所",
      period: "2026.04 – 2026.08",
      tags: ["多模态基准", "网络安全", "落地式理解", "可信人工智能"],
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
            `研究手稿为 <a href="${scamWebUrl}" target="_blank" rel="noopener noreferrer">ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages</a>。`
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
      summary: "接入本地智能体会话，实现受控工具调用与运行时安全审计。",
      starRepos: ["XSafeAI/XSafeClaw"],
      titleUrl: xsafeclawUrl,
      organization: "复旦大学可信具身智能研究院（TEAI）",
      organizationUrl: teaiUrl,
      period: "2026.03 – 2026.06",
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
      summary: "结合 CodeQL 静态分析、代码上下文与 LLM 安全判断开展漏洞分诊。",
      titleUrl: vulnseekerUrl,
      organization: "复旦大学软件工程（CodeWisdom）实验室",
      organizationUrl: codeWisdomLabUrl,
      period: "2026.01 – 2026.03",
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
        { label: "VulnSeeker 代码", url: vulnseekerUrl },
        { label: "CodeWisdom 实验室", url: codeWisdomLabUrl },
        { label: "李昳讲师", url: yiLiUrl }
      ]
    },
    {
      title: "国际组织实习：UNDP 管理的 UNV 在线科研实习生",
      summary: "通过 UNV 开展红树林气候变化响应与蓝碳减缓研究综述。",
      titleUrl: "https://www.undp.org/",
      organization: "巴布亚新几内亚 Morobe Development Foundation Inc.",
      period: "2026.01 – 2026.04",
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
      summary: "设计五智能体闭环与约束感知强化学习流程，支持安全代码生成。",
      organization: "独立科研合作",
      period: "2026.02 – 2026.05",
      tags: ["人工智能安全", "多智能体系统", "约束强化学习", "安全代码生成", "LLM 代码生成", "IoT/CPS 安全", "可信人工智能"],
      bullets: [
        "提出 SafeCodeRL，一种面向大语言模型代码生成动态安全约束的多智能体框架。",
        "设计由五个智能体组成的闭环协作流程与 PPO 风格的约束感知策略。",
        "论文报告结果显示，该方法在保持代码功能正确性的同时显著减少高风险漏洞代码生成。"
      ]
    },
    {
      title: "科研实习生，SFMambaNet",
      summary: "研究谱频增强状态空间模型，用于鲁棒双视图对应关系剪枝。",
      titleUrl: "https://arxiv.org/abs/2606.04493",
      organization: "福州大学福建省网络计算与智能信息处理重点实验室",
      organizationUrl: fzuKeyLabUrl,
      period: "2025.09 – 2026.03",
      tags: ["计算机视觉", "对应关系剪枝", "Mamba", "状态空间模型", "频域", "双视图几何", "外点剔除"],
      bullets: [
        {
          html:
            `2025.09 – 2026.03，在福州大学<a href="${fzuKeyLabUrl}" target="_blank" rel="noopener noreferrer">福建省网络计算与智能信息处理重点实验室</a>担任科研实习生。`
        },
        {
          html:
            `在<a href="${yizhangLiuProfileUrl}" target="_blank" rel="noopener noreferrer">导师刘翼章</a>指导下，研究鲁棒双视图对应关系剪枝。`
        },
        {
          html:
            `相关工作 <a href="https://arxiv.org/abs/2606.04493" target="_blank" rel="noopener noreferrer">SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning</a> 正在 <a href="${tipUrl}" target="_blank" rel="noopener noreferrer">IEEE Transactions on Image Processing (TIP)</a> 审稿，并已发布 arXiv 预印本。`
        }
      ],
      links: [
        { label: "SFMambaNet 代码", url: sfmambanetCodeUrl },
        { label: "福州大学重点实验室", url: fzuKeyLabUrl },
        { label: "导师刘翼章", url: yizhangLiuProfileUrl },
        { label: "IEEE TIP", url: tipUrl },
        { label: "SFMambaNet arXiv", url: "https://arxiv.org/abs/2606.04493" }
      ]
    },
    {
      title: "ACMer，ACM 程序设计集训队",
      summary: "系统训练算法与数据结构，获得全国及区域程序设计竞赛奖项。",
      titleUrl: usstAcmUrl,
      organization: "上海理工大学",
      period: "2024.05 – 2025.07",
      tags: ["ACM", "程序设计竞赛", "算法", "数据结构"],
      bullets: [
        "系统训练算法、数据结构与竞赛问题求解能力。",
        "期间获得 2025 年睿抗机器人开发者大赛国家级一等奖、2025 ACM 上海站大学生程序设计竞赛银奖以及 2025 年蓝桥杯 C/C++ 组全国二等奖。"
      ],
      links: [
        { label: "ACM 程序设计集训队", url: usstAcmUrl }
      ]
    }
  ],
  publications: [
    {
      ...publicationCredits.memHarmBench,
      title: memHarmBenchTitle,
      status: "已投稿至 WWW 2027 · arXiv 预印本",
      homepageStatus: "arXiv 预印本",
      role: "第一作者",
      url: memHarmBenchPaperUrl,
      links: [{ label: "arXiv", url: memHarmBenchPaperUrl }, { label: "代码", url: memHarmBenchCodeUrl }],
      tags: ["LLM 智能体", "持久记忆", "跨会话提示注入", "受害者中心评测", "智能体安全", "评测基准"],
      frameworkImage: "/figures/memharmbench-cross-session-en.webp",
      frameworkAlt: "MemHarmBench 图 1：外部笔记中的恶意指令被保留为记忆；原始笔记移除后，智能体在新会话中完成费用汇总，却将收款方改为攻击者指定对象。",
      frameworkCaption: "图 1 · 跨会话提示注入可能隐藏在成功完成的任务背后。"
    },
    {
      ...publicationCredits.cst,
      title: cstTitle,
      status: "已投稿至 WWW 2027 · arXiv 预印本",
      homepageStatus: "arXiv 预印本",
      role: "第一作者",
      url: cstPaperUrl,
      links: [{ label: "arXiv", url: cstPaperUrl }, { label: "代码", url: cstCodeUrl }],
      tags: ["风险分诊", "来源可追溯证据", "网络讨论", "多语言自然语言处理", "CPU 推理"],
      frameworkImage: "/figures/cst-framework-original.png",
      frameworkAlt: "CST 论文原始框架图：来源上下文、轻量特征融合与主题发现、风险分诊及来源可追溯的复核证据。",
      frameworkCaption: "CST 方法框架 · 论文原图。"
    },
    {
      ...publicationCredits.scamWeb,
      title: "ScamWeb: A Multimodal Benchmark for Grounded Understanding of Cyber-enabled Fraud Webpages",
      status: "AAAI 2027; Will be accepted(accept*4)",
      role: "共同第一作者",
      url: scamWebUrl,
      links: [{ label: "Hugging Face", url: scamWebDatasetUrl }],
      datasetDownloads: { repo: "kirco567/ScamWeb-Dataset", fallback: 839 },
      tags: ["多模态基准", "网络诈骗", "落地式理解", "证据定位", "LLM-VLM", "可信人工智能"],
      frameworkImage: "/figures/scamweb-dataset-overview.png",
      frameworkAlt: "ScamWeb 数据集概览，包括数据来源、网页采集与恢复、多模态处理结果、专家标注、数据集构成和代表性样本。",
      frameworkCaption: "数据集与标注概览"
    },
    {
      ...publicationCredits.safeCodeRl,
      title: safeCodeRlTitle,
      status: "Sensors, 26(11), 3502",
      role: "第一作者",
      url: safeCodeRlPaperUrl,
      tags: ["人工智能安全", "多智能体系统", "约束强化学习", "安全代码生成", "LLM", "IoT/CPS 安全", "可信人工智能", "漏洞缓解"],
      ratings: ["SCI 三区", "CCF C"],
      frameworkImage: "/figures/safecoderl-framework.png",
      frameworkAlt: "SafeCodeRL 框架图，展示 IoT/CPS 任务上下文、五智能体闭环、约束感知优化与训练流程。"
    },
    {
      ...publicationCredits.sfmambaNet,
      title: "SFMambaNet: Spectral-Frequency Enhanced Selective State Space Model for Correspondence Pruning",
      status: "IEEE Transactions on Image Processing (TIP) 在审 · arXiv 预印本",
      role: "第一作者",
      url: "https://doi.org/10.48550/arXiv.2606.04493",
      links: [{ label: "arXiv", url: "https://arxiv.org/abs/2606.04493" }, { label: "GitHub", url: sfmambanetCodeUrl }],
      tags: ["计算机视觉", "对应关系剪枝", "Mamba", "状态空间模型", "频域", "图神经网络", "双视图几何"],
      ratings: ["SCI 一区", "CCF A"],
      frameworkImage: "/figures/sfmambanet-framework.png",
      frameworkAlt: "SFMambaNet 框架图，展示剪枝模块、局部谱几何特征提取、谱全局聚合与验证模块。"
    },
    {
      ...publicationCredits.mangrove,
      title: "Research Support in Analysing Mangrove Responses to Climate Change: The Interplay of Anthropogenic Impacts and Blue Carbon Mitigation",
      status: "UNDP / UNV 综述手稿",
      role: "独立作者",
      url: "/papers/mangrove-paper.pdf",
      links: [
        { label: "Paper", url: "/papers/mangrove-paper.pdf" },
        { label: "证书", url: "/papers/unv-certificate.pdf" },
        { label: "感谢信", url: "/papers/unv-thanks.pdf" },
        { label: "任务书", url: "/papers/unv-assignment.pdf" }
      ],
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
      tags: ["CodeQL", "安全", "LLM"],
      link: vulnseekerUrl
    },
    {
      title: "Robust Deep-Learning Watermark Mobile Application",
      summary: "结合神经水印模型与移动端图像处理的跨平台图像版权及身份认证系统。",
      tags: ["数字水印", "移动应用", "深度学习"]
    }
  ],
  awards: [
    { html: `<time datetime="2025">2025</time> <strong>ACM</strong> 上海站大学生程序设计竞赛 <strong>银奖</strong>` },
    { html: `<time datetime="2025">2025</time> 年睿抗机器人开发者大赛<strong>国家级一等奖</strong>` },
    { html: `<time datetime="2025">2025</time> 年蓝桥杯 C/C++ 程序设计竞赛<strong>全国二等奖</strong>` },
    {
      html:
        `第九届全国大学生嵌入式芯片与系统设计竞赛全国总决赛<strong>全国一等奖</strong>，<time datetime="2026">2026</time>`
    },
    { html: `全国计算机能力挑战赛<strong>国家级二等奖</strong>（2 次）` },
    "国家励志奖学金（5 次）",
    "奖学金一等奖（2 次）、二等奖（3 次）、三等奖（2 次）",
    { html: `<time datetime="2025">2025</time> 年全国大学生英语竞赛全国三等奖` },
    { html: `<time datetime="2024">2024</time> 年全国大学生数学竞赛上海市一等奖` },
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
