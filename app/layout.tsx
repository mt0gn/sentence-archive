import type { Metadata } from "next";
import localFont from "next/font/local";
import { APP_DESCRIPTION, APP_NAME } from "./brand";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-ui-sans",
  display: "swap",
  weight: "45 920",
});

const mona12 = localFont({
  src: "../public/fonts/Mona12.woff2",
  variable: "--font-ui-mono",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — 텍스트 발췌 편집기`,
  description: APP_DESCRIPTION,
  icons: {
    icon: {
      url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.png`,
      type: "image/png",
      sizes: "64x64",
    },
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/favicon.png`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/apple-touch-icon.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} ${mona12.variable}`}>
        {children}
      </body>
    </html>
  );
}
