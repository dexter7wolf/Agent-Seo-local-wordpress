# .context/decisions/adr-001-core-architecture.md

```markdown
# ADR-001: Core Architecture for Local SEO Agent Framework

**Status:** Accepted  
**Date:** 2024-01-01  
**Deciders:** Technical Lead

## Decision

Adopt event-driven pipeline architecture with clear separation between orchestration layer (Next.js/tRPC) and execution layer (browser automation agents).

## Context

Building autonomous SEO workflow requires:
- Non-blocking execution of long-running browser automation tasks
- Real-time progress tracking for multi-article batch processing
- Fault tolerance for flaky WordPress interactions
- Local LLM integration without blocking web UI

## Chosen Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web UI        │────▶│  tRPC API        │────▶│ Task Queue      │
│  (Next.js 15)   │◀────│  (Procedures)    │◀────│ (BullMQ/Redis)  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
┌─────────────────┐     ┌──────────────────┐              ▼
│ Google Docs API │◀────│ Agent Workers    │     ┌─────────────────┐
│ Google Sheets   │     │ (Playwright)     │────▶│ WordPress       │
└─────────────────┘     └──────────────────┘     │ (Browser-use)   │
                                ▲                 └─────────────────┘
                                │
                        ┌───────┴────────┐
                        │ Ollama/LM      │
                        │ Studio          │
                        └────────────────┘
```

## Consequences

**Positive:**
- Browser automation runs in isolated worker processes
- UI remains responsive during 10+ minute workflows
- Failed WordPress operations can retry without losing progress
- LLM calls don't block HTTP request lifecycle

**Negative:**
- Additional Redis dependency for task queue
- Complex error propagation across process boundaries
- Requires WebSocket/SSE for real-time progress updates

## Alternatives Rejected

1. **Synchronous API calls**: Would timeout on long WordPress operations
2. **Serverless functions**: Cold starts incompatible with stateful browser sessions
3. **Direct browser control from Next.js**: Would block event loop, crash on memory spikes
```

# .context/decisions/adr-002-browser-automation-strategy.md

```markdown
# ADR-002: Browser Automation Strategy

**Status:** Accepted  
**Date:** 2024-01-01  
**Deciders:** Technical Lead

## Decision

Use Playwright with Browser-use wrapper for WordPress automation, running in dedicated worker processes with persistent browser contexts.

## Context

WordPress admin requires:
- Complex DOM interactions (TinyMCE editor, media modal, Yoast fields)
- Session persistence across multiple articles
- Screenshot evidence for debugging failures
- Handling of dynamic AJAX-loaded content

## Implementation

```typescript
// Worker process manages browser lifecycle
class WordPressAgent {
  private browser: Browser;
  private context: BrowserContext;
  
  async initialize() {
    this.browser = await chromium.launch({
      headless: false, // Debug mode for local development
      args: ['--disable-blink-features=AutomationControlled']
    });
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1920, height: 1080 },
      storageState: './sessions/wordpress.json' // Persist login
    });
  }
  
  async createDraft(article: ParsedArticle): Promise<DraftResult> {
    const page = await this.context.newPage();
    // Browser-use intelligent element selection
    await page.click('text="Add New Post"');
    // Wait for TinyMCE initialization
    await page.waitForFunction(() => window.tinyMCE?.activeEditor?.initialized);
    // ... automation logic
  }
}
```

## Consequences

**Positive:**
- Persistent sessions reduce login overhead by 90%
- Visual debugging with screenshots on failure
- Handles JavaScript-heavy WordPress plugins

**Negative:**
- 500MB+ memory per browser instance
- Requires Xvfb for headless Linux deployment
- Browser crashes need graceful recovery
```

# .context/decisions/adr-003-llm-integration.md

```markdown
# ADR-003: Local LLM Integration Pattern

**Status:** Accepted  
**Date:** 2024-01-01  
**Deciders:** Technical Lead

## Decision

Integrate Ollama/LM Studio via HTTP API with streaming responses, dedicated retry logic, and model-specific prompt templates.

