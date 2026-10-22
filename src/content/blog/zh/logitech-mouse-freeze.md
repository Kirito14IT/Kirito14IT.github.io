---
locale: "zh"
translationKey: "logitech-mouse-freeze"
title: "鼠标待机后失灵：Windows 查不到、也拦不住的一次掉电"
date: 2026-10-21
description: "设备管理器一切正常、触控板正常、鼠标却完全没反应。真实原因是接收器在待机期间掉电且固件不再监听鼠标——而这一层在 Windows 电源管理之下，Windows 既观测不到也拦不住。含完整取证、两种触发器方案、硬件层建议，以及一个我自己走错的弯路。"
tags: ["Windows", "故障排查", "USB", "HID", "罗技", "PowerShell", "Modern Standby"]
draft: false
---

我的 G304 无线鼠标又"待机后失灵"了。鼠标有电、接收器插着、触控板完全正常，但鼠标**移动无反应、点击无反应**。

这个系列我修过两次，两次都以为自己找到了根因。**第一次是错的，第二次也只对了一半。** 这篇是最终版，包含被证伪的那两次。

---

## 一、现象的迷惑性

| 你看到的 | 实际情况 |
|---|---|
| 设备管理器里鼠标是 `OK`，没有黄色感叹号 | 设备**从未**在 USB 层断开，只是**一个 HID 报告都发不出来** |
| 触控板能用，系统其他部分正常 | USB 控制器和系统都是好的 |
| 拔插接收器就好 | 重新枚举 = 给接收器做了一次 USB 复位 = 接收器固件重启 |
| 重启电脑就好 | 同上，且顺带清掉了休眠状态 |
| 事件日志里没有任何错误 | 驱动没报错，它只是**不再上报** |

```
Status  Class   FriendlyName          InstanceId
OK      Mouse   HID-compliant mouse  HID\VID_046D&PID_C53F&MI_01&COL01\8&2C2C0656&0&0000
```

`Problem = CM_PROB_NONE`。**系统认为它完全正常**——这正是为什么网上所有「重启 / 换 USB 口」的建议都"有效"却没人找到真正原因。

---

## 二、第一次走错的弯路：`logi_lamparray` 过滤器

接收器上挂着罗技的 USB 下层过滤驱动：

```
HKLM\...\Enum\USB\VID_046D&PID_C53F\<inst>\LowerFilters = { vhf, logi_lamparray }
```

这是罗技 `logi_lamparray_usb.inf`（WHCP 签名）装的内核态过滤驱动，作用是把罗技设备的 RGB 灯光接入 Windows 11 Dynamic Lighting。我的推理是：

> G304 是单色 DPI 指示灯机型，根本用不到 RGB，这套驱动是误装的；它插在接收器的 USB I/O 路径上，卡死就会吞掉 HID 报告。

旁证也有：微软官方文档教用户**禁用 `Logitech_Lamparray_Service`**；OpenLogi#1129 报告同一服务覆盖 HID++ 写入；Valve 的 Dota2 #35162 里另一台机器、另一款鼠标（G Pro Wireless）带着**同一套过滤器栈**出现主线程冻结。

于是我卸了驱动包、摘了过滤器、停用了服务。**鼠标当时确实恢复了。**

但症状复发时我第一件事就是查过滤器：

```
LowerFilters = []          ← 过滤器根本不在了
logi_lamparray 驱动包       ← 不存在
logi_lamparray 内核驱动     ← 已停用
```

**症状照样发生。** 结论只有一个：**上次"修好"不是因为摘了过滤器，而是因为那次操作顺带重新枚举了接收器**——和拔插 USB 是同一件事。

> **教训：当一个修复"生效"时，先确认它到底修掉了什么。**
> 验证了"A 之后好了"还不够，要补对照组"不 A、只做 B 是不是也一样好"。这一步如果早做，能省下一整串"卸载驱动包 → 引入 WinUSB 抢占 → 鼠标 HID 整个消失 → 再花一轮拉回来"的弯路。

