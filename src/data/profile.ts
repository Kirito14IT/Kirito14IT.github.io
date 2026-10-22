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
      "I build research prototypes around AI safety, LLM agents, embodied intelligence, software security analysis, and reliable multimodal systems.",
    bio:
      "I am a senior undergraduate student in Computer Science and Technology (Class of 2023) at the University of Shanghai for Science and Technology (USST). I will begin my M.Sc. studies at Fudan University in 2027, advised by Xingjun Ma. I am currently a research intern at the Institute of Trustworthy Embodied Artificial Intelligence (TEAI), Fudan University, where I work on AI agents, AI safety, and embodied intelligence. Feel free to contact me~",
    contactNote:
      "Please feel free to reach out by email for academic discussion, research collaboration, open-source projects, or learning exchange.",
    researchFocus: [
      "AI safety and runtime governance for LLM agents.",
      "Multi-agent reinforcement learning for safety-constrained code generation.",
      "CodeQL-assisted software security analysis.",
      "Efficient neural models for visual correspondence pruning."
    ],
    focusWords: [
      { text: "AI Safety", color: "#2563eb" },
      { text: "Large Language Models", color: "#7c3aed" },
      { text: "LLM Agents", color: "#db2777" },
      { text: "Embodied Intelligence", color: "#f59e0b" },
      { text: "Software Security", color: "#0891b2" },
      { text: "Multimodal Intelligence", color: "#16a34a" }
    ],
    interests: [
      "AI Safety",
      "LLM Agents",
      "Embodied Intelligence",
      "Software Security Analysis",
      "Trustworthy AI",
      "Multimodal Learning",
      "Program Analysis",
      "Computer Vision"
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
    tagline: "围绕人工智能安全、大语言模型智能体、具身智能、软件安全分析与可靠多模态系统开展研究原型开发。",
    bio:
      "我是上海理工大学计算机科学与技术专业 2023 级本科生，目前大四在读。我将于 2027 年进入复旦大学攻读硕士学位，导师为马兴军老师。目前，我正在复旦大学可信具身智能研究院（TEAI）进行科研实习，研究方向为智能体、人工智能安全与具身智能。欢迎与我联系交流~",
    contactNote: "欢迎通过邮件与我开展学术讨论、科研合作、开源项目协作或学习交流。",
    researchFocus: [
      "面向 LLM 智能体的人工智能安全与运行时治理。",
      "面向安全约束代码生成的多智能体强化学习。",
      "基于 CodeQL 的软件安全分析。",
      "面向视觉对应关系剪枝的高效神经网络模型。"
    ],
    focusWords: [
      { text: "人工智能安全", color: "#2563eb" },
      { text: "大语言模型", color: "#7c3aed" },
      { text: "LLM 智能体", color: "#db2777" },
      { text: "具身智能", color: "#f59e0b" },
      { text: "软件安全", color: "#0891b2" },
      { text: "多模态智能", color: "#16a34a" }
    ],
    interests: ["人工智能安全", "LLM 智能体", "具身智能", "软件安全分析", "可信人工智能", "多模态学习", "程序分析", "计算机视觉"],
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
