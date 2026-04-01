---
description: One-time install of Ansible dependencies on existing staging/production containers
---

# Install Ansible Dependencies (One-Time)

This is a **one-time** task to install missing Ansible dependencies inside already-running Docker containers on staging and production servers. Future deploys will include these via the updated Dockerfile automatically.

## What gets installed

| Dependency | Purpose |
|---|---|
| `python3-pip`, `python3-venv` | Package installer for Python deps |
| `pywinrm` | WinRM transport for Windows VM provisioning |
| `requests-credssp` | CredSSP auth for WinRM |
| `ansible.windows` collection | `win_uri`, `win_ping` etc. |
| `ansible.posix` collection | `firewalld` for Fedora/Rocky/Alma |
| `community.windows` collection | `win_chocolatey`, `win_updates`, `win_environment` etc. |
| `community.general` collection | Utility modules like `seport` |

## Staging Server

SSH into the staging server:

```bash
ssh odin@64.6.175.181
```

Run on the **sidekiq** container (where Ansible provisioning jobs run):

```bash
docker exec -u root proxysock-sidekiq-staging bash -c '
apt-get update -qq && 
apt-get install --no-install-recommends -y python3-pip python3-venv &&
pip3 install --no-cache-dir --break-system-packages pywinrm requests-credssp &&
ansible-galaxy collection install ansible.windows ansible.posix community.windows community.general --force &&
rm -rf /var/lib/apt/lists /var/cache/apt/archives &&
echo "✅ Sidekiq container done"
'
```

Run on the **web** container (for manual Ansible commands / console):

```bash
docker exec -u root proxysock-web-staging bash -c '
apt-get update -qq && 
apt-get install --no-install-recommends -y python3-pip python3-venv &&
pip3 install --no-cache-dir --break-system-packages pywinrm requests-credssp &&
ansible-galaxy collection install ansible.windows ansible.posix community.windows community.general --force &&
rm -rf /var/lib/apt/lists /var/cache/apt/archives &&
echo "✅ Web container done"
'
```

## Production Server

SSH into the production server and run the same commands with production container names:

```bash
docker exec -u root proxysock-sidekiq bash -c '
apt-get update -qq && 
apt-get install --no-install-recommends -y python3-pip python3-venv &&
pip3 install --no-cache-dir --break-system-packages pywinrm requests-credssp &&
ansible-galaxy collection install ansible.windows ansible.posix community.windows community.general --force &&
rm -rf /var/lib/apt/lists /var/cache/apt/archives &&
echo "✅ Sidekiq container done"
'
```

```bash
docker exec -u root proxysock-web bash -c '
apt-get update -qq && 
apt-get install --no-install-recommends -y python3-pip python3-venv &&
pip3 install --no-cache-dir --break-system-packages pywinrm requests-credssp &&
ansible-galaxy collection install ansible.windows ansible.posix community.windows community.general --force &&
rm -rf /var/lib/apt/lists /var/cache/apt/archives &&
echo "✅ Web container done"
'
```

## Verify

After running, verify inside any container:

```bash
docker exec proxysock-sidekiq-staging bash -c '
pip3 show pywinrm | grep Version &&
ansible-galaxy collection list | grep -E "(ansible\.windows|ansible\.posix|community\.windows|community\.general)"
'
```

## Note

These installs are ephemeral — they will be lost if containers are recreated. The updated `Dockerfile` and `ansible/requirements.yml` ensure all future image builds include these dependencies permanently.
