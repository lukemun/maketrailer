import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MakeTrailer OS",
  description: "An open, local ad canvas your AI agent can operate.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
