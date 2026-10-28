import type { Locale } from "@i18n/index";

const shared = {
  name: "Krico",
  githubUsername: "Kirito14IT",
  siteUrl: "https://kirito14it.github.io",
  email: "2657751462@qq.com",
  github: "https://github.com/Kirito14IT",
  avatarUrl: "https://github.com/Kirito14IT.png",
  advisorUrl: "http://xingjunma.com/",
  affiliations: [
    { label: "Fudan FVL", title: "Fudan Vision and Learning Lab", url: "https://fvl.fudan.edu.cn/", logo: "/github-profile/fudan-university-logo.png" },
    { label: "TEAI", title: "Institute of Trustworthy Embodied AI, Fudan University", url: "https://teai.fudan.edu.cn/#/", logo: "/github-profile/fudan-teai-logo.png" }
  ]
};

export const profiles = {
  en: {
    ...shared,
    legalName: "Zhihua Wang",
    location: "Shanghai, China",
    institution: "University of Shanghai for Science and Technology",
    school: "School of Optical-Electrical and Computer Engineering",
    title: "Senior Undergraduate in Computer Science and Technology",
    incomingTitle: "Incoming M.Sc. Student, Fudan University (2027)",
    advisorName: "Xingjun Ma",
    tagline:
      "I study LLM agents, reinforcement learning for agents (Agent RL), and agent safety, with an interest in reliable reasoning, memory, and tool use.",
    bio:
      "I am a senior undergraduate student in Computer Science and Technology (Class of 2023) at the University of Shanghai for Science and Technology (USST). I will begin my M.Sc. studies at Fudan University in 2027, advised by Xingjun Ma. I am currently a research intern at the Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University. My research interests center on LLM agents, reinforcement learning for agents (Agent RL), and agent safety. Feel free to get in touch.",
    contactNote:
      "Please feel free to reach out by email for academic discussion, research collaboration, open-source projects, or learning exchange.",
    researchFocus: [
      "Reinforcement learning for LLM agents (Agent RL), reasoning, and tool use.",
      "Agent safety, memory security, and cross-session prompt injection.",
      "Multi-agent collaboration and safety-constrained code generation.",
      "Reliable agent evaluation, software security analysis, and practical agent systems."
    ],
    focusWords: [
      { text: "LLM Agents", color: "#2563eb" },
      { text: "Agent RL", color: "#7c3aed" },
      { text: "Agent Safety", color: "#db2777" },
      { text: "Agent Memory", color: "#f59e0b" },
      { text: "Multi-Agent Systems", color: "#0891b2" },
      { text: "Embodied Intelligence", color: "#16a34a" }
    ],
    interests: [
      "LLM Agents",
      "Agent RL",
      "Agent Safety",
      "Multi-Agent Systems",
      "Agent Memory",
      "Trustworthy AI",
      "Software Security Analysis",
      "Embodied Intelligence"
    ],
    links: [
      { label: "Email", url: "mailto:2657751462@qq.com", displayUrl: "2657751462@qq.com" },
      { label: "GitHub", url: "https://github.com/Kirito14IT", displayUrl: "https://github.com/Kirito14IT" },
      {
        label: "Google Scholar",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "Academic publications and citations"
      },
      {
        label: "XSafeClaw",
        url: "https://github.com/XSafeAI/XSafeClaw",
        displayUrl: "https://github.com/XSafeAI/XSafeClaw"
      }
    ],
    representativeLinks: [
      {
        label: "Academic Profile: Google Scholar",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "Google Scholar Profile"
      },
      {
        label: "Representative Open-Source Work: XSafeClaw",
        url: "https://github.com/XSafeAI/XSafeClaw",
        displayUrl: "https://github.com/XSafeAI/XSafeClaw"
      },
      {
        label: "Security Analysis: VulnSeeker",
        url: "https://github.com/Kirito14IT/VulnSeeker",
        displayUrl: "CodeQL and LLM-assisted vulnerability analysis"
      },
      {
        label: "Representative Research: SafeCodeRL",
        url: "https://kirito14it.github.io/projects/safecoderl/",
        displayUrl: "https://kirito14it.github.io/projects/safecoderl/"
      },
      {
        label: "Representative Research: SFMambaNet",
        url: "https://kirito14it.github.io/projects/sfmambanet/",
        displayUrl: "https://kirito14it.github.io/projects/sfmambanet/"
      }
    ]
  },
  zh: {
    ...shared,
    legalName: "王志华",
    location: "中国上海",
    institution: "上海理工大学",
    school: "光电信息与计算机工程学院",
    title: "计算机科学与技术专业大四本科生",
    incomingTitle: "复旦大学 2027 级准硕士生",
    advisorName: "马兴军",
    tagline: "聚焦大语言模型智能体、智能体强化学习（Agent RL）与智能体安全，关注可靠推理、记忆与工具使用。",
    bio:
      "我是上海理工大学计算机科学与技术专业 2023 级本科生，目前大四在读。我将于 2027 年进入复旦大学攻读硕士学位，导师为马兴军老师。目前，我正在复旦大学可信具身智能研究院（TEAI）进行科研实习，研究兴趣聚焦大语言模型智能体、智能体强化学习（Agent RL）与智能体安全。欢迎与我联系交流。",
    contactNote: "欢迎通过邮件与我开展学术讨论、科研合作、开源项目协作或学习交流。",
    researchFocus: [
      "面向大语言模型智能体的强化学习（Agent RL）、推理与工具使用。",
      "智能体安全、记忆安全与跨会话提示注入。",
      "多智能体协作与安全约束代码生成。",
      "可靠智能体评测、软件安全分析与智能体系统实践。"
    ],
    focusWords: [
      { text: "LLM 智能体", color: "#2563eb" },
      { text: "Agent RL", color: "#7c3aed" },
      { text: "智能体安全", color: "#db2777" },
      { text: "智能体记忆", color: "#f59e0b" },
      { text: "多智能体系统", color: "#0891b2" },
      { text: "具身智能", color: "#16a34a" }
    ],
    interests: ["LLM 智能体", "Agent RL", "智能体安全", "多智能体系统", "智能体记忆", "可信人工智能", "软件安全分析", "具身智能"],
    links: [
      { label: "邮箱", url: "mailto:2657751462@qq.com", displayUrl: "2657751462@qq.com" },
      { label: "GitHub", url: "https://github.com/Kirito14IT", displayUrl: "https://github.com/Kirito14IT" },
      {
        label: "谷歌学术",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "学术论文与引用记录"
      },
      {
        label: "XSafeClaw",
        url: "https://github.com/XSafeAI/XSafeClaw",
        displayUrl: "https://github.com/XSafeAI/XSafeClaw"
      }
    ],
    representativeLinks: [
      {
        label: "学术主页：Google Scholar",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "Google Scholar 主页"
      },
      {
        label: "代表开源工作：XSafeClaw",
        url: "https://github.com/XSafeAI/XSafeClaw",
        displayUrl: "https://github.com/XSafeAI/XSafeClaw"
      },
      {
        label: "安全分析：VulnSeeker",
        url: "https://github.com/Kirito14IT/VulnSeeker",
        displayUrl: "CodeQL 与大语言模型辅助漏洞分析"
      },
      {
        label: "代表研究：SafeCodeRL",
        url: "https://kirito14it.github.io/zh/projects/safecoderl/",
        displayUrl: "https://kirito14it.github.io/zh/projects/safecoderl/"
      },
      {
        label: "代表研究：SFMambaNet",
        url: "https://kirito14it.github.io/zh/projects/sfmambanet/",
        displayUrl: "https://kirito14it.github.io/zh/projects/sfmambanet/"
      }
    ]
  }
} as const;

export const getProfile = (locale: Locale) => profiles[locale];
export const profile = profiles.en;
