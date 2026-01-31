#!/bin/bash

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Usage: ./push.sh <YOUR_GITHUB_TOKEN>"
    echo ""
    echo "Get your token from: https://github.com/settings/tokens/new"
    echo "Select 'repo' permissions and click 'Generate token'"
    exit 1
fi

TOKEN="$1"

echo "🚀 Pushing to GitHub..."
git push https://${TOKEN}@github.com/royrenwb/Notion2wechatMP.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Visit: https://github.com/royrenwb/Notion2wechatMP"
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi
