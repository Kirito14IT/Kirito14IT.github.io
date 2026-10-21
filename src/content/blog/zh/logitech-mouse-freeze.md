---
locale: "zh"
translationKey: "logitech-mouse-freeze"
title: "鼠标待机后失灵：真凶是 USB 端口掉电，不是驱动"
date: 2026-10-21
description: "设备管理器一切正常、触控板正常、鼠标却完全没反应——真因是 Modern Standby 期间 USB 端口被选择性挂起，罗技接收器固件掉电后不再监听已配对的鼠标。本文给出完整定位过程、真正的修复方案，以及一个我自己走错的弯路。"
tags: ["Windows", "故障排查", "USB", "HID", "罗技", "PowerShell", "Modern Standby"]
draft: false
---

我的 G304 无线鼠标又"待机后失灵"了。鼠标有电、接收器插着、触控板完全正常，但鼠标**移动无反应、点击无反应**。

第一次修的时候，我认定是罗技的驱动问题，卸载了驱动包、摘掉了过滤器——**结果这次同样的症状又原样复发**。过滤器早就没了，它根本不是元凶。

这篇文章是修正版：包括我走错的那条弯路。

---

## 一、现象的迷惑性

| 你看到的 | 实际情况 |
|---|---|
| 设备管理器里鼠标是 `OK`，没有黄色感叹号 | 设备**从未**在 USB 层断开，只是**一个 HID 报告都发不出来** |
| 触控板能用，系统其他部分正常 | USB 控制器和系统都是好的 |
| 拔插接收器就好 | 重新枚举 = 给接收器做了一次 USB 复位 = 接收器固件重启 |
| 重启电脑就好 | 同上，而且顺带清掉了休眠状态 |
| 事件日志里没有任何错误 | 驱动没报错，它只是**不再上报** |

关键证据（`Get-PnpDevice`）：

```
Status  Class   FriendlyName          InstanceId
OK      Mouse   HID-compliant mouse  HID\VID_046D&PID_C53F&MI_01&COL01\8&2C2C0656&0&0000
```

`Problem = CM_PROB_NONE`。**系统认为它完全正常**——这正是为什么网上所有「重启 / 换 USB 口」的建议都"有效"却没人找到真正原因。

---

## 二、真凶：USB 端口在待机时被下电，接收器固件掉电

LIGHTSPEED 接收器是**靠 USB 供电**的无线网关。链条是这样的：

```
鼠标（电池供电）──(LIGHTSPEED 无线)──> 接收器（USB 供电）──(USB 中断)──> 集线器 ──> 系统
```

待机时，Windows 会让 **USB 集线器进入选择性挂起（Selective Suspend）**，从而**切断端口供电**。接收器固件因此掉电。

而唤醒后，**接收器固件不会自动重新监听已配对的鼠标**——它需要一次 USB 复位（物理拔插）才会重启无线栈、重新配对。

于是：

- 鼠标有电，一直在发信号（它是电池供电的）
- 接收器"聋了"，收不到也转发不了
- Windows 侧一切正常，鼠标 HID 节点 `OK`
- **鼠标就是不发任何报告**

我在日志里抓到了这个证据：待机前后接收器的枚举号从 `&3&` 变成了 `&4&`——**Windows 确实在待机时对接收器做了端口复位/重新枚举**，而那次复位之后鼠标依然是死的。

### 怎么确认"是掉电"而不是"驱动坏了"

最硬的证据是这条：**把接收器所在的 USB 集线器设为不允许被关闭，症状就不再出现**。

```powershell
# 接收器所在的根集线器
$hub = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj      # 注意：没有 -Filter / -ClassName
```

> 这里有个 PowerShell 7 的坑：`Set-CimInstance` **只有 `-InputObject` 和 `-Query`**，没有 `-Filter`，也没有 `-ClassName`（`New-CimInstance` 才有 `-ClassName`）。我为此卡了两轮。

---

## 三、完整修复

### 3.1 防止端口被下电（根治）

四层一起上，缺一层都可能复发：

