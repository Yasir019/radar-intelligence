import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Notification } from "../api/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso + "Z").getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => api.get<Notification[]>("/notifications").then((r) => setItems(r.data));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-96 card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
            )}
            {items.slice(0, 15).map((n) => (
              <Link
                key={n.id}
                to={n.change_event_id ? `/changes/${n.change_event_id}` : "#"}
                onClick={() => setOpen(false)}
                className={`block border-b border-gray-50 px-4 py-3 hover:bg-gray-50 ${
                  n.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-gray-900 truncate">{n.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</div>
                    <div className="mt-1 text-[11px] text-gray-400">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
