import { Badge } from "@/components/ui/badge";
import { ESTADOS_PEDIDO, type Pedido } from "@/types/Pedido";
import { CalendarDays, Package, ChevronRight } from "lucide-react";

type Props = {
    pedido: Pedido;
    onClick?: (pedido: Pedido) => void;
};

export function PedidoCard({ pedido, onClick }: Props) {
    const estado = ESTADOS_PEDIDO[pedido.id_estado_pedido];
    const totalItems = (pedido.detalle ?? []).reduce((s, d) => s + d.cantidad, 0);

    const fecha = new Date(pedido.fecha_pedido).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs cursor-pointer hover:border-blue-300 transition-colors active:bg-gray-50"
            onClick={() => onClick?.(pedido)}
        >
            <div className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {/* Fila 1: Pedido # + Cliente */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900 text-sm tracking-tight">
                            Pedido #{pedido.id_pedido}
                        </span>
                        {pedido.nombre_cliente && (
                            <span className="flex items-center gap-1 text-md font-semibold">
                                👤 {pedido.nombre_cliente}
                            </span>
                        )}
                    </div>

                    {/* Fila 2: Status + fecha + unidades */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold px-2 h-5 border ${estado.color}`}
                        >
                            {estado.label}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarDays className="w-3 h-3" />
                            {fecha}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Package className="w-3 h-3" />
                            {totalItems} unidad{totalItems !== 1 ? "es" : ""}
                        </span>
                    </div>

                    {pedido.notas && (
                        <p className="mt-2 text-xs text-yellow-800 truncate">
                            📝 {pedido.notas}
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2">
                    <span className="text-lg font-bold text-gray-900 tabular-nums">
                        ${pedido.total_pedido.toFixed(2)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            </div>
        </div>
    );
}
