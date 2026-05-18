---
name: Browser Automation Orchestration
description: Headless browser automation with Browser-use/Playwright for WordPress admin tasks and web scraping
---

# Trigger (When to activate)
- Commands: `browser`, `scrape`, `wordpress-action`, `navigate`
- Files: `*/browser/*`, `*/automation/*`, `*-scraper.ts`
- WordPress admin panel interactions required

# Context Required
- Browser instance state (Playwright context)
- Target URLs and authentication credentials
- DOM selectors for WordPress admin elements
- Current automation workflow step

# Execution Steps
1. **Browser Init**: Launch Chromium with stealth plugins, viewport 1920x1080
2. **Auth Flow**: Navigate to wp-admin, handle 2FA if present
3. **Action Execution**: 
   - Wait for selectors (max 30s timeout)
   - Execute actions with retry logic
   - Screenshot on every major state change
4. **Data Extraction**: Use structured selectors, return typed objects
5. **Cleanup**: Close contexts, clear cookies, reset state

# Validation Criteria
- Zero browser crashes across 100 consecutive operations
- WordPress post creation success rate > 99%
- Screenshot evidence for every critical action
- Network requests logged and inspectable