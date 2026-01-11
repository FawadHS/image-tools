# Deployment Guide - tools.fawadhs.dev

## Current Setup

**Live URL**: https://tools.fawadhs.dev/image-tools/  
**Server**: Ubuntu VPS (142.132.168.16)  
**Web Server**: Nginx  
**SSL**: Let's Encrypt (certbot)  
**Deployment Path**: `/var/www/tools.fawadhs.dev/image-tools/`

---

## Fixed Nginx Configuration

The issue with 404 errors on assets is due to the static asset location block. Here's the corrected config:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tools.fawadhs.dev;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tools.fawadhs.dev;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/tools.fawadhs.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tools.fawadhs.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Canonical slash for tool root
    location = /image-tools {
        return 301 /image-tools/;
    }

    # Image Tools SPA served under /image-tools/
    location /image-tools/ {
        alias /var/www/tools.fawadhs.dev/image-tools/;
        try_files $uri $uri/ /image-tools/index.html;
        
        # Cache static assets
        location ~ \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000, immutable";
        }
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### Apply the fix on server:

```bash
# SSH into your server
ssh root@142.132.168.16

# Update nginx config
sudo tee /etc/nginx/sites-available/tools.fawadhs.dev >/dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name tools.fawadhs.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tools.fawadhs.dev;

    ssl_certificate /etc/letsencrypt/live/tools.fawadhs.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tools.fawadhs.dev/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location = /image-tools {
        return 301 /image-tools/;
    }

    location /image-tools/ {
        alias /var/www/tools.fawadhs.dev/image-tools/;
        try_files $uri $uri/ /image-tools/index.html;
        
        location ~ \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000, immutable";
        }
    }

    location ~ /\. {
        deny all;
    }
}
EOF

# Test and reload
nginx -t && systemctl reload nginx

# Verify it works
curl -I https://tools.fawadhs.dev/image-tools/assets/index-BeK_OO_Y.js
```

---

## Deployment Script

Located at `/usr/local/bin/deploy-image-tools`:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/srv/apps/tools/image-tools"
DEST="/var/www/tools.fawadhs.dev/image-tools"
USER="fawad"

sudo -u "$USER" -H bash -lc "
  cd '$APP_DIR'
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
  npm ci
  npm run build
"

rsync -av --delete "$APP_DIR/dist/" "$DEST/"

chown -R www-data:www-data /var/www/tools.fawadhs.dev
find /var/www/tools.fawadhs.dev -type d -exec chmod 755 {} \;
find /var/www/tools.fawadhs.dev -type f -exec chmod 644 {} \;

nginx -t
systemctl reload nginx
echo "image-tools deployed: $(date -u)"
```

### Usage:
```bash
sudo deploy-image-tools
```

---

## GitHub Auto-Deploy (Optional)

### Option 1: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: 142.132.168.16
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: /usr/local/bin/deploy-image-tools
```

Add your SSH private key to GitHub: Settings → Secrets → Actions → `SSH_PRIVATE_KEY`

### Option 2: Webhook

Install webhook listener:
```bash
# Install webhook
apt install webhook

# Create webhook script
tee /opt/webhooks/deploy-image-tools.sh >/dev/null <<'EOF'
#!/bin/bash
/usr/local/bin/deploy-image-tools > /var/log/webhook-deploy.log 2>&1
EOF

chmod +x /opt/webhooks/deploy-image-tools.sh

# Configure webhook
tee /etc/webhook.conf >/dev/null <<'EOF'
[
  {
    "id": "deploy-image-tools",
    "execute-command": "/opt/webhooks/deploy-image-tools.sh",
    "command-working-directory": "/srv/apps/tools",
    "response-message": "Deploying image-tools...",
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "YOUR_SECRET_HERE",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
EOF

# Start webhook service
systemctl enable webhook
systemctl start webhook
```

Add webhook in GitHub: Settings → Webhooks → Add webhook
- URL: `http://142.132.168.16:9000/hooks/deploy-image-tools`
- Secret: (match YOUR_SECRET_HERE)
- Events: Just the push event

---

## File Structure

```
Server Structure:
/srv/apps/tools/image-tools/          # Git repository + build
├── src/                              # React source code
├── dist/                             # Built files (generated)
├── package.json
├── package-lock.json
└── vite.config.ts                    # base: '/image-tools/'

/var/www/tools.fawadhs.dev/           # Nginx serves from here
└── image-tools/                      # Synced from dist/
    ├── index.html
    └── assets/
        ├── index-BeK_OO_Y.js
        └── index-C5DLT2hK.css
```

---

## Adding More Tools

When you add more tools to the suite:

1. **Create tool directory**:
```bash
mkdir -p /srv/apps/tools/another-tool
mkdir -p /var/www/tools.fawadhs.dev/another-tool
```

2. **Update nginx config** (add new location block):
```nginx
location /another-tool/ {
    alias /var/www/tools.fawadhs.dev/another-tool/;
    try_files $uri $uri/ /another-tool/index.html;
}
```

3. **Create deploy script**:
```bash
cp /usr/local/bin/deploy-image-tools /usr/local/bin/deploy-another-tool
# Edit paths in the script
```

---

## Monitoring & Logs

```bash
# Nginx access logs
tail -f /var/log/nginx/access.log | grep image-tools

# Nginx error logs
tail -f /var/log/nginx/error.log

# Check SSL certificate expiry
certbot certificates

# Test HTTPS
curl -I https://tools.fawadhs.dev/image-tools/

# Check build logs during deployment
journalctl -u nginx -f
```

---

## Performance Optimization

### Enable Gzip Compression

Add to `/etc/nginx/nginx.conf` in the `http` block:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
           application/json application/javascript application/xml+rss 
           application/rss+xml font/truetype font/opentype 
           application/vnd.ms-fontobject image/svg+xml;
```

### Reduce Bundle Size (Future)

The build shows a warning about large chunks (1.7MB). Consider:
- Code splitting with dynamic imports
- Lazy load routes/components
- Separate vendor chunks

---

## Troubleshooting

### 404 on Assets
- Check nginx config (nested location blocks issue)
- Verify file permissions: `ls -la /var/www/tools.fawadhs.dev/image-tools/`
- Check nginx error log: `tail /var/log/nginx/error.log`

### White Screen / App Not Loading
- Check browser console for CORS errors
- Verify `base: '/image-tools/'` in vite.config.ts
- Clear browser cache (Ctrl+Shift+R)

### SSL Certificate Renewal
- Auto-renews via certbot systemd timer
- Manually renew: `certbot renew`
- Check renewal: `certbot certificates`

### Git Authentication Issues
- Server uses HTTPS (no keys needed)
- If private repo: use deploy keys or PAT

---

## Security Checklist

- [x] HTTPS enabled with Let's Encrypt
- [x] Deny access to hidden files (`.git`, `.env`)
- [x] Correct file permissions (644 for files, 755 for dirs)
- [x] Deploy script runs as non-root user (`fawad`)
- [ ] Add rate limiting (optional)
- [ ] Add fail2ban for brute force protection
- [ ] Regular updates: `apt update && apt upgrade`

---

*Last Updated: January 8, 2026*
