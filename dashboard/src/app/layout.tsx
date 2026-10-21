import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gateway API Dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950">{children}</body>
    </html>
  );
}
