---
locale: "zh"
translationKey: "logitech-mouse-freeze"
title: "鼠标待机后失灵：一个被伪装成硬件故障的罗技驱动缺陷"
date: 2026-10-21
description: "设备管理器一切正常、触控板正常、鼠标却完全没反应——最终定位到罗技 logi_lamparray USB 下层过滤驱动在 Modern Standby 后吞掉了鼠标的全部 HID 报告。本文给出完整的定位思路、修复方案与踩坑记录。"
tags: ["Windows", "故障排查", "驱动", "HID", "罗技", "PowerShell"]
draft: false
---

自己的 G304 无线鼠标又"待机后失灵"了。鼠标有电、接收器插着、触控板正常，唯独鼠标移动和点击毫无反应。

这次我决定不靠"拔插 USB / 重启电脑"糊弄过去，而是把它查清楚。

结果证明：**是罗技官方驱动的缺陷**，而且这个缺陷伪装得极好——设备管理器里所有节点都显示 `Status=OK`，事件日志里一条错误都没有，硬件也完全正常。

---

## 一、最重要的线索，恰恰是"拔插就好"

如果鼠标是硬件坏了，拔插 USB 不会有任何效果。而"拔插一下立刻恢复"这件事本身就说明：

> 故障不在硬件，而在**已加载的驱动/过滤器状态**。拔插 = 重新枚举设备树 = 重新加载驱动。

顺着这个思路，第一步是排除硬件：

```powershell
Get-PnpDevice -Class Mouse |
  Select-Object Status, Problem, FriendlyName, InstanceId
```

```
Status  Problem         FriendlyName          InstanceId
OK      CM_PROB_NONE    HID-compliant mouse    HID\VID_046D&PID_C53F&MI_01&COL01\8&1293EAEC&0&0000
OK      CM_PROB_NONE    HID-compliant mouse    HID\HTIX5288&COL01\4&148E01A2&0&0000
```

`CM_PROB_NONE` 意味着**设备从未在 USB 层断开**。再查事件日志，`Kernel-PnP`、`UserPnp`、`DriverFrameworks`、`USBHUB3` 全部没有告警。

于是故障范围被压缩到一句话：**设备在位、驱动在位，但报告流断了。**

---

## 二、真正的元凶：一个"看不见"的 USB 过滤驱动

罗技 LIGHTSPEED 接收器是 USB 复合设备。查它的**下层过滤器**：

```powershell
$recv = Get-PnpDevice -PresentOnly |
  Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                 $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1

Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_LowerFilters'
```

```
DEVPKEY_Device_LowerFilters : vhf, logi_lamparray
```

注册表里同一个值：

```
HKLM\SYSTEM\CurrentControlSet\Enum\USB\VID_046D&PID_C53F\6&18811D57&0&1
    LowerFilters = { vhf, logi_lamparray }
```

`vhf` 是 Windows 自带的 Virtual HID Framework，正常。问题出在 `logi_lamparray`——这是罗技 `logi_lamparray_usb.inf` 驱动包安装的 **USB 下层过滤驱动**（内核态 `.sys`），配套还有用户态服务 `logi_lamparray_service`。

它的唯一职责是**把罗技设备的 RGB 灯光接入 Windows 11 的 Dynamic Lighting**。

而 **G304 是单色 DPI 指示灯机型，根本没有 RGB**。也就是说这套灯光驱动栈对我的鼠标毫无用处，却实实在在插在了它的 USB I/O 路径上。

### 它为什么会吃掉报告

USB 下层过滤驱动位于 USB 控制器和 HID 栈之间：

```
鼠标固件 →(LIGHTSPEED 无线)→ 接收器固件 →(USB 中断)→ USBHUB3 → logi_lamparray → hidusb → mouhid → 系统
```

`logi_lamparray` 夹在中间。**它一旦在电源状态转换中卡死，后面整条链路就断了**——而它不会报错，因为它不是"出错"，只是"不再传"。设备树不变、事件日志无错、服务状态正常。

