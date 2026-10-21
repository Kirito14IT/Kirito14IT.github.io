---
locale: "en"
translationKey: "logitech-mouse-freeze"
title: "Mouse Dead After Sleep: A Power Drop Windows Cannot See or Prevent"
date: 2026-10-21
description: "Device Manager said everything was healthy, the touchpad worked, and the mouse was completely dead. The receiver loses power during standby and its firmware stops listening for the mouse — and that happens below the Windows power-management layer, which can neither observe it nor stop it. Full forensics, the trigger design that actually works, hardware-level fixes, and the false lead I chased first."
tags: ["Windows", "Troubleshooting", "USB", "HID", "Logitech", "PowerShell", "Modern Standby"]
draft: false
---

My G304 wireless mouse went dead again after the laptop had been idle. The mouse had power, the receiver was plugged in, the touchpad worked fine — but the mouse produced no motion and no clicks.

I have now fixed this twice, and both times I was sure I had found the root cause. **The first was wrong, and the second was only half right.** This is the final version, including both of the false leads.

---

## 1. Why the symptom is so confusing

| What you see | What is actually happening |
|---|---|
| Device Manager shows the mouse as `OK`, no warning icon | The device was **never disconnected** at the USB level — it just **stops sending any HID report** |
| The touchpad works, the rest of the system is fine | The USB controller and the OS are healthy |
| Replugging the receiver fixes it | A re-enumeration is a USB reset of the receiver — the firmware restarts |
| Rebooting fixes it | Same, plus it clears the suspend state |
| Nothing in the event log | No driver errored; it simply stopped reporting |

```
Status  Class   FriendlyName          InstanceId
OK      Mouse   HID-compliant mouse  HID\VID_046D&PID_C53F&MI_01&COL01\8&2C2C0656&0&0000
```

`Problem = CM_PROB_NONE`. **The system believes the mouse is perfectly fine** — which is exactly why "reboot / try another port" always works and nobody ever finds the real cause.

---

## 2. The first false lead: the `logi_lamparray` filter

The receiver carried Logitech's USB lower filter driver:

```
HKLM\...\Enum\USB\VID_046D&PID_C53F\<inst>\LowerFilters = { vhf, logi_lamparray }
```

An official Logitech driver (`logi_lamparray_usb.inf`, WHCP-signed) whose job is to bridge Logitech RGB lighting into Windows 11 Dynamic Lighting. My reasoning:

> The G304 is a single-colour DPI-indicator mouse with no RGB at all, so this driver is installed by mistake; it sits in the receiver's USB I/O path, so if it wedges it swallows the HID reports.

There was corroboration: Microsoft's own documentation instructs users to **disable `Logitech_Lamparray_Service`**; OpenLogi#1129 documents the same service overwriting HID++ writes; Valve's Dota 2 #35162 shows a different machine with a different mouse (G Pro Wireless) and the **identical filter stack** producing main-thread freezes.

So I removed the driver package, stripped the filter and disabled the service. **The mouse did come back.**

But when the symptom recurred, the first thing I checked was the filter:

```
LowerFilters = []            <- the filter is not there any more
logi_lamparray driver package <- does not exist
logi_lamparray kernel driver  <- disabled
```

**The symptom happened anyway.** Which means: **the earlier "fix" did not work because the filter was removed. It worked because the procedure happened to re-enumerate the receiver** — the same thing as replugging it.

> **When a fix "works", first establish what it actually fixed.**
> Verifying "the mouse came back after stripping the filter" is not enough; you also need the control case: "does re-enumerating alone — without touching the filter — fix it just as well?" That control is what separates a **cause** from a **coincidence**. Running it first would have saved a whole detour: "uninstall the package → a WinUSB package claims the composite device → the mouse's HID node disappears entirely → another round to pull it back".

