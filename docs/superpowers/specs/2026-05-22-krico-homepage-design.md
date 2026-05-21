# Krico Personal Academic Homepage Design

## Summary

- Build a free personal academic homepage with GitHub Pages.
- Use `Kirito14IT.github.io` as the repository name and `https://kirito14it.github.io/` as the public URL.
- Use `Krico` as the visible brand name.
- Implement with Astro and static pages only.
- Use English as the public homepage language.

## Confirmed constraints

- `krico.github.io` is not available because `krico` is already a GitHub username.
- The public GitHub account is `Kirito14IT`.
- The current local workspace `E:\github\kirco` was empty and not a git repository.
- Do not publish phone number, exact address, GPA, exact class position, or exact course scores.
- Mention coursework and academic interests without numeric performance metrics.
- Do not attach PDF resumes in the first public version.
- Treat submitted papers as arXiv preprints or manuscripts under review; add exact arXiv URLs later.

## Site structure

- `/`: home page with sidebar profile, typing research-focus hero, About, News, Research and Experience, Publications, GitHub contribution graph, Featured Projects, Awards and Skills.
- `/cv/`: web CV without private or grade-like data.
- `/projects/`: project index.
- `/projects/[slug]/`: Markdown project pages.
- `/blog/`: Markdown blog index.
- `/blog/[slug]/`: Markdown blog pages.

## Content extracted from PDFs

- Education: B.Eng. in Computer Science and Technology, University of Shanghai for Science and Technology, Sep 2023 to present.
- Research directions: AI safety, LLM agents, software security analysis, trustworthy AI, multimodal learning.
- XSafeClaw: Fudan Trusted Embodied AI Institute intern, Apr 2026 to present; runtime safety governance for agents; nanobot-style runtime integration; XSafeAI/XSafeClaw had 150 GitHub stars when checked.
- VulnSeeker: Fudan Software Engineering Lab intern, Jan 2026 to Mar 2026; CodeQL plus LLM security analysis.
- SafeCodeRL: first-author AI safety manuscript on multi-agent reinforcement learning for safety-constrained LLM code generation.
- SFMambaNet: first-author computer vision manuscript on spectral-frequency enhanced state space models for correspondence pruning.
- UNV internship: online research support for Morobe Development Foundation Inc., Jan 31 2026 to May 21 2026; produced a mangrove climate response and blue carbon review manuscript.
- Software copyright: robust deep-learning watermark mobile application.
- Selected awards: RAICOM national first prize, LanQiao Cup national second prize, CCPC Shanghai silver award, National English Competition third prize, Mathematics Competition Shanghai first prize.

## Visual design

- Overall style: modern academic homepage with a light manga-inspired technical atmosphere.
- Layout: sticky left sidebar plus right content column, responsive single-column mobile layout.
- Hero: typing and deletion animation with rotating focus words and different colors.
- Hero: add a lightweight interactive neural-network particle canvas that reacts to pointer movement without covering the main content.
- Decorative style: soft gradient mesh, grid-paper background, small floating labels instead of copying any copyrighted anime character.
- GitHub contribution graph: render a live public contribution calendar like the reference site, with graceful failure if the third-party API is unavailable.
- Contact section: display the public email, GitHub URL, and representative-work URLs directly; invite academic discussion and collaboration via email.
- Learning map: show subjective knowledge-progress bars with concise research-oriented descriptions; do not use numeric academic course performance.

## Deployment plan

- Use Astro static output.
- Configure `astro.config.mjs` with `site: "https://kirito14it.github.io"`.
- Use GitHub Actions with `actions/deploy-pages`.
- GitHub repository Pages source should be set to GitHub Actions.
- No commit or push should happen before user confirmation.

## Validation

- `npm run validate` checks required files and blocks grade-like or sensitive public content.
- `npm run build` runs `astro build`.
- After deployment, manually verify `/`, `/cv/`, `/projects/`, project detail pages, `/blog/`, and blog detail pages.
