---
locale: "en"
translationKey: "logitech-mouse-freeze"
title: "A Logitech Driver Bug That Disguises Itself as Hardware Failure"
date: 2026-10-21
description: "Device Manager showed everything healthy, the touchpad worked, and the mouse was completely dead. The culprit turned out to be Logitech's own logi_lamparray USB filter driver wedging after Modern Standby and swallowing every HID report."
tags: ["Windows", "Troubleshooting", "Drivers", "HID", "Logitech", "PowerShell"]
draft: false
---

My G304 wireless mouse went dead again after the laptop had been idle for a while. The mouse had power, the receiver was plugged in, the touchpad worked fine — but the mouse itself produced no motion and no clicks.

This time I decided not to paper over it with "unplug the receiver / reboot the machine", but to actually find the cause.

It turned out to be a **defect in Logitech's own driver** — and a remarkably well-camouflaged one: every node in Device Manager reported `Status=OK`, the event log contained no errors whatsoever, and the hardware was perfectly fine.

---

## 1. The most valuable clue was "unplugging fixes it"

If the mouse were broken, replugging the USB receiver would change nothing. The fact that a replug instantly restored it says something specific:

> The fault is not in the hardware but in **already-loaded driver/filter state**. A replug re-enumerates the device tree, which reloads the driver.

Following that, step one was to rule out hardware:

```powershell
Get-PnpDevice -Class Mouse |
  Select-Object Status, Problem, FriendlyName, InstanceId
```

```
Status  Problem         FriendlyName          InstanceId
OK      CM_PROB_NONE    HID-compliant mouse    HID\VID_046D&PID_C53F&MI_01&COL01\8&1293EAEC&0&0000
OK      CM_PROB_NONE    HID-compliant mouse    HID\HTIX5288&COL01\4&148E01A2&0&0000
```

`CM_PROB_NONE` means the device was **never disconnected at the USB level**. The event log had no `Kernel-PnP`, `UserPnp`, `DriverFrameworks` or `USBHUB3` warnings either.

The problem statement collapsed to one line: **the device was present, the driver was present, but the report stream had stopped.**

---

## 2. The real culprit: an invisible USB filter driver

A Logitech LIGHTSPEED receiver is a USB composite device. Looking at its **lower filters**:

```powershell
$recv = Get-PnpDevice -PresentOnly |
  Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                 $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1

Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_LowerFilters'
```

```
DEVPKEY_Device_LowerFilters : vhf, logi_lamparray
```

`vhf` is Microsoft's own Virtual HID Framework and is fine. The problem is `logi_lamparray` — a **USB lower filter driver** (kernel-mode `.sys`) installed by Logitech's `logi_lamparray_usb.inf` driver package, together with the user-mode `logi_lamparray_service`.

Its only job is to **bridge Logitech RGB lighting into Windows 11 Dynamic Lighting**.

And the G304 is a single-colour DPI-indicator mouse with **no RGB at all**. The lighting stack was therefore useless to this mouse, yet it sat squarely in the device's USB I/O path.

### How it swallows the reports

A USB lower filter driver sits between the host controller and the HID stack:

```
mouse firmware →(LIGHTSPEED radio)→ receiver firmware →(USB interrupt)→ USBHUB3 → logi_lamparray → hidusb → mouhid → system
```

`logi_lamparray` is in the middle. **Once it wedges during a power-state transition, everything downstream goes dark** — and it never reports an error, because it did not "fail"; it simply stopped forwarding. The device tree is unchanged, the event log is clean, the service is healthy.

That is exactly how it fooled everyone, including me.

---

## 3. Trigger: Windows' default power policy

```powershell
powercfg /a
```

```
Standby (S0 low power idle) - Connected
Hibernate
Fast Startup
```

This is **Modern Standby (S0)**, not legacy S3. In S0 the system powers devices down one by one when idle and brings them back when the user moves. A filter driver that does not handle the S0 suspend/resume sequence gets stuck in between.

Two more Windows defaults complete the recipe:

| Setting | Default | Effect |
|---|---|---|
| USB selective suspend | Enabled (both AC and DC) | The receiver's port is powered down; filter state machines are most fragile on resume |
| `DeviceSelectiveSuspended` | `1` | Confirms the device really was in a selectively-suspended state |
| Fast startup | Enabled | So "shutdown then power on" is a hibernation resume, and USB devices often come back half-alive |

---

## 4. This is not specific to my machine

Three independent corroborations turned up:

**A different machine, a different mouse, the identical filter stack.** In a Dota 2 issue report, a user saw the game freeze for seconds whenever the receiver was replugged:

```
Logitech USB driver: logi_lamparray_usb.inf / oem218.inf
Driver version: 1.1.91.2790
Receiver lower filters: vhf, logi_lamparray
```

**The same component interfering with other software.** OpenLogi issue #1129 documents `logi_lamparray_service` continuously pushing a Windows accent colour over HID++ and overwriting other tools' writes.

**Microsoft's own support documentation** instructs users to **disable `Logitech_Lamparray_Service`**, noting that G-series keyboard and mouse users widely report abnormal behaviour caused by it.