（过滤器本身仍是一个真实缺陷，已向罗技提 issue 并更正归因：<https://github.com/Logitech/cpg-docs/issues/25>）

---

## 三、第二次：方向对了，但只对了一半

第二次我把注意力转向**电源**，逻辑链是：

> 接收器靠 USB 供电。待机时 USB 集线器进入选择性挂起，切断端口供电 → 接收器固件掉电 → 唤醒后固件不再监听已配对的鼠标。

于是做了四层加固：

```powershell
# (1) 全局：关闭所有电源方案的 USB 选择性暂停
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# (2) 接收器所在的 USB 集线器：不允许被关闭
$hub = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj

# (3) 接收器及所有接口：禁止被关闭
Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
    Where-Object { $_.InstanceName -match 'VID_046D' } | ForEach-Object {
        $_.Enable = $false; Set-CimInstance -InputObject $_
    }

# (4) 每个设备节点：清掉设备自身的挂起与链路电源管理标志
$dp = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)\Device Parameters"
Set-ItemProperty $dp -Name SelectiveSuspendEnabled        -Value 0 -Type DWord
Set-ItemProperty $dp -Name EnhancedPowerManagementEnabled -Value 0 -Type DWord
```

**下一次待机，症状照旧。** 于是有了这次真正有价值的取证——**趁鼠标还是死的**把设备状态属性全查一遍：

```
DEVPKEY_Device_ConfigFlags             = 0        ← 无 SUSPENDED 标志
DEVPKEY_Device_ProblemCode             = 0
DEVPKEY_Device_LastArrivalDate         = 23:48:18 ← 待机期间没有新的"到达"
DEVPKEY_Device_DeviceSelectiveSuspended = (属性不存在)
Device Parameters\SelectiveSuspendEnabled        = 0   ← 我设的，在
Device Parameters\EnhancedPowerManagementEnabled = 0   ← 我设的，在
```

**这些结果合起来说明三件事：**

1. **待机期间 Windows 根本没有重新枚举接收器**（设备实例 ID 没变，`LastArrivalDate` 停在 23:48）。我上一版守护进程靠 `LastArrivalDate` 变化来检测 → **这个信号永远不来**。
2. **Windows 完全不知道接收器掉过电**。没有挂起标志、没有错误码、没有问题状态、`DeviceSelectiveSuspended` 属性压根不存在。
3. **我做的 (2)(3)(4) 全部生效了（值都是 0 / False），但没有任何效果**。

也就是说：

> **这次掉电发生在 Windows 电源管理管不到的那一层。** 在 Modern Standby 里，USB **端口**的电源门控（port power gating / D3cold）由 **EC/BIOS** 决定，Windows 的 `MSPower_DeviceEnable`、选择性挂起开关、设备参数都管不到它。

所以我上一版宣称的"根治"是**错的**——那只是把问题压下去了，不是解决了。

---

## 四、最终方案：不去判断"鼠标死没死"，只判断"用户回来了没"

既然观测不到掉电、拦不住掉电，剩下的路只有一条：**检测到用户回来时，把接收器复位一次**。

接收器复位 = 软件层面的 USB 复位 = 物理拔插一次，**实测 4~5 秒恢复**。

### 4.1 关键信号：系统空闲时间

`GetLastInputInfo` 的空闲时间在待机期间会持续增长，用户一回来就归零。**这是唯一可靠、且成本几乎为零的"用户回来了"信号。**

### 4.2 四个触发器

