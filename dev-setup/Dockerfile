FROM gengjiawen/node-build

# SSHD configuration
COPY sshd_config /etc/ssh/sshd_config

ENV SSH_PUBLIC_KEY="ssh-public-key-placeholder"
RUN set -eux; \
    if id -u gitpod >/dev/null 2>&1; then \
      userhome="$(getent passwd gitpod | cut -d: -f6)"; \
      install -o gitpod -g gitpod -m 700 -d "$userhome/.ssh"; \
      printf '%s\n' "$SSH_PUBLIC_KEY" > "$userhome/.ssh/authorized_keys"; \
      chown gitpod:gitpod "$userhome/.ssh/authorized_keys"; \
      chmod 600 "$userhome/.ssh/authorized_keys"; \
    fi

# Run sshd in foreground
USER root
EXPOSE 22 3000 5173
CMD ["/usr/sbin/sshd", "-D", "-e"]

