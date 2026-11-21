import type { Metadata } from "next";
import { Inter, Noto_Sans_Telugu, Anek_Telugu } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { landingContent } from "@/lib/landing-content";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-telugu",
  display: "swap",
});

const teluguHeading = Anek_Telugu({
  subsets: ["telugu"],
  weight: ["500", "600", "700"],
  variable: "--font-telugu-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: landingContent.meta.title.te,
  description: landingContent.meta.description.te,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="te"
      className={`${inter.variable} ${telugu.variable} ${teluguHeading.variable}`}
    >
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
