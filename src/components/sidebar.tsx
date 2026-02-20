
import * as LucideIcons from "lucide-react";
import { Plus, X, Lock, LogOut } from "lucide-react"; // Import some specific ones needed locally in JSX
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router"
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "./ui/button";
import AddCliente from "./dialogAddCliente";
import { useCurrentUser } from "@/contexts/currentUser";
import logo from "../assets/logo.jpg";

import { useListaProductos } from "@/contexts/listaProductos";

type sideBarProps = {
    sidebarOpen: boolean,
    setSidebarOpen: (open: boolean) => void;
}



export default function Sidebar({ setSidebarOpen, sidebarOpen }: sideBarProps) {

    const { user } = useCurrentUser();
    const { carritoActivo, asignarClienteCarrito } = useListaProductos();

    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setOpen] = useState(false);
    const rutaActual = location.pathname;

    useHotkeys('f1', (e) => {
        e.preventDefault();
        navigate("/");
    }, { enableOnFormTags: true });



    // Mapa de respaldo por si el backend no envía el icono o la DB tiene datos genéricos
    const fallbackIconMap: Record<string, string> = {
        "Dashboard": "Home",
        "Transferencias": "ArrowRightLeft",
        "Sucursales": "Store",
        "Categorias": "Layers",
        "Egresos": "DollarSign",
        "Mis Ventas": "FileText",
        "Proveedores": "Truck",
        "Productos": "Package",
        "Usuarios": "Users",
        "Configuracion": "Settings"
    };

    // Los permisos ahora son objetos menuItem
    const sidebarItemsFiltrados = (user?.permisos || []).map((permiso) => {
        // 1. Intentar obtener el nombre del icono desde el permiso (Backend)
        let iconName = (permiso.icon || "").trim();

        // 2. Si no viene del backend o está vacío, usar el mapa de respaldo basado en el nombre del menú
        if (!iconName) {
            iconName = fallbackIconMap[permiso.nombre_menu] || "Home";
        }

        // Dynamic lookup from all Lucide icons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allIcons = LucideIcons as any;


        // Try exact match or case-insensitive match
        let Icon = allIcons[iconName];

        if (!Icon) {
            // Case-insensitive fallback
            const lowerName = iconName.toLowerCase();
            const matchingKey = Object.keys(allIcons).find(key => key.toLowerCase() === lowerName);
            if (matchingKey) {
                Icon = allIcons[matchingKey];
            }
        }

        if (!Icon) {
            Icon = LucideIcons.Home;
        }

        return {
            id: permiso.id_menu,
            label: permiso.nombre_menu,
            icon: Icon,
            ruta: permiso.ruta,
        };
    });


    return (
        <>
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div
                className={`
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
                lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 
                w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out
                flex flex-col h-full
            `}
            >
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-6 lg:mb-8">
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="" className="w-52 h-42" />
                        </div>
                        <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 mb-4 lg:mb-6">
                        <Button className="w-full justify-start gap-2 text-sm lg:text-base" size="sm">
                            <Link to={"/"} className="flex w-full justify-start items-center gap-2 text-sm lg:text-base">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nueva Venta (F1)</span>
                                <span className="sm:hidden">Venta</span>
                            </Link>
                        </Button>
                        {/*<Button
                            variant="outline"
                            className="w-full justify-start gap-2 bg-transparent text-sm lg:text-base"
                            size="sm"
                            onClick={() => { setOpen(true) }}
                        >
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Cliente</span>
                            <span className="sm:hidden">Cliente</span>
                        </Button>*/}
                    </div>

                    <nav className="space-y-1 lg:space-y-2">
                        {sidebarItemsFiltrados.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.id}
                                    to={item.ruta}
                                    onClick={() => {
                                        setSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar
                                    }}
                                    className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${rutaActual === item.ruta
                                        ? "bg-primary text-sidebar-primary-foreground"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Perfil de usuario al fondo */}
                <div className="p-4 border-t border-sidebar-border bg-sidebar shrink-0 space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                            {user?.usuario?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-semibold text-sidebar-foreground truncate text-sm">{user?.usuario}</span>
                            <span className="text-[10px] text-sidebar-foreground/70 truncate">{user?.rol}</span>
                        </div>
                    </div>

                    {/* Action Buttons - Full Width and Prominent */}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/50 text-orange-600 hover:text-orange-700 font-semibold"
                            onClick={() => navigate("/cerrar-caja")}
                        >
                            <Lock className="w-5 h-5" />
                            <span>Cerrar Caja</span>
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full justify-start gap-2 bg-red-500 hover:bg-red-500 border-red-500 text-white hover:text-white font-semibold"
                            onClick={() => {
                                if (localStorage.getItem("openCaja") != null) {
                                    navigate("/cerrar-caja");
                                    return;
                                }
                                localStorage.removeItem("tkn");
                                localStorage.removeItem("currentUser");
                                localStorage.removeItem("openCaja");
                                navigate("/login");
                            }}
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Salir</span>
                        </Button>
                    </div>
                </div>
            </div>
            <AddCliente
                isOpen={isOpen}
                setIsOpen={setOpen}
                onSelect={(selectedCliente) => {
                    if (carritoActivo) {
                        asignarClienteCarrito(carritoActivo, selectedCliente);
                    }
                }}
            />
        </>
    )
}