```markdown
# .agent/workflows/ARTICLE_PIPELINE.md

## Workflow: WordPress Article Publication Pipeline

### Prerequisites
- Ollama/LM Studio running locally with compatible model
- Browser automation configured (Browser-use/Playwright)
- Google OAuth credentials for Docs/Sheets access
- WordPress admin credentials stored in `.env`

### Steps

1. **Extract Google Docs Article**
   ```bash
   npx tsx scripts/extract-article.ts --doc-id={GOOGLE_DOC_ID}
   ```
   - Parse document structure preserving formatting
   - Extract inline images to `./temp/images/{doc-id}/`
   - Generate `article.json` with sections, headings, paragraphs
   - **Verify**: `article.json` contains `title`, `sections[]`, `images[]`

2. **Fetch SEO Metadata from Sheets**
   ```bash
   npx tsx scripts/fetch-seo-metadata.ts --sheet-id={SHEET_ID} --article-slug={SLUG}
   ```
   - Match article by slug column
   - Extract: focus_keyphrase, meta_description, canonical_url, schema_type
   - Output: `./temp/seo/{slug}.json`
   - **Verify**: All Yoast fields present, no empty values

3. **Synthesize Content with LLM**
   ```bash
   npx tsx scripts/synthesize-content.ts --article={SLUG} --model={MODEL_NAME}
   ```
   - Load article.json + seo.json
   - Prompt: "Preserve exact wording. Add ONLY: image alt-text generation"
   - Output: `./temp/final/{slug}-final.json`
   - **Verify**: Character-by-character diff shows <5% change

4. **Upload Media Assets**
   ```bash
   npx tsx scripts/upload-media.ts --slug={SLUG} --wp-url={WP_URL}
   ```
   - Authenticate via WordPress REST API
   - Upload images from `./temp/images/`
   - Map returned media IDs to article structure
   - **Verify**: All images return valid attachment_id

5. **Create WordPress Draft**
   ```bash
   npx tsx scripts/create-draft.ts --slug={SLUG} --browser={chrome|firefox}
   ```
   - Launch Playwright with visible browser
   - Navigate to WP admin login
   - Create new post, paste content blocks
   - Inject Yoast SEO fields via DOM selectors
   - Save as draft
   - **Verify**: Post ID returned, status = "draft"

6. **Validate SEO Compliance**
   ```bash
   npx tsx scripts/validate-seo.ts --post-id={POST_ID}
   ```
   - Fetch post via REST API
   - Check Yoast meta fields populated
   - Run accessibility scan on content
   - **Verify**: All checks pass, score >80

### Rollback
- **Failed at Step 3-4**: Delete `./temp/` contents, restart from Step 1
- **Failed at Step 5-6**: Use WP REST API to delete draft post + media, restart from Step 4

### Batch Processing
```bash
npx tsx scripts/batch-process.ts --sheet-id={SHEET_ID} --rows=1-10
```
- Iterate rows sequentially
- Log success/failure to `./logs/batch-{timestamp}.json`
- On failure: continue next row, mark failed in log
```

---

```markdown
# .agent/workflows/LOCAL_SEO_ENHANCEMENT.md

## Workflow: Yoast Local SEO Field Injection

### Prerequisites
- WordPress site with Yoast Local SEO plugin active
- Business location data in `./config/locations.json`
- Google My Business API credentials (optional)

### Steps

1. **Fetch Location Data**
   ```bash
   npx tsx scripts/fetch-location-data.ts --business-name={NAME}
   ```
   - Load from `./config/locations.json` or GMB API
   - Required fields: name, address, phone, hours, geo_lat, geo_lng
   - Output: `./temp/location-{slug}.json`
   - **Verify**: All required fields present

2. **Generate Schema Markup**
   ```bash
   npx tsx scripts/generate-local-schema.ts --location={SLUG}
   ```
   - Create LocalBusiness JSON-LD
   - Include: openingHoursSpecification, geo coordinates
   - Output: `./temp/schema-{slug}.json`
   - **Verify**: Valid against schema.org validator

3. **Inject via Browser Automation**
   ```bash
   npx tsx scripts/inject-local-seo.ts --post-id={ID} --location={SLUG}
   ```
   - Navigate to post editor
   - Open Yoast Local SEO tab
   - Fill: Business name, address, phone, hours grid
   - Paste schema markup in appropriate field
   - **Verify**: All fields saved, preview shows rich snippet

4. **Validate Local SEO**
   ```bash
   npx tsx scripts/validate-local.ts --post-id={ID}
   ```
   - Test structured data with Google Rich Results Test API
   - Check NAP consistency
   - **Verify**: No errors, all properties recognized

### Rollback
- **Failed at Step 3**: Restore post revision via WP admin
- **Failed at Step 4**: Clear Yoast transients, re-run Step 3

### Multi-Location Support
```bash
npx tsx scripts/multi-location.ts --post-id={ID} --locations=[loc1,loc2,loc3]
```
- Creates location-specific landing pages
- Links to main article
- Unique schema per location
```

