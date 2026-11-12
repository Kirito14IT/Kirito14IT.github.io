import type { Locale } from "@i18n/index";

const socialProfiles = {
  douyin: "https://www.douyin.com/user/MS4wLjABAAAAUGvPhZRE2l6SIkWl-UGmjqijJv1pQ_63oDcA7cMT-kg",
  xiaohongshu: "https://www.xiaohongshu.com/user/profile/639c0cc20000000026005bed"
};

const shared = {
  name: "Carey",
  githubUsername: "Kirito14IT",
  siteUrl: "https://kirito14it.github.io",
  email: "wzh2657751462@gmail.com",
  github: "https://github.com/Kirito14IT",
  avatarUrl: "/avatar.png",
  institutionUrl: "https://www.usst.edu.cn/",
  incomingInstitutionUrl: "https://www.fudan.edu.cn/",
  advisorUrl: "http://xingjunma.com/",
  labHeadUrl: "https://baike.baidu.com/item/%E5%A7%9C%E8%82%B2%E5%88%9A/22131913",
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
    labHeadName: "Yu-Gang Jiang (Vice President, Fudan University)",
    tagline:
      "I study large language models, coding agents, trustworthy AI, agent post-training, and reinforcement learning for agents (Agent RL), with an interest in reliable reasoning, memory, and tool use.",
    bio:
      "I am a senior undergraduate in Computer Science and Technology at USST and an incoming M.Sc. student at Fudan University (2027), advised by Xingjun Ma. I am currently a research intern at Fudan FVL, led by Yu-Gang Jiang, and TEAI. My research interests include foundation models, coding agents, agent post-training and reinforcement learning, and trustworthy AI.",
    contactNote:
      "I welcome academic discussions, research collaborations, and open-source projects. Feel free to reach out by email.",
    internshipSearch: {
      title: "Seeking internships:",
      description: "I am seeking internships in foundation models, coding agents, agent post-training, Agent RL, and LLM evaluation.",
      contactLabel: "Recruiters and research teams are welcome to contact me by email."
    },
    researchFocus: [
      "Foundation models.",
      "Agent post-training and reinforcement learning (Agent RL) for LLM agents, with a focus on reasoning and tool use.",
      "Agent safety, memory security, and cross-session prompt injection.",
      "Multi-agent collaboration and safety-constrained code generation.",
      "Reliable agent evaluation and practical agent systems."
    ],
    focusWords: [
      { text: "Foundation Models", color: "#16a34a" },
      { text: "LLM Agents", color: "#2563eb" },
      { text: "Coding Agent", color: "#0891b2" },
      { text: "Agent Post-Training", color: "#0891b2" },
      { text: "Agent RL", color: "#7c3aed" },
      { text: "Agent Safety", color: "#db2777" },
      { text: "Agent Memory", color: "#f59e0b" },
      { text: "Multi-Agent Systems", color: "#0891b2" }
    ],
    interests: [
      "Foundation Models",
      "LLM",
      "Coding Agent",
      "Agent Post-Training",
      "Agent RL",
      "Agent Safety",
      "Agent Memory",
      "Trustworthy AI"
    ],
    links: [
      { label: "Email", url: "mailto:wzh2657751462@gmail.com", displayUrl: "wzh2657751462@gmail.com" },
      { label: "GitHub", url: "https://github.com/Kirito14IT", displayUrl: "https://github.com/Kirito14IT" },
      {
        label: "Google Scholar",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "Academic publications and citations"
      },
      { label: "Douyin", url: socialProfiles.douyin, displayUrl: "@Kirito14IT" },
      { label: "Xiaohongshu", url: socialProfiles.xiaohongshu, displayUrl: "@998244353_plus" }
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
    labHeadName: "姜育刚（复旦大学副校长）",
    tagline: "聚焦大语言模型、Coding Agent、可信AI、智能体后训练、智能体强化学习（Agent RL），关注可靠推理、记忆与工具使用。",
    bio:
      "我是上海理工大学计算机科学与技术专业大四本科生，将于 2027 年进入复旦大学攻读硕士，导师为马兴军老师。目前在姜育刚老师负责的复旦大学视觉与学习实验室（FVL）及可信具身智能研究院（TEAI）进行科研实习。研究兴趣包括基座大模型、Coding Agent、智能体后训练与强化学习，以及可信人工智能。",
    contactNote: "欢迎学术讨论、科研合作及开源交流，欢迎通过邮件联系。",
    internshipSearch: {
      title: "实习求职：",
      description: "正在寻找基座大模型、Coding Agent、智能体后训练、Agent RL 和大模型评测相关实习。",
      contactLabel: "欢迎 HR 及研究团队通过邮件联系我。"
    },
    researchFocus: [
      "基座大模型。",
      "面向大语言模型智能体的后训练（Agent Post-Training）与强化学习（Agent RL），关注推理与工具使用。",
      "智能体安全、记忆安全与跨会话提示注入。",
      "多智能体协作与安全约束代码生成。",
      "可靠智能体评测与智能体系统实践。"
    ],
    focusWords: [
      { text: "基座大模型", color: "#16a34a" },
      { text: "LLM 智能体", color: "#2563eb" },
      { text: "Coding Agent", color: "#0891b2" },
      { text: "智能体后训练", color: "#0891b2" },
      { text: "Agent RL", color: "#7c3aed" },
      { text: "智能体安全", color: "#db2777" },
      { text: "智能体记忆", color: "#f59e0b" },
      { text: "多智能体系统", color: "#0891b2" }
    ],
    interests: ["基座大模型", "LLM", "Coding Agent", "智能体后训练", "Agent RL", "智能体安全", "智能体记忆", "可信人工智能"],
    links: [
      { label: "邮箱", url: "mailto:wzh2657751462@gmail.com", displayUrl: "wzh2657751462@gmail.com" },
      { label: "GitHub", url: "https://github.com/Kirito14IT", displayUrl: "https://github.com/Kirito14IT" },
      {
        label: "谷歌学术",
        url: "https://scholar.google.com/citations?user=MyweXYYAAAAJ",
        displayUrl: "学术论文与引用记录"
      },
      { label: "抖音", url: socialProfiles.douyin, displayUrl: "@Kirito14IT" },
      { label: "小红书", url: socialProfiles.xiaohongshu, displayUrl: "@998244353_plus" }
    ]
  }
} as const;

export const getProfile = (locale: Locale) => profiles[locale];
export const profile = profiles.en;
