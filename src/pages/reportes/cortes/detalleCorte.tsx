import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { obtenerDetalleTurnoApi } from "@/api/cortesApi/cortesApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Printer,
    ShoppingCart,
    ShoppingBag,
    ArrowUp,
    DollarSign,
    Calendar,
    FileText,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { isWebPlatform, printWebTicket } from "@/utils/webPrinterService";

export default function DetalleCortePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (id) {
            fetchDetalle(parseInt(id));
        }
    }, [id]);

    const fetchDetalle = async (idTurno: number) => {
        setLoading(true);
        try {
            const res = await obtenerDetalleTurnoApi(idTurno);
            if (res.success) {
                setData(res.data);
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message || "Error al cargar los detalles del corte");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined) return "$0.00";
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "N/A";
        return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4 space-y-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-3" />
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-48 mb-6" />
                                <Skeleton className="h-32 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-32 mb-6" />
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="container mx-auto py-10 px-4">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "No se encontró la información solicitada"}</AlertDescription>
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
                </Alert>
            </div>
        );
    }

    const { info_turno, metricas_principales, control_efectivo, egresos, movimientos_caja } = data;

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            Corte # {info_turno.id_turno}
                            <Badge className={cn(
                                "ml-2 uppercase",
                                info_turno.estado === 'abierto' ? "bg-blue-600" : "bg-slate-600"
                            )}>
                                {info_turno.estado}
                            </Badge>
                        </h1>

                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={async () => {
                        try {
                            // @ts-ignore
                            const api = window["electron-api"];
                            const printerName = await api?.getConfig("printer_device");

                            const ticketData = {
                                sucursal: "Sucursal " + data.info_turno.sucursal,
                                usuario: data.info_turno.usuario_cierre || data.info_turno.usuario_apertura,
                                fecha: data.info_turno.fecha_cierre || new Date(),
                                id_turno: data.info_turno.id_turno,
                                ventas: {
                                    total: data.metricas_principales.total_ventas,
                                    efectivo: data.metricas_principales.ventas_efectivo,
                                    tarjeta: data.metricas_principales.ventas_tarjeta,
                                    credito: data.metricas_principales.ventas_credito,
                                    numero: data.metricas_principales.numero_ventas
                                },
                                egresos: {
                                    total: data.egresos.total_egresos,
                                    compras: data.egresos.compras_efectivo,
                                    gastos: data.egresos.gastos_efectivo
                                },
                                movimientos: {
                                    depositos: data.movimientos_caja.depositos,
                                    retiros: data.movimientos_caja.retiros
                                },
                                efectivo: {
                                    inicial: data.control_efectivo.efectivo_inicial,
                                    esperado: data.control_efectivo.efectivo_esperado,
                                    contado: data.control_efectivo.efectivo_contado,
                                    diferencia: data.control_efectivo.diferencia
                                },
                                abonos_recibidos: data.metricas_principales.abonos_credito,
                            };

                            if (printerName) {
                                const isCut = (await api?.getConfig("printer_cut")) !== false;
                                await api?.printTicketCorteEscPos({ ...ticketData, cortar: isCut });
                            } else if (isWebPlatform()) {
                                await printWebTicket({ kind: "corte", data: ticketData });
                            }
                        } catch (e) {
                            console.error("Error al imprimir corte desde auditoría:", e);
                        }
                    }}>
                        <Printer className="h-4 w-4" /> Imprimir Ticket (Térmico)
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Vista Previa / PDF
                    </Button>
                </div>
            </div>

            {/* Resumen Principal Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Ventas</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(metricas_principales.total_ventas)}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Efectivo Sistema</p>
                                <p className="text-2xl font-bold text-slate-900">{formatCurrency(control_efectivo.efectivo_esperado)}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="h-5 w-5 text-blue-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Egresos Totales</p>
                                <p className="text-2xl font-bold text-red-600">-{formatCurrency(egresos.total_egresos)}</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg"><ShoppingBag className="h-5 w-5 text-red-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    control_efectivo.diferencia < 0 ? "border-red-200" : "border-slate-200"
                )}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance Final</p>
                                <p className={cn(
                                    "text-2xl font-bold",
                                    control_efectivo.diferencia < 0 ? "text-red-600" : "text-slate-900"
                                )}>
                                    {formatCurrency(control_efectivo.diferencia)}
                                </p>
                            </div>
                            <div className={cn(
                                "p-2 rounded-lg",
                                control_efectivo.diferencia < 0 ? "bg-red-50" : "bg-slate-100"
                            )}>
                                {control_efectivo.diferencia < 0
                                    ? <AlertCircle className="h-5 w-5 text-red-600" />
                                    : <TrendingUp className="h-5 w-5 text-slate-600" />
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel Auditoría de Efectivo */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                Auditoría de Flujo de Efectivo
                            </CardTitle>
                            <CardDescription>Detalle de entradas y salidas de efectivo del turno</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Entradas */}
                                <div className="p-6 border-r border-b border-border space-y-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                                        <ArrowUp className="rotate-180 h-4 w-4" /> Entradas
                                    </h3>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Row label="Efectivo Inicial" value={formatCurrency(control_efectivo.efectivo_inicial)} />
                                        <Row label="Ventas en Efectivo" value={formatCurrency(metricas_principales.ventas_efectivo)} color="text-blue-600 font-semibold" />
                                        <Row label="Cobranza de Créditos" value={formatCurrency(metricas_principales.abonos_credito)} color="text-blue-600" />
                                        <Row label="Depósitos a Caja" value={formatCurrency(movimientos_caja.depositos)} color="text-blue-600" />
                                    </div>
                                </div>
                                {/* Salidas */}
                                <div className="p-6 border-b border-border space-y-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 flex items-center gap-2">
                                        <ArrowUp className="h-4 w-4" /> Salidas
                                    </h3>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Row label="Retiros de Caja" value={`-${formatCurrency(movimientos_caja.retiros)}`} color="text-red-600" />
                                        <Row label="Compras pagadas en Efectivo" value={`-${formatCurrency(egresos.compras_efectivo)}`} color="text-red-600" />
                                        <Row label="Gastos pagados en Efectivo" value={`-${formatCurrency(egresos.gastos_efectivo)}`} color="text-red-600" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="p-6">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-medium text-muted-foreground">Efectivo Esperado:</span>
                                        <span className="font-bold text-2xl">{formatCurrency(control_efectivo.efectivo_esperado)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-medium text-muted-foreground">Efectivo Contado el Cierre:</span>
                                        <span className="font-bold text-2xl">{formatCurrency(control_efectivo.efectivo_contado)}</span>
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-lg flex justify-between items-center",
                                        control_efectivo.diferencia < 0 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                                    )}>
                                        <span className="font-semibold uppercase tracking-wider text-xs">Diferencia Final:</span>
                                        <span className={cn(
                                            "text-3xl font-bold",
                                            control_efectivo.diferencia < 0 ? "text-red-600" : "text-blue-600"
                                        )}>{formatCurrency(control_efectivo.diferencia)}</span>
                                    </div>
                                    {control_efectivo.diferencia !== 0 && (
                                        <p className="text-xs text-center uppercase tracking-wider font-medium text-muted-foreground">
                                            {control_efectivo.diferencia < 0 ? "Faltante Detectado" : "Sobrante Detectado"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Desglose de Ventas por Método */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Distribución de Ingresos</CardTitle>
                            <CardDescription>Ventas desglosadas por método de pago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MethodBox
                                    label="Efectivo"
                                    monto={metricas_principales.ventas_efectivo}
                                    icon={<DollarSign className="h-4 w-4" />}
                                    color="text-blue-600"
                                />
                                <MethodBox
                                    label="Tarjeta"
                                    monto={metricas_principales.ventas_tarjeta}
                                    icon={<FileText className="h-4 w-4" />}
                                    color="text-slate-700"
                                />
                                <MethodBox
                                    label="Crédito"
                                    monto={metricas_principales.ventas_credito}
                                    icon={<Clock className="h-4 w-4" />}
                                    color="text-slate-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Info de Tiempos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-muted-foreground">Detalles del Período</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-md"><Clock className="h-4 w-4 text-blue-600" /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Apertura</span>
                                    <span className="text-sm font-medium">{formatDate(info_turno.fecha_apertura)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-md"><CheckCircle2 className="h-4 w-4 text-slate-600" /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Cierre</span>
                                    <span className="text-sm font-medium">{formatDate(info_turno.fecha_cierre)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-md"><Clock className="h-4 w-4 text-slate-600" /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs uppercase font-semibold text-muted-foreground">Duración</span>
                                    <span className="text-sm font-medium">
                                        {info_turno.horas_abierto ? `${info_turno.horas_abierto.toFixed(1)} horas` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Otros Totales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-muted-foreground">Métricas de Actividad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Número de Ventas</span>
                                </div>
                                <span className="font-semibold">{metricas_principales.numero_ventas}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Ticket Promedio</span>
                                </div>
                                <span className="font-semibold">{formatCurrency(metricas_principales.ticket_promedio)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Abonos Cobrados</span>
                                </div>
                                <span className="font-semibold">{formatCurrency(metricas_principales.abonos_credito)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observaciones */}
                    {(info_turno.observaciones_apertura || info_turno.observaciones_cierre) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-muted-foreground">Observaciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm whitespace-pre-wrap text-muted-foreground">
                                {info_turno.observaciones_apertura && (
                                    <div>
                                        <p className="font-semibold text-xs text-blue-600 mb-1 uppercase">Apertura:</p>
                                        <p>{info_turno.observaciones_apertura}</p>
                                    </div>
                                )}
                                {info_turno.observaciones_cierre && (
                                    <div>
                                        <p className="font-semibold text-xs text-slate-600 mb-1 uppercase">Cierre:</p>
                                        <p>{info_turno.observaciones_cierre}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, color }: { label: string, value: string, color?: string }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("text-sm", color || "text-foreground")}>{value}</span>
        </div>
    );
}

function MethodBox({ label, monto, icon, color }: { label: string, monto: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="flex flex-col gap-1 p-4 rounded-lg border bg-white transition-colors hover:bg-muted/50">
            <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                {icon} {label}
            </span>
            <span className={cn("text-xl font-bold", color)}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)}</span>
        </div>
    );
}