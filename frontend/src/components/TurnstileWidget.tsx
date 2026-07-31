import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export default function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let widgetId: string | undefined;
    let timer: number | undefined;
    let disposed = false;
    const render = () => {
      if (disposed || widgetId || !ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        action: "turnstile-spin-v2",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
      if (timer) window.clearInterval(timer);
    };
    const script = document.querySelector<HTMLScriptElement>('script[data-radar-turnstile]') ?? document.createElement("script");
    if (!window.turnstile) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.radarTurnstile = "true";
      if (!script.parentNode) document.head.appendChild(script);
    }
    render();
    timer = window.setInterval(render, 100);
    return () => {
      disposed = true;
      if (timer) window.clearInterval(timer);
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
    };
  }, [onToken]);
  return SITE_KEY ? <div ref={ref} className="min-h-[65px]" /> : null;
}
