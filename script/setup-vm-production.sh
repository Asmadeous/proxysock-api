#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# setup-vm-production.sh — One-time setup for a fresh Ubuntu 24.04
# PRODUCTION VM (proxysock.com)
# Run this on the production VM after first boot.
# Usage: sudo bash script/setup-vm-production.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/proxysock-api"
APP_USER="odin"

# ─── Domain Configuration ───────────────────────────────────
FRONTEND_DOMAIN="proxysock.com"
FRONTEND_WWW="www.proxysock.com"
API_DOMAIN="api.proxysock.com"
MEDIA_DOMAIN="media.proxysock.com"
CERTBOT_EMAIL="support@proxysock.com"

log() { echo "[setup $(date '+%H:%M:%S')] $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: Run this script as root (sudo)"
  exit 1
fi

# ─── Clean Up Staging Artifacts (if staging script was run first) ─
log "Checking for staging artifacts to clean up..."
if [ -f /etc/nginx/sites-available/proxysock-staging ]; then
  log "⚠️  Found staging nginx config — removing..."
  rm -f /etc/nginx/sites-enabled/proxysock-staging
  rm -f /etc/nginx/sites-available/proxysock-staging
fi
if [ -f "$APP_DIR/.env" ] && grep -q 'RAILS_ENV=staging' "$APP_DIR/.env" 2>/dev/null; then
  log "⚠️  Found staging .env — backing up to .env.staging.bak"
  cp "$APP_DIR/.env" "$APP_DIR/.env.staging.bak"
  rm -f "$APP_DIR/.env"
fi
if grep -q 'test.proxysock.net' /etc/ssh/sshd_config 2>/dev/null; then
  log "⚠️  Found staging SSH config remnants"
fi
log "Staging cleanup complete"

# ─── System Updates ──────────────────────────────────────────
log "Updating system..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  docker.io docker-compose-v2 \
  curl git ufw qemu-guest-agent nginx fail2ban tmux \
  certbot python3-certbot-nginx

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

# ─── Nginx Production Configuration ─────────────────────────
log "Configuring Nginx for production domains..."
cat > /etc/nginx/sites-available/proxysock-production <<'NGINXEOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# ─── Frontend: proxysock.com + www.proxysock.com ─────────────
server {
    listen 80;
    server_name proxysock.com www.proxysock.com;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ─── API & ActionCable: api.proxysock.com ────────────────────
server {
    listen 80;
    server_name api.proxysock.com;
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ─── Media Server (Jellyfin): media.proxysock.com ────────────
server {
    listen 80;
    server_name media.proxysock.com;

    location / {
        proxy_pass http://localhost:8096;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for Jellyfin
        proxy_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/proxysock-production /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
# Remove staging config if it was accidentally applied
rm -f /etc/nginx/sites-enabled/proxysock-staging
rm -f /etc/nginx/sites-available/proxysock-staging
nginx -t && systemctl restart nginx

# ─── App directory ───────────────────────────────────────────
log "Setting up app directory..."
mkdir -p "$APP_DIR"
chown "$APP_USER:$APP_USER" "$APP_DIR"

# ─── Firewall ───────────────────────────────────────────────
log "Configuring firewall..."
ufw --force disable
ufw default deny incoming
ufw default allow outgoing
ufw allow 2206/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 60000:61000/udp comment 'Mosh'
ufw --force enable

# ─── Swap (safety net) ──────────────────────────────────────
if [ -f /swapfile ]; then
  CURRENT_SWAP=$(stat -c%s /swapfile 2>/dev/null || echo 0)
  TARGET_SWAP=$((4 * 1024 * 1024 * 1024))
  if [ "$CURRENT_SWAP" -lt "$TARGET_SWAP" ]; then
    log "Resizing swap from $(( CURRENT_SWAP / 1024 / 1024 ))MB to 4GB (production)..."
    swapoff /swapfile 2>/dev/null || true
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    log "Swap resized to 4GB"
  else
    log "Swap already 4GB+, skipping"
  fi
else
  log "Creating 4GB swap (production)..."
  fallocate -l 4G /swapfile
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

# ─── SSL Certificates (Let's Encrypt) ───────────────────────
log "Obtaining SSL certificates for all domains..."
log "NOTE: DNS A records must already point to this server's IP!"

certbot --nginx --non-interactive --agree-tos \
  --email "$CERTBOT_EMAIL" \
  -d "$FRONTEND_DOMAIN" \
  -d "$FRONTEND_WWW" \
  -d "$API_DOMAIN" \
  -d "$MEDIA_DOMAIN" \
  --redirect

# Enable auto-renewal
systemctl enable --now certbot.timer
log "SSL certificates installed and auto-renewal enabled"

# ─── Create production env template ─────────────────────────
# Always overwrite — staging .env was already backed up above
log "Writing production .env template..."
cat > "$APP_DIR/.env" <<'ENVEOF'
# ─── Production Environment ─────────────────────────────────
RAILS_ENV=production
SECRET_KEY_BASE=2487a07c393baeeb72ddf28b3fb948598b36451cbe2e537e127e24d0d6ee1c05e023aef377e3a1b93490008ee71f232d9914504631c71070911708cf2d332239
RAILS_MASTER_KEY=04a98d9d23a95f75e74436ca92cad6fa

# ─── Database ────────────────────────────────────────────────
PROXYSOCK_API_DATABASE_PASSWORD=CHANGE_ME_strong_password
DB_HOST=db
DB_USERNAME=proxysock_api

# ─── Redis ───────────────────────────────────────────────────
REDIS_URL=redis://redis:6379/0

# ─── URLs & Docker ───────────────────────────────────────────
APP_URL=https://api.proxysock.com
FRONTEND_URL=https://proxysock.com
DOCKER_REGISTRY=ghcr.io/asmadeous
IMAGE_TAG=latest

# ─── Google OAuth ────────────────────────────────────────────
GOOGLE_CLIENT_ID=265649004795-bfpa3r11th09ucimpqugca0au6s3vkfd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# ─── Twitter / X OAuth ───────────────────────────────────────
TWITTER_CLIENT_ID=8Bl08KM6BwOvIEMUjAvD2COao
TWITTER_CLIENT_SECRET=n4EcRqQsLogSKv6fFAnn3o1J5sikmCQJnsFB5vQfgPY4C8Lofo

# ─── Zoho OAuth (Employee SSO) ───────────────────────────────
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=

# ─── Payment Gateways ────────────────────────────────────────
# Paystack
PAYSTACK_SECRET_KEY=sk_test_7bd348ec6a5c66861623eb8dc44737b382a682ff

# Plisio (crypto)
PLISIO_SECRET_KEY=feJ8jc6nIb1V7KmmB2HsappTx2RKAQd4WZuy6Wd-57I2Ajjf2Q3c1H3a1BkYEsj-


# Payvra
PAYVRA_API_KEY=ef18b4da0b77427888c969b2dec2d74f
PAYVRA_WEBHOOK_SECRET=whsec_31fb7bc2ca9440f9a3dbee5d

# 100Pay
HUNDREDPAY_API_KEY=LIVE;SK;eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjY5YTdiMmNiMDczNTQxMDAyZTBjYWUxMSIsInVzZXJJZCI6IjY5YTdiMmNiMDczNTQxMDAyZTBjYWUwZCIsInR5cGUiOiJzZWNyZXQiLCJpYXQiOjE3NzI1OTc5NjN9.xu44YnzLaqzcfDLeO-Rt2nCAVx-wQughEYlMrEeV-OI
HUNDREDPAY_SECRET_KEY=rAavUeIKC3cTugE8ERCGNBQX5DDv02Y7A
HUNDREDPAY_USER_ID=093623

# FastSpring
FASTSPRING_USERNAME=
FASTSPRING_PASSWORD=
FASTSPRING_WEBHOOK_SECRET=
FASTSPRING_STORE_URL=

# ─── eSIM Access ─────────────────────────────────────────────
ESIM_ACCESS_API_KEY=0b1dc6149ab14cc5a1e910adf48cea5d
ESIM_ACCESS_SECRET_KEY=88f5a65d1b124817850c4a23919a4582

# ─── IP Data (Geo/IP lookup) ──────────────────────────────────
IPDATA_API_KEY=a619f87398f496d6750081716e5aaf9e7eb57878c557821fa35bc9cd

# ─── Proxmox / VPS Provisioning ──────────────────────────────
PROXMOX_NODE=local
PUBLIC_IP=127.0.0.1
PROXMOX_API_URL=https://proxmox.proxysock.com/api2/json
PROXMOX_API_TOKEN_ID=ansible@pve!provisioning-token
PROXMOX_API_TOKEN_SECRET=206371d0-1896-4f31-8c04-63777f878656
# Secret key for Ansible playbook status callbacks (POST /vm/:id/status)
VM_CALLBACK_API_KEY=f089d9d8-f5f8-4955-ae61-971204959cf2
# SSH Access for Remote dnsmasq/Whitelisting
PROXMOX_SSH_HOST=64.6.175.2
PROXMOX_SSH_USER=ian_dev
PROXMOX_SSH_PASSWORD=asmadeous2025@
PROXMOX_SSH_KEY_PATH=/home/asmadeous/.ssh/proxmox_key
# Proxmox backup settings (ProxmoxBackupJob runs every 3 days via cron)
PROXMOX_BACKUP_STORAGE=local
PROXMOX_BACKUP_KEEP_LAST=3
PROXMOX_BACKUP_COMPRESS=zstd
PROXMOX_BACKUP_MODE=snapshot
PROXMOX_BACKUP_MAILTO=root@pam
# Cloudflare DNS Integration (Optional)
CLOUDFLARE_API_TOKEN=cfut_HW9befL4mfNEQiIyS3JVeRiAbacOpz4QCFrtvEsJ92752eb6
CLOUDFLARE_ZONE_ID=7cadeb43b61290c3248f673fdd00ae6d
CLOUDFLARE_BASE_DOMAIN=proxysock.net

# VM Template Credentials
VM_LINUX_TEMPLATE_USER=ansible
VM_LINUX_TEMPLATE_PASSWORD=temporary
VM_WINDOWS_ADMIN_USER=ansible
VM_WINDOWS_TEMPLATE_PASSWORD=I@mg0D2025

# ─── Sentry (Error Monitoring) ───────────────────────────────
SENTRY_DSN=https://e8b43674b5bd9aa1e1ee1a4136029234@o4510955390894080.ingest.us.sentry.io/4510955431133184

# ─── Action Mailer ───────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USERNAME=resend
SMTP_PASSWORD=re_RGedgGuu_Cc4o2bfWmmT8LVQnMoxFzMhb
MAILER_FROM=support@proxysock.com

#------------ Resend SMTP---------------------------------------------
RESEND_API_KEY=re_RGedgGuu_Cc4o2bfWmmT8LVQnMoxFzMhb

# ─── MyProxy API ──────────────────────────────────────────────
MY_PROXY_API_URL=https://reseller.myproxyapi.com/api/v1
MY_PROXY_API_USERNAME=bradleyfox58
MY_PROXY_API_SECRET=xskdGFo5FpROEkD8MT6S5ejhDvzrsasGVinrFHo8
MY_PROXY_RESELLER_USER_ID=37199
SUPABASE_DB_URL=postgresql://postgres.xknakbxmpznclriiauim:vpyYxGY5TBisZV7a@aws-0-ca-central-1.pooler.supabase.com:5432/postgres
# ─── XProxy Service ───────────────────────────────────────────
# XPROXY_HOST=http://74.208.234.109
# XPROXY_USERNAME=xproxy
# XPROXY_PASSWORD=user@123

# ─── Exchange Rates Service ───────────────────────────────────────────
FIXER_API_KEY=90305fccb0446e3f525b29fadc92a544

# ─── Reddit CAPI ─────────────────────────────────────────────
REDDIT_AD_ACCOUNT_ID=your_ad_account_id_here
REDDIT_CONVERSION_TOKEN=your_conversion_token_here

# ─── Tailscale VPN ──────────────────────────────
TAILSCALE_AUTH_KEY=tskey-auth-kyGKNKPLS111CNTRL-dTpZKpnVLnEiRVbwvHYLoEapZRkHtqvrC
TAILSCALE_EXIT_NODE_IP=100.79.191.120
EXTERNAL_PROVISIONING_API_KEY=SiNdnfR02t2zngYlvJ1v4ax05yfom0wS


# ─── FastSpring ──────────────────────────────
FASTSPRING_USERNAME=
FASTSPRING_PASSWORD=
FASTSPRING_WEBHOOK_SECRET=
FASTSPRING_STORE_URL=
ENVEOF
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
log "Created $APP_DIR/.env template — FILL IN THE VALUES!"

log ""
log "════════════════════════════════════════════════════════"
log "  ✅ PRODUCTION VM setup complete!"
log "  User: $APP_USER (configured for deployment)"
log "  SSH: Hardened with keepalive, fail2ban enabled"
log "  Nginx: Production domains with SSL"
log "    - https://$FRONTEND_DOMAIN (frontend)"
log "    - https://$FRONTEND_WWW (frontend redirect)"
log "    - https://$API_DOMAIN (API + WebSocket)"
log "    - https://$MEDIA_DOMAIN (Jellyfin media)"
log "  SSL: Let's Encrypt certificates with auto-renewal"
log ""
log "  Next steps:"
log "  1. Add your SSH public key (optional):"
log "     echo 'ssh-ed25519 ...' >> /home/$APP_USER/.ssh/authorized_keys"
log ""
log "  2. Fill in production values:"
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
log ""
log "  6. Verify SSL certificates:"
log "     certbot certificates"
log "════════════════════════════════════════════════════════"
