#!/bin/bash
# Run this script to push the curated files to GitHub
# Make sure you're authenticated with GitHub (via SSH keys or credential helper)

cd "$(dirname "$0")"

# Set the remote (using HTTPS - you'll be prompted for credentials)
git remote remove origin 2>/dev/null
git remote add origin https://github.com/CoderofTheWest/Anthropic.git

# Ensure we're on main branch
git branch -M main

# Push to GitHub
echo "Pushing to https://github.com/CoderofTheWest/Anthropic.git..."
git push -u origin main

echo ""
echo "✓ Files pushed! Repository available at: https://github.com/CoderofTheWest/Anthropic"

