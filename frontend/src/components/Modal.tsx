import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <div className="relative card w-full max-w-md mx-4 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#ded9eb] bg-white px-3.5 py-2.5 text-sm text-[#171527] placeholder-[#9b97a8] outline-none transition focus:border-[#7457ea] focus:ring-2 focus:ring-violet-100";

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#7457ea] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(116,87,234,0.2)] transition hover:bg-[#6043d6] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#ded9eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#625e70] transition hover:border-[#cfc5ed] hover:bg-[#faf9fd]";
