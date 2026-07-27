import {
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Radar,
  Search,
  Settings,
  Swords,
} from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../NotificationBell";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/competitors", label: "Competitors", icon: Building2 },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/brief", label: "AI Brief", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItems({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            mobile
              ? `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive ? "bg-[#7457ea] text-white" : "text-[#747080]"
                }`
              : `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-[#7457ea] text-white shadow-[0_8px_20px_rgba(116,87,234,0.22)]"
                    : "text-[#7d7988] hover:bg-[#f4f1fb] hover:text-[#171527]"
                }`
          }
        >
          <Icon size={mobile ? 15 : 17} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "RA";

  return (
    <div className="min-h-screen bg-[#f3f1f8] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[178px] shrink-0 flex-col bg-white px-4 py-7 lg:flex">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7457ea] text-white shadow-[0_8px_20px_rgba(116,87,234,0.24)]">
            <Radar size={19} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-extrabold tracking-[-0.04em] text-[#171527]">Radar.</span>
        </div>

        <nav className="mt-16 flex flex-1 flex-col gap-2">
          <NavItems />
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#817d8d] transition hover:bg-[#f4f1fb] hover:text-[#171527]"
        >
          <LogOut size={17} />
          Log out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/60 bg-[#f3f1f8]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7457ea] text-white">
              <Radar size={17} />
            </span>
            <span className="font-extrabold tracking-tight text-[#171527]">Radar.</span>
          </div>

          <label className="hidden w-full max-w-[360px] items-center gap-2.5 text-[#91a0b4] sm:flex">
            <Search size={16} />
            <input
              aria-label="Search"
              placeholder="Search intelligence"
              className="w-full border-0 bg-transparent p-0 text-sm text-[#34435a] outline-none placeholder:text-[#a4b0c0] focus:ring-0"
            />
          </label>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-7 w-px bg-[#dbe6f3]" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171527] text-[10px] font-bold text-white">
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="max-w-36 truncate text-xs font-bold text-[#24324a]">
                  {user?.email?.split("@")[0]}
                </div>
                <div className="text-[10px] text-[#96a3b4]">
                  {user?.demo_mode ? "Demo workspace" : "Radar workspace"}
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-white/70 bg-[#f3f1f8] px-4 pb-3 lg:hidden">
          <NavItems mobile />
        </nav>

        <main className="radar-main min-h-[calc(100vh-76px)] p-4 sm:p-7 lg:px-10 lg:pb-10 lg:pt-5">
          {children}
        </main>
      </div>
    </div>
  );
}
