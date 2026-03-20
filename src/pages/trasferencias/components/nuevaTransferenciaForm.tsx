import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { nuevaTransferenciaApi, obtenerProductosTransferirApi } from "@/api/transferenciasApi/transferenciasApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/contexts/currentUser";
import { useTransferirProductos } from "@/contexts/listaTransferencia";
import type { ProductoVenta } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import { AlertCircle, Minus, PackageOpen, Plus, Search, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function CrearTransferencia() {
  // --- ESTADO ---
  const { user } = useCurrentUser();
  const [origen, setOrigen] = useState<string>(user?.id_sucursal.toString() || "");
  const [destino, setDestino] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [sucursalLista, setSucursalLista] = useState<Sucursal[]>([]);
  const [productosLista, setProductosLista] = useState<ProductoVenta[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

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
  useEffect(() => {
    let mounted = true;
    obtenerSucursalesApi()
      .then((res) => {
        if (mounted && res.data) setSucursalLista(res.data);
      })
      .catch((err) => console.error("Error sucursales", err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setProductosLista([]);

    const fetchProductos = async () => {
      try {
        const res = await obtenerProductosTransferirApi(origen);
        if (mounted) {
          if (res.success) {
            setProductosLista(res.data);
          } else {
            setProductosLista([]);
            toast.error("Error al cargar productos", {
              description: res.message || "No se pudieron obtener los productos de esta sucursal."
            });
          }
        }
      } catch (error: any) {
        console.error("Error obteniendo productos:", error);
        if (mounted) {
          setProductosLista([]);
          toast.error("Error de conexión", {
            description: "No se pudo establecer conexión con el servidor de inventario."
          });
        }
      }
    };

    fetchProductos();
    return () => {
      mounted = false;
    };
  }, [origen, clearCart]);


  // --- MEMOIZACIÓN: Filtrado eficiente ---
  const productosFiltrados = useMemo(() => {
    const term = busqueda.toLowerCase();
    return productosLista.filter((p) => {
      const nombre = (p.nombre_producto || "").toLowerCase();
      const sku = (p.sku_pieza || "").toLowerCase();
      return nombre.includes(term) || sku.includes(term);
    });
  }, [productosLista, busqueda]);

  // --- HANDLERS ---
  const transferirProductos = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setErrorMessage(null);
    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, "yyyy-MM-dd HH:mm:ss");
    e.preventDefault();
    if (!origen || !destino || carrito.length === 0) return;

    const nuevaTransferencia = {
      id_sucursal_origen: Number(origen),
      id_sucursal_destino: Number(destino),
      id_usuario_origen: user?.id_usuario,
      id_usuario_autoriza: null,
      id_usuario_recibe: null,
      fecha_creacion: fechaFormateada,
      fecha_recepcion: null,
      fecha_autorizacion: null,
      estado: "pendiente",
      motivo: motivo,
      productos: carrito.map((item) => ({
        id_producto: item.product.id_producto,
        cantidad: item.quantity,
        id_unidad_venta: item.product.id_unidad_venta
      })),
    };

    const res = await nuevaTransferenciaApi(nuevaTransferencia);
    if (res.success) {
      toast.success('Transferencia generada correctamente', {
        description: `La transferencia se ha generado correctamente, FOLIO ${res.data}`,
      });
      setMotivo("");
      clearCart();
      setDestino("");
      navigate("/transferencias");
    } else {
      setErrorMessage(res.message || "Ocurrió un error inesperado al procesar la transferencia.");
      toast.error("Error al crear la transferencia", {
        description: "Revisa los detalles en el panel de resumen.",
      });
    }
  };

  return (
    <div className="w-full px-4 h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4">
      {/* ---------------- IZQUIERDA: SELECCIÓN Y TABLA (40%) ---------------- */}
      <Card className="lg:flex-[4] flex flex-col h-full shadow-md border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-primary" />
            Nueva Transferencia de Inventario
          </CardTitle>
          <CardDescription>
            Selecciona el origen y destino para ver los productos disponibles.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Selectores de Sucursal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sucursal Origen</Label>
              <Select value={origen} onValueChange={setOrigen} disabled={user.id_rol != 1} >
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
          <div className="border rounded-md flex-1 overflow-y-auto relative min-h-0">
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
                    const itemEnCarrito = carrito.find(item => item.product.id_unidad_venta === prod.id_unidad_venta);
                    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
                    const stockReal = prod.stock_disponible_presentacion - cantidadEnCarrito;
                    const sinStock = stockReal <= 0;

                    return (
                      <TableRow key={prod.id_unidad_venta}>
                        <TableCell className="font-medium text-sm">
                          <div>{prod.nombre_producto}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium">{prod.sku_pieza}</span>
                            {prod.factor_conversion_cantidad > 1 && (
                              <span className="text-[9px] bg-blue-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                Paquete de {prod.factor_conversion_cantidad} pzs
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{prod.nombre_presentacion}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sinStock ? "destructive" : "secondary"} className="font-bold">
                            {stockReal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant={sinStock ? "ghost" : "default"}
                            disabled={sinStock}
                            className="h-8 w-8"
                            onClick={() => addProduct(prod as ProductoVenta)}
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
          </div>
        </CardContent>
      </Card>

      {/* ---------------- DERECHA: RESUMEN / CARRITO (60%) ---------------- */}
      <Card className="lg:flex-[6] flex flex-col h-full shadow-lg border-l-4 border-l-primary/20">
        <CardHeader className="bg-slate-50 border-b p-3">
          <CardTitle className="text-xl font-bold flex justify-between items-center">
            Resumen de Envío
            <Badge variant="default" className="text-base font-bold bg-blue-600">
              {getTotalItems()} Items
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
                <PackageOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm">El carrito de transferencia está vacío.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map((item) => (
                  <div key={item.product.id_unidad_venta} className="flex flex-col p-1.5 border rounded-md bg-card shadow-sm hover:shadow-md transition-shadow">
                    {/* Fila 1: Nombre y Borrar */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex flex-col flex-1 truncate">
                        <p className="font-bold text-sm md:text-base leading-tight truncate">
                          {item.product.nombre_producto}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-[11px] py-0.5 px-2 font-bold bg-blue-200 text-slate-700 border border-slate-300">
                            {item.product.nombre_presentacion} {item.product.factor_conversion_cantidad > 1 ? `(${item.product.factor_conversion_cantidad} pzs)` : ''}
                          </Badge>
                          {item.product.es_producto_compuesto === 1 && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 py-0 h-4">
                              Compuesto (Ver Desglose)
                            </Badge>
                          )}
                        </div>
                        {/* Desglose de componentes en el carrito */}
                        {item.product.es_producto_compuesto === 1 && item.product.componentes && (
                          <div className="mt-2 pl-3 border-l-2 border-amber-200 flex flex-col gap-1">
                            {item.product.componentes.map((comp: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>• {comp.nombre_componente}</span>
                                <span className="font-semibold text-slate-700">{comp.cantidad_por_unidad * item.quantity} pzas</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => removeProduct(item.product.id_unidad_venta)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Fila 2: Controles, Stock y Total */}
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <div className="flex items-center bg-slate-100 rounded border p-0.5 gap-1 shrink-0">
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 hover:bg-white"
                          onClick={() => decrementQuantity(item.product.id_unidad_venta)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-7 text-center font-black text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost" size="icon" className="h-6 w-6 hover:bg-white"
                          disabled={item.quantity >= item.product.stock_disponible_presentacion}
                          onClick={() => incrementQuantity(item.product.id_unidad_venta)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-1 items-center justify-end gap-3 truncate">
                        <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                          Stock: {item.product.stock_disponible_presentacion}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-bold border-blue-200 text-blue-700 bg-blue-50 whitespace-nowrap">
                          {item.quantity * item.product.factor_conversion_cantidad} pzas
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col gap-2 p-3 bg-slate-50">
          <div className="w-full space-y-1">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 animate-in fade-in slide-in-from-top-1 duration-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold flex justify-between items-center">
                  Atención requerida
                  <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-red-100" onClick={() => setErrorMessage(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </AlertTitle>
                <AlertDescription className="text-xs font-semibold">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
            <Label htmlFor="motivo" className="font-bold text-sm">Motivo de transferencia *</Label>
            <Input
              id="motivo"
              placeholder="Ej. Reabastecimiento..."
              className="bg-white font-bold h-9"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </div>

          <Button
            className="w-full gap-2 font-bold"
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