import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Inter, Rubik_Mono_One } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const rubikMonoOne = Rubik_Mono_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rubik-one",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sfRounded = localFont({
  src: "../fonts/sf-pro-rounded-heavy.woff2",
  weight: "800",
  variable: "--font-sf-rounded",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://breadapp.fun"),
  title: "Bread",
  description: "Turn market theses into tradeable sandwiches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rubikMonoOne.variable} ${instrumentSerif.variable} ${geistMono.variable} ${inter.variable} ${sfRounded.variable}`}>
      <body>{children}</body>
    </html>
  );
}