| 触发器 | 条件 | 说明 |
|---|---|---|
| **T1** | 接收器 `LastArrivalDate` 变化 | 换 USB 口 / 驱动更新时触发（上次实测不触发，但换口时会） |
| **T1b** | 设备实例 ID 变化 | 接收器被换到别的 USB 口 |
| **T2** | **系统空闲从 >4 分钟掉到 <1 秒** | 用户回来了（碰到键盘/触控板）→ 立即复位接收器 |
| **T5** | **空闲 >5 分钟后，每 2 分钟主动复位一次** | **主动式**：趁用户不在时把接收器复位好，回来直接就能用 |
| **T6** | 手工请求文件 | 桌面「一键恢复鼠标」写请求文件，守护代为执行，**不弹 UAC** |

**T2 不看指针动不动**，这是上一版最大的教训：上一版要求"回来后 4 秒内指针没动"才修复，于是用户**改用触控板移动指针** → 判据被自己抑制 → 一次都没触发。

### 4.3 为什么必须有 T5 主动式

死掉的鼠标**不产生任何输入**——滑动和点击都不会到达 Windows，空闲计时因此不会归零，守护也就不知道用户回来了。T5 反过来做：**在用户离开期间就周期性复位接收器**。

Modern Standby 下用户态程序仍在运行，而 USB 复位会**重新给端口供电、重启接收器固件**——于是用户回来时接收器就是新鲜的，**直接滑鼠标即可，连键盘都不用碰**。T2 保留为兜底（万一待机期间的复位无效）。

实测记录（用户离开的 9.5 分钟内）：

```
[00:50:58] 触发修复：T5 空闲期间主动复位接收器    ← idle 307s
[00:53:01] 触发修复：T5 空闲期间主动复位接收器    ← idle 427s
[00:55:03] 触发修复：T5 空闲期间主动复位接收器    ← idle 547s
```

间隔稳定在 2 分钟，且**守护在待机期间确实还在运行并执行了复位**——这是主动式方案成立的前提。

### 4.4 T6：不需要管理员权限的手工复位

复位接收器**确实需要管理员权限**——实测非提权进程执行 `Disable-PnpDevice` / `Enable-PnpDevice` 直接报「常规故障」。但守护进程本身就是以 SYSTEM 权限运行的，所以桌面入口改成**只写一个请求文件**：

```bat
>"E:\LogitechMouseFix\state\repair.request" echo request
```

守护看到就执行复位。**实测端到端 11 秒，全程不弹 UAC。** 守护没在运行时，批处理会自动退回提权方式。

### 4.5 代价与体感

用户从长空闲回来时，鼠标会有 **4~5 秒空窗**。但那正是鼠标本来就会死的时刻，所以感知是：

> "本来就不动 → 4 秒后突然好了"

而不是"一直坏着，必须拔插"。

而且 T2 触发在用户**碰到触控板或键盘的那一刻**——也就是他刚发现鼠标坏了、正在找别的办法的时候。恢复延迟几乎为零感知。

### 4.6 整日实测：一次都没失灵

修复上线后的**第一个完整工作日**（2026-10-22），用户反馈：「**今天一整体都没有出现鼠标动不了的情况**」。

守护进程当天的遥测：

```
T2  用户从长空闲回来（真实待机回机）  :   6 次   ← 每一次都自动恢复
T5  空闲期间主动复位接收器            : 314 次   （间隔稳定约 2 分钟）
T6  手工请求                          :   8 次
守护异常                             :   0 次
当天结束时接收器状态                   : OK / CM_PROB_NONE
```

**关键在 T2 那 6 次**——每一次都对应一次真实的「待机 → 回机」，而每一次回机时鼠标**直接就能用**：没有手动拔插、没有 UAC、没有用户干预。

这正好验证了方案的两个关键设计：

1. **T5 主动式确实生效**。如果只有 T2 兜底，用户回机后第一次动鼠标应该是"没反应"（T2 要等他碰到键盘或触控板才触发）。现在回机即用，说明**待机期间的周期性复位已经把接收器保持在健康状态**。
2. **T2 判据「空闲从长变短」不依赖指针动不动**。一整天 314 次接收器复位，守护既没误触发也没漏触发——零异常、零误报。

