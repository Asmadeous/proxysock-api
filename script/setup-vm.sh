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
  curl git ufw qemu-guest-agent

# ─── Enable services ────────────────────────────────────────
systemctl enable --now docker
systemctl enable --now qemu-guest-agent

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
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
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
# ─── Production Environment ─────────────────────────────────
RAILS_ENV=production
SECRET_KEY_BASE=CHANGE_ME_generate_with_rails_secret
RAILS_MASTER_KEY=CHANGE_ME_from_config_master_key

# ─── Database ────────────────────────────────────────────────
PROXYSOCK_API_DATABASE_PASSWORD=CHANGE_ME_strong_password
DB_HOST=db-production
DB_USERNAME=proxysock_api

# ─── Redis ───────────────────────────────────────────────────
REDIS_URL=redis://redis-production:6379/0

# ─── URLs & Docker ───────────────────────────────────────────
APP_URL=https://api.proxysock.com
FRONTEND_URL=https://proxysock.com
DOCKER_REGISTRY=ghcr.io/asmadeous
IMAGE_TAG=latest

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
PLISIO_SECRET_KEY=CHANGE_ME
PAYVRA_API_KEY=CHANGE_ME

# Copy remaining vars from your dev .env as needed
ENVEOF
  chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  log "Created $APP_DIR/.env template — FILL IN THE VALUES!"
fi

log ""
log "════════════════════════════════════════════════════════"
log "  ✅ VM setup complete!"
log ""
log "  Next steps:"
log "  1. Add your SSH public key:"
log "     echo 'ssh-ed25519 ...' >> /home/$DEPLOY_USER/.ssh/authorized_keys"
log ""
log "  2. Fill in production values:"
log "     nano $APP_DIR/.env"
log ""
log "  3. Copy docker-compose.prod.yml to $APP_DIR/"
log ""
log "  4. Log in to GHCR (as deploy user):"
log "     su - $DEPLOY_USER"
log "     echo \$GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin"
log "════════════════════════════════════════════════════════"
