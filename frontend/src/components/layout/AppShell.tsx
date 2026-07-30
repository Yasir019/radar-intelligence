import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Radar,
  Search,
  Settings,
  Swords,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../NotificationBell";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/competitors", label: "Competitors", icon: Building2 },
  { to: "/warroom", label: "War Room", icon: Swords },
  { to: "/ask", label: "Ask Radar", icon: MessageSquare },
  { to: "/brief", label: "AI Brief", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItems({ mobile = false, collapsed = false }: { mobile?: boolean; collapsed?: boolean }) {
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
              : `flex items-center rounded-xl py-2.5 text-[13px] font-semibold transition-all ${
                  collapsed ? "justify-center px-2" : "gap-3 px-3.5"
                } ${
                  isActive
                    ? "border border-white/15 bg-white/15 text-white shadow-[0_10px_24px_rgba(25,8,65,0.2)]"
                    : "text-white/68 hover:bg-white/10 hover:text-white"
                }`
          }
          title={collapsed ? label : undefined}
        >
          <Icon size={mobile ? 15 : 17} strokeWidth={2} />
          {!collapsed && label}
        </NavLink>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "RA";
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("radar-sidebar") === "collapsed");

  return (
    <div className="min-h-screen bg-[#f7f7fa] lg:flex">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-[linear-gradient(180deg,#46248F_0%,#35156f_58%,#281052_100%)] px-3 py-6 text-white shadow-[12px_0_35px_rgba(49,20,104,0.13)] transition-[width] duration-300 lg:flex ${
          collapsed ? "w-[78px]" : "w-[210px]"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 px-1"}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/12 text-white shadow-[0_8px_20px_rgba(28,8,70,0.24)]">
            <Radar size={19} strokeWidth={2.5} />
          </span>
          {!collapsed && <span className="text-lg font-extrabold tracking-[-0.04em] text-white">Radar.</span>}
        </div>

        <button
          type="button"
          onClick={() =>
            setCollapsed((current) => {
              localStorage.setItem("radar-sidebar", current ? "expanded" : "collapsed");
              return !current;
            })
          }
          className="absolute -right-3 top-[74px] z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#ddd7ea] bg-white text-[#46248F] shadow-md transition hover:scale-105"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <nav className="mt-14 flex flex-1 flex-col gap-2">
          <NavItems collapsed={collapsed} />
        </nav>

        <button
          onClick={logout}
          className={`flex items-center rounded-xl py-2.5 text-[13px] font-semibold text-white/68 transition hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center px-2" : "gap-3 px-3.5"
          }`}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut size={17} />
          {!collapsed && "Log out"}
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#ece9f1] bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-8">
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

        <nav className="flex gap-1 overflow-x-auto border-b border-[#ece9f1] bg-white px-4 pb-3 lg:hidden">
          <NavItems mobile />
        </nav>

        <main className="radar-main min-h-[calc(100vh-70px)] p-4 sm:p-6 lg:px-7 lg:pb-8 lg:pt-5">
          {children}
        </main>
      </div>
    </div>
  );
}
