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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_ICONS: Record<string, React.ReactNode> = {
    CARGO: <ShoppingCart className="h-4 w-4 text-destructive" />,
    ABONO: <TrendingDown className="h-4 w-4 text-green-500" />,
    LIQUIDACION: <CheckCircle className="h-4 w-4 text-blue-500" />,
};

const TIPO_LABELS: Record<string, string> = {
    CARGO: "Venta a crédito",
    ABONO: "Abono",
    LIQUIDACION: "Liquidación total",
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
            setHistorial(hRes.data ?? []);
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
            const res = await registrarAbono({
                id_cliente: Number(id_cliente),
                monto,
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
                concepto: conceptoAbono || "Abono a cuenta",
            });
            if (!res.success) throw new Error(res.message);
            setAccionMsg({ tipo: "ok", texto: `Abono de $${monto.toFixed(2)} registrado. Nuevo saldo: $${res.data.saldo_nuevo.toFixed(2)}` });
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
            const res = await liquidarDeuda({
                id_cliente: Number(id_cliente),
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
            });
            if (!res.success) throw new Error(res.message);
            setAccionMsg({ tipo: "ok", texto: `Deuda de $${res.data.monto_liquidado.toFixed(2)} liquidada completamente ✓` });
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
    const ultimoPago = historial.find((m) => m.tipo_movimiento === "abono" || m.tipo_movimiento === "liquidacion");
    const diasSinPago = ultimoPago
        ? differenceInDays(new Date(), parseISO(ultimoPago.fecha_movimiento))
        : historial.length > 0
            ? differenceInDays(new Date(), parseISO(historial[historial.length - 1].fecha_movimiento))
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
                            <DollarSign className="h-4 w-4" /> Saldo pendiente
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
                                {format(parseISO(ultimoPago.fecha_movimiento), "dd MMM yyyy", { locale: es })}
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

            {/* Historial de movimientos */}
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> Historial de movimientos
                    </CardTitle>
                    <CardDescription>
                        {historial.length} movimiento{historial.length !== 1 ? "s" : ""} registrado{historial.length !== 1 ? "s" : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {historial.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                            <Receipt className="h-8 w-8 opacity-30" />
                            <p>Sin movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Tipo</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">Monto</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">Saldo anterior</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">Saldo nuevo</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground hidden md:table-cell">Concepto</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {historial.map((mov) => (
                                        <tr key={mov.id_movimiento} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {TIPO_ICONS[mov.tipo_movimiento]}
                                                    <div>
                                                        <p className="font-medium text-sm">{TIPO_LABELS[mov.tipo_movimiento]}</p>
                                                        {mov.id_venta && (
                                                            <p className="text-xs text-muted-foreground">Venta #{mov.id_venta}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-bold ${mov.tipo_movimiento === "cargo" ? "text-destructive" : "text-green-500"}`}>
                                                    {mov.tipo_movimiento === "cargo" ? "+" : "-"}${Number(mov.monto).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground text-sm">
                                                ${Number(mov.saldo_anterior).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-sm">
                                                ${Number(mov.saldo_nuevo).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                                                {mov.concepto ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {format(parseISO(mov.fecha_movimiento), "dd MMM yyyy HH:mm", { locale: es })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

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