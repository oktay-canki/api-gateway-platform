"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
  { href: "/home", label: "Dashboard" },
  { href: "/apis", label: "APIs" },
  { href: "/account", label: "Account" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        return;
      }

      router.push("/auth/login");
      router.refresh();
    } catch {
      alert("Failed to logout!");
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/home"
          className="text-lg font-semibold text-white transition hover:text-blue-400"
        >
          API Gateway
        </Link>

        <div className="flex items-center gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
