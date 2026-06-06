import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      setJustBack(true);
      setTimeout(() => setJustBack(false), 2500);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!online) {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-yellow-300 bg-yellow-100 px-4 py-1.5 text-xs font-medium text-yellow-900 print:hidden">
        <WifiOff className="h-3.5 w-3.5" />
        You are offline — changes will sync when connection is restored
      </div>
    );
  }
  if (justBack) {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-emerald-300 bg-emerald-100 px-4 py-1.5 text-xs font-medium text-emerald-900 print:hidden">
        <Wifi className="h-3.5 w-3.5" />
        Back online — syncing…
      </div>
    );
  }
  return null;
}
