#!/bin/bash
# ============================================================================
# One-time Ansible dependency installer for EXISTING running containers
# Run this INSIDE the web/sidekiq containers on staging and production.
#
# Usage (from the Docker host / SSH session):
#
#   # ── Staging ──
#   docker exec -u root proxysock-web-staging bash /rails/script/install-ansible-deps.sh
#   docker exec -u root proxysock-sidekiq-staging bash /rails/script/install-ansible-deps.sh
#
#   # ── Production ──
#   docker exec -u root proxysock-web bash /rails/script/install-ansible-deps.sh
#   docker exec -u root proxysock-sidekiq bash /rails/script/install-ansible-deps.sh
#
# NOTE: This is a ONE-TIME fix for already-running containers.
#       New builds will include these dependencies via the updated Dockerfile.
# ============================================================================
set -euo pipefail

echo "============================================"
echo " Ansible Dependency Installer"
echo " $(date -Iseconds)"
echo "============================================"

# 1. Install system packages
echo ""
echo "[1/4] Installing system packages (python3-pip, python3-venv)..."
apt-get update -qq
apt-get install --no-install-recommends -y python3-pip python3-venv
rm -rf /var/lib/apt/lists /var/cache/apt/archives
echo "  ✅ System packages installed"

# 2. Install Python dependencies for WinRM
echo ""
echo "[2/4] Installing pywinrm and requests-credssp..."
pip3 install --no-cache-dir --break-system-packages pywinrm requests-credssp
echo "  ✅ Python dependencies installed"

# 3. Install Ansible Galaxy collections
echo ""
echo "[3/4] Installing Ansible Galaxy collections..."

# Use requirements.yml if available, otherwise install individually
if [ -f /rails/ansible/requirements.yml ]; then
  echo "  Using /rails/ansible/requirements.yml"
  ansible-galaxy collection install -r /rails/ansible/requirements.yml --force
else
  echo "  requirements.yml not found, installing collections individually..."
  ansible-galaxy collection install \
    ansible.windows \
    ansible.posix \
    community.windows \
    community.general \
    --force
fi
echo "  ✅ Ansible collections installed"

# 4. Verify installation
echo ""
echo "[4/4] Verifying installation..."
echo ""

echo "── Python packages ──"
pip3 show pywinrm 2>/dev/null | grep -E "^(Name|Version):" || echo "  ❌ pywinrm NOT found"
pip3 show requests-credssp 2>/dev/null | grep -E "^(Name|Version):" || echo "  ❌ requests-credssp NOT found"

echo ""
echo "── Ansible collections ──"
ansible-galaxy collection list 2>/dev/null | grep -E "(ansible\.windows|ansible\.posix|community\.windows|community\.general)" || echo "  ❌ Some collections missing"

echo ""
echo "── Ansible version ──"
ansible --version | head -1

echo ""
echo "============================================"
echo " ✅ All Ansible dependencies installed!"
echo " Safe to provision Windows, Fedora, Rocky,"
echo " and Alma VMs now."
echo "============================================"
