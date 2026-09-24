#!/usr/bin/env bash
set -euo pipefail
umask 077

readonly state_dir="${DUCKDNS_STATE_DIR:-/var/lib/mafiagame-duckdns}"
readonly state_file="${state_dir}/last-result"
last_success_at="never"

if [[ -r "$state_file" ]]; then
  saved_success="$(sed -n 's/^last_success_at=//p' "$state_file" | head -n 1)"
  if [[ -n "$saved_success" ]]; then
    last_success_at="$saved_success"
  fi
fi

write_status() {
  local status="$1"
  local success_at="$2"
  local attempted_at
  local temporary_file
  attempted_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  install -d -m 0750 "$state_dir"
  temporary_file="${state_file}.tmp.$$"
  {
    printf 'last_attempt_at=%s\n' "$attempted_at"
    printf 'last_success_at=%s\n' "$success_at"
    printf 'status=%s\n' "$status"
  } > "$temporary_file"
  chmod 0640 "$temporary_file"
  mv -f "$temporary_file" "$state_file"
  printf 'DuckDNS update status=%s last_attempt_at=%s last_success_at=%s\n' \
    "$status" "$attempted_at" "$success_at"
}

fail_update() {
  write_status "ERROR" "$last_success_at"
  printf '%s\n' 'DuckDNS update failed; inspect the service journal and configuration.' >&2
  exit 1
}

if [[ -z "${DUCKDNS_DOMAIN:-}" || -z "${DUCKDNS_TOKEN:-}" ]]; then
  fail_update
fi

if [[ ! "$DUCKDNS_DOMAIN" =~ ^[A-Za-z0-9-]+(,[A-Za-z0-9-]+)*$ \
    || ! "$DUCKDNS_TOKEN" =~ ^[A-Za-z0-9-]+$ ]]; then
  fail_update
fi

if ! response="$(
  printf 'url = "https://www.duckdns.org/update?domains=%s&token=%s"\n' \
    "$DUCKDNS_DOMAIN" "$DUCKDNS_TOKEN" \
    | curl --config - --silent --show-error --fail --connect-timeout 10 --max-time 30
)"; then
  fail_update
fi

if [[ "$response" != "OK" ]]; then
  write_status "KO" "$last_success_at"
  printf '%s\n' 'DuckDNS rejected the update; verify the domain and token.' >&2
  exit 1
fi

last_success_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
write_status "OK" "$last_success_at"
