#!/usr/bin/env bash
set -euo pipefail

readonly config_file="${DUCKDNS_CONFIG_FILE:-/etc/mafiagame/duckdns.env}"
readonly result_file="${DUCKDNS_STATE_DIR:-/var/lib/mafiagame-duckdns}/last-result"

if [[ $# -ne 1 || ! "$1" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; then
  printf 'Usage: %s <current-public-ipv4-from-your-server-provider>\n' "$0" >&2
  exit 2
fi
current_ipv4="$1"

if [[ ! -r "$config_file" ]]; then
  printf 'DuckDNS configuration is not readable: %s\n' "$config_file" >&2
  exit 1
fi
domain_list="$(sed -n 's/^DUCKDNS_DOMAIN=//p' "$config_file" | head -n 1)"
domain="${domain_list%%,*}"
if [[ ! "$domain" =~ ^[A-Za-z0-9-]+$ ]]; then
  printf '%s\n' 'DuckDNS domain configuration is invalid.' >&2
  exit 1
fi
hostname="${domain}.duckdns.org"

printf '1. Current public IPv4: %s (provided by the operator)\n' "$current_ipv4"
printf '2. Latest DuckDNS updater result:\n'
if [[ -r "$result_file" ]]; then
  cat "$result_file"
else
  printf 'No updater result found at %s\n' "$result_file"
fi
printf '   Journal: journalctl -u mafiagame-duckdns.service --since today\n'

printf '3. DuckDNS A record for %s:\n' "$hostname"
if command -v dig >/dev/null 2>&1; then
  dns_ipv4="$(dig +short A "$hostname" || true)"
elif command -v nslookup >/dev/null 2>&1; then
  dns_ipv4="$(nslookup -type=A "$hostname" 2>/dev/null \
    | awk '/^Name: / { answer = 1; next } answer && /^Address: / { print $2 }' || true)"
else
  printf '%s\n' 'Neither dig nor nslookup is installed; install one to inspect DNS.'
  dns_ipv4=""
fi
if [[ -n "$dns_ipv4" ]]; then
  printf '%s\n' "$dns_ipv4"
  if printf '%s\n' "$dns_ipv4" | grep -Fxq "$current_ipv4"; then
    printf '%s\n' 'DNS A record matches the supplied public IPv4.'
  else
    printf '%s\n' 'DNS A record does not match yet; allow for DNS cache propagation.'
  fi
else
  printf '%s\n' 'No A record was returned; verify the update result and allow for DNS propagation.'
fi

printf '%s\n' \
  '4. If the record matches, check router port forwarding, host firewall rules, and the application listening port.' \
  '   If those are correct but external access still fails, check whether the network uses CGNAT.'
