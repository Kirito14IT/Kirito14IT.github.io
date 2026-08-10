import type { Locale } from "@i18n/index";

const shared = {
  name: "Krico",
  githubUsername: "Kirito14IT",
  siteUrl: "https://kirito14it.github.io",
  email: "2657751462@qq.com",
  github: "https://github.com/Kirito14IT",
  avatarUrl: "https://github.com/Kirito14IT.png"
};

export const profiles = {
  en: {
    ...shared,
    legalName: "Zhihua Wang",
    location: "Shanghai, China",
    institution: "University of Shanghai for Science and Technology",
    school: "School of Optical-Electrical and Computer Engineering",
    title: "Undergraduate in Computer Science and Technology (Class of 2023)",
    tagline:
      "I build research prototypes around AI safety, LLM agents, software security analysis, and reliable multimodal systems.",
    bio:
      "I am an undergraduate student in Computer Science and Technology (Class of 2023) at the University of Shanghai for Science and Technology (USST). I am currently a research intern at the Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University, where I work on AI agents and AI safety. Feel free to contact me~",
    contactNote:
      "Please feel free to reach out by email for academic discussion, research collaboration, open-source projects, or learning exchange.",
    focusWords: [
      { text: "AI Safety", color: "#2563eb" },
      { text: "Large Language Models", color: "#7c3aed" },
      { text: "LLM Agents", color: "#db2777" },
      { text: "Software Security", color: "#0891b2" },
      { text: "Multimodal Intelligence", color: "#16a34a" }
    ],
    interests: [
      "AI Safety",
      "LLM Agents",
      "Software Security Analysis",
      "Trustworthy AI",
      "Multimodal Learning",
      "Scientific Writing"
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
    title: "计算机科学与技术专业 2023 级本科生",
    tagline: "围绕人工智能安全、大语言模型智能体、软件安全分析与可靠多模态系统开展研究原型开发。",
    bio:
      "我是上海理工大学计算机科学与技术专业 2023 级本科生。目前，我正在复旦大学可信具身智能研究院（TEAI）进行科研实习，研究方向为智能体与人工智能安全。欢迎与我联系交流~",
    contactNote: "欢迎通过邮件与我开展学术讨论、科研合作、开源项目协作或学习交流。",
    focusWords: [
      { text: "人工智能安全", color: "#2563eb" },
      { text: "大语言模型", color: "#7c3aed" },
      { text: "LLM 智能体", color: "#db2777" },
      { text: "软件安全", color: "#0891b2" },
      { text: "多模态智能", color: "#16a34a" }
    ],
    interests: ["人工智能安全", "LLM 智能体", "软件安全分析", "可信人工智能", "多模态学习", "科研写作"],
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
