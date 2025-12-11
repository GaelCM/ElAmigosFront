import type { DashboardTurno, DashboardTurnoResponse } from "@/types/Dashboard";
import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import './dashboardUser.css';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function DashboardUser({ idTurno }: { idTurno: number }) {
    const [dashboard, setDashboard] = useState<DashboardTurno | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/dashboard/${idTurno}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('tkn')}`
                    }
                });
                const result: DashboardTurnoResponse = await response.json();
                if (result.success) {
                    setDashboard(result.data);
                } else {
                    setError(result.mensaje);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setError("Error al cargar los datos del dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [idTurno]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Cargando dashboard...</p>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">⚠️</div>
                <h2>Error al cargar el dashboard</h2>
                <p>{error || "No se pudo obtener la información"}</p>
            </div>
        );
    }

    // Preparar datos para gráficas
    const ventasPorHoraData = {
        labels: dashboard.graficas.ventas_por_hora.map(v => v.hora_formato),
        datasets: [
            {
                label: 'Ventas',
                data: dashboard.graficas.ventas_por_hora.map(v => v.total),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const productosMasVendidosData = {
        labels: dashboard.graficas.productos_mas_vendidos.map(p => p.producto),
        datasets: [
            {
                label: 'Cantidad Vendida',
                data: dashboard.graficas.productos_mas_vendidos.map(p => p.cantidad),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(251, 146, 60, 1)',
                    'rgba(34, 197, 94, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const metodosPagoData = {
        labels: dashboard.graficas.metodos_pago.map(m => m.metodo),
        datasets: [
            {
                data: dashboard.graficas.metodos_pago.map(m => m.monto),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(251, 146, 60, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const categoriasMasVendidasData = {
        labels: dashboard.graficas.categorias_mas_vendidas.map(c => c.categoria),
        datasets: [
            {
                label: 'Ingresos',
                data: dashboard.graficas.categorias_mas_vendidas.map(c => c.ingresos),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(251, 191, 36, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="text-primary text-2xl font-bold">Dashboard de Ventas</h1>
                    <p className="dashboard-subtitle">
                        Turno #{idTurno} • {new Date(dashboard.info_turno.fecha_apertura).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <div className="status-badge">
                    {dashboard.info_turno.estado === "abierto" ? '🟢 Activo' : '🔴 Cerrado'}
                </div>
            </div>

            {/* KPIs Principales */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-primary">
                    <div className="kpi-icon">💰</div>
                    <div className="kpi-content">
                        <p className="kpi-label">Total Ventas</p>
                        <h2 className="kpi-value">{formatCurrency(dashboard.metricas_principales.total_ventas)}</h2>
                        <p className="kpi-detail">{dashboard.metricas_principales.numero_ventas} transacciones</p>
                    </div>
                </div>

                <div className="kpi-card kpi-success">
                    <div className="kpi-icon">📊</div>
                    <div className="kpi-content">
                        <p className="kpi-label">Ticket Promedio</p>
                        <h2 className="kpi-value">{formatCurrency(dashboard.metricas_principales.ticket_promedio)}</h2>
                        <p className="kpi-detail">Por transacción</p>
                    </div>
                </div>

                <div className="kpi-card kpi-info">
                    <div className="kpi-icon">💵</div>
                    <div className="kpi-content">
                        <p className="kpi-label">Efectivo</p>
                        <h2 className="kpi-value">{formatCurrency(dashboard.metricas_principales.ventas_efectivo)}</h2>
                        <p className="kpi-detail">Ventas en efectivo</p>
                    </div>
                </div>

                <div className="kpi-card kpi-warning">
                    <div className="kpi-icon">💳</div>
                    <div className="kpi-content">
                        <p className="kpi-label">Tarjeta</p>
                        <h2 className="kpi-value">{formatCurrency(dashboard.metricas_principales.ventas_tarjeta)}</h2>
                        <p className="kpi-detail">Ventas con tarjeta</p>
                    </div>
                </div>
            </div>

            {/* Control de Efectivo y Egresos */}
            <div className="info-grid">
                <div className="info-card">
                    <h3 className="info-card-title">💼 Control de Efectivo</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span>Efectivo Inicial:</span>
                            <strong>{formatCurrency(dashboard.control_efectivo.efectivo_inicial)}</strong>
                        </div>
                        <div className="info-row">
                            <span>Efectivo Esperado:</span>
                            <strong>{formatCurrency(dashboard.control_efectivo.efectivo_esperado)}</strong>
                        </div>
                        {dashboard.control_efectivo.efectivo_contado !== null && (
                            <>
                                <div className="info-row">
                                    <span>Efectivo Contado:</span>
                                    <strong>{formatCurrency(dashboard.control_efectivo.efectivo_contado)}</strong>
                                </div>
                                <div className="info-row highlight">
                                    <span>Diferencia:</span>
                                    <strong className={dashboard.control_efectivo.diferencia! >= 0 ? 'positive' : 'negative'}>
                                        {formatCurrency(dashboard.control_efectivo.diferencia!)}
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="info-card">
                    <h3 className="info-card-title">📉 Egresos</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span>Compras:</span>
                            <strong>{formatCurrency(dashboard.egresos.total_compras)}</strong>
                        </div>
                        <div className="info-row">
                            <span>Gastos:</span>
                            <strong>{formatCurrency(dashboard.egresos.total_gastos)}</strong>
                        </div>
                        <div className="info-row highlight">
                            <span>Total Egresos:</span>
                            <strong className="negative">{formatCurrency(dashboard.egresos.total_egresos)}</strong>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <h3 className="info-card-title">🔄 Movimientos de Caja</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span>Retiros:</span>
                            <strong className="negative">{formatCurrency(dashboard.movimientos_caja.retiros)}</strong>
                        </div>
                        <div className="info-row">
                            <span>Depósitos:</span>
                            <strong className="positive">{formatCurrency(dashboard.movimientos_caja.depositos)}</strong>
                        </div>
                        <div className="info-row highlight">
                            <span>Neto:</span>
                            <strong className={dashboard.movimientos_caja.neto >= 0 ? 'positive' : 'negative'}>
                                {formatCurrency(dashboard.movimientos_caja.neto)}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficas */}
            <div className="charts-grid">
                <div className="chart-card chart-large">
                    <h3 className="chart-title">📈 Ventas por Hora</h3>
                    <div className="chart-wrapper">
                        <Line
                            data={ventasPorHoraData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        titleFont: { size: 14 },
                                        bodyFont: { size: 13 },
                                        callbacks: {
                                            label: (context) => `Ventas: ${formatCurrency(context.parsed.y ?? 0)}`
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: (value) => formatCurrency(Number(value))
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">🏆 Productos Más Vendidos</h3>
                    <div className="chart-wrapper">
                        <Bar
                            data={productosMasVendidosData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        callbacks: {
                                            label: (context) => `Cantidad: ${context.parsed.x} unidades`
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">💳 Métodos de Pago</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={metodosPagoData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            padding: 15,
                                            font: { size: 12 }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        callbacks: {
                                            label: (context) => {
                                                const label = context.label || '';
                                                const value = formatCurrency(Number(context.parsed));
                                                const percentage = dashboard.graficas.metodos_pago[context.dataIndex].porcentaje;
                                                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">📦 Categorías Más Vendidas</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={categoriasMasVendidasData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            padding: 15,
                                            font: { size: 12 }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        padding: 12,
                                        callbacks: {
                                            label: (context) => {
                                                const label = context.label || '';
                                                const value = formatCurrency(Number(context.parsed));
                                                return `${label}: ${value}`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Tablas de Detalles */}
            <div className="tables-grid">
                <div className="table-card">
                    <h3 className="table-title">🏆 Top Productos</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Ingresos</th>
                                    <th>Transacciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.graficas.productos_mas_vendidos.map((producto, index) => (
                                    <tr key={index}>
                                        <td className="product-name">{producto.producto}</td>
                                        <td>{producto.cantidad}</td>
                                        <td className="amount">{formatCurrency(producto.ingresos)}</td>
                                        <td>{producto.transacciones}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="table-card">
                    <h3 className="table-title">📦 Top Categorías</h3>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Cantidad</th>
                                    <th>Ingresos</th>
                                    <th>Ventas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.graficas.categorias_mas_vendidas.map((categoria, index) => (
                                    <tr key={index}>
                                        <td className="category-name">{categoria.categoria}</td>
                                        <td>{categoria.cantidad}</td>
                                        <td className="amount">{formatCurrency(categoria.ingresos)}</td>
                                        <td>{categoria.ventas}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}