
import { Activity, BarChart3, Box, Home, Package, Pill, Plus,  ShoppingCart, UserPlus, Users, X } from "lucide-react";
import {useState } from "react";
import { Link, useLocation } from "react-router"
import { Button } from "./ui/button";
import AddCliente from "./dialogAddCliente";
import { useCurrentUser } from "@/contexts/currentUser";


type sideBarProps={
    sidebarOpen:boolean,
    setSidebarOpen:(open: boolean) => void;
}



export default function Sidebar({setSidebarOpen,sidebarOpen}:sideBarProps){

    const {user}=useCurrentUser();

    const location = useLocation();
    const [isOpen,setOpen]=useState(false);
    const rutaActual = location.pathname;

  

            // Mapear iconos string a componentes
            const iconMap: Record<string, any> = {
                Home,
                Pill,
                Box,
                ShoppingCart,
                Package,
                Users,
                BarChart3,
            };

            // Los permisos ahora son objetos menuItem
            const sidebarItemsFiltrados = (user?.permisos || []).map((permiso) => {
                // Buscar el icono por nombre, si no existe, usar Home por defecto
                const Icon = iconMap[permiso.icono] || Home;
                return {
                    id: permiso.id_menu,
                    label: permiso.nombre_menu,
                    icon: Icon,
                    ruta: permiso.ruta,
                };
            });

            console.log(sidebarItemsFiltrados)

        return(
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
            `}
            >
                <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-6 lg:mb-8">
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h1 className="text-lg lg:text-xl font-bold text-sidebar-foreground">Depósito EL AMIGO</h1>
                    </div>
                    <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-2 mb-4 lg:mb-6">

                    <Button  className="w-full justify-start gap-2 text-sm lg:text-base" size="sm">
                    <Link to={"/"} className="flex w-full justify-start items-center gap-2 text-sm lg:text-base">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nueva Venta</span>
                        <span className="sm:hidden">Venta</span>
                    </Link>
                    </Button>
                    <Button
                    variant="outline"
                    className="w-full justify-start gap-2 bg-transparent text-sm lg:text-base"
                    size="sm"
                    onClick={()=>{setOpen(true)}}
                    >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Buscar Cliente (alt+m)</span>
                    <span className="sm:hidden">Cliente</span>
                    </Button>
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
                                        className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 rounded-lg text-left transition-colors text-sm lg:text-base ${
                                            rutaActual === item.ruta
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

                                {/* Fin contenido sidebar */}
                      </div>
                                {/* Perfil de usuario al fondo, fuera del contenido principal */}
                        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-sidebar-border bg-sidebar/80 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                                        {user?.usuario?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-sidebar-foreground truncate">{user?.usuario}</span>
                                        <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
                                        <span className="text-xs text-sidebar-foreground/70 truncate">{user?.rol}</span>
                                    </div>
                                </div>
                    </div>
                    <AddCliente isOpen={isOpen} setIsOpen={setOpen}/>
                </>
        )
}