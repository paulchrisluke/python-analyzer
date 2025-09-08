import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cranberry Hearing & Balance Center - Business Sale",
  description: "Exclusive business sale opportunity for established audiology practice with 22 years of excellence in hearing care.",
  keywords: ["audiology", "hearing center", "business sale", "Pittsburgh", "healthcare"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

