import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { nuevaTransferenciaApi, obtenerProductosTransferirApi } from "@/api/transferenciasApi/transferenciasApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/contexts/currentUser";
import { useTransferirProductos } from "@/contexts/listaTransferencia";
import type { ProductoVenta } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import { Minus, PackageOpen, Plus, Search, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState,} from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";




export default function CrearTransferencia() {
  // --- ESTADO ---
  const {user}=useCurrentUser();
  const [origen, setOrigen] = useState<string>(user?.id_sucursal.toString() || "");
  const [destino, setDestino] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [sucursalLista, setSucursalLista] = useState<Sucursal[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoVenta[]>([]);
 

  // --- ZUSTAND STORE ---
  const {
    carrito,
    addProduct,
    incrementQuantity,
    decrementQuantity,
    removeProduct,
    clearCart,
    getTotalItems,
  } = useTransferirProductos();

  // --- EFECTOS ---
  
   // --- EFECTO 1: Carga Inicial de Sucursales ---
  useEffect(() => {
    let mounted = true;
    obtenerSucursalesApi()
      .then((res) => {
        if (mounted && res.data) setSucursalLista(res.data);
      })
      .catch((err) => console.error("Error sucursales", err));
    return () => { mounted = false; };
  }, []);

  // --- EFECTO 2: Cargar Productos al cambiar Origen ---
  useEffect(() => {

    let mounted = true;
    setProductosLista([]); 
    clearCart(); 


    const fetchProductos = async () => {
      try {
        const res = await obtenerProductosTransferirApi(origen); // Asegurar que sea número si la API lo espera  
        // Solo actualizamos el estado si el componente sigue montado y el origen no ha cambiado de nuevo
        if (mounted) {
          if (res.success) {
            setProductosLista(res.data);
          } else {
            setProductosLista([]);
          }
        }
      } catch (error) {
        console.error("Error obteniendo productos:", error);
        if (mounted) setProductosLista([]);
      } 
    };

    fetchProductos();

    // Cleanup function para evitar race conditions
    return () => {
      mounted = false;
    };
  }, [origen, clearCart]); // Añadimos clearCart a dependencias (es estable en Zustand, pero es buena práctica)


  // --- MEMOIZACIÓN: Filtrado eficiente ---
  const productosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return productosLista.filter((p) =>
      p.nombre_producto.toLowerCase().includes(term) ||
      p.sku_pieza.toLowerCase().includes(term)
    );
  }, [productosLista, busqueda]);
  


  // --- HANDLERS ---
  const transferirProductos = async(e: React.MouseEvent<HTMLButtonElement>) => {

    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, "yyyy-MM-dd HH:mm:ss");
    e.preventDefault();
    if (!origen || !destino || carrito.length === 0) return;

    // Payload final basado en tu imagen de base de datos
    const nuevaTransferencia = {
      id_sucursal_origen: Number(origen),
      id_sucursal_destino: Number(destino),
      id_usuario_origen: user?.id_usuario,
      id_usuario_autoriza: null,
      id_usuario_recibe: null,
      fecha_creacion: fechaFormateada,
      fecha_recepcion: null,
      fecha_autorizacion: null,
      estado: "pendiente", // Default según DB
      motivo: motivo,
      productos: carrito.map((item) => ({
        id_producto: item.product.id_producto,
        cantidad: item.quantity,
        id_unidad_venta: item.product.id_unidad_venta
      })),
    };

    const res=await nuevaTransferenciaApi(nuevaTransferencia);
    if(res.success){
      toast.success('Transferencia generada correctamente', {
        description:`La transferencia se ha generado correctamente, FOLIO ${res.data}`,});
      setMotivo("");
      clearCart();
      setDestino("");
    }else{
      toast.error("Error al crear la transferencia. Intenta nuevamente.",{
        description: res.message || "Error desconocido.",
      });
    }

    
    
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6">
      
      {/* ---------------- IZQUIERDA: SELECCIÓN Y TABLA ---------------- */}
      <Card className="flex-1 flex flex-col h-full shadow-md border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-primary" />
            Nueva Transferencia de Inventario
          </CardTitle>
          <CardDescription>
            Selecciona el origen y destino para ver los productos disponibles.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Selectores de Sucursal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sucursal Origen</Label>
              <Select value={origen}  onValueChange={setOrigen} disabled={user.id_rol!=1} >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursalLista.map((s) => (
                    <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sucursal Destino</Label>
              <Select 
                value={destino} 
                onValueChange={setDestino} 
                disabled={!origen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursalLista
                    .filter((s) => s.id_sucursal.toString() !== origen)
                    .map((s) => (
                      <SelectItem key={s.id_sucursal} value={s.id_sucursal.toString()}>
                        {s.nombre}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={!origen}
            />
          </div>

          {/* Tabla de Productos */}
          <div className="border rounded-md flex-1 overflow-hidden relative">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Presentación</TableHead>
                    <TableHead className="text-center">Stock Disp.</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!origen ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Selecciona una sucursal de origen para comenzar.
                      </TableCell>
                    </TableRow>
                  ) : productosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No se encontraron productos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltrados.map((prod) => {
                      // Calcular stock restante en tiempo real restando lo que ya está en el carrito
                      const itemEnCarrito = carrito.find(item => item.product.id_producto === prod.id_producto);
                      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
                      const stockReal = prod.stock_disponible_presentacion - cantidadEnCarrito;
                      const sinStock = stockReal <= 0;

                      return (
                        <TableRow key={prod.id_unidad_venta}>
                          <TableCell className="font-medium">
                            <div>{prod.nombre_producto}</div>
                            <div className="text-xs text-muted-foreground">{prod.sku_pieza}</div>
                          </TableCell>
                          <TableCell>{prod.nombre_presentacion}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={sinStock ? "destructive" : "secondary"}>
                              {stockReal}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={sinStock ? "ghost" : "default"}
                              disabled={sinStock}
                              onClick={() => addProduct(prod as ProductoVenta)} // Cast si TS se queja por campos extra
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- DERECHA: RESUMEN / CARRITO ---------------- */}
      <Card className="w-full lg:w-[400px] flex flex-col h-full shadow-lg border-l-4 border-l-primary/20">
        <CardHeader className="bg-slate-50 border-b pb-4">
          <CardTitle className="text-lg flex justify-between items-center">
            Resumen de Envío
            <Badge variant="default" className="text-sm">
              {getTotalItems()} Items
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-4">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                <PackageOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm">El carrito de transferencia está vacío.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div key={item.product.id_producto} className="flex flex-col gap-2 p-3 border rounded-lg bg-card shadow-sm">
                    {/* Header Item */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{item.product.nombre_producto}</p>
                        <p className="text-xs text-muted-foreground">{item.product.nombre_presentacion}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => removeProduct(item.product.id_producto)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Controles Cantidad */}
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded text-xs">
                       <span className="text-muted-foreground ml-2">
                         Disp: {item.product.stock_disponible_presentacion}
                       </span>
                       <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" size="icon" className="h-6 w-6"
                            onClick={() => decrementQuantity(item.product.id_producto)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <Button 
                            variant="outline" size="icon" className="h-6 w-6"
                            disabled={item.quantity >= item.product.stock_disponible_presentacion}
                            onClick={() => incrementQuantity(item.product.id_producto)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col gap-4 p-4 bg-slate-50">
          <div className="w-full space-y-2">
            <Label htmlFor="motivo">Motivo de la transferencia *</Label>
            <Textarea
              id="motivo"
              placeholder="Ej. Reabastecimiento semanal..."
              className="resize-none bg-white"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={transferirProductos}
            disabled={carrito.length === 0 || !motivo || !origen || !destino}
          >
            <Send className="h-4 w-4" />
            Crear Transferencia
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}