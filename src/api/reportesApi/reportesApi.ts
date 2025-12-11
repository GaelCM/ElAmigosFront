import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";


export const obtenerReporteMisVentas = async (fechaDesde: string, fechaHasta: string, idUsuario?: number, idTurno?: number, idSucursal?: number) => {
    const res = await fetch(`http://localhost:3000/api/reportes/mis-ventas`, {
        method: "post",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            id_usuario: idUsuario,
            id_turno: idTurno,
            id_sucursal: idSucursal
        })
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: ReporteVentaDetallado[] };
}