import type { Metadata } from "next";
import { Quantico as FontSans, Geist_Mono as FontMono } from "next/font/google";
import "./globals.css";

const fontSans = FontSans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400",
});

const fontMono = FontMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Card Oracle - Magic: The Gathering",
  description:
    "An agentic application that helps you find Magic: The Gathering cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
