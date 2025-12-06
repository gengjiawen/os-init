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
exec /usr/sbin/sshd -D -e