（原始日志在教程仓库的 `evidence/field-test-20261022.log`。）

---

## 五、硬件层才是真正的根治

软件只能事后补救。真正能一劳永逸的，是让接收器**在待机期间不断电**：

1. **给接收器接一个带独立供电的 USB Hub**（几十块钱）。Hub 有自己的电源，笔记本端口下电不影响它 → 接收器不掉电 → 鼠标永不失联。**这是最省事、最有效的办法。**
2. **换一个 USB 口**。AMD 平台有多个 USB 控制器（本机就有 3 个根集线器），**不同控制器的 Modern Standby 电源门控行为可能不同**。换口试一次，成本为零。
3. **BIOS 里找 S3 选项**。很多 AMD 笔记本在 BIOS 里提供 "S3 Sleep" 与 "Modern Standby" 的切换。S3 是真正的 ACPI 睡眠（整个系统挂起），而不是"系统还醒着、只关屏"。**切到 S3 后行为可能完全不同。**
4. BIOS 里也可能有 "USB 待机供电" / "USB Selective Suspend" / "Modern Standby" 相关项。

---

## 六、给遇到同样问题的人：最快的排查路径

```powershell
# 1. 确认是软件层问题
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'VID_046D' } |
    Select-Object Status, Problem, Class, InstanceId

# 2. 找到接收器
$recv = Get-PnpDevice -PresentOnly |
    Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                   $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1

# 3. 应急：复位接收器（= 拔插一次，约 4~5 秒，永远有效）
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false; Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

**第 3 步永远能立刻救回来**——下次再遇到，先做这步，别急着重启。

想要自动化，就上第四节的守护脚本（判断"用户回来了"而不是判断"鼠标死了"）。

---

## 七、几个值得记下的坑

### `pnputil` 的输出是本地化的

提权进程里是中文 `发布名称:`，交互式会话里是英文 `Published Name:`。用英文正则解析提权进程的输出 → **全部匹配失败，且静默地"什么都没找到"**。我第一次就是这么把"已清除"写进了日志，复查才发现根本没删。

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value   # 与语言无关
```

### `Set-CimInstance` 没有 `-Filter` / `-ClassName`

PowerShell 7 里只有 `-InputObject` 和 `-Query`。要取出对象、改属性、再传回去：

```powershell
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### 删驱动包可能让设备直接起不来

只摘过滤器、留着驱动包 → 换 USB 口时 INF 把过滤器写回来 → 而内核驱动已停用 → **设备直接「无法启动」**。两者必须一起做。

### 卸载第三方驱动后 WinUSB 可能抢走整个复合设备

摘掉罗技驱动包后，Windows 重新匹配时选中第三方 `LIGHTSPEED_Receiver.inf`（libwdi / WinUSB），它匹配**整个** `VID_046D&PID_C53F`（无 `&MI_` 限定）。**WinUSB 不暴露 HID 接口** → 鼠标 HID 节点整个消失。

判断哪些该卸、哪些该留，读 DriverStore 里 INF 声明的硬件 ID：

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          <- 抢整个复合设备，要卸
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    <- 只管 HID++ 接口，保留
```

### Raw Input 不一定可用

本机实测（交互式计划任务内，`SessionId=2`、`UserInteractive=True`）：

```
GetRawInputDeviceList 返回码: 0   (无设备)
光标: 起=(1640,766)  止=(1416,1040)  移动过=True
WatchBoth 结果: G304=0  其它=0
→ 光标动了但 raw input 无事件，RAW INPUT 不可用
```

任何"按设备区分输入来源"的检测方案在这台机器上都是瞎的。**别把方案建立在它之上**，除非先验证过。

---

## 八、脚本与源码

完整的修复包（PowerShell 脚本 + 守护进程 + 计划任务安装 + 日志）：

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

里面也包含了给罗技的 issue 链接、OpenLogi 的 PR，以及本文提到的所有坑。
