import type { Locale } from "@i18n/index";

const remoteControlUrl = "https://github.com/Kirito14IT/chatgpt-codex-windows-remote-control-proxy-fix";

const fieldNotes = {
  en: [
    {
      title: "ChatGPT / Codex on Windows: Remote Control Connection Failures",
      summary: "A debugging write-up covering DNS resolution, proxy environment variables, os error 10060, and Clash Verge / mihomo TUN diagnostics, with reusable PowerShell scripts. The tested fix restored device registration; a separate desktop WebSocket connection issue is documented as unresolved.",
      tags: ["Windows", "Debugging", "Networking", "PowerShell"],
      url: remoteControlUrl
    }
  ],
  zh: [
    {
      title: "ChatGPT / Codex 桌面端「无法更新远程控制状态」排障记录",
      summary: "记录 DNS 解析、代理环境变量、os error 10060 与 Clash Verge / mihomo TUN 的排查过程，并提供可复用的 PowerShell 脚本。已验证设备上线恢复；桌面端另一条 WebSocket 连接仍有未解决问题，详见原文。",
      tags: ["Windows", "故障排查", "网络诊断", "PowerShell"],
      url: remoteControlUrl
    }
  ]
} as const;

export const getFieldNotes = (locale: Locale) => fieldNotes[locale];
