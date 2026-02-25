import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { obtenerDetalleTurnoApi } from "@/api/cortesApi/cortesApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Cargando auditoría del turno...</p>
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
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full shadow-md">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-2">
                            Corte # {info_turno.id_turno}
                            <Badge className={cn(
                                "ml-2 uppercase",
                                info_turno.estado === 'abierto' ? "bg-emerald-500" : "bg-slate-500"
                            )}>
                                {info_turno.estado}
                            </Badge>
                        </h1>

                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 shadow-sm" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Imprimir Auditoría
                    </Button>
                </div>
            </div>

            {/* Resumen Principal Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Total Ventas</p>
                                <p className="text-2xl font-black text-blue-700">{formatCurrency(metricas_principales.total_ventas)}</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-5 w-5 text-blue-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Efectivo Sistema</p>
                                <p className="text-2xl font-black text-emerald-700">{formatCurrency(control_efectivo.efectivo_esperado)}</p>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-red-400 uppercase tracking-widest">Egresos Totales</p>
                                <p className="text-2xl font-black text-red-700">-{formatCurrency(egresos.total_egresos)}</p>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg"><ShoppingBag className="h-5 w-5 text-red-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "bg-gradient-to-br border-none shadow-lg shadow-black/5",
                    control_efectivo.diferencia < 0 ? "from-orange-500 to-red-600" : "from-slate-700 to-slate-900"
                )}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start text-white">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Balance Final</p>
                                <p className="text-2xl font-black tracking-tighter">
                                    {formatCurrency(control_efectivo.diferencia)}
                                </p>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                {control_efectivo.diferencia < 0 ? <AlertCircle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Panel Auditoría de Efectivo */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-xl overflow-hidden border-none ring-1 ring-border">
                        <CardHeader className="bg-muted/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <Calendar className="h-5 w-5 text-primary" />
                                Auditoría de Flujo de Efectivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {/* Entradas */}
                                <div className="p-6 border-r border-b space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <ArrowUp className="rotate-180 h-4 w-4" /> Entradas (Cash In)
                                    </h3>
                                    <div className="space-y-2">
                                        <Row label="Efectivo Inicial" value={formatCurrency(control_efectivo.efectivo_inicial)} />
                                        <Row label="Ventas en Efectivo" value={formatCurrency(metricas_principales.ventas_efectivo)} color="text-emerald-600 font-bold" />
                                        <Row label="Cobranza de Créditos" value={formatCurrency(metricas_principales.abonos_credito)} color="text-emerald-600" />
                                        <Row label="Depósitos a Caja" value={formatCurrency(movimientos_caja.depositos)} color="text-emerald-600" />
                                    </div>
                                </div>
                                {/* Salidas */}
                                <div className="p-6 border-b space-y-4 bg-red-50/20">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                                        <ArrowUp className="h-4 w-4" /> Salidas (Cash Out)
                                    </h3>
                                    <div className="space-y-2">
                                        <Row label="Retiros de Caja" value={`-${formatCurrency(movimientos_caja.retiros)}`} color="text-red-600" />
                                        <Row label="Compras pagadas en Efectivo" value={`-${formatCurrency(egresos.compras_efectivo)}`} color="text-red-600" />
                                        <Row label="Gastos pagados en Efectivo" value={`-${formatCurrency(egresos.gastos_efectivo)}`} color="text-red-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-primary/5">
                                <div className="max-w-md mx-auto space-y-4">
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-medium text-muted-foreground">Efectivo Esperado:</span>
                                        <span className="font-black text-2xl">{formatCurrency(control_efectivo.efectivo_esperado)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg pt-4 border-t border-primary/10">
                                        <span className="font-medium text-muted-foreground">Efectivo Contado el Cierre:</span>
                                        <span className="font-black text-2xl text-primary">{formatCurrency(control_efectivo.efectivo_contado)}</span>
                                    </div>
                                    <div className={cn(
                                        "p-4 rounded-xl flex justify-between items-center mt-4 transition-all",
                                        control_efectivo.diferencia < 0 ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                    )}>
                                        <span className="font-black uppercase tracking-wider text-xs opacity-80">Diferencia Final:</span>
                                        <span className="text-3xl font-black">{formatCurrency(control_efectivo.diferencia)}</span>
                                    </div>
                                    {control_efectivo.diferencia !== 0 && (
                                        <p className="text-[10px] text-center uppercase tracking-widest font-bold opacity-40">
                                            {control_efectivo.diferencia < 0 ? "Faltante Detectado" : "Sobrante Detectado"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Desglose de Ventas por Método */}
                    <Card className="shadow-lg border-none ring-1 ring-border overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-sm font-black uppercase text-slate-500 tracking-widest">Distribución de Ingresos</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <MethodBox
                                    label="Efectivo"
                                    monto={metricas_principales.ventas_efectivo}
                                    icon={<DollarSign className="h-4 w-4" />}
                                    color="text-emerald-600"
                                />
                                <MethodBox
                                    label="Tarjeta"
                                    monto={metricas_principales.ventas_tarjeta}
                                    icon={<FileText className="h-4 w-4" />}
                                    color="text-blue-600"
                                />
                                <MethodBox
                                    label="Crédito (A cuenta)"
                                    monto={metricas_principales.ventas_credito}
                                    icon={<Clock className="h-4 w-4" />}
                                    color="text-orange-600"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Info de Tiempos */}
                    <Card className="shadow-lg border-none ring-1 ring-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Detalles del Período</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-full text-emerald-600"><Clock className="h-4 w-4" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Apertura</span>
                                    <span className="text-sm font-medium">{formatDate(info_turno.fecha_apertura)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-full text-blue-600"><CheckCircle2 className="h-4 w-4" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Cierre</span>
                                    <span className="text-sm font-medium">{formatDate(info_turno.fecha_cierre)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-50 rounded-full text-slate-600"><Clock className="h-4 w-4" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Duración</span>
                                    <span className="text-sm font-medium">
                                        {info_turno.horas_abierto ? `${info_turno.horas_abierto.toFixed(1)} horas` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Otros Totales */}
                    <Card className="shadow-lg border-none ring-1 ring-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Métricas de Actividad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm">Número de Ventas</span>
                                </div>
                                <span className="font-bold">{metricas_principales.numero_ventas}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm">Ticket Promedio</span>
                                </div>
                                <span className="font-bold">{formatCurrency(metricas_principales.ticket_promedio)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm">Abonos Cobrados</span>
                                </div>
                                <span className="font-bold">{formatCurrency(metricas_principales.abonos_credito)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observaciones */}
                    {(info_turno.observaciones_apertura || info_turno.observaciones_cierre) && (
                        <Card className="shadow-lg border-none ring-1 ring-border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Observaciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4 text-sm whitespace-pre-wrap italic text-muted-foreground">
                                {info_turno.observaciones_apertura && (
                                    <div>
                                        <p className="font-bold text-[10px] text-emerald-600 mb-1 uppercase">Apertura:</p>
                                        <p>{info_turno.observaciones_apertura}</p>
                                    </div>
                                )}
                                {info_turno.observaciones_cierre && (
                                    <div>
                                        <p className="font-bold text-[10px] text-blue-600 mb-1 uppercase">Cierre:</p>
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
        <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn("text-sm", color || "text-foreground")}>{value}</span>
        </div>
    );
}

function MethodBox({ label, monto, icon, color }: { label: string, monto: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="flex flex-col gap-1 p-4 rounded-xl border-2 border-slate-100 group transition-all hover:bg-slate-50">
            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                {icon} {label}
            </span>
            <span className={cn("text-xl font-black", color)}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)}</span>
        </div>
    );
}