import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "F1 Manager 2027", description: "Lead an F1 constructor through the 2027 season." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