---

```markdown
# .agent/workflows/IMAGE_ALT_SYNC.md

## Workflow: Intelligent Image-to-Alt-Text Synchronization

### Prerequisites
- Ollama/LM Studio with vision-capable model (e.g., LLaVA)
- WordPress Media Library REST API access
- Image analysis prompt templates in `./prompts/`

### Steps

1. **Scan Media Library**
   ```bash
   npx tsx scripts/scan-media.ts --wp-url={URL} --missing-alt-only
   ```
   - Fetch all images via `/wp-json/wp/v2/media`
   - Filter: alt_text = empty OR alt_text = filename
   - Output: `./temp/images-needing-alt.json`
   - **Verify**: List contains media IDs and URLs

2. **Generate Alt Text via LLM**
   ```bash
   npx tsx scripts/generate-alt-text.ts --batch-size=10
   ```
   - Download images to `./temp/analyze/`
   - For each: prompt LLM with image + context
   - Prompt template: "Generate SEO-friendly alt text, max 125 chars, describe key elements"
   - Output: `./temp/alt-text-mapping.json`
   - **Verify**: All entries have non-empty alt text

3. **Update WordPress Media**
   ```bash
   npx tsx scripts/update-media-alt.ts --dry-run
   ```
   - For each mapping entry:
     - PATCH `/wp-json/wp/v2/media/{id}`
     - Update alt_text field
   - Log: `./logs/media-updates-{timestamp}.json`
   - **Verify**: Dry run shows correct mappings

4. **Sync with Published Posts**
   ```bash
   npx tsx scripts/sync-post-images.ts --regenerate-html
   ```
   - Find all posts using updated images
   - Regenerate img tags with new alt attributes
   - Update post content via REST API
   - **Verify**: Post revision created, images have alt text

### Rollback
- **Failed at Step 3**: Media Library has revision history, restore previous
- **Failed at Step 4**: Restore post revision from WordPress admin

### Quality Control
```bash
npx tsx scripts/alt-text-quality.ts --min-length=10 --max-length=125
```
- Scan all alt texts for quality issues
- Flag: too short, too long, keyword stuffing, generic terms
- Output report: `./reports/alt-text-quality.html`
```

---

```markdown
# .agent/workflows/SECURE_NAVIGATION.md

## Workflow: Secure Local Web Navigation Protocol

### Prerequisites
- Browser profiles configured in `./config/browser-profiles/`
- Proxy settings for local navigation only
- Session recording enabled for audit trail

### Steps

1. **Initialize Secure Browser Context**
   ```bash
   npx tsx scripts/init-browser.ts --profile=wordpress-admin
   ```
   - Launch with: `--disable-web-security=false`, `--proxy-server=localhost:8888`
   - Load cookies from encrypted store
   - Enable request interception for domain whitelist
   - **Verify**: Browser launches, no external requests

2. **Authenticate WordPress Session**
   ```bash
   npx tsx scripts/auth-wordpress.ts --method=headless
   ```
   - Navigate to `/wp-login.php`
   - Use stored credentials from `.env`
   - Save auth cookies to `./temp/session.enc`
   - **Verify**: Redirect to dashboard, admin bar visible

3. **Execute Navigation Sequence**
   ```bash
   npx tsx scripts/navigate-sequence.ts --workflow={WORKFLOW_NAME}
   ```
   - Load navigation steps from `./workflows/{name}.json`
   - Each step: URL, selectors, actions, wait conditions
   - Screenshot after each action to `./logs/screenshots/`
   - **Verify**: Each step completes within timeout

4. **Cleanup & Audit**
   ```bash
   npx tsx scripts/cleanup-browser.ts --preserve-logs
   ```
   - Close browser context
   - Encrypt session recording
   - Clear temporary files except logs
   - Generate audit report: `./reports/navigation-{timestamp}.pdf`
   - **Verify**: No sensitive data in temp, logs encrypted

### Security Constraints
- **Domain Whitelist**: Only `localhost`, `*.local`, configured WP domain
- **Request Blocking**: Block all third-party scripts, analytics, external CSS
- **Session Isolation**: Each workflow gets fresh browser context
- **Credential Handling**: Never log passwords, use env vars only

### Rollback
- **Failed Authentication**: Clear session cache, restart browser profile
- **Navigation Timeout**: Restore WordPress to last known state via DB backup
- **Security Breach**: Rotate all credentials, review audit logs
```