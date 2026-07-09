import { obtenerReporteMisVentas } from "@/api/reportesApi/reportesApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import TablaVentas from "@/components/reportes/TablaVentas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutList } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
    const [soloTurnoActual, setSoloTurnoActual] = useState(false);
    const { user } = useCurrentUser();

    const [hasOpenCaja, setHasOpenCaja] = useState(false);

    useEffect(() => {
        const checkCaja = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const storeCaja = await api?.getConfig("open_caja");
            if (storeCaja) setHasOpenCaja(true);
            else setHasOpenCaja(!!localStorage.getItem("openCaja"));
        };
        checkCaja();
    }, []);

    const obtenerMisVentas = async () => {
        setLoading(true);
        setError(null);
        try {
            let idTurno = undefined;

            // Si el usuario quiere filtrar por turno y hay una caja abierta
            if (soloTurnoActual) {
                // @ts-ignore
                const api = window["electron-api"];
                const storeCaja = await api?.getConfig("open_caja");
                const turnoDataString = localStorage.getItem("openCaja");

                const data = storeCaja || (turnoDataString ? JSON.parse(turnoDataString) : null);
                if (data) {
                    idTurno = data.id_turno;
                }
            }

            // Si hay turno, filtramos por turno. Si no, por sucursal.
            const res = await obtenerReporteMisVentas(
                fechaDesde,
                fechaHasta,
                undefined,
                idTurno,
                idTurno ? undefined : user.id_sucursal
            );

            if (res.success) {
                setVentas(res.data);
            } else {
                setError(res.message);
            }
        } catch (error) {
            setError("Error al obtener las ventas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerMisVentas();
    }, [fechaDesde, fechaHasta, soloTurnoActual])

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-5xl text-primary font-bold tracking-tight">
                    Mis Ventas
                </h1>
                <p className="text-muted-foreground text-lg">
                    Consulta y analiza tus ventas realizadas
                </p>
            </div>

            <Separator />

            {/* Filtros de Fecha */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider">
                        Filtros de Busqueda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-1.5 w-full">
                            <Label htmlFor="fecha-desde" className="text-sm font-medium text-muted-foreground">
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
                            <div className="h-px w-6 bg-border"></div>
                        </div>

                        <div className="flex-1 space-y-1.5 w-full">
                            <Label htmlFor="fecha-hasta" className="text-sm font-medium text-muted-foreground">
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

                        {hasOpenCaja && (
                            <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
                                <Switch
                                    id="solo-turno"
                                    checked={soloTurnoActual}
                                    onCheckedChange={setSoloTurnoActual}
                                />
                                <Label
                                    htmlFor="solo-turno"
                                    className="text-base font-medium cursor-pointer flex items-center gap-2 whitespace-nowrap"
                                >
                                    <LayoutList className="h-5 w-5 text-primary" />
                                    Solo mi turno actual
                                </Label>
                            </div>
                        )}

                        <Button
                            onClick={obtenerMisVentas}
                            disabled={loading}
                            className="gap-2 text-base"
                            size="lg"
                        >
                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
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
            <TablaVentas ventas={ventas} loading={loading} onVentaCancelada={obtenerMisVentas} />
        </div>
    )
}