**Verdict: a defect in Logitech's shipped driver, amplified by Windows' default power policy.** I filed the reproduction and a complete repair script with Logitech's official GitHub.

---

## 5. The fix: strip the filter, remove the driver package

The core step is removing `logi_lamparray` from the receiver's device instance:

```powershell
$key = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)"
Set-ItemProperty -Path $key -Name LowerFilters -Value @('vhf') -Type MultiString
```

You must then **re-enumerate the device** (disable and re-enable the receiver) for it to take effect. After that the mouse **came back immediately** — no replug, no reboot.

### But stopping there leaves a trap

If the Logitech driver package stays installed, moving the receiver to another USB port makes Windows create a new device instance and the INF **writes the filter back**, while the kernel driver is now disabled — the device then fails to start entirely (Code 10 or 39), which is worse than the original problem.

So the packages have to go too:

```powershell
pnputil /delete-driver oem103.inf /uninstall /force   # logi_lamparray_usb.inf
pnputil /delete-driver oem78.inf  /uninstall /force
pnputil /delete-driver oem18.inf  /uninstall /force
pnputil /delete-driver oem6.inf   /uninstall /force   # logi_lamparray_hid.inf
```

The end state is clean: the receiver falls back to Microsoft's generic `usbccgp` driver and `LowerFilters` ends up **completely empty** — not a single third-party filter left.

---

## 6. The pitfalls (the genuinely valuable part)

### `pnputil` output is localised

In an elevated process, `pnputil /enum-drivers` prints `发布名称:`; in an interactive session it prints `Published Name:`. Parsing the elevated output with an English regex **matches nothing and fails silently** — my first run cheerfully logged "all cleared" while nothing had been deleted.

Parse language-agnostically by grabbing the `oem` number directly:

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value
```

### WinUSB claims the whole composite device afterwards

Once `logi_lamparray_usb.inf` is gone, Windows re-matches the driver and picks a third-party `LIGHTSPEED_Receiver.inf` (libwdi / WinUSB) that matches the **entire** `VID_046D&PID_C53F` (no `&MI_` qualifier).

**WinUSB exposes no HID interfaces**, so the mouse HID node vanishes entirely. Those packages have to be removed as well so the receiver falls back to `usbccgp`. To decide which ones to remove, read the hardware IDs declared in the DriverStore INF files:

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          <- claims everything, remove
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    <- HID++ interface only, keep
```

### `Set-CimInstance` has no `-Filter` or `-ClassName`

On PowerShell 7 it only offers `-InputObject` / `-Query`:

```powershell
# fails
Set-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable -Property @{Enable=$false} -Filter "..."
# works
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### PowerShell variable names are case-insensitive

```powershell
$Base = 'E:\LogitechMouseFix'
$base = Measure-G304 -Milliseconds 8000   # <- overwrote $Base with an object
$bat  = "$Base\一键恢复鼠标.bat"           # -> path now reads "@{Count=-1; ...}\..."
```

The symptom is a baffling object string in the log and files written to a nonsense path. Never reuse a path variable name for a value.

### Always filter with `-PresentOnly`

`Get-PnpDevice` lists **historical** instances by default — other receivers, other ports. This machine had two `PID_C53F` instances and only one was `Present=True`. Without that filter you end up editing the registry for a stale instance.

---

## 7. Making it stick

A one-off repair is not enough; the trigger conditions have to go as well:

```powershell
# USB selective suspend off for every power scheme (AC and DC)
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# stop Windows from powering down the Logitech receiver interfaces
# (root\wmi MSPower_DeviceEnable, Enable set to False)

# fast startup off
Set-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power' -Name HiberbootEnabled -Value 0

# idle sleep off
```

Three scheduled tasks then keep it self-healing: one fires **after a resume from low power state** (the failure almost always happens right after wake, so this is the important one), one runs **at logon**, and a watchdog runs **every two minutes**.

The watchdog is deliberately not a "restart the receiver every so often" timer — that would interrupt normal use. It acts only when three conditions hold at once: the G304 was genuinely in use and recently active, it is currently silent while the touchpad is moving, and this has persisted for two consecutive rounds. Otherwise it stays out of the way. Telling the touchpad's activity apart from the G304's uses Raw Input with a device-path filter on `VID_046D&PID_C53F`.

---

## 8. A note on method

The most valuable thing here was not any individual command, but the observation that **"unplugging fixes it"** was itself the diagnosis.

It rules out hardware (a flaky USB port does not cure a dead mouse) and points straight at driver state, because a re-enumeration is all it takes. Almost every generic "mouse is dead" guide says "try another port / reboot / change the battery", because those actions *incidentally* rebuild the device tree — which is precisely why the actual root cause stays hidden forever.

A diagnosis that explains the whole failure cascade is a different thing from a list of things to try.

**The complete scripts, the step-by-step transcript and a rollback-ready backup** live here:

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

If your mouse has ever gone dead after sleep while Device Manager insisted everything was fine, try the repository's `一键恢复鼠标.bat` — it is equivalent to a software-level USB re-enumeration, with no replugging required.
