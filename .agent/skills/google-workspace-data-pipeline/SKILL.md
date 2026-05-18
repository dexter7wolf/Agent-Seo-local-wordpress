---
name: Google Workspace Data Pipeline
description: Extract and transform data from Google Docs/Sheets with authentication, parsing, and schema mapping
---

# Trigger (When to activate)
- Commands: `sync-docs`, `import-sheets`, `google-data`
- Files: `*/google/*`, `*/import/*`, `*-sync.ts`
- Google Drive URLs in context

# Context Required
- Google OAuth2 service account credentials
- Document/Sheet IDs from URLs
- Target schema definitions (Drizzle models)
- Field mapping configuration

# Execution Steps
1. **Auth Setup**: Initialize Google APIs client with service account
2. **Document Parsing**:
   - Extract text with formatting preservation
   - Identify and download inline images
   - Parse metadata (title, author, modified date)
3. **Sheet Processing**:
   - Read ranges with type inference
   - Handle merged cells and formulas
   - Map columns to SEO metadata fields
4. **Data Validation**: Enforce required fields, sanitize HTML
5. **Batch Operations**: Process up to 50 documents concurrently

# Validation Criteria
- 100% textual fidelity (character-perfect preservation)
- Image extraction success rate > 95%
- Sheet parsing handles 10k+ rows without OOM
- Automatic retry on rate limits (exponential backoff)