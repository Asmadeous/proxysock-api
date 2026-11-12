#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# setup-vm.sh — One-time setup for a fresh Ubuntu 24.04 VM
# Run this on the Proxmox VM after first boot.
# Usage: sudo bash script/setup-vm.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/proxysock-api"
APP_USER="odin"

log() { echo "[setup $(date '+%H:%M:%S')] $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run this script as root (sudo)"
  exit 1
fi

# ─── System Updates ──────────────────────────────────────────
log "Updating system..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  docker.io docker-compose-v2 \
  curl git ufw qemu-guest-agent nginx fail2ban tmux

# ─── Enable services ────────────────────────────────────────
systemctl enable --now docker
systemctl enable --now qemu-guest-agent
systemctl enable --now nginx

# ─── Configure existing user ─────────────────────────────────
log "Configuring user '$APP_USER' for deployment..."
if id "$APP_USER" &>/dev/null; then
  # Add user to docker group
  usermod -aG docker "$APP_USER"
  
  # Ensure SSH directory exists with proper permissions
  mkdir -p /home/$APP_USER/.ssh
  chmod 700 /home/$APP_USER/.ssh
  touch /home/$APP_USER/.ssh/authorized_keys
  chmod 600 /home/$APP_USER/.ssh/authorized_keys
  chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh
  
  log "User '$APP_USER' configured for Docker and SSH"
else
  log "ERROR: User '$APP_USER' does not exist!"
  exit 1
fi

# ─── SSH Hardening & Keepalive ───────────────────────────────
log "Configuring SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

cat >> /etc/ssh/sshd_config <<'SSHEOF'

# SSH Hardening & Keepalive
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
ClientAliveInterval 30
ClientAliveCountMax 10
TCPKeepAlive yes
MaxAuthTries 6
MaxSessions 10
LoginGraceTime 120
SSHEOF

systemctl restart ssh

# ─── Fail2Ban Configuration ──────────────────────────────────
log "Installing and configuring fail2ban..."

cat > /etc/fail2ban/jail.local <<'F2BEOF'
[DEFAULT]
bantime = 3h
findtime = 10m
maxretry = 5
destemail = root@localhost
sendername = Fail2Ban
# Whitelist localhost
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3h
findtime = 10m
F2BEOF

systemctl enable --now fail2ban
log "Fail2ban configured - SSH protected from brute-force attacks"

# ─── Nginx Host Configuration ────────────────────────────────
log "Configuring Nginx Host Proxy..."
cat > /etc/nginx/sites-available/proxysock-staging <<'NGINXEOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Frontend
server {
    listen 80;
    server_name test.proxysock.net;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API & ActionCable
server {
    listen 80;
    server_name apitest.proxysock.net;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /cable {
        proxy_pass http://localhost:3000/cable;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/proxysock-staging /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# ─── App directory ───────────────────────────────────────────
log "Setting up app directory..."
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

# ─── Firewall ───────────────────────────────────────────────
log "Configuring firewall..."
ufw --force disable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 60000:61000/udp comment 'Mosh'
ufw --force enable

# ─── Swap (safety net) ──────────────────────────────────────
if [ ! -f /swapfile ]; then
  log "Creating 2GB swap..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ─── Docker log rotation ────────────────────────────────────
log "Configuring Docker log rotation..."
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

# ─── Create env template ────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENVEOF'
# ─── Staging Environment ─────────────────────────────────
RAILS_ENV=staging
SECRET_KEY_BASE=CHANGE_ME_generate_with_rails_secret
RAILS_MASTER_KEY=CHANGE_ME_from_config_master_key

# ─── Database ────────────────────────────────────────────────
PROXYSOCK_API_DATABASE_PASSWORD=CHANGE_ME_strong_password
DB_HOST=db-staging
DB_USERNAME=proxysock_api

# ─── Redis ───────────────────────────────────────────────────
REDIS_URL=redis://redis-staging:6379/0

# ─── URLs & Docker ───────────────────────────────────────────
APP_URL=https://apitest.proxysock.net
FRONTEND_URL=https://test.proxysock.net
DOCKER_REGISTRY=ghcr.io/asmadeous
IMAGE_TAG=staging

# ─── Proxmox Settings ────────────────────────────────────────
PROXMOX_API_URL=CHANGE_ME
PROXMOX_API_TOKEN_ID=CHANGE_ME
PROXMOX_API_TOKEN_SECRET=CHANGE_ME
PROXMOX_NODE=pve

# ─── SMTP (Resend) ──────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USERNAME=resend
SMTP_PASSWORD=CHANGE_ME
MAILER_FROM=support@proxysock.com

# ─── Sentry ──────────────────────────────────────────────────
SENTRY_DSN=CHANGE_ME

# ─── Payment Gateways ───────────────────────────────────────
REXPAY_USERNAME=CHANGE_ME
REXPAY_SECRET_KEY=CHANGE_ME
REXPAY_BASE_URL=https://pgs-sandbox.globalaccelerex.com
HUNDREDPAY_SECRET_KEY=CHANGE_ME
PLISIO_SECRET_KEY=CHANGE_ME
PAYVRA_API_KEY=CHANGE_ME

# ─── Other Vars ─────────────────────────────────────────────
VM_CALLBACK_API_KEY=internal-provisioning-key
PROXMOX_SSH_HOST=CHANGE_ME
PROXMOX_SSH_USER=root
PROXMOX_SSH_PASSWORD=CHANGE_ME
ENVEOF
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  log "Created $APP_DIR/.env template — FILL IN THE VALUES!"
fi

log ""
log "════════════════════════════════════════════════════════"
log "  ✅ VM setup complete!"
log "  User: $APP_USER (configured for deployment)"
log "  SSH: Hardened with keepalive, fail2ban enabled"
log "  Nginx: Configured for websockets & 100MB uploads"
log ""
log "  Next steps:"
log "  1. Add your SSH public key (optional):"
log "     echo 'ssh-ed25519 ...' >> /home/$APP_USER/.ssh/authorized_keys"
log ""
log "  2. Fill in staging values:"
log "     nano $APP_DIR/.env"
log ""
log "  3. Copy docker-compose.yml to $APP_DIR/"
log ""
log "  4. Log in to GHCR (as $APP_USER):"
log "     su - $APP_USER"
log "     echo \$GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
log ""
log "  5. Check fail2ban status:"
log "     fail2ban-client status sshd"
log "════════════════════════════════════════════════════════"