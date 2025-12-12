import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Sucursal } from "@/types/Sucursal";
import { ArrowRight, Building2, MapPin, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function ProductosPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();

  useEffect(() => {
    if (user.id_rol === 2) {
      navigate(`/`);
      return;
    }
    setLoading(true);
    obtenerSucursalesApi().then(data => setSucursales(data.data)).catch(err => { setError(err.message) }).finally(() => setLoading(false));
  }, [user.id_rol, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando sucursales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Error de conexión al servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
      <div className="p-6 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Administración de Productos
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Bienvenido, <span className="font-semibold">{user.usuario}</span>
          </p>
          <p className="text-slate-500 mt-1">
            Selecciona la sucursal que deseas gestionar
          </p>
        </div>

        {/* Cards responsive en grid */}
        <div className="flex flex-col gap-6 md:gap-8">
          {sucursales.map((sucursal) => (
            <Card
              key={sucursal.id_sucursal}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 group w-full"
              onClick={() => { navigate(`/productos/sucursal?id=${sucursal.id_sucursal}&sucursal=${sucursal.nombre}`) }}
            >
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:gap-8 h-full justify-between">
                {/* Info Principal */}
                <div className="flex items-center gap-4 mb-4 md:mb-0 md:w-1/3">
                  <div className="p-4 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {sucursal.nombre}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {sucursal.direccion}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        📞 {sucursal.telefono}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estadísticas completas de la sucursal, horizontal en web, vertical en móvil */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:w-2/3 mb-4 md:mb-0">
                  <div className="bg-slate-50 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-blue-600 text-xl font-bold">{sucursal.total_productos}</span>
                    <span className="text-xs text-slate-500 mt-1">Productos</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-indigo-600 text-xl font-bold">{sucursal.total_presentaciones}</span>
                    <span className="text-xs text-slate-500 mt-1">Presentaciones</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-green-600 text-xl font-bold">{sucursal.stock_total_piezas}</span>
                    <span className="text-xs text-slate-500 mt-1">Stock total piezas</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-green-700 text-lg font-bold">${sucursal.valor_inventario_costo.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 mt-1">Inventario (costo)</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-blue-700 text-lg font-bold">${sucursal.valor_inventario_venta.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 mt-1">Inventario (venta)</span>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-yellow-600 text-xl font-bold">{sucursal.productos_stock_bajo}</span>
                    <span className="text-xs text-yellow-700 mt-1">Stock bajo</span>
                  </div>
                  <div className="bg-red-100 rounded-lg p-3 text-center flex flex-col items-center">
                    <span className="text-red-600 text-xl font-bold">{sucursal.productos_sin_stock}</span>
                    <span className="text-xs text-red-700 mt-1">Sin stock</span>
                  </div>
                </div>

                {/* Botón de acción */}
                <Button
                  className="group-hover:bg-blue-600 transition-colors w-full md:w-auto mt-auto md:mt-0"
                  size="lg"
                >
                  <span>Gestionar</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>


      </div>
    </div>
  );
}