import type { Metadata } from "next"
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeachLink",
  description: "Connect with teachers and students",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/teachlink-logo.png", sizes: "32x32", type: "image/png" },
      { url: "/teachlink-logo.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/teachlink-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/teachlink-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/teachlink-logo.png" />
        <link rel="apple-touch-icon" href="/teachlink-logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
