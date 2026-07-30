import {
  Building2,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
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
  { to: "/ask", label: "Ask Radar", icon: MessageSquare },
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
                    ? "bg-[#f0edff] text-[#4d2eae]"
                    : "text-[#5f6879] hover:bg-[#f7f6fa] hover:text-[#211b2a]"
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
    <div className="min-h-screen bg-[#f7f7fa] lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[184px] shrink-0 flex-col border-r border-[#e7e3ea] bg-white px-2.5 py-5 text-[#211b2a] lg:flex">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#6541cf] text-white shadow-[0_6px_14px_rgba(101,65,207,0.2)]">
            <Radar size={17} strokeWidth={2.5} />
          </span>
          <span className="text-[18px] font-extrabold tracking-[-0.04em] text-[#17142b]">Radar.</span>
        </div>

        <nav className="mt-12 flex flex-1 flex-col gap-1.5">
          <NavItems />
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-[#60697a] transition hover:bg-[#f7f6fa] hover:text-[#211b2a]"
        >
          <LogOut size={17} />
          Log out
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-[#e7e3ea] bg-white/95 px-4 backdrop-blur-xl sm:px-7 lg:px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7457ea] text-white">
              <Radar size={17} />
            </span>
            <span className="font-extrabold tracking-tight text-[#171527]">Radar.</span>
          </div>

          <label className="hidden h-10 w-full max-w-[430px] items-center gap-2.5 rounded-lg border border-[#ddd9e1] bg-white px-3 text-[#7f7885] shadow-[0_1px_3px_rgba(35,24,48,0.03)] transition focus-within:border-[#9d87d8] focus-within:ring-2 focus-within:ring-[#ede8fa] sm:flex">
            <Search size={15} />
            <input
              aria-label="Search"
              placeholder="Search intelligence"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12px] text-[#3b3542] outline-none placeholder:text-[#9e98a3] focus:ring-0"
            />
            <span className="inline-flex h-6 items-center gap-1 rounded-md border border-[#e5e1e8] bg-[#faf9fb] px-2 text-[9px] font-bold text-[#8a8490]">
              ⌘ K
            </span>
          </label>

          <div className="flex items-center gap-4 sm:gap-5">
            <NotificationBell />
            <div className="h-8 w-px bg-[#e4e0e7]" />
            <button type="button" className="flex items-center gap-2.5 rounded-lg py-1 text-left">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17142d] text-[10px] font-bold text-white">
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <div className="max-w-36 truncate text-[11px] font-extrabold text-[#282231]">
                  {user?.email?.split("@")[0]}
                </div>
                <div className="mt-0.5 text-[9px] text-[#8f8995]">
                  {user?.demo_mode ? "Demo workspace" : "Radar workspace"}
                </div>
              </div>
              <ChevronDown size={13} className="ml-2 hidden text-[#837d88] sm:block" />
            </button>
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
