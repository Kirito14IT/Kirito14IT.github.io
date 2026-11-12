---
name: Carey Academic Website
description: A compact bilingual academic page with a white surface and content-led rows.
colors:
  primary: "#1769aa"
  ink: "#222222"
  muted: "#626262"
  paper: "#ffffff"
  line: "#dddddd"
  soft: "#f7f7f7"
  news-surface: "#f7f9fc"
  callout-surface: "#f0f6ff"
  callout-accent: "#2862a6"
  publication-badge: "#245b95"
typography:
  heading:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  control: "2px"
spacing:
  compact: "8px"
  group: "16px"
  section: "28px"
  columns: "48px"
components:
  link:
    textColor: "{colors.primary}"
    typography: "{typography.label}"
  button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "5px 10px"
  section-heading:
    textColor: "{colors.ink}"
    typography: "{typography.heading}"
---

# Design System: Carey Academic Website

## Overview

**Creative North Star: "A compact academic page"**

The approved reference is xuyanye.com. The website uses a plain white surface, familiar system typography, restrained blue links, and thin separators so academic content carries the page. The identity sidebar and dense, readable content rows form the recurring composition.

**Key Characteristics:**
- White, flat public pages.
- Compact text and simple academic hierarchy.
- Linked publications, dated news, and accessible disclosures.
- Bilingual routes with a consistent shared shell.

## Colors

The palette uses blue for links, near-black text, subdued gray metadata, and pale gray rules. The frontmatter defines the normative reused values; CSS may retain factual publication metadata colors and the existing ACMer identity asset.

### Primary
- **Academic Blue:** Interactive text, focus outlines, and meaningful progress fills.

### Neutral
- **Paper:** All public page backgrounds.
- **Ink:** Body text and headings.
- **Muted Gray:** Dates, secondary information, and figure captions.
- **Rule Gray:** Thin separators and PDF preview borders.
- **Soft Gray:** Code surfaces and low-emphasis utilities.

**The White Surface Rule.** Keep the main public page surface white and fixed to light mode.

## Typography

The system sans-serif stack supports English and Chinese without a remote font dependency. Heading, body, and label roles use the exact values in the frontmatter. Publication and article-row titles are slightly smaller than section headings; technical code uses the system monospace stack.

Body prose uses normal weight and a compact, readable line height. Article text is limited to 75ch; publication and timeline rows use the available content column. Date fields use italic tabular numerals at the normal 15px body size and ink color; numeric counts stay upright. Content links are underlined at rest, while sidebar contact links are not.

## Layout

Desktop pages use a centered container with a maximum width of 1280px, a 220px sidebar, and a 48px column gap. The gap reduces to 36px below 1100px. At 900px and below the sidebar becomes a visible, stacked identity header with contacts alongside the avatar. Small screens retain both navigation and language switching without adding a duplicate navigation row.

Section headings sit above a thin rule. Navigation stays on one horizontally scrollable row. News occupies a pale, bordered, 10px-rounded scroll window, 320px high on desktop and 280px on mobile; screenshot links open a full-size native dialog. Homepage publications pair a 320px uncropped figure at left with text at right, then stack at 600px and below. Lists of projects and notes use flat rows. Research experience uses native details/summary disclosures, while education uses two compact rows.

## Elevation & Depth

Content rows remain unboxed and flat. Homepage paper images have the explicitly requested 2px 3px 6px rgba(0,0,0,.18) shadow. The internship callout uses a pale-blue surface and 4px blue left rule. News uses a pale rounded border. Separation elsewhere comes from whitespace and thin rules. The existing floating assistant and optional interaction effects are functional exceptions kept outside the content hierarchy.

## Shapes

Content has square, unboxed edges. Utility controls use a minimal corner radius from the frontmatter. The avatar remains circular. Contacts use original official brand marks, with standard outline icons for email and CV, and the static ACMer asset retains its own identity geometry.

## Components

### Navigation

Desktop and mobile share one horizontally scrollable navigation row. Homepage links jump to sections; inner pages link to Home, CV, Projects, and Blog. Language switching remains a plain text link with a small globe where space permits.

### Publication rows

A figure links to the full image. Paper titles are plain bold text (700 weight). Each author line is followed only by notes for symbols that actually occur. Homepage figures carry a small upper-left rating badge, or Preprint; homepage dates and captions are hidden while full CV metadata remains. Platform resource links use official marks and underlined labels. News and Featured Projects use compact colorful live Star badges; the About total badge is the user-specified static ≈2.5k. Existing author/status overrides remain intact.

### Disclosures

Native summary controls show the date and a concise research description. Opening a research entry reveals its full content with a consistent indent. Keyboard focus is a blue outline. The detailed CV preview mounts only when its disclosure opens.

### CV controls and previews

Open and download actions are plain inline links. The PDF previews keep their original source URLs, version hashes, filenames, and one-pixel borders. Detailed CV preview loading remains on demand.

### Motion and interaction

The static content remains visible by default. The assistant, click feedback, and CSS meteors are retained; click and meteor layers are hidden under reduced motion. Project GIF demos loop continuously by default and show a static poster for reduced motion. The ACMer identity floats and gently rotates with a flowing circuit and blinking cursor, as explicitly requested; reduced motion disables these animations.

## Do's and Don'ts

### Do:
- **Do** keep public page backgrounds white and use system sans-serif text.
- **Do** preserve clear keyboard focus, ordinary links, authorship marks, and language controls.
- **Do** use thin separators and flat content rows.
- **Do** keep contacts visible when the sidebar stacks on mobile.

### Don't:
- **Don't** add glass panels, decorative meshes, background grids, or large shadows.
- **Don't** add pill containers to ordinary tags or resource links; compact Star badges and publication labels are approved exceptions.
- **Don't** add section eyebrows. Keep ACMer animation confined to the identity mark and respect reduced motion.
- **Don't** hide the entire sidebar on mobile or add a second mobile navigation.
