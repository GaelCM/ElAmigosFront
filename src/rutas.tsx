import { createHashRouter } from "react-router"
import App from "./App"
import HomePage from "./pages/home/home"
import LoginPage from "./auth/login"
import { AuthGuard } from "./auth/authguard"
import ProductosPage from "./pages/productos/productosPage"
import ProductosXSuc from "./pages/productos/components/productosXsuc"
import TipoProductoPage from "./pages/productos/components/tipoProductoRoute"
import EditarProductoForm from "./pages/productos/components/editarProductoForm"
import EditarProductoCompuestoForm from "./pages/productos/components/editarProductoEspForm"
import TransferenciasPage from "./pages/trasferencias/transferenciasPage"
import NuevaTransferenciaPage from "./pages/trasferencias/components/nuevaTransferenciaPage"
import SucursalesPage from "./pages/sucursales/sucursalesPage"
import NuevaSucurcalForm from "./pages/sucursales/components/nuevaSucurcalForm"
import EditarSucursalForm from "./pages/sucursales/components/editarSucursalForm"
import CategoriasPage from "./pages/categorias/categoriasPage"
import NuevaCategoriaForm from "./pages/categorias/components/NuevaCategoriaForm"
import EditarCategoriaForm from "./pages/categorias/components/EditarCategoriaForm"
import ProveedoresPage from "./pages/proveedores/proveedoresPage"
import NuevaProveedorForm from "./pages/proveedores/components/NuevaProveedorForm"
import EditarProveedorForm from "./pages/proveedores/components/EditarProveedorForm"
import EgresosPage from "./pages/egresos/egresos"
import CerrarCajaPage from "./pages/caja/CerrarCajaPage"
import DashboardPage from "./pages/dashboard/dashboard"
import MisVentasReport from "./pages/reportes/ventas/misVentas"
import VentasPorMes from "./pages/reportes/ventas/ventasPorMes"
import BajoStockPage from "./pages/reportes/stock/bajoStockPage"
import { ListPrints } from "./components/ListPrints"
import UsuariosPage from "./pages/usuarios/usuariosPage"
import NuevoUsuarioForm from "./pages/usuarios/components/NuevoUsuarioForm"
import EditarUsuarioForm from "./pages/usuarios/components/EditarUsuarioForm"
import DetalleVentaPage from "./pages/reportes/ventas/detalleVenta"



export const rutas = createHashRouter([
    {
        element: <AuthGuard />,
        children: [
            {
                path: "/",
                element: <App />,

                children: [
                    {
                        path: "/",
                        element: <HomePage />
                    },
                    {
                        path: "/productos",
                        element: <ProductosPage />
                    },
                    {
                        path: "/productos/sucursal",
                        element: <ProductosXSuc />
                    },
                    {
                        path: "/productos/nuevoProducto",
                        element: <TipoProductoPage />
                    },
                    {
                        path: "/productos/editProducto",
                        element: <EditarProductoForm />
                    },
                    {
                        path: "/productos/editProductoEspecial",
                        element: <EditarProductoCompuestoForm />
                    },
                    {
                        path: "/transferencias",
                        element: <TransferenciasPage />
                    },
                    {
                        path: "/transferencias/nueva",
                        element: <NuevaTransferenciaPage />
                    },
                    {
                        path: "/sucursales",
                        element: <SucursalesPage />
                    },
                    {
                        path: "/sucursales/nueva",
                        element: <NuevaSucurcalForm />
                    },
                    {
                        path: "/sucursales/editar/:id",
                        element: <EditarSucursalForm />
                    },
                    {
                        path: "/categorias",
                        element: <CategoriasPage />
                    },
                    {
                        path: "/categorias/nueva",
                        element: <NuevaCategoriaForm />
                    },
                    {
                        path: "/categorias/editar/:id",
                        element: <EditarCategoriaForm />
                    },
                    {
                        path: "/proveedores",
                        element: <ProveedoresPage />
                    },
                    {
                        path: "/proveedores/nueva",
                        element: <NuevaProveedorForm />
                    },
                    {
                        path: "/proveedores/editar/:id",
                        element: <EditarProveedorForm />
                    },
                    {
                        path: "/egresos",
                        element: <EgresosPage />
                    },
                    {
                        path: "/usuarios",
                        element: <UsuariosPage />
                    },
                    {
                        path: "/usuarios/nuevo",
                        element: <NuevoUsuarioForm />
                    },
                    {
                        path: "/usuarios/editar/:id",
                        element: <EditarUsuarioForm />
                    },
                    {
                        path: "/cerrar-caja",
                        element: <CerrarCajaPage />
                    },
                    {
                        path: "/dashboard",
                        element: <DashboardPage />
                    },
                    {
                        path: "/reportes/misVentas",
                        element: <MisVentasReport />
                    },
                    {
                        path: "/reportes/detalleVenta",
                        element: <DetalleVentaPage />
                    },

                    {
                        path: "/reportes/ventasPorMes",
                        element: <VentasPorMes />
                    },
                    {
                        path: "/reportes/stockBajo",
                        element: <BajoStockPage />
                    },
                    {
                        path: "/configuraciones",
                        element: <ListPrints />
                    }
                ]
            }
        ]
    },
    {
        path: "/login",
        element: <LoginPage />
    }
])