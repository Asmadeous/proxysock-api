---
description: One-time install of Ansible dependencies on existing staging/production containers
---

# Install Ansible Dependencies (One-Time)

This is a **one-time** task to install missing Ansible dependencies inside already-running Docker containers on staging and production servers.

> **Note:** This is automated in the GitHub deploy workflows (`deploy-staging.yml` and `deploy.yml`). After every deploy, dependencies are installed automatically via `docker exec`. This doc is for manual recovery only.

## Pinned Versions (matching local dev)

| Component | Version |
|---|---|
| `ansible-core` | 2.20.4 |
| `ansible.windows` | 3.5.0 |
| `ansible.posix` | 2.1.0 |
| `community.windows` | 3.1.0 |
| `community.general` | 12.5.0 |

## Manual Install (if needed)

### Staging

```bash
ssh odin@64.6.175.181

INSTALL_CMD='apt-get update -qq && apt-get install --no-install-recommends -y python3-pip python3-venv && pip3 install --no-cache-dir --break-system-packages ansible-core==2.20.4 pywinrm requests-credssp && ansible-galaxy collection install ansible.windows:==3.5.0 ansible.posix:==2.1.0 community.windows:==3.1.0 community.general:==12.5.0 chocolatey.chocolatey:==1.5.3 -p /usr/share/ansible/collections --force && rm -rf /var/lib/apt/lists /var/cache/apt/archives'

docker exec -u root proxysock-sidekiq-staging bash -c "$INSTALL_CMD"
docker exec -u root proxysock-web-staging bash -c "$INSTALL_CMD"
```

### Production

```bash
INSTALL_CMD='apt-get update -qq && apt-get install --no-install-recommends -y python3-pip python3-venv && pip3 install --no-cache-dir --break-system-packages ansible-core==2.20.4 pywinrm requests-credssp && ansible-galaxy collection install ansible.windows:==3.5.0 ansible.posix:==2.1.0 community.windows:==3.1.0 community.general:==12.5.0 chocolatey.chocolatey:==1.5.3 -p /usr/share/ansible/collections --force && rm -rf /var/lib/apt/lists /var/cache/apt/archives'

docker exec -u root proxysock-sidekiq bash -c "$INSTALL_CMD"
docker exec -u root proxysock-web bash -c "$INSTALL_CMD"
```

### Verify

```bash
docker exec proxysock-sidekiq-staging bash -c 'ansible --version | head -1 && ansible-galaxy collection list | grep -E "(ansible\.windows|ansible\.posix|community\.windows|community\.general)"'
```
