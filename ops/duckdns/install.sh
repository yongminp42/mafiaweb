#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  printf '%s\n' 'Run this installer as root (for example, with sudo).' >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
install -D -m 0750 "${script_dir}/update-duckdns.sh" \
  /usr/local/libexec/mafiagame/update-duckdns.sh
install -D -m 0750 "${script_dir}/diagnose-duckdns.sh" \
  /usr/local/libexec/mafiagame/diagnose-duckdns.sh
install -D -m 0644 "${script_dir}/mafiagame-duckdns.service" \
  /etc/systemd/system/mafiagame-duckdns.service
install -D -m 0644 "${script_dir}/mafiagame-duckdns.timer" \
  /etc/systemd/system/mafiagame-duckdns.timer
install -d -m 0750 /etc/mafiagame

if [[ ! -e /etc/mafiagame/duckdns.env ]]; then
  install -m 0600 "${script_dir}/duckdns.env.example" /etc/mafiagame/duckdns.env
fi

systemctl daemon-reload
if grep -Eq '^(DUCKDNS_DOMAIN=exampledomain|DUCKDNS_TOKEN=replace_with_duckdns_token)$' \
  /etc/mafiagame/duckdns.env; then
  printf '%s\n' \
    'Set DUCKDNS_DOMAIN and DUCKDNS_TOKEN in /etc/mafiagame/duckdns.env, then run:' \
    '  systemctl enable --now mafiagame-duckdns.timer'
  exit 0
fi

systemctl enable --now mafiagame-duckdns.timer
printf '%s\n' 'DuckDNS timer enabled. Check state in /var/lib/mafiagame-duckdns/last-result.'
