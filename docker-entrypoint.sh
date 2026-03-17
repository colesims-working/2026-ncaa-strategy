#!/bin/sh
# Ensure the data directory is writable by the node user (UID 1000).
# Docker named volumes are created as root; this fixes ownership on first run.
chown -R node:node /app/data 2>/dev/null || true
exec su-exec node node server/index.js
