import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexiDraft",
  description: "A modern rich-text note application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement { // <-- Add the return type here
  return (
    <html lang="en">
      <body className="vsc-initialized">
        {children}
      </body>
    </html>
  );
}