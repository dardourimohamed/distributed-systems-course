# Scratchpad - Cloudflare Pages Deployment

## Current Understanding

Project: Distributed Systems Course (mdBook)
- Built with mdBook v0.4.45
- Output directory: `book/` (per book.toml)
- Uses mdbook-mermaid and mdbook-quiz preprocessors
- Currently no package.json at project root

Objective: Add npm script to deploy to Cloudflare Pages

## Analysis

Cloudflare Pages deployment typically requires:
1. A build command that produces static files in a directory
2. The output directory to deploy

For mdBook on Cloudflare Pages:
- Build command: `mdbook build`
- Output directory: `book`
- No package.json is strictly required for Cloudflare Pages if using direct Git integration

However, the user wants an **npm script** for deployment. This means:
1. Create package.json with scripts
2. Use Wrangler CLI (Cloudflare's tool) for deployment via npm

## Plan

1. Create package.json with:
   - `build` script: runs `mdbook build`
   - `deploy` script: runs build then uses Wrangler to deploy
   - Or use `wrangler pages deploy` command directly

2. Consider using Wrangler v2+ which supports: `wrangler pages deploy <directory> --project-name=<name>`

## Tasks to Create

1. Create package.json with build script
2. Add deploy script using wrangler
3. Document usage instructions

Let me create these tasks and implement one at a time.

## Implementation Complete

Created package.json with:
- `npm run build` - Builds the mdBook to `book/` directory
- `npm run deploy` - Builds and deploys to Cloudflare Pages
- `npm run deploy:production` - Builds and deploys to production branch

The build script was tested and works correctly. The `book/` output directory is created successfully.

## Usage Instructions

First time setup (install Wrangler CLI):
```bash
npm install
```

Then authenticate with Cloudflare:
```bash
npx wrangler login
```

Deploy to Cloudflare Pages:
```bash
npm run deploy
```

Note: The project name `distributed-systems-course` can be changed to match your actual Cloudflare Pages project name.

## All Tasks Complete

The objective has been fulfilled. The npm script for Cloudflare Pages deployment has been properly added.
