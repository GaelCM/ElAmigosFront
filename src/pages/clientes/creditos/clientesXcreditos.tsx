import { useEffect, useState } from "react";
import { getTodosCreditos, getResumenCartera } from "@/api/creditosApi/creditosApi";
import type { CreditoClienteCompleto, ResumenCartera } from "@/types/Creditos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    CreditCard,
    Users,
    AlertTriangle,
    DollarSign,
    Search,
    RefreshCw,
    ChevronRight,
    Clock,
    TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router";
import { differenceInDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function ClientesXCreditos() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<CreditoClienteCompleto[]>([]);
    const [resumen, setResumen] = useState<ResumenCartera | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");

    const cargarDatos = async () => {
        setLoading(true);
        setError(null);
        try {
            // Solo 2 requests en total — sin N+1
            const [creditosRes, resumenRes] = await Promise.all([
                getTodosCreditos(),
                getResumenCartera(),
            ]);

            if (!creditosRes.success) throw new Error(creditosRes.message ?? "Error al cargar créditos");

            setClientes(creditosRes.data ?? []);
            setResumen(resumenRes.data ?? null);
        } catch (err: any) {
            setError(err.message ?? "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);  // <-- solo se ejecuta UNA vez al montar

    const filtrados = clientes.filter((c) =>
        c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())
    );

    // ── Helpers visuales ──────────────────────────────────
    const getDiasSinPago = (cliente: CreditoClienteCompleto): number | null => {
        if (cliente.ultima_fecha_pago) {
            return differenceInDays(new Date(), parseISO(cliente.ultima_fecha_pago.replace('Z', '')));
        }
        if (cliente.primer_cargo) {
            return differenceInDays(new Date(), parseISO(cliente.primer_cargo.replace('Z', '')));
        }
        return null;
    };

    const getEstadoBadge = (cliente: CreditoClienteCompleto) => {
        const saldo = Number(cliente.saldo_actual);
        if (saldo <= 0) return <Badge variant="secondary">Sin deuda</Badge>;
        const dias = getDiasSinPago(cliente);
        if (dias !== null && dias > 30)
            return <Badge variant="destructive">Resagado {dias}d</Badge>;
        if (dias !== null && dias > 14)
            return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">En riesgo</Badge>;
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Al corriente</Badge>;
    };

    const getPorcentajeUso = (cliente: CreditoClienteCompleto) => {
        const saldo = Number(cliente.saldo_actual);
        const limite = Number(cliente.limite_credito);
        if (limite === 0) return null;
        return Math.min((saldo / limite) * 100, 100);
    };

    // Conteo de resagados para la tarjeta
    const totalResagados = clientes.filter((c) => {
        if (Number(c.saldo_actual) <= 0) return false;
        const dias = getDiasSinPago(c);
        return dias !== null && dias > 14;
    }).length;

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-4xl text-primary font-bold tracking-tight flex items-center gap-3">
                    <CreditCard className="h-9 w-9" />
                    Créditos a Clientes
                </h1>
                <p className="text-muted-foreground text-lg">
                    Gestiona la cartera de crédito, abonos y liquidaciones
                </p>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" /> Clientes con crédito
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{clientes.length}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Total deuda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-destructive">
                            ${Number(resumen?.total_deuda_cartera ?? 0).toFixed(2)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> En riesgo / Resagados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-orange-500">{totalResagados}</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Con deuda activa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">
                            {Number(resumen?.total_clientes_con_deuda ?? 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de búsqueda + refresh */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cliente..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline" onClick={cargarDatos} disabled={loading} className="gap-2 shrink-0">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                </Button>
            </div>

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabla */}
            <Card className="shadow-lg">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground gap-3">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Cargando cartera...
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                            <CreditCard className="h-10 w-10 opacity-30" />
                            <p>{busqueda ? "No se encontraron clientes" : "No hay clientes con cuenta de crédito"}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Cliente</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">Saldo deuda</th>
                                        <th className="text-right px-4 py-3 text-sm font-semibold text-muted-foreground">Límite</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground hidden md:table-cell">Uso de crédito</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Último pago</th>
                                        <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">Estado</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtrados.map((cliente) => {
                                        const pct = getPorcentajeUso(cliente);
                                        const saldo = Number(cliente.saldo_actual);
                                        const dias = getDiasSinPago(cliente);
                                        return (
                                            <tr
                                                key={cliente.id_credito}
                                                className="hover:bg-muted/30 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/creditos/estado-cuenta/${cliente.id_cliente}`)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                            {cliente.nombre_cliente.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{cliente.nombre_cliente}</p>
                                                            {cliente.telefono && (
                                                                <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-bold text-lg ${saldo > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                                        ${saldo.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">
                                                    {Number(cliente.limite_credito) === 0
                                                        ? <span className="text-xs italic">Sin límite</span>
                                                        : `$${Number(cliente.limite_credito).toFixed(2)}`}
                                                </td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    {pct !== null ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${pct > 80 ? "bg-destructive" : pct > 50 ? "bg-orange-400" : "bg-primary"}`}
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Clock className="h-3 w-3 shrink-0" />
                                                        {cliente.ultima_fecha_pago
                                                            ? format(parseISO(cliente.ultima_fecha_pago.replace('Z', '')), "dd MMM yyyy", { locale: es })
                                                            : <span className="italic">Sin abonos{dias !== null ? ` (${dias}d)` : ""}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {getEstadoBadge(cliente)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}