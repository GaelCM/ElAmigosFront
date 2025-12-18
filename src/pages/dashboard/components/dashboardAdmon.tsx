import type { TurnoActivo, TurnosActivosResponse } from "@/types/Dashboard";
import { useEffect, useState } from "react";
import DashboardUser from "./dashboardUser";
import './dashboardAdmon.css';

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
                const response = await fetch("http://localhost:3000/api/dashboard/activos", {
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
            <div>
                <div className="back-button-container">
                    <button
                        className="back-button"
                        onClick={() => setSelectedTurnoId(null)}
                    >
                        ← Volver a Turnos Activos
                    </button>
                </div>
                <DashboardUser idTurno={selectedTurnoId} />
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>Cargando turnos activos...</p>
            </div>
        );
    }

    // Error state
    if (error || !turnosActivos) {
        return (
            <div className="admin-error">
                <div className="error-icon">⚠️</div>
                <h2>Error al cargar turnos</h2>
                <p>{error || "No se pudieron obtener los turnos activos"}</p>
            </div>
        );
    }

    // No active shifts
    if (turnosActivos.length === 0) {
        return (
            <div className="admin-empty">
                <div className="empty-icon">📊</div>
                <h2>No hay turnos activos</h2>
                <p>Actualmente no hay turnos abiertos en ninguna sucursal</p>
            </div>
        );
    }

    // Lista de turnos activos
    return (
        <div className="admin-dashboard-container">
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="text-primary">Dashboard Administrativo</h1>
                    <p className="admin-subtitle">
                        {turnosActivos.length} {turnosActivos.length === 1 ? 'turno activo' : 'turnos activos'}
                    </p>
                </div>
                <div className="bg-primary flex flex-col items-center justify-center text-white p-2 rounded" onClick={() => window.location.reload()}>
                    🔄 Actualizar
                </div>
            </div>

            {/* Grid de Turnos Activos */}
            <div className="turnos-grid">
                {turnosActivos.map((turno) => (
                    <div
                        key={turno.id_turno}
                        className="turno-card"
                        onClick={() => setSelectedTurnoId(turno.id_turno)}
                    >
                        {/* Header de la tarjeta */}
                        <div className="turno-card-header">
                            <div className="turno-info">
                                <h3 className="turno-sucursal">{turno.sucursal.nombre}</h3>
                                <p className="turno-id">Turno #{turno.id_turno}</p>
                            </div>
                            <div className="turno-status">
                                Activo
                            </div>
                        </div>

                        {/* Información del usuario */}
                        <div className="turno-usuario">
                            <span className="usuario-icon"></span>
                            <span className="usuario-nombre">{turno.usuario.nombre}</span>
                        </div>

                        {/* Fecha de apertura */}
                        <div className="turno-fecha">
                            <span className="fecha-icon"></span>
                            <span className="fecha-text">{formatDate(turno.fecha_apertura)}</span>
                        </div>

                        {/* Estadísticas */}
                        <div className="turno-stats">
                            <div className="stat-item">
                                <span className="stat-label">Horas Abierto</span>
                                <span className="stat-value">{turno.estadisticas.horas_abierto}h</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Ventas</span>
                                <span className="stat-value">{turno.estadisticas.numero_ventas}</span>
                            </div>
                        </div>

                        {/* Total vendido */}
                        <div className="bg-blue-500 flex flex-col items-center justify-center text-white p-2 rounded">
                            <span className="total-label">Total Vendido</span>
                            <span className="total-value">{formatCurrency(turno.estadisticas.total_vendido)}</span>
                        </div>

                        {/* Efectivo inicial */}
                        <div className="turno-efectivo">
                            <span className="efectivo-label">Efectivo Inicial:</span>
                            <span className="efectivo-value">{formatCurrency(turno.efectivo_inicial)}</span>
                        </div>

                        {/* Call to action */}
                        <div className="turno-cta">
                            Ver Dashboard Completo →
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}