## Context

Local LLM requirements:
- Generate SEO-optimized alt text from images
- Extract key entities from articles for Yoast fields
- Run fully offline without external API dependencies
- Support model switching without code changes

## Implementation

```typescript
// LLM service with model abstraction
class LocalLLMService {
  private baseUrl: string;
  private model: string;
  
  constructor() {
    this.baseUrl = process.env.LLM_BASE_URL || 'http://localhost:11434';
    this.model = process.env.LLM_MODEL || 'llama2:13b';
  }
  
  async generateAltText(imageBuffer: Buffer): Promise<string> {
    const base64 = imageBuffer.toString('base64');
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: `Generate SEO-optimized alt text for this image. Maximum 125 characters. No quotes. Image: [base64:${base64}]`,
        stream: false,
        options: {
          temperature: 0.3, // Low creativity for consistency
          max_tokens: 50
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response.trim();
  }
}
```

## Consequences

**Positive:**
- Zero external API costs
- Sub-second response times with local inference
- Complete data privacy for client content

**Negative:**
- Requires 16GB+ RAM for quality models
- Model download/setup complexity for non-technical users
- Variable output quality compared to GPT-4
```

# .context/decisions/adr-004-data-source-integration.md

```markdown
# ADR-004: Google Workspace Data Integration

**Status:** Accepted  
**Date:** 2024-01-01  
**Deciders:** Technical Lead

## Decision

Use Google APIs with service account authentication for Docs/Sheets access, implementing intelligent parsing with 1:1 fidelity preservation.

## Context

Data integration needs:
- Parse complex Google Docs with inline images
- Map Sheet rows to article metadata
- Preserve exact formatting and whitespace
- Handle large documents (10MB+) efficiently

## Implementation

```typescript
// Document parser with fidelity preservation
class GoogleDocsParser {
  private docs: docs_v1.Docs;
  
  async parseDocument(documentId: string): Promise<ParsedArticle> {
    const doc = await this.docs.documents.get({ documentId });
    const content = doc.data.body.content;
    
    let markdown = '';
    const images: ExtractedImage[] = [];
    
    for (const element of content) {
      if (element.paragraph) {
        // Preserve exact whitespace and formatting
        const text = element.paragraph.elements
          .map(e => e.textRun?.content || '')
          .join('');
        
        // Detect and preserve line breaks
        if (text === '\n') {
          markdown += '\n\n';
        } else {
          markdown += this.applyFormatting(element.paragraph);
        }
      } else if (element.inlineObjectElement) {
        const imageId = element.inlineObjectElement.inlineObjectId;
        const imageUrl = doc.data.inlineObjects[imageId].inlineObjectProperties.embeddedObject.imageProperties.contentUri;
        
        images.push({
          id: imageId,
          url: imageUrl,
          position: markdown.length
        });
        
        markdown += `![image-${images.length}]`;
      }
    }
    
    return { markdown, images, metadata: this.extractMetadata(doc) };
  }
}
```

## Consequences

**Positive:**
- Direct API access without OAuth flow complexity
- Batch operations for multi-document processing
- Preserves all Google Docs formatting nuances

**Negative:**
- Service account setup requires admin permissions
- API rate limits (300 requests/minute)
- Complex parsing logic for nested structures
```

# .context/style-guide.md

```markdown
# TypeScript Style Guide for Local SEO Agent Framework

## Type Safety [CORE]

```typescript
// ✅ ALWAYS: Explicit return types and strict null checks
async function parseArticle(docId: string): Promise<ParsedArticle | null> {
  if (!docId) return null;
  // ...
}

// ❌ NEVER: Implicit any or loose typing
async function parseArticle(docId) { // Missing types
  return await getSomething(); // Unknown return type
}
```

## Error Handling [CORE]

