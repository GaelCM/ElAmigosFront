import { Calendar, ChevronDown, FileText, Menu, Package, Search, Settings, TrendingUp, Wifi } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

import { Link, Outlet } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useHotkeys } from "react-hotkeys-hook";
import { useState } from "react";
import DialogProducto from "./dialogProductos";

type navBarProps = {
  sidebarOpen: boolean,
  setSidebarOpen: (open: boolean) => void;
}

export default function NavBar({ setSidebarOpen }: navBarProps) {
  ;
  const { user } = useCurrentUser();
  const [openP, setOpenP] = useState(false);
  const [focusScanner, setFocusScanner] = useState<() => void>(() => { });
  //const [turnoData, setTurnoData] = useState(JSON.parse(localStorage.getItem("openCaja") || "{}"));

  useHotkeys('F10', () => {
    setOpenP(true)
  }, {
    enableOnFormTags: true
  }, [setOpenP]); // El array de dependencias es opcional pero recomendado


  const openDialog = () => {
    setOpenP(true)

  }

  return (
    <>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex">
                <h1 className="text-primary font-bold">
                  Sucursal : {user.sucursal}
                </h1>
                <h1 className="font-bold text-primary">
                  {/* {turnoData.id_turno ? "Turno Actual : " + turnoData.id_turno : "Turno Actual : " + "No hay turno abierto"} */}
                </h1>


              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" color="white" />
                <Button variant={"default"} className="px-10 cursor-pointer" onClick={openDialog}>Buscar Producto (F10)</Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
                  <Wifi className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                  <span>Online</span>
                </div>

              </div>

              {user.id_rol === 1 && (
                <div className="hidden lg:flex items-center gap-4">
                  {/* Dropdown de Reportes */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <FileText className="w-4 h-4" />
                        Reportes
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Reportes de Ventas</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Link to={"reportes/ventasPorMes"} className="flex items-center gap-2 w-full h-full">
                          <Calendar className="w-4 h-4" />
                          Por Mes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2" >
                        <Package className="w-4 h-4" />
                        Por Productos
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Reportes de Inventario</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2">
                        <Link to={"reportes/stockBajo"} className="flex items-center gap-2 w-full h-full">
                          <TrendingUp className="w-4 h-4" />
                          Stock Bajo
                        </Link>
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Link to={"/configuraciones"} className="gap-2 bg-transparent">
                    <Settings className="w-4 h-4" />
                  </Link>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" color="white" />
              <Button variant={"default"} className="px-10 cursor-pointer">Buscar   Producto (F10)</Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 bg-card overflow-auto">
          <Outlet context={{ setFocusScanner }}></Outlet>
        </main>


      </div>

      <DialogProducto isOpen={openP} setIsOpen={(open) => {
        setOpenP(open);
        if (!open) focusScanner(); // 👈 AQUI
      }} idSucursal={user.id_sucursal}></DialogProducto>
    </>
  )
}