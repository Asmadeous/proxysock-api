#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# setup-vm.sh — One-time setup for a fresh Ubuntu 24.04 VM
# Run this on the Proxmox VM after first boot.
# Usage: sudo bash script/setup-vm.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/proxysock-api"
DEPLOY_USER="deploy"

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
  curl git ufw qemu-guest-agent nginx

# ─── Enable services ────────────────────────────────────────
systemctl enable --now docker
systemctl enable --now qemu-guest-agent
systemctl enable --now nginx

# ─── Create deploy user ─────────────────────────────────────
log "Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G docker "$DEPLOY_USER"
  mkdir -p /home/$DEPLOY_USER/.ssh
  chmod 700 /home/$DEPLOY_USER/.ssh
  touch /home/$DEPLOY_USER/.ssh/authorized_keys
  chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
  chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
  log "Created user '$DEPLOY_USER'. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
else
  log "User '$DEPLOY_USER' already exists, ensuring docker group..."
  usermod -aG docker "$DEPLOY_USER"
fi

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
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ─── Firewall ───────────────────────────────────────────────
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp    # HTTP (Nginx)
ufw allow 443/tcp   # HTTPS (Nginx)
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
PAYSTACK_SECRET_KEY=CHANGE_ME
HUNDREDPAY_SECRET_KEY=CHANGE_ME
PLISIO_SECRET_KEY=CHANGE_ME
PAYVRA_API_KEY=CHANGE_ME

# ─── Other Vars ─────────────────────────────────────────────
VM_CALLBACK_API_KEY=internal-provisioning-key
PROXMOX_SSH_HOST=CHANGE_ME
PROXMOX_SSH_USER=root
PROXMOX_SSH_PASSWORD=CHANGE_ME
ENVEOF
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  log "Created $APP_DIR/.env template — FILL IN THE VALUES!"
fi

log ""
log "════════════════════════════════════════════════════════"
log "  ✅ VM setup complete!"
log "  Nginx configured for websockets & 100MB uploads."
log ""
log "  Next steps:"
log "  1. Add your SSH public key:"
log "     echo 'ssh-ed25519 ...' >> /home/$DEPLOY_USER/.ssh/authorized_keys"
log ""
log "  2. Fill in staging values:"
log "     nano $APP_DIR/.env"
log ""
log "  3. Copy docker-compose.yml to $APP_DIR/"
log ""
log "  4. Log in to GHCR (as deploy user):"
log "     su - $DEPLOY_USER"
log "     echo \$GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
log "════════════════════════════════════════════════════════"
