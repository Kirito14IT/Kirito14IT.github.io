# Krico Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a free Astro-based academic homepage for Krico and prepare it for GitHub Pages deployment.

**Architecture:** Use a static Astro site with data-driven profile/CV files, Markdown content collections for projects and blog posts, reusable layout/components, and a GitHub Actions Pages workflow. Keep all public content free of private address, phone number, and grade-like metrics.

**Tech Stack:** Astro, TypeScript, Markdown content collections, GitHub Pages, GitHub Actions.

---

### Task 1: Project skeleton and validation

**Files:**
- Create: `package.json`
- Create: `scripts/validate-content.mjs`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`

- [x] Write a validation script that fails when required site files are missing or sensitive public content appears.
- [x] Run `npm run validate` and confirm it fails because required files are missing.
- [x] Add Astro configuration and TypeScript configuration.

### Task 2: Public data model

**Files:**
- Create: `src/data/profile.ts`
- Create: `src/data/cv.ts`

- [x] Extract public-safe profile information from the resumes.
- [x] Remove phone number, exact address, GPA, exact position, and course scores.
- [x] Add research, internship, publications, projects, awards, and skills data.

### Task 3: Pages and components

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Sidebar.astro`
- Create: `src/components/TypingHero.astro`
- Create: `src/components/ContributionGraph.astro`
- Create: `src/components/Section.astro`
- Create: `src/components/Timeline.astro`
- Create: `src/components/ProjectCard.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/cv.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/projects/[slug].astro`
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`

- [x] Build the homepage structure.
- [x] Add typing and deletion animation.
- [x] Add live GitHub contribution graph with graceful fallback.
- [x] Build CV, Projects, and Blog routes.

### Task 4: Content

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/*.md`
- Create: `src/content/blog/website-launch.md`

- [x] Define content collection schemas.
- [x] Add project detail pages for XSafeClaw, SafeCodeRL, VulnSeeker, SFMambaNet, mangrove blue carbon work, and watermark mobile app.
- [x] Add one starter blog post.

### Task 5: Styling

**Files:**
- Create: `src/styles/global.css`

- [x] Add modern academic layout.
- [x] Add light manga-inspired decorative motion without copying any character IP.
- [x] Add responsive layout.

### Task 6: Deployment support

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `.gitignore`
- Create: `README.md`

- [x] Add GitHub Actions Pages workflow.
- [x] Add beginner deployment and verification instructions.
- [x] Keep commit and push as user-confirmed steps only.
