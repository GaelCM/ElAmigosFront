import type { TurnoActivo, TurnosActivosResponse } from "@/types/Dashboard";
import { useEffect, useState } from "react";
import DashboardUser from "./dashboardUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw, ChevronLeft, Store, User, Calendar, Clock, Receipt, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function DashboardAdmon() {
    const [turnosActivos, setTurnosActivos] = useState<TurnoActivo[] | null>(null);
    const [selectedTurnoId, setSelectedTurnoId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTurnosActivos = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("https://elamigos-elamigosapi.xj7zln.easypanel.host/api/dashboard/activos", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("tkn")}`
                    }
                });
                const res: TurnosActivosResponse = await response.json();
                if (res.success) {
                    setTurnosActivos(res.data);
                } else {
                    setError("No se pudieron cargar los turnos activos");
                }
            } catch (error) {
                console.error("Error fetching turnos activos:", error);
                setError("Error al cargar los turnos activos");
            } finally {
                setLoading(false);
            }
        };
        fetchTurnosActivos();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Si se seleccionó un turno, mostrar el dashboard detallado
    if (selectedTurnoId) {
        return (
            <div className="space-y-4 pb-8">
                <div className="container mx-auto px-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setSelectedTurnoId(null)}
                        className="gap-2 text-base"
                        size="lg"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Volver a Turnos Activos
                    </Button>
                </div>
                <DashboardUser idTurno={selectedTurnoId} />
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground">Cargando turnos activos...</p>
            </div>
        );
    }

    // Error state
    if (error || !turnosActivos) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-lg ml-2">
                        {error || "No se pudieron obtener los turnos activos"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // No active shifts
    if (turnosActivos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-muted rounded-full">
                    <Store className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">No hay turnos activos</h2>
                <p className="text-lg text-muted-foreground">Actualmente no hay turnos abiertos en ninguna sucursal</p>
            </div>
        );
    }

    // Lista de turnos activos
    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-5xl text-primary font-bold tracking-tight">
                        Dashboard Administrativo
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {turnosActivos.length} {turnosActivos.length === 1 ? 'turno activo' : 'turnos activos'}
                    </p>
                </div>
                <Button 
                    onClick={() => window.location.reload()} 
                    size="lg"
                    className="gap-2 text-base w-full md:w-auto"
                >
                    <RefreshCw className="h-5 w-5" />
                    Actualizar
                </Button>
            </div>

            <Separator />

            {/* Grid de Turnos Activos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turnosActivos.map((turno) => (
                    <Card 
                        key={turno.id_turno}
                        className="cursor-pointer hover:border-primary/50 transition-colors group"
                        onClick={() => setSelectedTurnoId(turno.id_turno)}
                    >
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <CardTitle className="text-2xl font-bold">{turno.sucursal.nombre}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">Turno #{turno.id_turno}</p>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-sm">
                                    Activo
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <User className="h-5 w-5" />
                                    <span className="text-base font-medium text-foreground">{turno.usuario.nombre}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Calendar className="h-5 w-5" />
                                    <span className="text-base">{formatDate(turno.fecha_apertura)}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Horas</span>
                                    </div>
                                    <p className="text-2xl font-bold">{turno.estadisticas.horas_abierto}h</p>
                                </div>
                                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Receipt className="h-4 w-4" />
                                        <span className="text-sm font-medium uppercase tracking-wider">Ventas</span>
                                    </div>
                                    <p className="text-2xl font-bold">{turno.estadisticas.numero_ventas}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Total Vendido</p>
                                <p className="text-3xl font-bold text-primary">{formatCurrency(turno.estadisticas.total_vendido)}</p>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" />
                                    <span>Efectivo Inicial:</span>
                                </div>
                                <span className="font-semibold text-base">{formatCurrency(turno.efectivo_inicial)}</span>
                            </div>

                            <Button className="w-full text-base" variant="secondary">
                                Ver Dashboard Completo
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}