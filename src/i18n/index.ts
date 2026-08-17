export type Locale = "en" | "zh";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "zh"];

export const localeFromPath = (pathname: string): Locale =>
  pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : "en";

const splitSuffix = (value: string) => {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const suffixIndex = [hashIndex, queryIndex]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  return suffixIndex === undefined
    ? { pathname: value, suffix: "" }
    : { pathname: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
};

export const stripLocalePrefix = (value: string) => {
  const { pathname, suffix } = splitSuffix(value || "/");
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const stripped = normalized === "/zh" ? "/" : normalized.replace(/^\/zh(?=\/)/, "");
  return `${stripped || "/"}${suffix}`;
};

export const localizedPath = (locale: Locale, value = "/") => {
  const { pathname, suffix } = splitSuffix(stripLocalePrefix(value));
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "en") return `${normalized || "/"}${suffix}`;
  return `${normalized === "/" ? "/zh/" : `/zh${normalized}`}${suffix}`;
};

export const alternateLocale = (locale: Locale): Locale => (locale === "en" ? "zh" : "en");

export const ui = {
  en: {
    htmlLang: "en",
    localeName: "English",
    switchTitle: "Switch to Chinese",
    theme: { switchToDark: "Switch to dark theme", switchToLight: "Switch to light theme" },
    nav: { home: "Home", cv: "CV", projects: "Projects", blog: "Blog" },
    sidebar: { profile: "Profile", navigation: "Navigation", focus: "Focus", links: "Links" },
    homeJump: {
      homepage: "Homepage",
      about: "About Me",
      news: "News",
      work: "Work Experience",
      research: "Research Experience",
      publications: "Publications",
      projects: "Projects",
      awards: "Awards",
      services: "Services"
    },
    hero: {
      kicker: "Research Focus",
      heading: "I am researching",
      projects: "View Projects",
      cv: "Open CV"
    },
    sections: {
      about: "About Me",
      profile: "Profile",
      news: "News",
      recentUpdates: "Recent updates",
      workExperience: "Work Experience",
      researchExperience: "Selected Research and Experience",
      timeline: "Timeline",
      publications: "Selected Publications and Manuscripts",
      researchOutput: "Research output",
      projects: "Featured Projects",
      builds: "Builds and artifacts",
      learning: "Learning Map",
      knowledge: "Knowledge progress",
      awardsSkills: "Awards and Skills",
      signals: "Signals",
      selectedHonors: "Selected Honors",
      skills: "Skills",
      services: "Services",
      academicCommunity: "Academic community"
    },
    contact: {
      eyebrow: "Contact and Representative Links",
      title: "Open to academic discussion and collaboration"
    },
    publication: { framework: "Framework overview" },
    contribution: {
      eyebrow: "Live Open Source Signal",
      title: "GitHub Commit Activity",
      open: "Open GitHub ->",
      last12Months: "Last 12 months",
      loading: "Loading public contribution graph...",
      syncing: "Syncing",
      weekdays: ["Mon", "Wed", "Fri"],
      less: "Less",
      more: "More",
      initialNote: "Live contributions are fetched from a public GitHub contribution API and may be cached.",
      unavailable: "Unable to load live contribution data.",
      openLatest: "Open GitHub for latest data",
      unavailableNote: "The external contribution source is unavailable right now.",
      summary: "{count} contributions in the last year",
      activeDays: "{count} active days shown",
      cachedNote: "Live contributions are fetched from your public GitHub profile graph and may be cached for about one hour.",
      dayTitle: "{date} - {count} contribution{suffix}",
      calendarLabel: "GitHub contribution calendar"
    },
    cv: {
      eyebrow: "Web CV",
      title: "Curriculum Vitae",
      intro: "A public, web-native CV focused on research, projects, internships, awards, and reproducible artifacts.",
      education: "Education",
      workExperience: "Work Experience",
      experience: "Research and Internship Experience",
      publications: "Publications and Manuscripts",
      awards: "Awards",
      services: "Services",
      skills: "Skills",
      learning: "Learning Map"
    },
    projectsPage: {
      eyebrow: "Research and engineering",
      title: "Projects",
      intro: "Selected work from AI safety, LLM agents, software security, computer vision, and climate research.",
      project: "Project",
      featured: "Featured"
    },
    blogPage: {
      eyebrow: "Notes",
      title: "Blog",
      intro: "Technical notes, reading logs, and project retrospectives. The first post is a launch note for this site."
    },
    serviceWatermark: "REVIEW",
    footer: {
      updated: "Last updated:",
      showVisits: "Show total homepage visits",
      hideVisits: "Hide total homepage visits",
      visitsAlt: "Total homepage visits",
      visitsLabel: "visits",
      unavailable: "Unavailable"
    },
    newsJump: "{date} update: jump to competition awards"
  },
  zh: {
    htmlLang: "zh-CN",
    localeName: "中文",
    switchTitle: "切换到英文",
    theme: { switchToDark: "切换到深色主题", switchToLight: "切换到浅色主题" },
    nav: { home: "首页", cv: "简历", projects: "项目", blog: "博客" },
    sidebar: { profile: "个人信息", navigation: "导航", focus: "研究方向", links: "链接" },
    homeJump: {
      homepage: "首页",
      about: "关于我",
      news: "动态",
      work: "工作经历",
      research: "科研经历",
      publications: "论文",
      projects: "项目",
      awards: "奖项",
      services: "学术服务"
    },
    hero: {
      kicker: "研究方向",
      heading: "我正在研究",
      projects: "查看项目",
      cv: "打开简历"
    },
    sections: {
      about: "关于我",
      profile: "个人简介",
      news: "最新动态",
      recentUpdates: "近期更新",
      workExperience: "工作经历",
      researchExperience: "科研与实践经历",
      timeline: "时间线",
      publications: "代表论文与手稿",
      researchOutput: "科研成果",
      projects: "精选项目",
      builds: "研究与工程实践",
      learning: "学习图谱",
      knowledge: "知识进展",
      awardsSkills: "奖项与技能",
      signals: "能力概览",
      selectedHonors: "代表荣誉",
      skills: "技能",
      services: "学术服务",
      academicCommunity: "学术共同体"
    },
    contact: {
      eyebrow: "联系方式与代表链接",
      title: "欢迎开展学术交流与科研合作"
    },
    publication: { framework: "框架概览" },
    contribution: {
      eyebrow: "开源活动",
      title: "GitHub 提交活动",
      open: "打开 GitHub ->",
      last12Months: "过去 12 个月",
      loading: "正在加载公开贡献图...",
      syncing: "同步中",
      weekdays: ["周一", "周三", "周五"],
      less: "少",
      more: "多",
      initialNote: "贡献数据来自公开 GitHub 贡献接口，可能存在缓存。",
      unavailable: "暂时无法加载实时贡献数据。",
      openLatest: "前往 GitHub 查看最新数据",
      unavailableNote: "外部贡献数据源当前不可用。",
      summary: "过去一年共有 {count} 次贡献",
      activeDays: "展示 {count} 个活跃日",
      cachedNote: "实时贡献来自公开 GitHub 个人资料，数据可能缓存约一小时。",
      dayTitle: "{date} - {count} 次贡献",
      calendarLabel: "GitHub 贡献日历"
    },
    cv: {
      eyebrow: "网页版简历",
      title: "个人简历",
      intro: "一份聚焦科研、项目、实习、奖项与可复现成果的公开网页版简历。",
      education: "教育经历",
      workExperience: "工作经历",
      experience: "科研与实习经历",
      publications: "论文与手稿",
      awards: "奖项",
      services: "学术服务",
      skills: "技能",
      learning: "学习图谱"
    },
    projectsPage: {
      eyebrow: "科研与工程",
      title: "项目",
      intro: "涵盖人工智能安全、大语言模型智能体、软件安全、计算机视觉与气候研究的代表工作。",
      project: "项目",
      featured: "精选"
    },
    blogPage: {
      eyebrow: "笔记",
      title: "博客",
      intro: "记录技术笔记、论文阅读与项目复盘；首篇文章介绍本网站的建设思路。"
    },
    serviceWatermark: "审稿",
    footer: {
      updated: "最近更新：",
      showVisits: "显示主页总访问量",
      hideVisits: "隐藏主页总访问量",
      visitsAlt: "主页总访问量",
      visitsLabel: "访问量",
      unavailable: "暂不可用"
    },
    newsJump: "{date} 动态：跳转到竞赛获奖部分"
  }
} as const;

export const getUi = (locale: Locale) => ui[locale];