```typescript
// ✅ ALWAYS: Typed errors with context
class WordPressError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_FAILED' | 'ELEMENT_NOT_FOUND' | 'TIMEOUT',
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
  }
}

try {
  await page.click('#publish-button');
} catch (error) {
  throw new WordPressError(
    'Failed to publish article',
    'ELEMENT_NOT_FOUND',
    { selector: '#publish-button', url: page.url() }
  );
}

// ❌ NEVER: Generic catch without context
catch (e) {
  console.log('Error:', e);
}
```

## Async Patterns [CORE]

```typescript
// ✅ ALWAYS: Promise.allSettled for parallel operations
const results = await Promise.allSettled(
  articles.map(article => processArticle(article))
);

const successful = results
  .filter((r): r is PromiseFulfilledResult<ProcessedArticle> => r.status === 'fulfilled')
  .map(r => r.value);

// ❌ NEVER: Unhandled promise rejections
articles.forEach(async (article) => {
  await processArticle(article); // No error handling!
});
```

## Database Queries (Drizzle) [STACK]

```typescript
// ✅ ALWAYS: Type-safe queries with proper joins
const articlesWithImages = await db
  .select({
    id: articles.id,
    title: articles.title,
    images: sql<string[]>`array_agg(${images.url})`.as('images')
  })
  .from(articles)
  .leftJoin(images, eq(images.articleId, articles.id))
  .groupBy(articles.id)
  .where(eq(articles.status, 'pending'));

// ❌ NEVER: Raw SQL without type safety
const result = await db.execute(sql`SELECT * FROM articles`);
```

## tRPC Procedures [STACK]

```typescript
// ✅ ALWAYS: Input validation with Zod
export const articleRouter = router({
  create: protectedProcedure
    .input(z.object({
      docId: z.string().regex(/^[a-zA-Z0-9-_]{25,}$/),
      publish: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      // Implementation
    })
});

// ❌ NEVER: Trust client input without validation
.input((val: any) => val as ArticleInput)
```

## Component Patterns (React) [STACK]

```typescript
// ✅ ALWAYS: Explicit props interfaces
interface ArticleCardProps {
  article: Article;
  onPublish: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function ArticleCard({ article, onPublish, isLoading = false }: ArticleCardProps) {
  // Implementation
}

// ❌ NEVER: Props spreading without types
export function ArticleCard(props: any) {
  return <div {...props} />;
}
```

## Naming Conventions

- **Files**: kebab-case (`wordpress-agent.ts`, `parse-document.ts`)
- **Classes**: PascalCase (`WordPressAgent`, `DocumentParser`)
- **Functions**: camelCase (`parseArticle`, `extractImages`)
- **Constants**: SCREAMING_SNAKE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with 'I' prefix for DTOs only (`IArticleDTO`)
- **Types**: PascalCase (`ParsedArticle`, `AgentStatus`)

## File Organization

```
src/
├── server/
│   ├── api/          # tRPC routers
│   ├── db/           # Drizzle schemas and migrations
│   ├── services/     # Business logic
│   └── agents/       # Browser automation workers
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Shared utilities
└── types/            # Shared TypeScript types
```

## Testing Patterns

```typescript
// ✅ ALWAYS: Descriptive test names with AAA pattern
describe('WordPressAgent', () => {
  it('should create draft with all metadata fields populated', async () => {
    // Arrange
    const article = createMockArticle({ title: 'Test Article' });
    const agent = new WordPressAgent();
    
    // Act
    const result = await agent.createDraft(article);
    
    // Assert
    expect(result.draftId).toMatch(/^\d+$/);
    expect(result.status).toBe('draft');
  });
});

// ❌ NEVER: Vague test names or missing assertions
it('works', () => {
  const agent = new WordPressAgent();
  agent.createDraft({}); // No assertion!
});
```

## Performance Patterns

```typescript
// ✅ ALWAYS: Batch operations and connection pooling
const imageBuffers = await Promise.all(
  images.map(img => 
    fetch(img.url).then(r => r.arrayBuffer())
  )
);

// ❌ NEVER: Sequential operations in loops
for (const image of images) {
  const buffer = await fetch(image.url).then(r => r.arrayBuffer());
  await processImage(buffer);
}
```
```