#!/bin/sh
set -e

# Substitute env vars into config.js at container startup.
envsubst < /usr/share/nginx/html/config.js > /usr/share/nginx/html/config.js.tmp
mv /usr/share/nginx/html/config.js.tmp /usr/share/nginx/html/config.js

exec nginx -g "daemon off;"