```powershell
# (1) 全局：关闭所有电源方案的 USB 选择性暂停（AC + DC）
$SUB = '2a737441-1930-4402-8d77-b2bebba308a3'   # USB 设置
$SET = '48e6b7a6-50f5-4782-a5d4-53bb8f07e226'   # USB 选择性暂停
foreach ($s in (powercfg /list | Select-String -Pattern '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}').Matches.Value) {
    powercfg /setacvalueindex $s $SUB $SET 0
    powercfg /setdcvalueindex $s $SUB $SET 0
}
powercfg /setactive SCHEME_CURRENT

# (2) 接收器所在的 USB 集线器：不允许被关闭
#     ← 这一步是第一版修复里漏掉的，也是当时"修好了又复发"的真正原因
$hub  = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj  = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
        Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj

# (3) 接收器自身及所有接口：禁止被关闭
#     （每个节点的 root\wmi 实例名 = 设备实例 ID + "_0"）
Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
    Where-Object { $_.InstanceName -match 'VID_046D' } | ForEach-Object {
        $_.Enable = $false; Set-CimInstance -InputObject $_
    }

# (4) 每个设备节点：关掉设备自身的选择性挂起与增强电源管理
$dp = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)\Device Parameters"
Set-ItemProperty $dp -Name SelectiveSuspendEnabled      -Value 0 -Type DWord
Set-ItemProperty $dp -Name EnhancedPowerManagementEnabled -Value 0 -Type DWord
```

### 3.2 常驻守护：万一还是被复位了，自动修回来

端口没电这类问题靠设置去"根除"并不总是可靠（笔记本厂商的 BIOS/EC、驱动栈更新都可能改回去）。所以再加一个常驻守护，**在用户还没回到电脑时就把接收器复位好**。

关键洞察：**Windows 每次重新枚举设备，都会刷新接收器的 `DEVPKEY_Device_LastArrivalDate`，而设备实例 ID 不变**。这就是最可靠的"接收器刚刚被复位过"的信号：

```powershell
$before = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
           -KeyName 'DEVPKEY_Device_LastArrivalDate').Data
# ... 重新枚举 ...
$after  = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
           -KeyName 'DEVPKEY_Device_LastArrivalDate').Data
"$before -> $after   变了 = $($before -ne $after)"
```

守护的三个触发器：

| 触发器 | 含义 | 何时发生 |
|---|---|---|
| **T1** | `LastArrivalDate` 变了 | Windows 重新枚举了接收器（**通常发生在用户回来之前**） |
| **T1b** | 设备实例 ID 变了 | 接收器被换到别的 USB 口 |
| **T2** | 用户从长空闲回来，但**指针没跟着动** | 鼠标死了（鼠标活着的话，用户一动鼠标指针就动） |

**T2 的设计是重点**：鼠标正常时，用户一动鼠标指针就动，这个触发器根本不会响，所以**不会给正常使用添乱**。

T2 依赖"指针动没动"，需要区分"鼠标死了"和"用户改用触控板"——这本来要用 Raw Input 按设备区分。**但我实测发现这台机器上 Raw Input 不可用**：

```
GetRawInputDeviceList 返回码: 0   (无设备)
光标: 起=(1640,766)  止=(1416,1040)  移动过=True
WatchBoth 结果: G304=0  其它=0
判定: 光标动了但 raw input 无事件 -> RAW INPUT 不可用
```

（探针跑在交互式计划任务里，`SessionId=2`、`UserInteractive=True`，不是权限问题。）

所以我**删掉了基于 raw input 的按设备判定**，改用上面三个不依赖它的触发器。

### 3.3 修复动作

复位接收器 = 软件层面的 USB 复位 = 物理拔插一次：

