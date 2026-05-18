import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Agent SEO - Local WordPress Automation",
    description: "Autonomous SEO article publication pipeline",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
