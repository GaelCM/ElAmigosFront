import { obtenerReporteMisVentas } from "@/api/reportesApi/reportesApi";
import { obtenerUsuariosApi } from "@/api/usuariosAPi/usuariosApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import type { Usuario } from "@/types/Usuarios";
import type { Sucursal } from "@/types/Sucursal";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import TablaVentas from "@/components/reportes/TablaVentas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw, Users, Store, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VentasGeneralPage() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

    const [ventas, setVentas] = useState<ReporteVentaDetallado[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>("all");
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>("all");

    const cargarFiltros = async () => {
        loadingFilters
        setLoadingFilters(true);
        try {
            const [resUsuarios, resSucursales] = await Promise.all([
                obtenerUsuariosApi(),
                obtenerSucursalesApi()
            ]);

            if (resUsuarios.success && resUsuarios.data) {
                setUsuarios(resUsuarios.data);
            }
            if (resSucursales.success) {
                setSucursales(resSucursales.data);
            }
        } catch (err) {
            console.error("Error al cargar filtros:", err);
            setError("Error al cargar la lista de usuarios o sucursales");
        } finally {
            setLoadingFilters(false);
        }
    };

    const consultarReporte = async () => {
        setLoading(true);
        setError(null);
        try {
            const idUsuario = usuarioSeleccionado === "all" ? undefined : parseInt(usuarioSeleccionado);
            const idSucursal = sucursalSeleccionada === "all" ? undefined : parseInt(sucursalSeleccionada);

            const res = await obtenerReporteMisVentas(
                fechaDesde,
                fechaHasta,
                idUsuario,
                undefined, // Turno como undefined según pedido
                idSucursal
            );

            if (res.success) {
                setVentas(res.data);
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError("Error al obtener el reporte de ventas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarFiltros();
        consultarReporte();
    }, [fechaDesde, fechaHasta, usuarioSeleccionado, sucursalSeleccionada]);

    return (
        <div className="container mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-2xl">
                        <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-primary">
                            Reporte General de Ventas
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Análisis detallado de transacciones por sucursal y vendedor
                        </p>
                    </div>
                </div>
            </div>

            {/* Panel de Filtros */}
            <Card className="shadow-xl border-2 overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Parametrización del Reporte
                            </CardTitle>
                            <CardDescription>
                                Ajusta los criterios para filtrar la información de ventas
                            </CardDescription>
                        </div>
                        <Button
                            onClick={consultarReporte}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2 transition-all active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Generar Reporte
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Rango de Fechas */}
                        <div className="space-y-2">
                            <Label htmlFor="fecha-desde" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Fecha Inicial
                            </Label>
                            <Input
                                id="fecha-desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="h-11 focus-visible:ring-primary/30 border-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fecha-hasta" className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Fecha Final
                            </Label>
                            <Input
                                id="fecha-hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="h-11 focus-visible:ring-primary/30 border-2"
                            />
                        </div>

                        {/* Selección de Sucursal */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Store className="h-3.5 w-3.5" />
                                Sucursal
                            </Label>
                            <Select value={sucursalSeleccionada} onValueChange={setSucursalSeleccionada}>
                                <SelectTrigger className="h-11 border-2 focus:ring-primary/30">
                                    <SelectValue placeholder="Todas las sucursales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las Sucursales</SelectItem>
                                    {sucursales.map((s) => (
                                        <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                                            {s.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selección de Usuario */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Vendedor / Usuario
                            </Label>
                            <Select value={usuarioSeleccionado} onValueChange={setUsuarioSeleccionado}>
                                <SelectTrigger className="h-11 border-2 focus:ring-primary/30">
                                    <SelectValue placeholder="Cualquier usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Usuarios</SelectItem>
                                    {usuarios.map((u) => (
                                        <SelectItem key={u.id_usuario} value={u.id_usuario?.toString() || ""}>
                                            {u.usuario} - {u.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="border-2 border-red-200 bg-red-50 text-red-900 animate-bounce">
                    <AlertDescription className="font-semibold">{error}</AlertDescription>
                </Alert>
            )}

            {/* Resultados */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-muted-foreground flex items-center gap-2">
                        Resultados Encontrados
                        <span className="bg-primary/20 text-primary text-xs px-3 py-1 rounded-full">{ventas.length}</span>
                    </h2>
                </div>

                <Card className="shadow-2xl border-2 border-primary/5">
                    <CardContent className="p-0">
                        <TablaVentas
                            ventas={ventas}
                            loading={loading}
                            onVentaCancelada={consultarReporte}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}