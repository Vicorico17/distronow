import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DistroNow",
  description: "Turn a website into a reusable brand profile for distribution content."
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
