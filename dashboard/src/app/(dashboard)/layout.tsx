import { Navbar } from "@/components/layout/navbar";

export default function UiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {children}
    </div>
  );
}
