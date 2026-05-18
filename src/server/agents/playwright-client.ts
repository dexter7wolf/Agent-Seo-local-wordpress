import { chromium, Browser, Page } from "playwright";

export class PlaywrightClient {
    private browser: Browser | null = null;

    async init() {
        this.browser = await chromium.launch({
            headless: process.env.NODE_ENV === "production",
            args: ["--disable-web-security"],
        });
    }

    async createPage(): Promise<Page> {
        if (!this.browser) await this.init();
        const context = await this.browser!.newContext();
        return await context.newPage();
    }

    async loginToWordPress(page: Page) {
        await page.goto(`${process.env.WP_URL}/wp-login.php`);
        await page.fill("#user_login", process.env.WP_USERNAME!);
        await page.fill("#user_pass", process.env.WP_APPLICATION_PASSWORD!); // Note: WordPress expects application password or user password
        await page.click("#wp-submit");
        await page.waitForURL(/wp-admin/);
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export const wpBrowser = new PlaywrightClient();
