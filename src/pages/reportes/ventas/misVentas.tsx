import { obtenerReporteMisVentas } from "@/api/reportesApi/reportesApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import TablaVentas from "@/components/reportes/TablaVentas";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MisVentasReport() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');
    const [ventas, setVentas] = useState<ReporteVentaDetallado[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fechaDesde, setFechaDesde] = useState(fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(fechaFormateada);
    const { user } = useCurrentUser();

    const obtenerMisVentas = async () => {
        setLoading(true);
        setError(null);
        try {
            const turnoDataString = localStorage.getItem("openCaja");
            if (turnoDataString) {
                const data = JSON.parse(turnoDataString);
                const res = await obtenerReporteMisVentas(fechaDesde, fechaHasta, undefined, data.id_turno, undefined);
                if (res.success) {
                    setVentas(res.data);
                } else {
                    setError(res.message);
                }
            } else {
                const res = await obtenerReporteMisVentas(fechaDesde, fechaHasta, undefined, undefined, user.id_sucursal);
                if (res.success) {
                    setVentas(res.data);
                } else {
                    setError(res.message);
                }
            }
        } catch (error) {
            setError("Error al obtener las ventas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerMisVentas();
    }, [fechaDesde, fechaHasta])

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl text-primary font-bold tracking-tight flex items-center gap-3">

                    Mis Ventas
                </h1>
                <p className="text-muted-foreground text-lg">
                    Consulta y analiza tus ventas realizadas
                </p>
            </div>

            {/* Filtros de Fecha */}
            <Card className="shadow-lg border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Filtros de Búsqueda
                    </CardTitle>
                    <CardDescription>
                        Selecciona el rango de fechas para consultar las ventas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="fecha-desde" className="text-sm font-semibold">
                                Fecha Desde
                            </Label>
                            <Input
                                id="fecha-desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="hidden md:flex items-center pb-2">
                            <div className="h-px w-8 bg-border"></div>
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label htmlFor="fecha-hasta" className="text-sm font-semibold">
                                Fecha Hasta
                            </Label>
                            <Input
                                id="fecha-hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <Button
                            onClick={obtenerMisVentas}
                            disabled={loading}
                            className="gap-2"
                            size="lg"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Actualizar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabla de Ventas */}
            <TablaVentas ventas={ventas} loading={loading} />
        </div>
    )
}