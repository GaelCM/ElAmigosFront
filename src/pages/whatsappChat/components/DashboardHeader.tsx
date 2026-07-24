import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [info, setInfo] = useState<{ phone?: string; verified_name?: string } | null>(null);

  useEffect(() => {
    fetch("https://cuevstiendas-wa-apichat.xj7zln.easypanel.host/api/connection/status")
      .then(res => res.json())
      .then(data => {
        if (data.status === "connected") {
          setInfo(data);
        }
      });
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
          WA
        </div>
        <div className="text-left">
          <h1 className="font-semibold text-gray-800 leading-tight text-sm">
            {info?.verified_name || "WhatsApp Agent"}
          </h1>
          <p className="text-[10px] text-gray-500">
            {info?.phone ? `+${info.phone}` : "Conectado"}
          </p>
        </div>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors cursor-pointer"
      >
        Probar conexión
      </button>
    </header>
  );
}