这就是它骗过所有人的地方。

---

## 三、触发条件：Windows 的默认电源策略

```powershell
powercfg /a
```

```
此系统上有以下睡眠状态:
    待机 (S0 低电量待机) 连接的网络
    休眠
    快速启动
```

不是传统 S3，而是 **Modern Standby (S0)**。在 S0 下系统空闲时会把设备逐个下电，用户一动再逐个上电。**过滤器驱动如果没处理好 S0 的挂起/恢复序列，就会卡在中间态。**

再叠加两个 Windows 默认值，构成了完整的复现条件：

| 设置 | 默认值 | 影响 |
|---|---|---|
| USB 选择性暂停 | 启用（AC 与 DC 均为启用） | 接收器端口被下电，恢复时过滤器状态机最容易出错 |
| `DeviceSelectiveSuspended` | `1` | 证实设备当时确实处于被选择性挂起的状态 |
| 快速启动 | 启用 | 于是"关机再开机"其实是休眠恢复，USB 设备常以半死状态起来 |

---

## 四、这不是我一个人的机器

拿到这个结论后，我去查了有没有别人遇到过同一件事。找到了三个独立佐证：

**其一，另一台机器、另一款鼠标、同一个过滤器栈。** Valve 的 Dota 2 问题单里，有人报告拔插接收器时游戏主线程冻结数秒：

```
Logitech USB driver: logi_lamparray_usb.inf / oem218.inf
Driver version: 1.1.91.2790
Receiver lower filters: vhf, logi_lamparray
```

**其二，同一个组件在别的软件里作乱。** OpenLogi 项目的问题单 #1129 指出，`logi_lamparray_service` 会持续往鼠标灯光区推 Windows 强调色，把其他工具的 HID++ 写入直接覆盖掉。

**其三，微软官方支持文档**在教用户**禁用 `Logitech_Lamparray_Service`**，并明确提到 G 系列键鼠用户大量反馈该服务导致"异常行为"。

**判定：罗技官方驱动缺陷，Windows 默认电源策略是放大器。** 我已经把这个复现过程和完整修复脚本提交到了罗技官方 GitHub 仓库。

---

## 五、修复：把过滤器摘掉，驱动包卸掉

核心只有一步——从接收器的设备实例上移除 `logi_lamparray`：

```powershell
$key = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)"
Set-ItemProperty -Path $key -Name LowerFilters -Value @('vhf') -Type MultiString
```

改完必须**重新枚举设备**才生效（禁用再启用接收器）。这一步做完，鼠标**立刻恢复**——没有拔插，没有重启。

### 但只做这一步会埋雷

如果留着罗技驱动包，日后把接收器换到另一个 USB 口，Windows 会新建设备实例、由 INF **把过滤器重新写回**，而内核驱动此时已被停用——设备会直接"无法启动"（Code 10 或 39），比原问题更糟。

所以必须连驱动包一起卸掉：

```powershell
pnputil /delete-driver oem103.inf /uninstall /force   # logi_lamparray_usb.inf
pnputil /delete-driver oem78.inf  /uninstall /force
pnputil /delete-driver oem18.inf  /uninstall /force
pnputil /delete-driver oem6.inf   /uninstall /force   # logi_lamparray_hid.inf
```

最终状态很干净：接收器回落到微软通用驱动 `usbccgp`，`LowerFilters` **完全为空**，一个第三方过滤器都不剩。

---

## 六、踩到的几个坑（这部分最值钱）

### 坑 1：`pnputil` 的输出是本地化的

提权进程里 `pnputil /enum-drivers` 输出的是中文标签 `发布名称:`，而交互式会话里是英文 `Published Name:`。用英文正则去解析提权进程的输出，**会全部匹配失败，而且静默地"什么都没找到"**——我第一次就是这么把"已清除"写成日志、然后复查才发现根本没删掉。

