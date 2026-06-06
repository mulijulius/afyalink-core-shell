import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "afyalink-install-dismissed";

export function InstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
  };

  return (
    <div className="flex items-center gap-3 border-b bg-primary px-4 py-2 text-primary-foreground print:hidden">
      <Download className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs sm:text-sm">
        Install AfyaLink HMS on this device for faster access offline.
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs"
        onClick={dismiss}
      >
        Install
      </Button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded p-1 hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
