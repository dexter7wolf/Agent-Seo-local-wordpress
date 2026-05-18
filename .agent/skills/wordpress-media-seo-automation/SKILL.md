---
name: WordPress Media & SEO Automation
description: Automated media upload, alt-text generation, and Yoast SEO field injection via REST API
---

# Trigger (When to activate)
- Commands: `wordpress-upload`, `seo-optimize`, `media-sync`
- Files: `*/wordpress/*`, `*/seo/*`, `*-publisher.ts`
- Media files or SEO metadata in context

# Context Required
- WordPress REST API credentials and endpoint
- Yoast SEO field mappings
- Media files with metadata
- Target post/page IDs

# Execution Steps
1. **Media Upload**:
   - Compress images (WebP, max 2MB)
   - Generate descriptive filenames
   - Upload via `/wp-json/wp/v2/media`
2. **Alt-Text Intelligence**:
   - Extract context from surrounding content
   - Generate SEO-friendly descriptions
   - Apply to media library items
3. **Yoast Field Injection**:
   - Map Google Sheets data to Yoast fields
   - Update via custom REST endpoints
   - Validate against Yoast schema
4. **Batch Publishing**: Queue posts, respect rate limits
5. **Verification**: Query published URLs, validate rendering

# Validation Criteria
- Media upload success rate > 99.5%
- Alt-text passes WCAG 2.1 guidelines
- Yoast fields populate without errors
- Published posts match source content exactly