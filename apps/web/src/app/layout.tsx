import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bodyFont = localFont({
  src: [
    {
      path: "../../public/fonts/general-sans/GeneralSans-Variable.woff2",
      style: "normal",
      weight: "400 700",
    },
    {
      path: "../../public/fonts/general-sans/GeneralSans-VariableItalic.woff2",
      style: "italic",
      weight: "400 700",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "recAI",
  description:
    "Candidate profiles backed by verified recommendations and recruiter search grounded in real work evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
