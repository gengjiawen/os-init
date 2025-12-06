#!/usr/bin/env bash
set -euo pipefail

# Generate SSH host keys in mounted volume to keep fingerprints stable across rebuilds.
HOST_KEY_DIR="/etc/ssh/host_keys"

mkdir -p "${HOST_KEY_DIR}"

for key_type in rsa ed25519; do
  key_path="${HOST_KEY_DIR}/ssh_host_${key_type}_key"
  if [ ! -f "${key_path}" ]; then
    echo "Generating ${key_type} host key..."
    ssh-keygen -q -N "" -t "${key_type}" -f "${key_path}"
  else
    echo "${key_type} host key already exists."
  fi
done

echo "Done. SSH host keys are ready."

# Fix ownership for gitpod user config/cache if needed
TARGET_UID=${TARGET_UID:-33333}
TARGET_GID=${TARGET_GID:-33333}
TARGET_HOME=/home/gitpod

fix_owner() {
  local dir="$1"
  [ -d "$dir" ] || return 0
  local owner_uid owner_gid
  owner_uid=$(stat -c %u "$dir")
  owner_gid=$(stat -c %g "$dir")
  if [ "$owner_uid" != "$TARGET_UID" ] || [ "$owner_gid" != "$TARGET_GID" ]; then
    chown -R "${TARGET_UID}:${TARGET_GID}" "$dir"
  fi
}

fix_owner "${TARGET_HOME}/.config"
fix_owner "${TARGET_HOME}/.cache"

exec /usr/sbin/sshd -D -e
