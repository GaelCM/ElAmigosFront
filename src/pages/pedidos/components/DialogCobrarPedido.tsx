import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { completarPedidoApi } from "@/api/pedidosApi/pedidoApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Pedido } from "@/types/Pedido";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Printer, Loader2, AlertCircle } from "lucide-react";

type Props = {
    pedido: Pedido | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
};

const METODOS_PAGO = [
    { value: "0", label: "Efectivo" },
    { value: "1", label: "Tarjeta" },
    { value: "2", label: "Credito (Cargo a cuenta)" },
];

type Estado = "Inicio" | "Cargando" | "Listo" | "Error";

export function DialogCobrarPedido({ pedido, isOpen, onClose, onSuccess }: Props) {
    const { user } = useCurrentUser();
    const [metodoPago, setMetodoPago] = useState("0");
    const [montoRecibido, setMontoRecibido] = useState("");
    const [turnoData, setTurnoData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [estado, setEstado] = useState<Estado>("Inicio");
    const [errorMessage, setErrorMessage] = useState("");
    const [ventaId, setVentaId] = useState<number | null>(null);

    // Cargar turno automáticamente
    useEffect(() => {
        const loadSettings = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const tDataStore = await api?.getConfig("open_caja");
            const tDataLocal = localStorage.getItem("open_caja");
            const tData = tDataStore || (tDataLocal ? JSON.parse(tDataLocal) : null);
            setTurnoData(tData);
        };
        if (isOpen) {
            setEstado("Inicio");
            setErrorMessage("");
            setVentaId(null);
            loadSettings();
        }
    }, [isOpen]);

    // Auto-cerrar 2 segundos después de éxito
    useEffect(() => {
        if (estado === "Listo") {
            const timer = setTimeout(() => {
                handleClose();
                onSuccess();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [estado]);

    const total = pedido?.total_pedido ?? 0;
    const montoNum = parseFloat(montoRecibido) || 0;
    const cambio = montoNum - total;

    const imprimirTicket = async (folio: number | string, isImprimir: boolean) => {
        try {
            // @ts-ignore
            const api = window["electron-api"];
            const printerName = await api?.getConfig("printer_device");

            if (!printerName) {
                toast.error("No se ha configurado una impresora en ajustes.");
                return;
            }

            if (isImprimir || Number(metodoPago) === 2) {
                const isCut = (await api?.getConfig("printer_cut")) !== false;
                const ticketData = {
                    printerName,
                    sucursal: "Sucursal " + user.sucursal,
                    id_sucursal: user.id_sucursal,
                    direccion_sucursal: user.direccion_sucursal,
                    telefono_sucursal: user.telefono_sucursal,
                    usuario: user.usuario,
                    cliente: pedido?.nombre_cliente || "Público General",
                    folio: folio,
                    fecha: new Date(),
                    productos: (pedido?.detalle ?? []).map((d) => ({
                        cantidad: d.cantidad,
                        nombre: `${d.nombre_producto}${d.nombre_presentacion ? " " + d.nombre_presentacion : ""}`,
                        importe: d.subtotal,
                    })),
                    total: total,
                    pagoCon: metodoPago === "0" ? montoNum : total,
                    cambio: metodoPago === "0" ? Math.max(0, cambio) : 0,
                    ahorro: 0,
                    turno: turnoData?.id_turno || "0",
                    metodo_pago: Number(metodoPago),
                    cortar: isCut,
                };

                await api?.printTicketVentaEscPos(ticketData);
                toast.success("Ticket enviado a imprimir");
            } else {
                await api?.openCashDrawer(printerName);
            }
        } catch (e) {
            console.error("Error al imprimir ticket:", e);
            toast.error("No se pudo imprimir el ticket", { duration: 2000 });
        }
    };

    const handleSubmit = async (isImprimir: boolean) => {
        if (!pedido) return;

        if (!turnoData?.id_turno) {
            toast.error("No hay un turno de caja abierto.");
            return;
        }

        if (metodoPago !== "2" && montoNum < total) {
            toast.error("El monto recibido no puede ser menor al total.");
            return;
        }

        setLoading(true);
        setEstado("Cargando");
        try {
            const res = await completarPedidoApi(pedido.id_pedido, {
                id_usuario: user.id_usuario,
                id_turno: Number(turnoData.id_turno),
                metodo_pago: Number(metodoPago),
                monto_recibido: metodoPago === "2" ? total : montoNum,
            });

            if (res.success) {
                const idVenta = res.data?.id_venta;
                setVentaId(idVenta ?? null);
                toast.success(
                    `Pedido #${pedido.id_pedido} cobrado. Venta #${idVenta} registrada.`
                );

                // Imprimir ticket
                await imprimirTicket(idVenta ?? "S/N", isImprimir);

                setEstado("Listo");
            } else {
                setErrorMessage(res.message || "Error al completar el pedido.");
                setEstado("Error");
            }
        } catch {
            setErrorMessage("Error de conexión.");
            setEstado("Error");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setMetodoPago("0");
        setMontoRecibido("");
        setEstado("Inicio");
        setErrorMessage("");
        setVentaId(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">
                        Cobrar Pedido #{pedido?.id_pedido}
                        {pedido?.nombre_cliente && (
                            <span className="ml-2 text-sm font-normal text-blue-700">
                                · {pedido.nombre_cliente}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Estado: Inicio ────────────────────────────────── */}
                {estado === "Inicio" && (
                    <div className="space-y-4 py-2">
                        {/* Total */}
                        <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center border border-gray-200">
                            <span className="text-sm text-gray-600">Total del pedido</span>
                            <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                        </div>

                        {/* Método de pago */}
                        <div className="space-y-1.5">
                            <Label htmlFor="metodo-pago" className="text-sm font-medium text-gray-700">
                                Método de pago
                            </Label>
                            <Select value={metodoPago} onValueChange={setMetodoPago}>
                                <SelectTrigger id="metodo-pago" className="w-full">
                                    <SelectValue placeholder="Selecciona método" />
                                </SelectTrigger>
                                <SelectContent>
                                    {METODOS_PAGO.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!turnoData && (
                            <div className="bg-red-50 text-red-700 text-sm p-3 rounded border border-red-200">
                                <strong>Advertencia:</strong> No hay un turno de caja abierto. No podrás registrar la venta.
                            </div>
                        )}

                        {/* Monto recibido */}
                        {metodoPago !== "2" && (
                            <div className="space-y-1.5">
                                <Label htmlFor="monto-recibido" className="text-sm font-medium text-gray-700">
                                    Monto recibido
                                </Label>
                                <Input
                                    id="monto-recibido"
                                    type="number"
                                    placeholder={`Mínimo $${total.toFixed(2)}`}
                                    value={montoRecibido}
                                    onChange={(e) => setMontoRecibido(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Cambio */}
                        {metodoPago !== "2" && montoRecibido !== "" && (
                            <>
                                <Separator />
                                <div className={`flex justify-between text-sm font-semibold rounded px-3 py-2 ${cambio >= 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"}`}>
                                    <span>Cambio</span>
                                    <span>${Math.max(0, cambio).toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {metodoPago === "2" && (
                            <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-3 py-2">
                                Se cargará ${total.toFixed(2)} a la cuenta de crédito del cliente.
                            </p>
                        )}

                        {/* Botones */}
                        <div className="flex flex-col gap-2 pt-1">
                            <Button
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2"
                                onClick={() => handleSubmit(true)}
                                disabled={loading || !turnoData?.id_turno}
                            >
                                <Printer className="w-4 h-4" />
                                Registrar e imprimir ticket
                            </Button>
                            <Button
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                onClick={() => handleSubmit(false)}
                                disabled={loading || !turnoData?.id_turno}
                            >
                                Registrar sin ticket
                            </Button>
                            <Button variant="outline" onClick={handleClose} disabled={loading} className="w-full h-10">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Estado: Cargando ──────────────────────────────── */}
                {estado === "Cargando" && (
                    <div className="py-10 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        <p className="text-sm text-gray-500">Procesando venta...</p>
                    </div>
                )}

                {/* ── Estado: Listo ────────────────────────────────── */}
                {estado === "Listo" && (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <Check className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">¡Venta registrada!</p>
                        {ventaId && (
                            <p className="text-sm text-gray-500">Folio de venta: <strong>#{ventaId}</strong></p>
                        )}
                        {metodoPago === "0" && (
                            <p className="text-3xl font-bold text-green-700">
                                Cambio: ${Math.max(0, cambio).toFixed(2)}
                            </p>
                        )}
                        <p className="text-xs text-gray-400">Cerrando en unos segundos...</p>
                    </div>
                )}

                {/* ── Estado: Error ────────────────────────────────── */}
                {estado === "Error" && (
                    <div className="py-6 flex flex-col items-center justify-center gap-3">
                        <div className="p-2 rounded-full bg-red-100 text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-base font-semibold text-gray-900">Error</p>
                        <p className="text-sm text-red-500 text-center max-w-xs">{errorMessage}</p>
                        <div className="flex gap-2 w-full mt-2">
                            <Button variant="outline" className="flex-1" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button className="flex-1" onClick={() => setEstado("Inicio")}>
                                Volver
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