(The filter is still a genuine defect worth reporting upstream, and the issue filed with Logitech has been corrected accordingly: <https://github.com/Logitech/cpg-docs/issues/25>)

---

## 3. The second attempt: right direction, only half right

The second time I turned to power, with this chain:

> The receiver is USB-powered. During standby the USB hub enters selective suspend and cuts port power → the receiver's firmware loses power → after the resume it no longer listens for its paired mouse.

So I applied four layers:

```powershell
# (1) Globally: USB selective suspend off for every power scheme
powercfg /setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setdcvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
powercfg /setactive SCHEME_CURRENT

# (2) The hub the receiver is on: never let it be powered down
$hub = (Get-PnpDeviceProperty -InstanceId $recv.InstanceId -KeyName 'DEVPKEY_Device_Parent').Data
$obj = Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
       Where-Object { $_.InstanceName -eq "$hub`_0" }
$obj.Enable = $false
Set-CimInstance -InputObject $obj

# (3) The receiver and each of its interfaces: never power them down
Get-CimInstance -Namespace root\wmi -ClassName MSPower_DeviceEnable |
    Where-Object { $_.InstanceName -match 'VID_046D' } | ForEach-Object {
        $_.Enable = $false; Set-CimInstance -InputObject $_
    }

# (4) Per device node: clear the device's own suspend and link power management flags
$dp = "HKLM:\SYSTEM\CurrentControlSet\Enum\$($recv.InstanceId)\Device Parameters"
Set-ItemProperty $dp -Name SelectiveSuspendEnabled        -Value 0 -Type DWord
Set-ItemProperty $dp -Name EnhancedPowerManagementEnabled -Value 0 -Type DWord
```

**The next standby, the symptom came straight back.** And that produced the most valuable evidence of the whole investigation — querying the device's state properties **while the mouse was still dead**:

```
DEVPKEY_Device_ConfigFlags             = 0        <- no SUSPENDED flag
DEVPKEY_Device_ProblemCode             = 0
DEVPKEY_Device_LastArrivalDate         = 23:48:18 <- no new arrival during standby
DEVPKEY_Device_DeviceSelectiveSuspended = (property does not exist)
Device Parameters\SelectiveSuspendEnabled        = 0   <- mine, and it is set
Device Parameters\EnhancedPowerManagementEnabled = 0   <- mine, and it is set
```

Together those say three things:

1. **Windows never re-enumerated the receiver during standby** (the device instance id is unchanged and `LastArrivalDate` is still 23:48). The previous guard detected this via `LastArrivalDate` → **that signal never comes.**
2. **Windows has no idea the receiver lost power.** No suspend flag, no error code, no problem status, and `DeviceSelectiveSuspended` does not even exist as a property.
3. **Everything in (2)(3)(4) above took effect** (the values are `0` / `False`) **and none of it mattered.**

Which means:

> **This power drop happens below the layer Windows power management controls.** In Modern Standby, **port** power gating (port power gating / D3cold) is decided by the **EC/BIOS**, and Windows' `MSPower_DeviceEnable`, the selective-suspend switch, and the per-device parameters do not reach it.

So the "root fix" I claimed last time was **wrong** — it only suppressed the symptom.

---

## 4. What actually works: stop asking "is the mouse dead?" and ask "is the user back?"

Since the drop cannot be observed and cannot be prevented, the only remaining road is: **when the user comes back, reset the receiver once.**

Resetting the receiver is a software-level USB reset — one physical replug — and it **always restores the mouse in 4–5 seconds**.

### 4.1 The signal: system idle time

`GetLastInputInfo`'s idle timer keeps running through standby and drops to zero the moment the user returns. **It is the only reliable, essentially free "the user is back" signal.**

### 4.2 Three triggers

| Trigger | Condition | Notes |
|---|---|---|
| **T1** | The receiver's `LastArrivalDate` changes | Fires when the receiver moves to another port or a driver updates (it did not fire during standby, but it does on a port change) |
| **T1b** | The device instance id changes | The receiver was moved to another USB port |
| **T2** | **System idle drops from >4 minutes to <1 second** | **The main one.** The user is back → reset the receiver now |
| **T5** | Every 20 minutes while idle > 10 minutes | Safety net so it always comes back eventually |

**T2 does not care whether the pointer moved** — that was the biggest lesson of the previous version. It required "the pointer stayed still for 4 seconds after the user returned", so a user who **reached for the touchpad** silently defeated the detector, and it never fired once.

### 4.3 The cost, and what it feels like

Coming back from a long idle, the mouse has a **4–5 second window** where it does not respond. But that is exactly the moment the mouse would have been dead anyway, so what you perceive is:

> "it was already dead → 4 seconds later it suddenly works"

rather than "it stays dead until I unplug the receiver".

And T2 fires at the moment the user **touches the touchpad or the keyboard** — i.e. exactly when they have just noticed the mouse is dead and are reaching for something else. The recovery latency is effectively imperceptible.

---

## 5. The real fix is at the hardware layer

Software can only clean up afterwards. What actually fixes it for good is keeping the receiver **powered through standby**:

1. **Put the receiver on a self-powered USB hub** (a few dollars). The hub has its own supply, so the laptop's port power-down does not affect it — the receiver never loses power and the mouse never goes deaf. **Cheapest and most effective option.**
2. **Try another USB port.** AMD platforms have several USB controllers (this machine has three root hubs) and **their Modern Standby port gating behaviour may differ**. Moving the receiver costs nothing.
3. **Look for an S3 option in the BIOS.** Many AMD laptops let you switch between "S3 Sleep" and "Modern Standby". S3 is real ACPI sleep (the whole system suspends) rather than "the system stays awake, only the screen turns off". **Switching to S3 may change the behaviour completely.**
4. Also look for "USB standby power" / "USB Selective Suspend" / "Modern Standby" entries in the same BIOS area.

---

## 6. The shortest path for anyone hitting this

```powershell
# 1. Confirm it is software, not hardware
Get-PnpDevice -PresentOnly | Where-Object { $_.InstanceId -match 'VID_046D' } |
    Select-Object Status, Problem, Class, InstanceId

# 2. Find the receiver
$recv = Get-PnpDevice -PresentOnly |
    Where-Object { $_.InstanceId -like 'USB\VID_046D&PID_C53F\*' -and
                   $_.InstanceId -notmatch '&MI_|LAMPARRAY' } | Select-Object -First 1

# 3. Emergency: reset the receiver (= one replug, ~4-5 s, always works)
Disable-PnpDevice -InstanceId $recv.InstanceId -Confirm:$false; Start-Sleep -Milliseconds 700
Enable-PnpDevice  -InstanceId $recv.InstanceId -Confirm:$false
```

**Step 3 always brings it back immediately** — so when this happens, do that first instead of reaching for a reboot.

To automate it, use the guard script from the next section (which asks "is the user back?" rather than "is the mouse dead?").

---

## 7. Traps worth recording

### `pnputil` output is localised

In an elevated process it prints `发布名称:`; in an interactive session `Published Name:`. Parsing the elevated output with an English regex **matches nothing and fails silently** — my first run cheerfully logged "all cleared" while nothing had been deleted.

```powershell
$pub = ([regex]::Match($b, '(?i)oem\d+\.inf')).Value   # language-agnostic
```

### `Set-CimInstance` has no `-Filter` / `-ClassName`

PowerShell 7 offers only `-InputObject` and `-Query`. Fetch the object, change the property, pass it back:

```powershell
$obj.Enable = $false
Set-CimInstance -InputObject $obj
```

### Removing a driver package can stop the device from starting at all

Strip the filter but leave the package and moving the receiver to another port makes the INF write the filter back, while the kernel driver is now disabled — the **device then fails to start entirely**. Both have to go together.

### A WinUSB package can claim the whole composite device

After the Logitech package was removed, Windows re-matched the driver and picked a third-party `LIGHTSPEED_Receiver.inf` (libwdi / WinUSB), which matches the **entire** `VID_046D&PID_C53F` with no `&MI_` qualifier. **WinUSB exposes no HID interfaces**, so the mouse's HID node vanished entirely.

Deciding what to remove and what to keep comes straight from the hardware ids the INF declares:

```
LIGHTSPEED_Receiver.inf        -> VID_046D&PID_C53F          <- claims everything, remove
usb_receiver_(interface_0).inf -> VID_046D&PID_C53F&MI_00    <- HID++ interface only, keep
```

### Raw Input is not always usable

Measured on this machine, inside an interactive scheduled task (`SessionId=2`, `UserInteractive=True`):

```
GetRawInputDeviceList return code: 0   (no devices)
cursor: from=(1640,766)  to=(1416,1040)  moved=True
WatchBoth result: G304=0  other=0
-> the cursor moved but raw input delivered no events; RAW INPUT UNAVAILABLE
```

Any detection scheme built on "tell the devices apart by input source" is blind here. **Do not build on it unless you have verified it first.**

---

## 8. Scripts and source

The complete repair package (PowerShell scripts, the resident guard, task installation, logs):

> https://github.com/Kirito14IT/logitech-mouse-not-working-after-sleep

It also links the issue filed with Logitech, the OpenLogi pull request, and every trap mentioned above.
