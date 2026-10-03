import type { Metadata } from "next";
import { Teleprompter } from "./Teleprompter";

export const metadata: Metadata = {
  title: "Bread · teleprompter",
  // a private speaking aid, not a page to surface in search
  robots: { index: false, follow: false },
};

export default function TeleprompterPage() {
  return <Teleprompter />;
}
