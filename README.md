# TryHackMe CTF Writeups

A collection of my TryHackMe room walkthroughs and writeups. Each walkthrough covers the full attack chain from recon to privilege escalation.

## Rooms

| # | Room | Difficulty | Flags | Key Techniques |
|---|------|-----------|-------|----------------|
| 1 | [Develpy](Develpy.md) | Easy | 2 | Python 2 `input()` injection, cron job hijack |
| 2 | [Wgel CTF](Wgel_CTF.md) | Easy | 2 | Exposed SSH key, `sudo wget` privilege escalation |
| 3 | [Library](Library.md) | Easy | 2 | SSH brute-force (rockyou.txt), Python import hijacking |
| 4 | [Watcher](Watcher.md) | Medium | 7 | LFI, FTP upload, sudo misconfig, cron poisoning, module hijacking, SSH key extraction |
| 5 | [Couch](Couch.md) | Easy | 2 | Unauthenticated CouchDB, Docker escape via host FS mount |
| 6 | [CMesS](CMesS.md) | Medium | 2 | Gila CMS RCE, `tar` wildcard exploit |
| 7 | [Chocolate Factory](Chocolate_Factory.md) | Easy | 2 | Steganography, command injection, `sudo vi` escape, Fernet decryption |

## About

Each writeup includes a detailed walkthrough with:
- Reconnaissance and enumeration steps
- Exploitation techniques
- Privilege escalation methods
- Vulnerability chain summary
- Key security takeaways

---

*Writeups by [komal-pr](https://github.com/komal-pr)*
