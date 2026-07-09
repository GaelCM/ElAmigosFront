import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import { ESTADOS_PEDIDO, type DetallePedido, type Pedido } from "@/types/Pedido";
import { CalendarDays, CheckCircle2, Package, Trash2, ClipboardList, Edit2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
    pedido: Pedido | null;
    isOpen: boolean;
    onClose: () => void;
    onMarcarPreparado?: (idPedido: number) => void;
    onCancelar?: (idPedido: number) => void;
    onEditar?: (idPedido: number) => void;
    onCompletar?: (pedido: Pedido) => void;
    loading?: boolean;
};

export function PedidoDetailSheet({ pedido, isOpen, onClose, onMarcarPreparado, onCancelar, onEditar, onCompletar, loading }: Props) {
    const [checados, setChecados] = useState<Set<number>>(new Set());

    // Resetear checklist cuando cambia el pedido o se abre el sheet
    useEffect(() => {
        if (isOpen) {
            setChecados(new Set());
        }
    }, [isOpen, pedido?.id_pedido]);

    if (!pedido) return null;

    const estado = ESTADOS_PEDIDO[pedido.id_estado_pedido];
    const detalle: DetallePedido[] = pedido.detalle ?? [];
    const totalItems = detalle.reduce((s, d) => s + d.cantidad, 0);
    const todosChequeados = detalle.length > 0 && checados.size === detalle.length;

    const toggleCheck = (idx: number) => {
        setChecados((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const fecha = new Date(pedido.fecha_pedido).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Sheet ocupando 100dvh real en móvil para no ocultar botones bajo la barra del navegador */}
            <SheetContent side="right" className="w-[90vw] sm:w-full sm:max-w-md p-0 flex flex-col bg-gray-50 border-l-0 sm:border-l h-[100dvh] sm:h-full">

                {/* ── Cabecera ─────────────────────────────────────────── */}
                <SheetHeader className="px-5 py-4 bg-white border-b border-gray-200 text-left shrink-0">
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div className="min-w-0 flex-1">
                            <SheetTitle className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-gray-900 text-lg tracking-tight truncate">
                                    Pedido #{pedido.id_pedido}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={`text-[11px] font-semibold px-2 h-5 border ${estado.color}`}
                                >
                                    {estado.label}
                                </Badge>
                            </SheetTitle>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                {pedido.nombre_cliente && (
                                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                                        👤 {pedido.nombre_cliente}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {fecha}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5" />
                                    {totalItems} unidad{totalItems !== 1 ? "es" : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {pedido.notas && (
                        <div className="mt-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex gap-2 items-start">
                            <ClipboardList className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                            <p>{pedido.notas}</p>
                        </div>
                    )}
                </SheetHeader>

                {/* ── Lista de productos con checklist ─────────────────── */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                    {detalle.length > 0 && (
                        <>
                            {/* Barra de progreso (solo en pendiente) */}
                            {pedido.id_estado_pedido === 0 && (
                                <div className="px-5 pt-4 pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Progreso de preparación
                                        </span>
                                        <span className={`text-xs font-bold ${todosChequeados ? "text-green-600" : "text-blue-600"}`}>
                                            {checados.size} de {detalle.length}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${todosChequeados ? "bg-green-500" : "bg-blue-500"}`}
                                            style={{ width: `${detalle.length > 0 ? (checados.size / detalle.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="px-3 py-2 space-y-1">
                                {detalle.map((item, idx) => {
                                    const isChecked = checados.has(idx);
                                    const esPendiente = pedido.id_estado_pedido === 0;

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors cursor-pointer select-none border border-transparent ${esPendiente
                                                ? isChecked
                                                    ? "bg-green-50 border-green-100"
                                                    : "hover:bg-gray-50 active:bg-gray-100"
                                                : ""
                                                }`}
                                            onClick={() => esPendiente && toggleCheck(idx)}
                                        >
                                            {/* Checkbox (solo en pendiente) */}
                                            {esPendiente && (
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={() => toggleCheck(idx)}
                                                    className={`w-6 h-6 shrink-0 rounded-[6px] data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 ${isChecked ? "border-green-500 text-white" : "border-gray-300"}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}

                                            {/* Nombre + cantidad */}
                                            <div className="flex-1 min-w-0 flex items-center gap-2">
                                                <span className={`text-sm font-medium transition-colors truncate ${isChecked && esPendiente ? "line-through text-gray-400" : "text-gray-800"
                                                    }`}>
                                                    {item.nombre_producto}
                                                    {item.nombre_presentacion && (
                                                        <span className={`ml-1 ${isChecked && esPendiente ? "text-gray-400" : "text-blue-600"}`}>
                                                            {item.nombre_presentacion}
                                                        </span>
                                                    )}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] h-4 px-1.5 shrink-0 ${isChecked && esPendiente ? "border-green-200 text-green-600 bg-white" : "border-gray-200 text-gray-600"}`}
                                                >
                                                    ×{item.cantidad}
                                                </Badge>
                                            </div>

                                            {/* Subtotal */}
                                            <span className={`text-sm font-bold shrink-0 transition-colors ${isChecked && esPendiente ? "text-gray-400" : "text-gray-700"
                                                }`}>
                                                ${item.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Footer de acciones ────────────────────────────────── */}
                <div className="bg-white border-t border-gray-200 p-5 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">

                    <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</span>
                        <span className="text-2xl font-bold text-gray-900">${pedido.total_pedido.toFixed(2)}</span>
                    </div>

                    {pedido.id_estado_pedido === 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                className={`flex-1 h-12 rounded-xl text-base font-semibold transition-all ${todosChequeados
                                    ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                                disabled={loading || !todosChequeados}
                                onClick={() => {
                                    if (todosChequeados && onMarcarPreparado) {
                                        onMarcarPreparado(pedido.id_pedido);
                                    }
                                }}
                            >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                {todosChequeados ? "Listo para entregar" : `Verifica ${detalle.length - checados.size} producto${detalle.length - checados.size !== 1 ? "s" : ""}`}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-xl text-gray-400 border-gray-200 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50 shrink-0"
                                disabled={loading}
                                onClick={() => onEditar?.(pedido.id_pedido)}
                            >
                                <Edit2 className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-xl text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 shrink-0"
                                disabled={loading}
                                onClick={() => onCancelar?.(pedido.id_pedido)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {pedido.id_estado_pedido === 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md"
                                disabled={loading}
                                onClick={() => onCompletar?.(pedido)}
                            >
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                Cobrar pedido
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-xl text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 shrink-0"
                                disabled={loading}
                                onClick={() => onCancelar?.(pedido.id_pedido)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {(pedido.id_estado_pedido === 2 || pedido.id_estado_pedido === 3) && (
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                            <p className="text-sm font-medium text-gray-500">
                                {pedido.id_estado_pedido === 2 ? "✅ Venta registrada correctamente." : "🚫 Este pedido fue cancelado."}
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
