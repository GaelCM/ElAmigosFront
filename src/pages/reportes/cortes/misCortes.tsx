import { obtenerReporteCortesApi } from "@/api/cortesApi/cortesApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    RefreshCw,
    Store,
    FileText,
    ArrowRight,
    User,
    DollarSign,
    History,
    Search
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CorteReporte {
    id_turno: number;
    id_usuario: number;
    id_sucursal: number;
    fecha_apertura: string;
    fecha_cierre: string | null;
    efectivo_inicial: string;
    efectivo_final: string | null;
    efectivo_contado: string | null;
    diferencia: string | null;
    estado: 'abierto' | 'cerrado';
    numero_ventas: number;
    total_ventas: string;
    total_ventas_efectivo: string;
    total_ventas_tarjeta: string;
    total_ventas_credito: string;
    total_abonos_recibidos: string;
    observaciones_apertura: string | null;
    observaciones_cierre: string | null;
    nombre_usuario_apertura: string;
    nombre_usuario_cierre: string | null;
    nombre_sucursal: string;
}

export default function MisCortesPage() {
    const navigate = useNavigate();
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

    const [cortes, setCortes] = useState<CorteReporte[]>([]);
    const [sucursales, setSucursales] = useState<{ id_sucursal: number, nombre: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const [idSucursal, setIdSucursal] = useState<string>("0"); // "0" para todas


    const fetchSucursales = useCallback(async () => {
        try {
            const res = await obtenerSucursalesApi();
            if (res.success) {
                setSucursales(res.data);
            }
        } catch (err) {
            console.error("Error al cargar sucursales", err);
        }
    }, []);

    const fetchCortes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const sucId = idSucursal === "0" ? undefined : parseInt(idSucursal);
            const res = await obtenerReporteCortesApi(fechaDesde, fechaHasta, sucId);

            if (res.success) {
                setCortes(res.data);
            } else {
                setError(res.message);
            }
        } catch (err: any) {
            setError(err.message || "Error al obtener el reporte de cortes");
        } finally {
            setLoading(false);
        }
    }, [fechaDesde, fechaHasta, idSucursal]);

    useEffect(() => {
        fetchSucursales();
    }, [fetchSucursales]);

    useEffect(() => {
        fetchCortes();
    }, [fetchCortes]);

    const formatCurrency = (amount: string | number | null) => {
        if (amount === null) return "N/A";
        const val = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(val);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "En curso...";
        const date = new Date(dateStr);
        return format(date, 'dd/MM/yyyy HH:mm');
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl text-primary font-bold tracking-tight flex items-center gap-3">
                        <History className="h-10 w-10 text-primary" />
                        Historial de Cortes
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Consulta y audita los cierres de caja por sucursal y fecha
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchCortes}
                        disabled={loading}
                        className="rounded-full hover:rotate-180 transition-transform duration-500"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <Card className="shadow-xl border-t-4 border-t-primary overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Search className="h-5 w-5 text-primary" />
                        Parámetros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="fecha-desde" className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Fecha Desde
                            </Label>
                            <Input
                                id="fecha-desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="border-primary/20 focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha-hasta" className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Fecha Hasta
                            </Label>
                            <Input
                                id="fecha-hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="border-primary/20 focus:border-primary transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sucursal" className="text-sm font-semibold flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" />
                                Sucursal
                            </Label>
                            <Select value={idSucursal} onValueChange={setIdSucursal}>
                                <SelectTrigger className="border-primary/20 focus:border-primary">
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Todas las sucursales</SelectItem>
                                    {sucursales.map(s => (
                                        <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                                            {s.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={fetchCortes}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10 shadow-lg transition-all"
                        >
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Consultar Reporte
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Report Content */}
            <Card className="shadow-2xl border-none ring-1 ring-border overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Sucursal / Usuario</TableHead>
                                    <TableHead className="font-bold">Apertura / Cierre</TableHead>
                                    <TableHead className="font-bold text-center">Estado</TableHead>
                                    <TableHead className="font-bold text-right">Efec. Inicial</TableHead>
                                    <TableHead className="font-bold text-right">Efectivo Final</TableHead>
                                    <TableHead className="font-bold text-right">Total Ventas</TableHead>
                                    <TableHead className="font-bold text-center">Diferencia</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse">
                                            <TableCell colSpan={8}>
                                                <div className="h-12 bg-muted rounded-md w-full"></div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : cortes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <FileText className="h-12 w-12 text-muted-foreground/30" />
                                                <p className="text-xl text-muted-foreground font-medium">No se encontraron cortes en este periodo</p>
                                                <Button variant="ghost" onClick={() => { setFechaDesde(fechaFormateada); setFechaHasta(fechaFormateada); }}>
                                                    Ver cortes de hoy
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    cortes.map((c) => (
                                        <TableRow key={c.id_turno} className="hover:bg-muted/30 transition-colors group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-primary flex items-center gap-1">
                                                        <Store className="h-3 w-3" />
                                                        {c.nombre_sucursal}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {c.nombre_usuario_apertura}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-200">INICIO</Badge>
                                                        <span>{formatDate(c.fecha_apertura)}</span>
                                                    </div>
                                                    {c.fecha_cierre && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">FIN</Badge>
                                                            <span>{formatDate(c.fecha_cierre)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn(
                                                    "capitalize",
                                                    c.estado === 'abierto'
                                                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                                                        : "bg-slate-500 hover:bg-slate-600 shadow-slate-200"
                                                )}>
                                                    {c.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(c.efectivo_inicial)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-blue-600">
                                                {formatCurrency(c.efectivo_final)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-emerald-600">{formatCurrency(c.total_ventas)}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{c.numero_ventas} ventas</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {c.estado === 'cerrado' ? (
                                                    <Badge variant={parseFloat(c.diferencia || "0") < 0 ? "destructive" : parseFloat(c.diferencia || "0") > 0 ? "default" : "secondary"}>
                                                        {formatCurrency(c.diferencia)}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/reportes/cortes/${c.id_turno}`)}
                                                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-all rounded-full"
                                                >
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Resumen Rápidos o Stats */}
            {!loading && cortes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                    <StatCard
                        title="Total Vendido"
                        value={formatCurrency(cortes.reduce((acc, curr) => acc + parseFloat(curr.total_ventas), 0))}
                        icon={<DollarSign className="h-6 w-6" />}
                        color="text-emerald-600"
                    />
                    <StatCard
                        title="Efectivo Acumulado"
                        value={formatCurrency(cortes.reduce((acc, curr) => acc + parseFloat(curr.total_ventas_efectivo), 0))}
                        icon={<Badge variant="outline" className="bg-blue-50">EF</Badge>}
                        color="text-blue-600"
                    />
                    <StatCard
                        title="Total Abonos"
                        value={formatCurrency(cortes.reduce((acc, curr) => acc + parseFloat(curr.total_abonos_recibidos || "0"), 0))}
                        icon={<FileText className="h-6 w-6" />}
                        color="text-purple-600"
                    />
                    <StatCard
                        title="Sobrante/Faltante Total"
                        value={formatCurrency(cortes.reduce((acc, curr) => acc + parseFloat(curr.diferencia || "0"), 0))}
                        icon={<History className="h-6 w-6" />}
                        color={cortes.reduce((acc, curr) => acc + parseFloat(curr.diferencia || "0"), 0) < 0 ? "text-red-600" : "text-slate-600"}
                    />
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                        <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-2xl group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}