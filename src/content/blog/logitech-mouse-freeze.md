---
locale: "en"
translationKey: "logitech-mouse-freeze"
title: "Mouse Dead After Sleep: The Real Cause Is USB Port Power-Gating"
date: 2026-10-21
description: "Device Manager said everything was healthy, the touchpad worked, and the mouse was completely dead. The actual cause was USB selective suspend cutting power to the LIGHTSPEED receiver during Modern Standby — not a driver bug. Full diagnosis, the real fix, and the false lead I chased first."
tags: ["Windows", "Troubleshooting", "USB", "HID", "Logitech", "PowerShell", "Modern Standby"]
draft: false
---

My G304 wireless mouse went dead again after the laptop had been idle. The mouse had power, the receiver was plugged in, the touchpad worked fine — but the mouse produced no motion and no clicks.

The first time round, I blamed a Logitech driver, uninstalled the package and stripped the filter. **The same symptom came straight back.** The filter was long gone by then; it was never the culprit.

This is the corrected version, including the dead end I walked down first.

---

## 1. Why the symptom is so confusing

| What you see | What is actually happening |
|---|---|
| Device Manager shows the mouse as `OK`, no warning icon | The device was **never disconnected** at the USB level — it just **stops sending any HID report** |
| The touchpad works, the rest of the system is fine | The USB controller and the OS are healthy |
| Replugging the receiver fixes it | A re-enumeration is a USB reset of the receiver — the firmware restarts |
| Rebooting fixes it | Same, plus it clears the suspend state |
| Nothing in the event log | No driver errored; it simply stopped reporting |

The decisive evidence:

```
Status  Class   FriendlyName          InstanceId
OK      Mouse   HID-compliant mouse  HID\VID_046D&PID_C53F&MI_01&COL01\8&2C2C0656&0&0000
```

`Problem = CM_PROB_NONE`. **The system believes the mouse is perfectly fine** — which is exactly why "reboot / try another port" always works and nobody ever finds the real cause.

---

## 2. The actual cause: the USB port loses power during standby

The LIGHTSPEED receiver is a wireless gateway **powered by USB**:

```
mouse (battery) ──(LIGHTSPEED radio)──> receiver (USB powered) ──(USB interrupt)──> hub ──> OS
```

While the machine is idle, Windows lets the **USB hub enter selective suspend**, which **cuts power to its ports**. The receiver's firmware loses power with it.

After the resume, **the receiver's firmware does not go back to listening for its paired mouse** — it needs a USB reset (a physical replug) to restart its radio stack and re-pair.

So:

- The mouse has its own battery and keeps transmitting
- The receiver has gone deaf and cannot forward anything
- Windows sees a perfectly healthy device
- **The mouse reports nothing at all**

I caught the evidence in the logs: the receiver's enumeration number changed from `&3&` to `&4&` across the standby — **Windows did perform a port reset / re-enumeration on the receiver**, and the mouse was still dead afterwards.

### How to confirm "it lost power" rather than "the driver broke"

The hardest evidence is this: **stop the USB hub the receiver is plugged into from being powered down, and the symptom goes away.**

```powershell
# The root hub the receiver is plugged into
$hub = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj      # note: no -Filter, no -ClassName
```

> A PowerShell 7 trap that cost me two rounds: `Set-CimInstance` only has `-InputObject` and `-Query`. There is no `-Filter`, and `-ClassName` belongs to `New-CimInstance`.

---

## 3. The complete fix

### 3.1 Stop the port from losing power (root fix)

All four layers together — miss one and it can come back:

```powershell
# (1) Globally: USB selective suspend off for every power scheme (AC + DC)
$SUB = '2a737441-1930-4402-8d77-b2bebba308a3'   # USB settings
$SET = '48e6b7a6-50f5-4782-a5d4-53bb8f07e226'   # USB selective suspend
foreach ($s in (powercfg /list | Select-String -Pattern '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}').Matches.Value) {
    powercfg /setacvalueindex $s $SUB $SET 0
    powercfg /setdcvalueindex $s $SUB $SET 0
}
powercfg /setactive SCHEME_CURRENT

# (2) The hub the receiver is on: never let it be powered down
#     ← this is the layer the first fix missed, and the reason it came back
$hub = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj

# (3) The receiver and each of its interfaces: never power them down
#     (each node's root\wmi instance name is the device instance id + "_0")
Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
    Where-Object { $_.InstanceName -match 'VID_046D' } | ForEach-Object {
        $_.Enable = $false; Set-CimInstance -InputObject $_
    }

# (4) Per device node: clear the device's own suspend flags
$dp = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)\Device Parameters"
Set-ItemProperty $dp -Name SelectiveSuspendEnabled        -Value 0 -Type DWord
Set-ItemProperty $dp -Name EnhancedPowerManagementEnabled -Value 0 -Type DWord
```

### 3.2 A resident guard, in case it still gets reset

Settings alone are not always enough to eliminate a power-gating problem — the laptop's EC/BIOS or a driver-stack update can put it back. So a resident watcher resets the receiver **before the user is even back at the machine**.

The key insight: **Windows refreshes the receiver's `DEVPKEY_Device_LastArrivalDate` on every re-enumeration, while the device instance id stays the same.** That is the most reliable "the receiver was just reset" signal available:

```powershell
$before = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
           -KeyName 'DEVPKEY_Device_LastArrivalDate').Data
# ... re-enumerate ...
$after  = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
           -KeyName 'DEVPKEY_Device_LastArrivalDate').Data
"$before -> $after   changed = $($before -ne $after)"
```

Three triggers:

