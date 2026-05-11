import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Columns3, Shield } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import TenantSwitcher from "../header/TenantSwitcher";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/board", label: "Board", icon: Columns3 },
  { path: "/admin", label: "Admin", icon: Shield },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-surface-900">MarketFlow</h1>
            <TenantSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-surface-600">{session?.user.name}</span>
            <button onClick={handleSignOut} className="btn-ghost text-sm">Sign out</button>
          </div>
        </div>
        <nav className="border-t border-surface-100">
          <div className="mx-auto flex max-w-7xl gap-1 px-6">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-[var(--clr-primary,#0070c4)] text-[var(--clr-primary,#0070c4)]"
                      : "border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
