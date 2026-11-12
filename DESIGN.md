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

Body prose uses normal weight and a compact, readable line height. Article text is limited to 75ch; publication and timeline rows use the available content column. Dates and numeric counts use tabular numerals.

## Layout

Desktop pages use a centered container with a maximum width of 1280px, a 220px sidebar, and a 48px column gap. The gap reduces to 36px below 1100px. At 900px and below the sidebar becomes a visible, stacked identity header with contacts alongside the avatar. Small screens retain both navigation and language switching without adding a duplicate navigation row.

Section headings sit above a thin rule. Navigation stays on one horizontally scrollable row. News occupies a vertically scrollable 320px region on desktop and 280px on mobile; screenshot links open a full-size native dialog. Publications pair a compact figure at left with text at right, then stack at 600px and below. Lists of projects and notes use flat rows. Research experience uses native details/summary disclosures, while education uses two compact rows.

## Elevation & Depth

Content rows have no shadows, glass effects, backdrop blur, or decorative background layers. Separation comes from whitespace and thin rules. The existing floating assistant and optional interaction effects are functional exceptions kept outside the content hierarchy.

## Shapes

Content has square, unboxed edges. Utility controls use a minimal corner radius from the frontmatter. The avatar remains circular. Contact icons use a consistent small SVG stroke, and the static ACMer asset retains its own identity geometry.

## Components

### Navigation

Desktop and mobile share one wrapping navigation row. Homepage links jump to sections; inner pages link to Home, CV, Projects, and Blog. Language switching remains a plain text link with a small globe where space permits.

### Publication rows

A figure links to the full image; the text contains linked title, authorship marks, status/date metadata, resources, ratings, and tags. Resources and metadata read as inline text without pill containers. Existing homepage overrides remain intact.

### Disclosures

Native summary controls show the date and a concise research description. Opening a research entry reveals its full content with a consistent indent. Keyboard focus is a blue outline. The detailed CV preview mounts only when its disclosure opens.

### CV controls and previews

Open and download actions are plain inline links. The PDF previews keep their original source URLs, version hashes, filenames, and one-pixel borders. Detailed CV preview loading remains on demand.

### Motion and interaction

The static content remains visible by default. The assistant, click feedback, and CSS meteors are retained; click and meteor layers are hidden under reduced motion. Project GIF demos loop continuously by default and show a static poster for reduced motion. The ACMer identity has no CSS animation.

## Do's and Don'ts

### Do:
- **Do** keep public page backgrounds white and use system sans-serif text.
- **Do** preserve clear keyboard focus, ordinary links, authorship marks, and language controls.
- **Do** use thin separators and flat content rows.
- **Do** keep contacts visible when the sidebar stacks on mobile.

### Don't:
- **Don't** add glass panels, decorative meshes, background grids, or large shadows.
- **Don't** turn tags, ratings, or resource links into pills.
- **Don't** add section eyebrows or animated ACMer styling.
- **Don't** hide the entire sidebar on mobile or add a second mobile navigation.
