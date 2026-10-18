import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Rubik_Mono_One } from "next/font/google";
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
    <html lang="en" className={`${rubikMonoOne.variable} ${instrumentSerif.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