| Trigger | Meaning | When it fires |
|---|---|---|
| **T1** | `LastArrivalDate` changed | Windows re-enumerated the receiver — **normally before the user comes back** |
| **T1b** | The device instance id changed | The receiver moved to a different USB port |
| **T2** | The user came back from a long idle, but **the pointer did not move** | The mouse is dead (a live mouse moves the pointer the moment you move it) |

**T2 is the important one**: while the mouse is healthy, moving it moves the pointer, so this trigger never fires — it adds nothing to normal use.

T2 needs to tell "the mouse is dead" from "the user switched to the touchpad", which normally calls for Raw Input with per-device filtering. **On this machine Raw Input does not work at all:**

```
GetRawInputDeviceList return code: 0   (no devices)
cursor: from=(1640,766)  to=(1416,1040)  moved=True
WatchBoth result: G304=0  other=0
verdict: the cursor moved but raw input delivered no events -> RAW INPUT UNAVAILABLE
```

(The probe ran inside an interactive scheduled task — `SessionId=2`, `UserInteractive=True` — so this is not a permissions artefact.)

So I **dropped the raw-input based per-device detection** and used the three triggers above, none of which need it.

### 3.3 The repair action

Resetting the receiver is a software-level USB reset, i.e. one physical replug:

```powershell
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false
Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

Measured at **4–5 seconds**. That is an interruption the user can feel, so timing matters — **T1 fires before the user returns, so the interruption is entirely invisible**.

---

## 4. The false lead — and the most valuable part of this write-up

On the first failure I found Logitech's `logi_lamparray` USB lower filter on the receiver:

```
HKLM\...\Enum\USB\VID_046D&PID_C53F\<inst>\LowerFilters = { vhf, logi_lamparray }
```

An official Logitech driver (`logi_lamparray_usb.inf`, WHCP-signed) whose job is to bridge Logitech RGB lighting into Windows 11 Dynamic Lighting. My reasoning was:

> The G304 is a single-colour DPI-indicator mouse with no RGB at all, so this driver is installed by mistake; it sits in the receiver's USB I/O path, so if it wedges it swallows the HID reports.

The reasoning was sound, and there was corroboration:

- **Microsoft's own support documentation** instructs users to **disable `Logitech_Lamparray_Service`**, noting that G-series keyboard and mouse users widely report abnormal behaviour from it
- **AprilNEA/OpenLogi#1129** documents the same service overwriting HID++ writes
- **ValveSoftware/Dota2-Gameplay#35162** shows a different machine, a different mouse (G Pro Wireless) and the **identical filter stack**, with multi-second main-thread freezes on replug

So I removed the driver package, stripped the filter and disabled the service. **The mouse did come back.**

But when the symptom recurred, the first thing I checked was the filter:

```
LowerFilters = []            <- the filter is not there any more
logi_lamparray driver package <- does not exist
logi_lamparray kernel driver <- disabled
```

**The symptom happened anyway.**

Which means: **the "fix" last time did not work because the filter was removed. It worked because the procedure happened to re-enumerate the receiver** — the same thing a replug does. The filter was never the cause.

A textbook lesson:

> **When a fix "works", first establish what it actually fixed.**
> I verified "the mouse came back after stripping the filter", but never the control case: "does re-enumerating alone — without touching the filter — fix it just as well?" That control is what separates a **cause** from a **coincidence**.

(The filter is still a genuine defect worth reporting upstream — binding an RGB driver to hardware with no RGB, and conflicting with Dynamic Lighting. It is simply not the cause of "the mouse dies after sleep". I have corrected the issue I filed with Logitech accordingly.)

---

## 5. Other traps worth recording

### `pnputil` output is localised

In an elevated process, `pnputil /enum-drivers` prints `发布名称:`; in an interactive session it prints `Published Name:`. Parsing the elevated output with an English regex **matches nothing and fails silently** — my first run cheerfully logged "all cleared" while nothing had been deleted.

Parse it language-agnostically:

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value
```

### `Set-CimInstance` has no `-Filter` / `-ClassName`

PowerShell 7 offers only `-InputObject` and `-Query`. Fetch the object, change the property, pass it back:

```powershell
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### Removing a driver package can stop the device from starting at all

If you only strip the filter but leave the package, moving the receiver to another port makes Windows create a new instance and the INF **writes the filter back** — and with the kernel driver now disabled the device fails to start entirely (Code 10 or 39), which is worse than the original problem. **Both have to go together.**

### A WinUSB package can claim the whole composite device

After the Logitech package was removed, Windows re-matched the driver and picked a third-party `LIGHTSPEED_Receiver.inf` (libwdi / WinUSB), which matches the **entire** `VID_046D&PID_C53F` with no `&MI_` qualifier. **WinUSB exposes no HID interfaces**, so the mouse's HID node vanished entirely.

Deciding what to remove and what to keep comes straight from the hardware ids the INF declares:

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          <- claims everything, remove
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    <- HID++ interface only, keep
```

---

## 6. The shortest path for anyone hitting this

```powershell
# 1. Confirm it is software, not hardware
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'VID_046D' } |
    Select-Object Status, Problem, Class, InstanceId

# 2. Find the receiver and the hub it sits on
$recv = Get-PnpDevice -PresentOnly |
    Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                   $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1
$hub  = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId `
         -KeyName 'DEVPKEY_Device_Parent').Data

# 3. Stop the hub from being powered down (the key step)
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false; Set-CimInstance -InputObject $obj

# 4. And turn global USB selective suspend off
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# 5. Emergency: reset the receiver (= one replug, ~4-5 s)
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false; Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

**Step 5 always brings it back immediately** — so when this happens, do that first instead of reaching for a reboot.

---

## 7. Scripts and source

The complete repair package (PowerShell scripts, the resident guard, task installation, logs):

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

It also links the issue filed with Logitech, the OpenLogi pull request, and every trap mentioned above.
