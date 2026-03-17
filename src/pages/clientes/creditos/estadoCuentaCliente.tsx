import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
    getCreditoCliente,
    getHistorialCliente,
    registrarAbono,
    liquidarDeuda,
    configurarCredito,
} from "@/api/creditosApi/creditosApi";
import type { CreditoCliente, MovimientoCredito } from "@/types/Creditos";
import { useCurrentUser } from "@/contexts/currentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    CreditCard,
    TrendingDown,
    CheckCircle,
    RefreshCw,
    DollarSign,
    Banknote,
    ShoppingCart,
    Settings,
    AlertTriangle,
    Clock,
    Receipt,
    XCircle,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_ICONS: Record<string, React.ReactNode> = {
    cargo: <ShoppingCart className="h-4 w-4 text-destructive" />,
    abono: <TrendingDown className="h-4 w-4 text-green-500" />,
    liquidado: <CheckCircle className="h-4 w-4 text-blue-500" />,
    venta_cancelada: <XCircle className="h-4 w-4 text-red-500" />,
};

const TIPO_LABELS: Record<string, string> = {
    cargo: "Venta a crédito",
    abono: "Abono",
    liquidado: "Liquidación total",
    venta_cancelada: "Venta cancelada",
};

export default function EstadoCuentaCliente() {
    const { id_cliente } = useParams<{ id_cliente: string }>();
    const navigate = useNavigate();
    const { user } = useCurrentUser();

    const [credito, setCredito] = useState<CreditoCliente | null>(null);
    const [historial, setHistorial] = useState<MovimientoCredito[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accionLoading, setAccionLoading] = useState(false);
    const [accionMsg, setAccionMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

    // Dialogs
    const [dialogAbono, setDialogAbono] = useState(false);
    const [dialogLiquidar, setDialogLiquidar] = useState(false);
    const [dialogLimite, setDialogLimite] = useState(false);

    const [montoAbono, setMontoAbono] = useState("");
    const [conceptoAbono, setConceptoAbono] = useState("");
    const [nuevoLimite, setNuevoLimite] = useState("");

    const [selectedMov, setSelectedMov] = useState<MovimientoCredito | null>(null);

    const cargarDatos = async () => {
        if (!id_cliente) return;
        setLoading(true);
        setError(null);
        try {
            const [cRes, hRes] = await Promise.all([
                getCreditoCliente(Number(id_cliente)),
                getHistorialCliente(Number(id_cliente)),
            ]);
            if (!cRes.success) throw new Error(cRes.message ?? "Error al cargar crédito");
            setCredito(cRes.data);
            const movs = hRes.data ?? [];
            setHistorial(movs);
            if (movs.length > 0 && !selectedMov) {
                setSelectedMov(movs[0]);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [id_cliente]);

    // ── Registrar abono ──────────────────────────────────────
    const handleAbono = async () => {
        const monto = parseFloat(montoAbono);
        if (isNaN(monto) || monto <= 0) {
            setAccionMsg({ tipo: "error", texto: "Ingresa un monto válido mayor a 0" });
            return;
        }
        if (credito && monto > Number(credito.saldo_actual)) {
            setAccionMsg({ tipo: "error", texto: "El abono no puede ser mayor al saldo pendiente" });
            return;
        }
        setAccionLoading(true);
        setAccionMsg(null);
        try {
            // @ts-ignore
            const api = window["electron-api"];
            const storeCaja = await api?.getConfig("open_caja");
            const localCaja = localStorage.getItem("openCaja");
            const data = storeCaja || (localCaja ? JSON.parse(localCaja) : null);
            const id_turno = data?.id_turno;

            if (!id_turno) {
                setAccionMsg({ tipo: "error", texto: "No hay un turno de caja abierto." });
                setAccionLoading(false);
                return;
            }

            const res = await registrarAbono({
                id_cliente: Number(id_cliente),
                monto,
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
                id_turno: id_turno,
                concepto: conceptoAbono || "Abono a cuenta",
            });
            if (!res.success) throw new Error(res.message);
            setAccionMsg({ tipo: "ok", texto: `Abono de $${monto.toFixed(2)} registrado. Nuevo saldo: $${res.data.saldo_nuevo.toFixed(2)}` });

            // --- INICIO LÓGICA DE IMPRESIÓN ---
            try {
                // @ts-ignore
                const api = window["electron-api"];
                const printerName = await api?.getConfig("printer_device");

                if (printerName) {
                    const isCut = (await api?.getConfig("printer_cut")) !== false;
                    const ticketData = {
                        printerName,
                        sucursal: "Sucursal " + user.sucursal,
                        usuario: user.usuario,
                        cliente: credito?.nombre_cliente || "N/A",
                        fecha: new Date(),
                        monto: monto,
                        saldoAnterior: credito?.saldo_actual || 0,
                        saldoNuevo: res.data.saldo_nuevo,
                        concepto: conceptoAbono || "Abono a cuenta",
                        tipo: "ABONO",
                        cortar: isCut
                    };
                    await api?.printTicketAbonoEscPos(ticketData);
                }
            } catch (printError) {
                console.error("Error al imprimir ticket de abono:", printError);
            }
            // --- FIN LÓGICA DE IMPRESIÓN ---

            setDialogAbono(false);
            setMontoAbono("");
            setConceptoAbono("");
            cargarDatos();
        } catch (err: any) {
            setAccionMsg({ tipo: "error", texto: err.message });
        } finally {
            setAccionLoading(false);
        }
    };

    // ── Liquidar deuda ───────────────────────────────────────
    const handleLiquidar = async () => {
        setAccionLoading(true);
        setAccionMsg(null);
        try {
            // @ts-ignore
            const api = window["electron-api"];
            const storeCaja = await api?.getConfig("open_caja");
            const localCaja = localStorage.getItem("openCaja");
            const data = storeCaja || (localCaja ? JSON.parse(localCaja) : null);
            const id_turno = data?.id_turno;

            if (!id_turno) {
                setAccionMsg({ tipo: "error", texto: "No hay un turno de caja abierto." });
                setAccionLoading(false);
                return;
            }

            const res = await liquidarDeuda({
                id_cliente: Number(id_cliente),
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
                id_turno: id_turno,
            });
            if (!res.success) throw new Error(res.message);
            setAccionMsg({ tipo: "ok", texto: `Deuda de $${res.data.monto_liquidado.toFixed(2)} liquidada completamente ✓` });

            // --- INICIO LÓGICA DE IMPRESIÓN ---
            try {
                // @ts-ignore
                const api = window["electron-api"];
                const printerName = await api?.getConfig("printer_device");

                if (printerName) {
                    const isCut = (await api?.getConfig("printer_cut")) !== false;
                    const ticketData = {
                        printerName,
                        sucursal: "Sucursal " + user.sucursal,
                        usuario: user.usuario,
                        cliente: credito?.nombre_cliente || "N/A",
                        fecha: new Date(),
                        monto: res.data.monto_liquidado,
                        saldoAnterior: res.data.monto_liquidado, // Liquidamos el total
                        saldoNuevo: 0,
                        concepto: "LIQUIDACION TOTAL DE DEUDA",
                        tipo: "LIQUIDACION",
                        cortar: isCut
                    };
                    await api?.printTicketAbonoEscPos(ticketData);
                }
            } catch (printError) {
                console.error("Error al imprimir ticket de liquidación:", printError);
            }
            // --- FIN LÓGICA DE IMPRESIÓN ---

            setDialogLiquidar(false);
            cargarDatos();
        } catch (err: any) {
            setAccionMsg({ tipo: "error", texto: err.message });
        } finally {
            setAccionLoading(false);
        }
    };

    // ── Actualizar límite ───────────────────────────────────
    const handleLimite = async () => {
        const limite = parseFloat(nuevoLimite);
        if (isNaN(limite) || limite < 0) {
            setAccionMsg({ tipo: "error", texto: "Ingresa un límite válido (0 = sin límite)" });
            return;
        }
        setAccionLoading(true);
        try {
            const res = await configurarCredito({ id_cliente: Number(id_cliente), limite_credito: limite });
            if (!res.success) throw new Error(res.message);
            setAccionMsg({ tipo: "ok", texto: `Límite actualizado a ${limite === 0 ? "sin límite" : `$${limite.toFixed(2)}`}` });
            setDialogLimite(false);
            setNuevoLimite("");
            cargarDatos();
        } catch (err: any) {
            setAccionMsg({ tipo: "error", texto: err.message });
        } finally {
            setAccionLoading(false);
        }
    };

    // ── Datos derivados ─────────────────────────────────────
    const saldo = Number(credito?.saldo_actual ?? 0);
    const limite = Number(credito?.limite_credito ?? 0);
    const pct = limite > 0 ? Math.min((saldo / limite) * 100, 100) : null;
    const ultimoPago = historial.find((m) => m.tipo_movimiento === "abono" || m.tipo_movimiento === "liquidado");
    const diasSinPago = ultimoPago
        ? differenceInDays(new Date(), parseISO(ultimoPago.fecha_movimiento.replace('Z', '')))
        : historial.length > 0
            ? differenceInDays(new Date(), parseISO(historial[historial.length - 1].fecha_movimiento.replace('Z', '')))
            : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Cargando estado de cuenta...
            </div>
        );
    }

    if (error || !credito) {
        return (
            <div className="container mx-auto py-8 px-4 space-y-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Regresar
                </Button>
                <Alert variant="destructive">
                    <AlertDescription>{error ?? "No se encontró la cuenta de crédito"}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                            <CreditCard className="h-7 w-7" />
                            {credito.nombre_cliente}
                        </h1>
                        <p className="text-muted-foreground">Estado de cuenta · Crédito #{credito.id_credito}</p>
                    </div>
                </div>
                {/* Saldo Total Gigante - Referencia Eleventa */}
                <div className="text-right">
                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Saldo Restante</p>
                    <p className={`text-5xl font-black ${saldo > 0 ? "text-destructive" : "text-green-500"}`}>
                        ${saldo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Mensaje de acción */}
            {accionMsg && (
                <Alert variant={accionMsg.tipo === "ok" ? "default" : "destructive"}>
                    <AlertDescription>{accionMsg.texto}</AlertDescription>
                </Alert>
            )}

            {/* Resumen de crédito */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Saldo restante
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${saldo > 0 ? "text-destructive" : "text-green-500"}`}>
                            ${saldo.toFixed(2)}
                        </p>
                        {saldo <= 0 && <p className="text-sm text-green-500 mt-1">✓ Sin deuda</p>}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Límite de crédito
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">
                            {limite === 0 ? (
                                <span className="text-2xl text-muted-foreground italic">Sin límite</span>
                            ) : (
                                `$${limite.toFixed(2)}`
                            )}
                        </p>
                        {pct !== null && (
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Usado</span>
                                    <span>{pct.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-orange-400" : "bg-primary"}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Días sin abonar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-4xl font-bold ${(diasSinPago ?? 0) > 30 ? "text-destructive" : (diasSinPago ?? 0) > 14 ? "text-orange-500" : ""}`}>
                            {diasSinPago !== null ? diasSinPago : "—"}
                        </p>
                        {ultimoPago && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Último:{" "}
                                {format(parseISO(ultimoPago.fecha_movimiento.replace('Z', '')), "dd MMM yyyy", { locale: es })}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Alertas de resago */}
            {saldo > 0 && diasSinPago !== null && diasSinPago > 1 && (
                <Alert variant={diasSinPago > 30 ? "destructive" : "default"} className={diasSinPago > 30 ? "" : "border-orange-400 text-orange-700"}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {diasSinPago > 30
                            ? `⚠️ Cliente resagado — lleva ${diasSinPago} días sin realizar un pago.`
                            : `Cliente en riesgo — ${diasSinPago} días sin abonar.`}
                    </AlertDescription>
                </Alert>
            )}

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={() => { setAccionMsg(null); setDialogAbono(true); }}
                    disabled={saldo <= 0}
                    className="gap-2"
                >
                    <Banknote className="h-4 w-4" /> Registrar Abono
                </Button>
                <Button
                    variant="destructive"
                    onClick={() => { setAccionMsg(null); setDialogLiquidar(true); }}
                    disabled={saldo <= 0}
                    className="gap-2"
                >
                    <CheckCircle className="h-4 w-4" /> Liquidar Deuda Total
                </Button>
                <Button
                    variant="outline"
                    onClick={() => { setNuevoLimite(limite > 0 ? String(limite) : ""); setAccionMsg(null); setDialogLimite(true); }}
                    className="gap-2"
                >
                    <Settings className="h-4 w-4" /> Configurar Límite
                </Button>
            </div>

            {/* Grid Principal: Historial | Detalle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Columna Izquierda: Tabla de Movimientos */}
                <Card className="lg:col-span-2 shadow-lg overflow-hidden border-none bg-card/50 backdrop-blur-sm">
                    <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Receipt className="h-5 w-5" /> Movimientos Recientes
                        </h3>
                        <span className="text-xs text-muted-foreground">{historial.length} registros found</span>
                    </div>
                    <CardContent className="p-0">
                        {historial.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                                <Receipt className="h-10 w-10 opacity-20" />
                                <p>No hay actividad registrada</p>
                            </div>
                        ) : (
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 shadow-sm">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha/Hora</th>
                                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Folio</th>
                                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                                            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Monto</th>
                                            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Saldo Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {historial.map((mov) => (
                                            <tr
                                                key={mov.id_movimiento}
                                                onClick={() => setSelectedMov(mov)}
                                                className={`cursor-pointer transition-all hover:bg-primary/5 ${selectedMov?.id_movimiento === mov.id_movimiento ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {format(parseISO(mov.fecha_movimiento.replace('Z', '')), "dd/MMM HH:mm", { locale: es })}
                                                </td>
                                                <td className="px-4 py-3 text-center text-muted-foreground font-mono">
                                                    {mov.id_venta ?? "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {TIPO_ICONS[mov.tipo_movimiento]}
                                                        <span className="font-medium">{TIPO_LABELS[mov.tipo_movimiento]}</span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${mov.tipo_movimiento === 'cargo' ? 'text-destructive' : 'text-green-600'}`}>
                                                    {mov.tipo_movimiento === 'cargo' ? '+' : '-'}${Number(mov.monto).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-medium">
                                                    ${Number(mov.saldo_nuevo).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Columna Derecha: Panel de Detalle (Referencia Caja Eleventa) */}
                <Card className="lg:col-span-1 shadow-xl border-t-4 border-t-primary sticky top-6">
                    <CardHeader className="bg-muted/10 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            Detalle del Movimiento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {!selectedMov ? (
                            <div className="text-center py-10 space-y-3">
                                <Receipt className="h-10 w-10 mx-auto text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground text-sm">Selecciona una transacción para ver el desglose</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 font-sans border-b pb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Folio de Venta:</span>
                                        <span className="font-mono font-bold">{selectedMov.id_venta ?? "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Cajero:</span>
                                        <span className="capitalize">{selectedMov.nombre_usuario ?? "Admin"}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Cliente:</span>
                                        <span className="font-medium text-primary">{credito.nombre_cliente}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-muted-foreground italic">
                                            {format(parseISO(selectedMov.fecha_movimiento.replace('Z', '')), "PPP p", { locale: es })}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Monto del Movimiento:</span>
                                        <span className={`text-xl font-bold ${selectedMov.tipo_movimiento === 'cargo' ? 'text-destructive' : 'text-green-600'}`}>
                                            ${Number(selectedMov.monto).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-muted-foreground/10 my-2" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Saldo Anterior:</span>
                                        <span className="font-mono">${Number(selectedMov.saldo_anterior).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Saldo Ahora:</span>
                                        <span className="font-mono font-bold">${Number(selectedMov.saldo_nuevo).toFixed(2)}</span>
                                    </div>
                                </div>

                                {selectedMov.concepto && (
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase font-bold text-muted-foreground">Notas / Concepto:</p>
                                        <p className="text-sm border p-2 rounded bg-muted/5 italic">"{selectedMov.concepto}"</p>
                                    </div>
                                )}


                            </>
                        )}
                    </CardContent>
                </Card>

            </div>



            {/* ── Dialog: Abono ── */}
            <Dialog open={dialogAbono} onOpenChange={setDialogAbono}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-green-500" /> Registrar Abono
                        </DialogTitle>
                        <DialogDescription>
                            Saldo actual: <strong className="text-destructive">${saldo.toFixed(2)}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Monto del abono *</Label>
                            <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="$0.00"
                                value={montoAbono}
                                onChange={(e) => setMontoAbono(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Concepto (opcional)</Label>
                            <Input
                                placeholder="Ej: Pago parcial semanal"
                                value={conceptoAbono}
                                onChange={(e) => setConceptoAbono(e.target.value)}
                            />
                        </div>
                        {accionMsg?.tipo === "error" && (
                            <Alert variant="destructive">
                                <AlertDescription>{accionMsg.texto}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogAbono(false)}>Cancelar</Button>
                        <Button onClick={handleAbono} disabled={accionLoading} className="gap-2">
                            {accionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            Confirmar Abono
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Liquidar ── */}
            <Dialog open={dialogLiquidar} onOpenChange={setDialogLiquidar}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <CheckCircle className="h-5 w-5" /> Liquidar deuda total
                        </DialogTitle>
                        <DialogDescription>
                            Esta acción registrará el pago completo de{" "}
                            <strong className="text-destructive">${saldo.toFixed(2)}</strong> y dejará el saldo en $0.
                        </DialogDescription>
                    </DialogHeader>
                    {accionMsg?.tipo === "error" && (
                        <Alert variant="destructive">
                            <AlertDescription>{accionMsg.texto}</AlertDescription>
                        </Alert>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogLiquidar(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleLiquidar} disabled={accionLoading} className="gap-2">
                            {accionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            Sí, liquidar ${saldo.toFixed(2)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Límite ── */}
            <Dialog open={dialogLimite} onOpenChange={setDialogLimite}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" /> Configurar límite de crédito
                        </DialogTitle>
                        <DialogDescription>
                            Ingresa 0 para dejar el crédito sin límite.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label>Límite en pesos</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0 = sin límite"
                            value={nuevoLimite}
                            onChange={(e) => setNuevoLimite(e.target.value)}
                        />
                    </div>
                    {accionMsg?.tipo === "error" && (
                        <Alert variant="destructive">
                            <AlertDescription>{accionMsg.texto}</AlertDescription>
                        </Alert>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogLimite(false)}>Cancelar</Button>
                        <Button onClick={handleLimite} disabled={accionLoading} className="gap-2">
                            {accionLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
