#!/bin/bash
# Deploy Image Tools to production

SERVER="root@142.132.168.16"
DEST="/var/www/tools.fawadhs.dev/image-tools"

echo "Building Image Tools..."
npm run build

echo "Removing service worker from build..."
rm -f dist/sw.js

echo "Deploying to server..."
ssh $SERVER "mkdir -p $DEST"
scp -r dist/* $SERVER:$DEST/

echo "Fixing permissions..."
ssh $SERVER "chmod -R 755 $DEST && chown -R www-data:www-data $DEST"

echo "✅ Deployment complete!"
