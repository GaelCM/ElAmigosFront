


import { obtenerCategoriasApi } from "@/api/categoriasApi/categoriasApi";
import { actualizarProductoEspApi, getProductosInventario, obtenerProductoEspGeneral } from "@/api/productosApi/productosApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Categoria } from "@/types/Categoria";
import type { Producto } from "@/types/Producto";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Search, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  id_sucur: z.number(),
  isEspecial: z.number(),
  sku_pieza: z.string().min(1, 'El código es requerido'),
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional(),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  precio_venta: z.coerce.number().min(0, { message: 'El precio de venta debe ser mayor o igual a 0' }),
  precio_mayoreo: z.coerce.number().min(0, { message: 'El precio de mayoreo debe ser mayor o igual a 0' }),
  componentes: z.array(
    z.object({
      id_unidad_venta: z.number(),
      nombre_producto: z.string(),
      nombre_presentacion: z.string(),
      cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
      precio_unitario: z.number(),
      stock_disponible: z.number(),
      es_producto_compuesto: z.number().optional(),
      factor_conversion_cantidad: z.number().optional()
    })

  ).min(1, 'Debes agregar al menos un componente al paquete')
});

type FormValues = z.infer<typeof formSchema>;





export default function EditarProductoCompuestoForm() {

  const [searchParams] = useSearchParams();
  const id_sucursal = searchParams.get("suc");
  const id_producto = searchParams.get("id");
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);



  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_sucur: 0,
      isEspecial: 1,
      sku_pieza: "",
      nombre_producto: "",
      descripcion: "",
      id_categoria: "",
      precio_venta: 0,
      precio_mayoreo: 0,
      componentes: []
    }
  });

  const componentes = form.watch("componentes");

  const productosFiltrados = productosDisponibles.filter(p => {
    const s = searchTerm.toLowerCase();
    return (
      p.nombre_producto.toLowerCase().includes(s) ||
      p.nombre_presentacion.toLowerCase().includes(s) ||
      p.sku_pieza.toLowerCase().includes(s) ||
      p.sku_presentacion.toLowerCase().includes(s)
    );
  });

  // Reset selectedIndex when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchResults || productosFiltrados.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % productosFiltrados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + productosFiltrados.length) % productosFiltrados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      agregarComponente(productosFiltrados[selectedIndex]);
    }
  };

  useEffect(() => {
    const activeElement = document.querySelector(`[data-product-index="${selectedIndex}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const agregarComponente = (producto: typeof productosDisponibles[0]) => {

    const yaExiste = componentes.find(c => c.id_unidad_venta === producto.id_unidad_venta);
    if (yaExiste) {
      toast.error("Este producto ya está agregado al paquete", {
        description: "No se pueden duplicar componentes en el paquete",
        duration: 3000
      });
      return;
    }

    form.setValue("componentes", [
      ...componentes,
      {
        id_unidad_venta: producto.id_unidad_venta,
        nombre_producto: producto.nombre_producto,
        nombre_presentacion: producto.nombre_presentacion,
        cantidad: 1,
        precio_unitario: producto.precio_venta ?? 0,
        stock_disponible: producto.stock_disponible_presentacion ?? 0,
        es_producto_compuesto: producto.es_producto_compuesto,
        factor_conversion_cantidad: producto.factor_conversion_cantidad
      }

    ]);

    setSearchTerm("");
    setShowSearchResults(false);
  };

  const removerComponente = (index: number) => {
    form.setValue(
      "componentes",
      componentes.filter((_, i) => i !== index)
    );
  };

  const calcularCostoTotal = () => {
    return componentes.reduce((total, comp) => {
      return total + comp.precio_unitario * comp.cantidad;
    }, 0);
  };

  useEffect(() => {
    if (!id_producto || !id_sucursal) return;
    Promise.all([
      setIsLoading(true),
      obtenerCategoriasApi().then(res => {
        if (res.success) {
          setCategorias(res.data);
        } else {
          setCategorias([]);
        }
      }),
      getProductosInventario(parseInt(id_sucursal)).then(res => {
        if (res.success) {
          setProductosDisponibles(res.data);
        } else {
          setProductosDisponibles([]);
        }
      }),
      obtenerProductoEspGeneral(parseInt(id_producto), parseInt(id_sucursal)).then(res => {
        if (res.success && res.data) {
          const data = res.data;
          form.reset({
            id_sucur: parseInt(id_sucursal),
            isEspecial: 1,
            sku_pieza: data.sku_pieza,
            nombre_producto: data.nombre_producto,
            descripcion: data.descripcion ?? "",
            id_categoria: String(data.id_categoria),
            precio_venta: data.precio_venta,
            precio_mayoreo: data.precio_mayoreo,
            componentes: data.componentes
          });
        } else {
          toast.error('Error al cargar el producto');
        }
      }).catch(err => {
        toast.error('Error al cargar el producto: ' + err.message);
      })
    ]).finally(() => setIsLoading(false));
  }, [id_producto, id_sucursal, form]);


  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const res = await actualizarProductoEspApi(parseInt(id_producto!), values);
    if (res.success) {
      toast.success('Producto compuesto actualizado correctamente');
      setIsLoading(false);
      window.history.back();
    } else {
      toast.error('Error al actualizar el producto compuesto: ' + res.message);
      setIsLoading(false);
    }
  };

  const costoTotal = calcularCostoTotal();

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto Compuesto</CardTitle>
          <CardDescription>Actualiza la información del paquete</CardDescription>
        </CardHeader>

        <CardContent>
          {/* ---------------------- FORMULARIO ÚNICO ---------------------- */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log("Errores del formulario:", errors);
                toast.error("Corrige los errores del formulario");
              })}
              className="space-y-10"
            >

              {/* GRID PRINCIPAL DE DOS COLUMNAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ------------------------------------------------------------- */}
                {/* COLUMNA IZQUIERDA - INFORMACIÓN BÁSICA + COMPONENTES */}
                {/* ------------------------------------------------------------- */}

                <div className="space-y-6">

                  {/* ---------------------- INFO BÁSICA ------------------------- */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center">
                        <p className="p-4 mx-4 bg-blue-300 rounded-b-full">1</p>
                        <CardTitle>Información Básica</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">

                      <Alert>
                        <AlertDescription>
                          Define la información básica del paquete/producto compuesto
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="sku_pieza"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: 70999" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nombre_producto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Paquete *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Paquete Sabores 600ml" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} placeholder="Describe el contenido del paquete" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="id_categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categorias.map(cat => (
                                  <SelectItem
                                    key={cat.id_categoria}
                                    value={String(cat.id_categoria)}
                                  >
                                    {cat.category_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </CardContent>
                  </Card>

                  {/* ---------------------- COMPONENTES ------------------------- */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center">
                        <p className="p-4 mx-4 bg-blue-300 rounded-b-full">3</p>
                        <CardTitle>Seleccion precios</CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">

                      <Alert>
                        <AlertDescription>
                          Define el precio de venta basado en los componentes
                        </AlertDescription>
                      </Alert>

                      {/* Resumen */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Resumen del Paquete</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {componentes.map((comp, index) => (
                            <div key={index} className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{comp.cantidad}x</span>
                                <span className="text-gray-600">{comp.nombre_producto}</span>
                                <Badge className={`
                                  ${comp.es_producto_compuesto === 1
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                    : (comp.factor_conversion_cantidad === 1 || comp.nombre_presentacion.toUpperCase() === 'PIEZA')
                                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                                      : 'bg-amber-100 text-amber-700 hover:bg-amber-100'} 
                                  text-[9px] px-1.5 py-0 h-3.5 rounded-full font-bold uppercase border-none`}>
                                  {comp.nombre_presentacion}
                                </Badge>
                              </div>
                              <span className="font-semibold text-gray-900">
                                ${(comp.precio_unitario * comp.cantidad).toFixed(2)}
                              </span>
                            </div>
                          ))}

                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                              <span>Costo Total de Componentes:</span>
                              <span>${costoTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Precio final */}
                      <FormField
                        control={form.control}
                        name="precio_venta"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio de Venta del Paquete *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
                                }
                                placeholder="Ej: 150.00"
                              />
                            </FormControl>
                            <FormMessage />

                            {field.value > 0 && (
                              <p className="text-sm mt-2">
                                {field.value > costoTotal ? (
                                  <span className="text-green-600">
                                    ✓ Ganancia: ${(field.value - costoTotal).toFixed(2)}
                                  </span>
                                ) : field.value < costoTotal ? (
                                  <span className="text-red-600">
                                    ⚠ Pérdida: ${(costoTotal - field.value).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">
                                    Sin ganancia ni pérdida
                                  </span>
                                )}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />

                      {/* Precio mayoreo */}
                      <FormField
                        control={form.control}
                        name="precio_mayoreo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio de Mayoreo del Paquete *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))
                                }
                                placeholder="Ej: 150.00"
                              />
                            </FormControl>
                            <FormMessage />

                            {field.value > 0 && (
                              <p className="text-sm mt-2">
                                {field.value > costoTotal ? (
                                  <span className="text-green-600">
                                    ✓ Ganancia: ${(field.value - costoTotal).toFixed(2)}
                                  </span>
                                ) : field.value < costoTotal ? (
                                  <span className="text-red-600">
                                    ⚠ Pérdida: ${(costoTotal - field.value).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">
                                    Sin ganancia ni pérdida
                                  </span>
                                )}
                              </p>
                            )}
                          </FormItem>
                        )}
                      />



                    </CardContent>
                  </Card>

                </div>


                <div className="space-y-6">

                  <Card>
                    <CardHeader>
                      <div className="flex items-center">
                        <p className="p-4 mx-4 bg-blue-300 rounded-b-full">2</p>
                        <CardTitle>Seleccione los productos que lo conforman</CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">

                      <Alert>
                        <AlertDescription>
                          Busca y selecciona los productos que formarán parte del paquete
                        </AlertDescription>
                      </Alert>

                      {/* Buscador */}
                      <div className="relative">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar por nombre o presentación..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setShowSearchResults(e.target.value.length > 0);
                            }}
                            onFocus={() => setShowSearchResults(searchTerm.length > 0)}
                            onKeyDown={handleKeyDown}
                            className="pl-10"
                          />
                        </div>

                        {showSearchResults && productosFiltrados.length > 0 && (
                          <Card className="absolute z-10 w-full mt-2 max-h-60 overflow-y-auto shadow-xl border-2 border-blue-100">
                            <CardContent className="p-0">
                              {productosFiltrados.map((producto, index) => (
                                <div
                                  key={producto.id_unidad_venta}
                                  data-product-index={index}
                                  className={`p-3 cursor-pointer border-b last:border-0 transition-colors ${index === selectedIndex ? "bg-blue-300" : "hover:bg-blue-50"
                                    }`}
                                  onClick={() => agregarComponente(producto)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{producto.nombre_producto}</p>
                                        <span className={`
                                          ${producto.es_producto_compuesto === 1
                                            ? 'bg-purple-100 text-purple-700'
                                            : producto.factor_conversion_cantidad === 1
                                              ? 'bg-blue-100 text-blue-700'
                                              : 'bg-amber-100 text-amber-700'} 
                                          text-[10px] px-2 py-0.5 rounded-full font-bold uppercase`}>
                                          {producto.nombre_presentacion}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-sm text-green-700">
                                        {producto.precio_venta > 0
                                          ? `$${producto.precio_venta.toFixed(2)}`
                                          : <span className="text-orange-500 text-[10px]">Sólo Inventario</span>
                                        }
                                      </p>
                                      <p className={`text-[11px] font-medium ${producto.stock_disponible_presentacion > 0 ? 'text-gray-600' : 'text-red-500'}`}>
                                        Stock: {producto.stock_disponible_presentacion}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                      </div>

                      {/* Lista de componentes */}
                      <div className="space-y-3">
                        {componentes.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No hay componentes agregados</p>
                            <p className="text-sm">Busca y selecciona productos arriba</p>
                          </div>
                        ) : (
                          componentes.map((comp, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">{comp.nombre_producto}</p>
                                      <Badge className={`
                                        ${comp.es_producto_compuesto === 1
                                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                          : (comp.factor_conversion_cantidad === 1 || comp.nombre_presentacion.toUpperCase() === 'PIEZA')
                                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
                                            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'} 
                                        text-[10px] px-2 py-0 h-4 rounded-full font-bold uppercase border-none`}>
                                        {comp.nombre_presentacion}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">

                                      <p className="text-xs text-gray-400">Stock: {comp.stock_disponible}</p>
                                      {comp.stock_disponible === 0 ? (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                                          <AlertTriangle className="h-2.5 w-2.5" />
                                          Agotado
                                        </Badge>
                                      ) : comp.stock_disponible < 5 ? (
                                        <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-amber-500 hover:bg-amber-600 text-white">
                                          <AlertTriangle className="h-2.5 w-2.5" />
                                          Stock bajo
                                        </Badge>
                                      ) : (
                                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500 hover:bg-emerald-600 text-white">
                                          Disponible
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`componentes.${index}.cantidad`}
                                    render={({ field }) => (
                                      <FormItem className="w-24">
                                        <FormLabel className="text-xs">Cantidad</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min="1"
                                            max={comp.stock_disponible}
                                            value={field.value}
                                            onChange={(e) =>
                                              field.onChange(parseInt(e.target.value) || 1)
                                            }
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <div className="text-right w-24">
                                    <p className="text-xs text-gray-500">Subtotal</p>
                                    <p className="font-medium">
                                      ${(comp.precio_unitario * comp.cantidad).toFixed(2)}
                                    </p>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removerComponente(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="componentes"
                        render={() => (
                          <FormItem>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

              </div>

              {/* BOTÓN FINAL */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Package className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Actualizar Paquete'
                )}
              </Button>

            </form>

          </Form>
        </CardContent>
      </Card>
    </div>
  );
}