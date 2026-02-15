


export interface InfoTurno {
    id_turno: number;
    fecha_apertura: string;
    fecha_cierre: string | null;
    estado: string;
    usuario: number;
    sucursal: number;
}

/**
 * KPIs principales del turno
 */
export interface MetricasPrincipales {
    total_ventas: number;
    numero_ventas: number;
    ticket_promedio: number;
    ventas_efectivo: number;
    ventas_tarjeta: number;
}

/**
 * Control de efectivo y cuadre de caja
 */
export interface ControlEfectivo {
    efectivo_inicial: number;
    efectivo_esperado: number;
    efectivo_contado: number | null;
    diferencia: number | null;
}

/**
 * Egresos del turno
 */
export interface Egresos {
    total_compras: number;
    compras_efectivo: number;
    total_gastos: number;
    gastos_efectivo: number;
    total_egresos: number;
    total_egresos_efectivo: number;
}

/**
 * Movimientos de efectivo (retiros y depósitos)
 */
export interface MovimientosCaja {
    retiros: number;
    depositos: number;
    neto: number;
}

/**
 * Producto más vendido
 */
export interface ProductoMasVendido {
    producto: string;
    cantidad: number;
    ingresos: number;
    transacciones: number;
}

/**
 * Categoría más vendida
 */
export interface CategoriaMasVendida {
    categoria: string;
    cantidad: number;
    ingresos: number;
    ventas: number;
}

/**
 * Ventas agrupadas por hora
 */
export interface VentaPorHora {
    hora: number;
    hora_formato: string;
    numero_ventas: number;
    total: number;
}

/**
 * Distribución de métodos de pago
 */
export interface MetodoPago {
    metodo: string;
    transacciones: number;
    monto: number;
    porcentaje: number;
}

/**
 * Datos para gráficas
 */
export interface Graficas {
    productos_mas_vendidos: ProductoMasVendido[];
    categorias_mas_vendidas: CategoriaMasVendida[];
    ventas_por_hora: VentaPorHora[];
    metodos_pago: MetodoPago[];
}

/**
 * Dashboard completo del turno
 */
export interface DashboardTurno {
    info_turno: InfoTurno;
    metricas_principales: MetricasPrincipales;
    control_efectivo: ControlEfectivo;
    egresos: Egresos;
    movimientos_caja: MovimientosCaja;
    graficas: Graficas;
}

/**
 * Respuesta completa del endpoint
 */
export interface DashboardTurnoResponse {
    success: boolean;
    data: DashboardTurno;
    mensaje: string;
}

/**
 * Respuesta en caso de error
 */
export interface DashboardTurnoError {
    success: false;
    message: string;
    error?: string;
}

// ===================================================
// TYPE UNION para manejar éxito o error
// ===================================================
export type DashboardTurnoResult = DashboardTurnoResponse | DashboardTurnoError;



/**
 * Información de sucursal en turno activo
 */
export interface SucursalTurnoActivo {
    id: number;
    nombre: string;
}

/**
 * Información de usuario en turno activo
 */
export interface UsuarioTurnoActivo {
    id: number;
    nombre: string;
}

/**
 * Estadísticas del turno activo
 */
export interface EstadisticasTurnoActivo {
    horas_abierto: number;
    numero_ventas: number;
    total_vendido: number;
}

/**
 * Turno activo completo
 */
export interface TurnoActivo {
    id_turno: number;
    sucursal: SucursalTurnoActivo;
    usuario: UsuarioTurnoActivo;
    fecha_apertura: string;
    efectivo_inicial: number;
    estado: number;
    estadisticas: EstadisticasTurnoActivo;
}

/**
 * Respuesta exitosa del endpoint de turnos activos
 */
export interface TurnosActivosResponse {
    success: true;
    data: TurnoActivo[];
    total: number;
    mensaje: string;
}

/**
 * Respuesta en caso de error
 */
export interface TurnosActivosError {
    success: false;
    message: string;
    error?: string;
}

/**
 * Type union para manejar éxito o error en turnos activos
 */
export type TurnosActivosResult = TurnosActivosResponse | TurnosActivosError;
