# Zhihua Wang's ChatBot

The shared Astro layout loads ChatDOC Studio's official floating widget on English and Chinese pages. The published public app ID is `rZqgDXMQ`, configured in `src/data/chatbot.ts`. The app is named **Zhihua Wang's ChatBot**. No API key is stored in the website.

The integration is the exact code supplied by Studio's Launch → Connect screen:

```html
<script src="https://chatdoc.studio/chatbot/embed.js" data-id="rZqgDXMQ" async defer></script>
```

The vendor manages the launcher, chat window, and conversation interface. A blank or malformed app ID omits the embed script entirely. The Studio app has been deployed; the website is published through the normal GitHub Pages workflow.

A mobile-only CSS correction in `ChatBot.astro` fits the vendor's `.chatdoc-studio-chatbot-iframe` container within viewports up to 600px wide. It overrides the observed fixed 412px width and scaling that cropped the widget at 390×844, while preserving the desktop widget and iframe's internal controls.

An accessible invitation button above the launcher reads **Ask anything about Zhihua Wang!**. It remains visible while the chat is closed, hides while open or its state is unknown, and opens the existing vendor chat when clicked. It uses the iframe's observed inline transform (`scale(0)` when closed), rather than the outer container's mobile transform. A bounded mount observer disconnects when the widget appears or after 30 seconds; no polling timer is used. If a future vendor update changes the iframe state mechanism, recheck this integration before updating the visibility rule.

## Source and checks recorded on 2026-11-04

- The deployed app indexes the public [English homepage](https://kirito14it.github.io/), with 3,652 tokens indexed. Chinese replies use this public source and the configured language-matching instructions.
- Playground checks succeeded for a Chinese question about research interests/contact and an English question distinguishing current USST undergraduate status from incoming Fudan studies in 2027, including an unknown job-start-date question.
- The public iframe was opened in the in-app browser without a Studio login; its contact shortcut returned the correct public email. The local homepage widget was also checked at desktop and 390×844 viewport sizes, including the mobile fit correction.
- The first attempt to crawl the Chinese homepage failed. Its earlier `SupportAssistant` draft (`KIgKxexo`) was retained and was not deployed by this integration. It still occupies an app slot; it is not the app ID used by the website.
- Additional bilingual knowledge and prompt materials are prepared locally at `D:\Resume\.codex-work\chatbot_20261104\knowledge.md` and `bot-instructions.md`; they are not represented here as indexed sources.
- No purchase or paid subscription was made. Future updates should check the public widget and live homepage separately from Playground responses.

## Cost and account state verified on 2026-11-04

- The signed-in account showed Free Trial / Current, $0/month, 1,000 credits, 100MB knowledge capacity, and 3 apps.
- Usage displayed the period **2026-11-04–2026-12-04** and **Auto-Subscription: No**. No payment or subscription was enabled.
- Credits cover document processing and app interactions; 1,000 credits is not necessarily 1,000 questions.
- The [official introduction](https://www.chatdoc.studio/blog/turn-business-documents-into-24-7-ai-expert-with-chatdoc-studio/) describes 1,000 credits/month, while the current pricing label says Free Trial. Future free renewal and expiry should be checked in the account; this setup does not promise perpetual free service.
- The current lowest Studio subscription was $50/month. The [changelog](https://chatdoc.studio/log/) announces on-demand additional credit packages, but eligibility, minimum price, and expiry for free accounts have not been verified.
- [PDFParser](https://chatdoc.com/guide/getting-started/developer-resource/pdf-parser-api/) is a separate PDF extraction service ($1/100 pages in its guide), not the website chatbot. It is not required separately for this integration.

## Update knowledge, replace the app, or disable

Sign in with Google at [ChatDOC Studio](https://chatdoc.studio/chatdoc-studio/). Update the app's public sources when the CV/profile changes, train again, test both languages and unknown-answer behavior, and redeploy the app. Keep the existing public app ID unless replacing the app. Configure its name, greeting, suggested questions, avatar, and interface in Studio.

In Playground → Interface, **Chat Avatar** controls the image beside replies; **Chat Launcher Icon → Custom** controls the floating button. Both currently use an uploaded copy of the homepage's GitHub avatar. With the current 100×100 source and 200×200 crop box, set the crop zoom to 2× to avoid transparent padding. Confirm the crop, save the form, then Deploy. These copies do not automatically follow future GitHub-avatar changes. The greeting and suggested questions are configured with English first and Chinese second.

To replace the bot, copy the new public app ID from Launch → Connect into `src/data/chatbot.ts` and run `npm test`. Never copy a private API key into this file. To remove chat from all site pages, clear `appId`, rebuild, and publish. Website content remains independent of the chatbot service.
