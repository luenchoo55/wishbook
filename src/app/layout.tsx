import type { Metadata } from "next";
import { Cinzel, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  weight: ["400", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "心願畫冊 Wishbook",
  description: "想要的東西，先畫下來、放進資料夾。冷靜期過了還心動，再用心動基金帶它回家。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${cinzel.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
