#!/usr/bin/env bash
set -euo pipefail

# Run as root or with sudo
CFG="/etc/ssh/sshd_config"
BACKUP="${CFG}.bak.$(date +%Y%m%d%H%M%S)"

# If config missing, try to install openssh-server on common distros
if [ ! -f "$CFG" ]; then
  if command -v apt >/dev/null 2>&1; then
    apt update
    apt install -y openssh-server
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y openssh-server
  elif command -v yum >/dev/null 2>&1; then
    yum install -y openssh-server
  elif command -v zypper >/dev/null 2>&1; then
    zypper install -y openssh
  else
    echo "No supported package manager found and $CFG is missing. Create the file manually at $CFG" >&2
    exit 1
  fi
fi

# Ensure config exists now
if [ ! -f "$CFG" ]; then
  echo "$CFG still missing after install. Exiting." >&2
  exit 1
fi

# Backup, set ownership/permissions, enforce settings
cp -f "$CFG" "$BACKUP"
echo "Backup saved to $BACKUP"

chown root:root "$CFG"
chmod 644 "$CFG"

sed -i -E 's/^[[:space:]]*#?[[:space:]]*PubkeyAuthentication[[:space:]]+.*/PubkeyAuthentication yes/' "$CFG" || true
sed -i -E 's/^[[:space:]]*#?[[:space:]]*PasswordAuthentication[[:space:]]+.*/PasswordAuthentication no/' "$CFG" || true
sed -i -E 's/^[[:space:]]*#?[[:space:]]*ChallengeResponseAuthentication[[:space:]]+.*/ChallengeResponseAuthentication no/' "$CFG" || true

grep -q -E '^[[:space:]]*PubkeyAuthentication' "$CFG" || echo "PubkeyAuthentication yes" >> "$CFG"
grep -q -E '^[[:space:]]*PasswordAuthentication' "$CFG" || echo "PasswordAuthentication no" >> "$CFG"
grep -q -E '^[[:space:]]*ChallengeResponseAuthentication' "$CFG" || echo "ChallengeResponseAuthentication no" >> "$CFG"

# Restart sshd (handle systems without systemd)
if command -v systemctl >/dev/null 2>&1; then
  systemctl restart sshd
else
  service ssh restart || service sshd restart || true
fi

# Verify
echo "---- sshd service status ----"
if command -v systemctl >/dev/null 2>&1; then
  systemctl status sshd --no-pager || true
else
  service ssh status || service sshd status || true
fi

echo "---- Relevant config lines ----"
grep -E 'PubkeyAuthentication|PasswordAuthentication|ChallengeResponseAuthentication' "$CFG" || true

echo "Done."
