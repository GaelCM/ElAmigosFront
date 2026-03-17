
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TablaCompras from "./components/tablaCompras";
import TablaGastos from "./components/tablaGastos";
import TablaMovimientos from "./components/tablaMovimientos";

type TabOption = "compras" | "gastos" | "movimientos";

export default function EgresosPage() {
    const [activeTab, setActiveTab] = useState<TabOption>("compras");
    const [hasTurno, setHasTurno] = useState<boolean>(false);
    const [turnoId, setTurnoId] = useState<number | null>(null);

    useEffect(() => {
        const checkTurno = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const storeCaja = await api?.getConfig("open_caja");
            const turnoDataString = localStorage.getItem("openCaja");

            const data = storeCaja || (turnoDataString ? JSON.parse(turnoDataString) : null);

            if (data && data.id_turno) {
                setHasTurno(true);
                setTurnoId(data.id_turno);
            }
        };
        checkTurno();
    }, []);

    if (!hasTurno) {
        return (
            <div className="flex flex-col items-center justify-center h-full pt-20">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle>Modulo No Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center">
                            No hay un turno activo. Por favor abra la caja para registrar egresos.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Egresos</h1>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-muted p-1 w-fit">
                <button
                    onClick={() => setActiveTab("compras")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${activeTab === "compras"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/50"
                        }`}
                >
                    Compras
                </button>
                <button
                    onClick={() => setActiveTab("gastos")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${activeTab === "gastos"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/50"
                        }`}
                >
                    Gastos
                </button>
                <button
                    onClick={() => setActiveTab("movimientos")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${activeTab === "movimientos"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/50"
                        }`}
                >
                    Otros Movimientos
                </button>
            </div>

            <div className="min-h-[500px]">
                {activeTab === "compras" && <TablaCompras turnoId={turnoId} />}
                {activeTab === "gastos" && <TablaGastos turnoId={turnoId} />}
                {activeTab === "movimientos" && <TablaMovimientos turnoId={turnoId} />}
            </div>
        </div>
    );
}