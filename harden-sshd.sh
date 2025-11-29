#!/usr/bin/env bash
set -eo pipefail

CFG="/etc/ssh/sshd_config"
BACKUP="${CFG}.bak.$(date +%Y%m%d%H%M%S)"

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

if command -v systemctl >/dev/null 2>&1; then
  systemctl restart sshd
else
  service ssh restart
fi

echo "---- sshd service status ----"
if command -v systemctl >/dev/null 2>&1; then
  systemctl status sshd --no-pager
else
  service ssh status
fi

echo "---- Relevant config lines ----"
grep -E 'PubkeyAuthentication|PasswordAuthentication|ChallengeResponseAuthentication' "$CFG" || true

echo "Done."
