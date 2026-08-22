import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DistroNow Marketing OS",
  description: "Create, organize, distribute, and measure brand content from one workspace."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