```powershell
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false
Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

实测耗时 **4~5 秒**。这一下是用户能感觉到的中断，所以触发时机很重要——**T1 发生在用户回来之前，这一次中断他完全无感**。

---

## 四、我走错的那条弯路（也是最有价值的部分）

第一次故障时，我看到接收器上挂着罗技的 `logi_lamparray` USB 下层过滤驱动：

```
HKLM\...\Enum\USB\VID_046D&PID_C53F\<inst>\LowerFilters = { vhf, logi_lamparray }
```

这是个罗技官方驱动（`logi_lamparray_usb.inf`，WHCP 签名），它的作用是把罗技设备的 RGB 灯光接入 Windows 11 的 Dynamic Lighting。我当时的推理链是：

> G304 是单色 DPI 指示灯机型，根本用不到 RGB，这套驱动是误装的；它挂在接收器的 USB I/O 路径上，卡死就会吞掉 HID 报告。

推理本身是自洽的，而且有旁证：

- **微软官方支持文档**在教用户**禁用 `Logitech_Lamparray_Service`**，并说明 G 系列键鼠用户大量反馈该服务导致「异常行为」
- **AprilNEA/OpenLogi#1129** 报告同一个服务持续覆盖 HID++ 写入
- **ValveSoftware/Dota2-Gameplay#35162** 里，另一台机器、另一款鼠标（G Pro Wireless）、**同一套过滤器栈**，拔插接收器时游戏主线程冻结数秒

于是我卸掉了驱动包、摘掉了过滤器、停用了服务。**鼠标当时确实恢复了。**

但这次复发时，我第一件事就是查过滤器：

```
LowerFilters = []          ← 过滤器根本不在了
logi_lamparray 驱动包      ← 不存在
logi_lamparray 内核驱动    ← 已停用
```

**症状照样发生。**

也就是说：**上次"修好"并不是因为摘掉了过滤器，而是因为那次操作顺带重新枚举了接收器**——和拔插 USB 是同一件事。过滤器从来不是这个症状的原因。

这是一个很典型的教训：

> **当一个修复"生效"时，先确认它到底修掉了什么。**
> 我当时验证了"摘过滤器之后鼠标好了"，却没有验证"不摘过滤器、只重新枚举，鼠标是不是也一样好"。
> 后者才是区分**真因**和**巧合**的对照实验。

（过滤器本身仍是一个值得上报的真实缺陷——把 RGB 驱动绑到没有 RGB 的机型上，而且它确实和 Dynamic Lighting 冲突。只是它不是"鼠标待机后失灵"的原因。给罗技的 issue 我会同步更正。）

---

## 五、还有几个坑值得记下来

### `pnputil` 的输出是本地化的

提权进程里 `pnputil /enum-drivers` 输出的是中文标签 `发布名称:`，交互式会话里是英文 `Published Name:`。用英文正则去解析提权进程的输出会**全部匹配失败，而且静默地"什么都没找到"**——我第一次就是这么把"已清除"写进了日志，复查才发现根本没删掉。

用与语言无关的模式：

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value
```

### `Set-CimInstance` 没有 `-Filter` / `-ClassName`

PowerShell 7 里只有 `-InputObject` 和 `-Query`。正确写法是取出对象、改属性、再传回去：

```powershell
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### 删驱动包可能让设备直接起不来

如果只是把过滤器从 `LowerFilters` 摘掉、却留着驱动包，那么换一个 USB 口时 Windows 会新建实例、由 INF **把过滤器写回来**，而内核驱动已被停用 → 设备直接「无法启动」（Code 10/39），比原问题更糟。**两者必须一起做。**

### 卸载第三方驱动后 WinUSB 可能抢走整个复合设备

摘掉罗技驱动包后，Windows 重新匹配驱动时选中了第三方 `LIGHTSPEED_Receiver.inf`（libwdi / WinUSB），它匹配的是**整个** `VID_046D&PID_C53F`（没有 `&MI_` 限定）。**WinUSB 不暴露 HID 接口**，于是鼠标 HID 节点整个消失。

判断哪些该卸、哪些该留，直接读 DriverStore 里 INF 声明的硬件 ID：

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          <- 抢整个复合设备，要卸
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    <- 只管 HID++ 接口，保留
```

---

## 六、给遇到同样问题的人：最快的排查路径

```powershell
# 1. 确认是软件层问题（设备在位、状态正常）
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'VID_046D' } |
    Select-Object Status, Problem, Class, InstanceId

# 2. 找到接收器，以及它挂在哪个集线器上
$recv = Get-PnpDevice -PresentOnly |
    Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                   $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1
$hub  = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
         -KeyName 'DEVPKEY_Device_Parent').Data

# 3. 让集线器不许被关闭（关键一步）
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false; Set-CimInstance -InputObject $obj

# 4. 顺手关掉全局 USB 选择性暂停
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# 5. 应急：复位接收器（= 拔插一次，约 4~5 秒）
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false; Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

**第 5 步永远能立刻救回来**——所以下次再遇到，先做这步，别急着重启。

---

## 七、脚本与源码

完整的修复包（PowerShell 脚本 + 守护进程 + 计划任务安装 + 日志）：

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

里面也包含了给罗技的 issue 链接、OpenLogi 的 PR，以及本文提到的所有坑。
