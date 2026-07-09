import { cancelarPedidoApi, marcarPreparadoApi, obtenerPedidosApi } from "@/api/pedidosApi/pedidoApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Pedido } from "@/types/Pedido";
import { CheckCircle2, ClipboardList, Plus, RefreshCw, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PedidoCard } from "./components/PedidoCard";
import { DialogCobrarPedido } from "./components/DialogCobrarPedido";
import { PedidoDetailSheet } from "./components/PedidoDetailSheet";

export default function PedidosPage() {
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    const [pedidosPendientes, setPedidosPendientes] = useState<Pedido[]>([]);
    const [pedidosPreparados, setPedidosPreparados] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Estado para el Sheet de detalles del pedido
    const [pedidoDetalleAbierto, setPedidoDetalleAbierto] = useState<Pedido | null>(null);

    // Dialog cobrar
    const [pedidoACobrar, setPedidoACobrar] = useState<Pedido | null>(null);

    const cargarPedidos = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [resPend, resPre] = await Promise.all([
                obtenerPedidosApi(user.id_sucursal, 0),
                obtenerPedidosApi(user.id_sucursal, 1),
            ]);

            setPedidosPendientes(resPend.success ? resPend.data : []);
            setPedidosPreparados(resPre.success ? resPre.data : []);
        } catch {
            if (!isSilent) toast.error("Error al cargar pedidos.");
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, [user.id_sucursal]);

    useEffect(() => {
        cargarPedidos();

        // Auto-actualizar cada 30 segundos silenciosamente (para no saturar la API)
        const interval = setInterval(() => {
            cargarPedidos(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [cargarPedidos]);

    const handleMarcarPreparado = async (idPedido: number) => {
        setActionLoading(true);
        try {
            const res = await marcarPreparadoApi(idPedido);
            if (res.success) {
                toast.success(`Pedido #${idPedido} marcado como preparado.`);
                setPedidoDetalleAbierto(null); // Cerrar sheet al completar
                cargarPedidos();
            } else {
                toast.error(res.message || "Error al actualizar el pedido.");
            }
        } catch {
            toast.error("Error de conexión.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelar = async (idPedido: number) => {
        setActionLoading(true);
        try {
            const res = await cancelarPedidoApi(idPedido);
            if (res.success) {
                toast.success(`Pedido #${idPedido} cancelado.`);
                setPedidoDetalleAbierto(null); // Cerrar sheet al cancelar
                cargarPedidos();
            } else {
                toast.error(res.message || "Error al cancelar el pedido.");
            }
        } catch {
            toast.error("Error de conexión.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Pedidos</h1>
                        <p className="text-xs text-gray-500">{user.sucursal}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => cargarPedidos()}
                        disabled={loading}
                        className="w-10 h-10 rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                        className="h-10 px-4 gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                        onClick={() => navigate("/pedidos/nuevo")}
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 min-h-0 overflow-hidden px-3 py-3">
                <Tabs defaultValue="pendientes" className="h-full flex flex-col">
                    <TabsList className="w-full mb-3 grid grid-cols-2 bg-gray-100 h-12 rounded-xl">
                        <TabsTrigger
                            value="pendientes"
                            className="gap-1.5 h-10 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Pendientes
                            {pedidosPendientes.length > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-bold ml-0.5 px-1.5 h-5" variant="outline">
                                    {pedidosPendientes.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="preparados"
                            className="gap-1.5 h-10 rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm"
                        >
                            <XCircle className="w-4 h-4" />
                            Preparados
                            {pedidosPreparados.length > 0 && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-bold ml-0.5 px-1.5 h-5" variant="outline">
                                    {pedidosPreparados.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Pendientes */}
                    <TabsContent value="pendientes" className="flex-1 min-h-0 overflow-y-auto mt-0 space-y-3">
                        {loading ? (
                            <ListSkeleton />
                        ) : pedidosPendientes.length === 0 ? (
                            <EmptyState mensaje="No hay pedidos pendientes" />
                        ) : (
                            pedidosPendientes.map((pedido) => (
                                <PedidoCard
                                    key={pedido.id_pedido}
                                    pedido={pedido}
                                    onClick={(p) => setPedidoDetalleAbierto(p)}
                                />
                            ))
                        )}
                    </TabsContent>

                    {/* Preparados */}
                    <TabsContent value="preparados" className="flex-1 min-h-0 overflow-y-auto mt-0 space-y-3">
                        {loading ? (
                            <ListSkeleton />
                        ) : pedidosPreparados.length === 0 ? (
                            <EmptyState mensaje="No hay pedidos preparados por cobrar" />
                        ) : (
                            pedidosPreparados.map((pedido) => (
                                <PedidoCard
                                    key={pedido.id_pedido}
                                    pedido={pedido}
                                    onClick={(p) => setPedidoDetalleAbierto(p)}
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialog cobrar */}
            <DialogCobrarPedido
                pedido={pedidoACobrar}
                isOpen={!!pedidoACobrar}
                onClose={() => setPedidoACobrar(null)}
                onSuccess={() => {
                    setPedidoDetalleAbierto(null);
                    cargarPedidos();
                }}
            />

            {/* Sheet detalle de pedido */}
            <PedidoDetailSheet
                pedido={pedidoDetalleAbierto}
                isOpen={!!pedidoDetalleAbierto}
                onClose={() => setPedidoDetalleAbierto(null)}
                onMarcarPreparado={handleMarcarPreparado}
                onCancelar={handleCancelar}
                onEditar={(idPedido) => {
                    setPedidoDetalleAbierto(null);
                    navigate(`/pedidos/editar/${idPedido}`);
                }}
                onCompletar={(p) => setPedidoACobrar(p)}
                loading={actionLoading}
            />
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function EmptyState({ mensaje }: { mensaje: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mb-3 opacity-25" />
            <p className="text-sm font-medium">{mensaje}</p>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                    <div className="flex justify-between mb-3">
                        <div className="h-5 bg-gray-200 rounded-lg w-28" />
                        <div className="h-5 bg-gray-200 rounded-lg w-16" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-48 mb-2" />
                    <div className="h-12 bg-gray-100 rounded-xl w-full mt-3" />
                </div>
            ))}
        </div>
    );
}