解法是用与语言无关的模式直接抓 `oem` 编号：

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value
```

### 坑 2：卸完罗技驱动，WinUSB 会抢走整个复合设备，鼠标 HID 直接消失

`logi_lamparray_usb.inf` 被删后，Windows 重新匹配驱动，选中了第三方 `LIGHTSPEED_Receiver.inf`（libwdi / WinUSB）——它匹配的是**整个** `VID_046D&PID_C53F`（没有 `&MI_` 限定）。

**WinUSB 不暴露 HID 接口**，于是鼠标 HID 节点整个消失。

解法是把这几个 WinUSB 包也卸掉，让接收器回落到微软通用驱动。判断哪些该卸、哪些该留，直接读 DriverStore 里 INF 声明的硬件 ID：

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          ← 抢整个复合设备，要卸
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    ← 只管 HID++ 接口，保留
```

### 坑 3：`Set-CimInstance` 没有 `-Filter` 和 `-ClassName`

PowerShell 7 里只有 `-InputObject` / `-Query`：

```powershell
# 报错
Set-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable -Property @{Enable=$false} -Filter "..."
# 正确
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### 坑 4：PowerShell 变量名大小写不敏感

```powershell
$Base = 'E:\LogitechMouseFix'
$base = Measure-G304 -Milliseconds 8000   # ← 把 $Base 覆盖成了一个对象
$bat  = "$Base\一键恢复鼠标.bat"           # → 路径变成 "@{Count=-1; ...}\一键恢复鼠标.bat"
```

症状是日志里出现莫名其妙的对象字符串、文件写到错误路径。给路径变量起个不会撞的名字。

### 坑 5：忘了 `-PresentOnly`

`Get-PnpDevice` 默认会列出所有**历史**设备实例（包括插过的其它接收器、换过的 USB 口）。我这里就有两个 `PID_C53F` 实例，只有一个 `Present=True`。不对它做过滤，就会对着陈旧实例改注册表。

---

## 七、让问题不再复发

光修一次不够，得把触发条件也拆掉：

```powershell
# 关闭所有电源方案的 USB 选择性暂停（AC 与 DC）
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# 禁止 Windows 关闭罗技接收器接口的电源
# （root\wmi 的 MSPower_DeviceEnable，Enable 设为 False）

# 关闭快速启动
Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -Name HiberbootEnabled -Value 0

# 关闭空闲自动睡眠
```

另外还注册了三个计划任务：

- **从低功耗状态恢复后**自动重新枚举接收器（故障几乎都发生在唤醒后，这是最关键的一条）
- **用户登录时**自愈
- **每 2 分钟**跑一次看门狗

看门狗不是"定时重启接收器"（那会打断正常使用），而是**三重约束**才动手：G304 平时确实在用且最近活跃过、当前零事件而触控板有活动、连续两轮都这样。否则不动——如果你平时只用触控板，G304 静默是**正常的**，不能当成故障。

判断"别的鼠标在动"靠 Raw Input 按设备路径过滤，把 `VID_046D&PID_C53F` 和其它鼠标区分开。

---

## 八、一点反思

这次排查里最值钱的不是任何一条命令，而是**"拔插一下就好"这个现象本身**。

它同时否定了硬件问题（USB 接触不良不会靠拔插解决鼠标不响应）并指向了驱动状态（重新枚举即可恢复）。几乎所有"鼠标失灵"的通用建议都是"换 USB 口 / 重启 / 换电池"，因为这些操作**碰巧**会触发设备树的重建——于是永远找不到真正的根因。

一个能给出"故障级联"解释的排查，和一串试错的建议，差别就在这里。

**完整脚本、逐条诊断实录和可回滚的备份**都放在这个仓库里：

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

如果你的鼠标也出现过"待机后失灵、设备管理器却一切正常"，可以直接用仓库里的 `一键恢复鼠标.bat` 试一下——它等价于一次软件层面的 USB 重新枚举，不需要真的拔插。
