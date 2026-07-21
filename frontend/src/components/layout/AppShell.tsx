import { Building2, FileText, LayoutDashboard, LogOut, Radar, Settings, Swords } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../NotificationBell";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/competitors", label: "Competitors", icon: Building2 },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/brief", label: "AI Brief", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Radar size={17} className="text-white" />
          </span>
          <div>
            <div className="text-[15px] font-semibold leading-tight text-gray-900">Radar</div>
            <div className="text-[11px] text-gray-400 leading-tight">Competitor Intelligence</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-gray-700">{user?.email}</div>
              {user?.demo_mode && (
                <span className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  DEMO MODE
                </span>
              )}
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-6 gap-3">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
