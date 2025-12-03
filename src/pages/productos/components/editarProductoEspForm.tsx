


import { actualizarProductoEspApi, getProductos, obtenerProductoEspGeneral } from "@/api/productosApi/productosApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Producto } from "@/types/Producto";

import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Search, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  id_sucur: z.number().positive(),
  isEspecial:z.number().positive(),
  sku_pieza: z.string().min(1, 'El código es requerido'),
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional(),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  precio_venta: z.coerce.number().positive({ message: 'El precio de venta debe ser mayor a 0' }),
  precio_mayoreo: z.coerce.number().positive({ message: 'El precio de venta debe ser mayor a 0' }),
  componentes: z.array(
    z.object({
      id_unidad_venta: z.number(),
      nombre_producto: z.string(),
      nombre_presentacion: z.string(),
      cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
      precio_unitario: z.number(),
      stock_disponible: z.number()
    })
  ).min(1, 'Debes agregar al menos un componente al paquete')
});

type FormValues = z.infer<typeof formSchema>;





export default function EditarProductoCompuestoForm() {

  const [searchParams] = useSearchParams();
  const id_sucursal = searchParams.get("suc");
  const id_producto = searchParams.get("id");
  const [productosDisponibles,setProductosDisponibles]=useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [categorias] = useState([
    { id_categoria: 1, category_name: "Bebidas" },
    { id_categoria: 2, category_name: "Paquetes" }
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_sucur:0,
      isEspecial:1,
      sku_pieza:"",
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
      p.nombre_presentacion.toLowerCase().includes(s)
    );
  });

  const agregarComponente = (producto: typeof productosDisponibles[0]) => {
    const yaExiste = componentes.find(c => c.id_unidad_venta === producto.id_unidad_venta);
    if (yaExiste) {
      alert("Este producto ya está agregado al paquete");
      return;
    }

    form.setValue("componentes", [
      ...componentes,
      {
        id_unidad_venta: producto.id_unidad_venta,
        nombre_producto: producto.nombre_producto,
        nombre_presentacion: producto.nombre_presentacion,
        cantidad: 1,
        precio_unitario: producto.precio_venta,
        stock_disponible: producto.stock_disponible_presentacion
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

  useEffect(()=>{
    if (!id_producto || !id_sucursal) return;
    Promise.all([
      setIsLoading(true),
      getProductos(parseInt(id_sucursal)).then(res => {
        if(res.success){
          setProductosDisponibles(res.data);
        }else{
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
            descripcion: data.descripcion,
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


  const onSubmit = async(values: FormValues) => {
     setIsLoading(true);
     const res=await actualizarProductoEspApi(parseInt(id_producto!),values);
     if(res.success){
        toast.success('Producto compuesto actualizado correctamente');
        setIsLoading(false);
        window.history.back();
     }else{
        toast.error('Error al actualizar el producto compuesto: '+res.message);
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
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {comp.cantidad}x {comp.nombre_producto} ({comp.nombre_presentacion})
                              </span>
                              <span className="font-medium">
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
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
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
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
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
                            className="pl-10"
                          />
                        </div>

                        {showSearchResults && productosFiltrados.length > 0 && (
                          <Card className="absolute z-10 w-full mt-2 max-h-60 overflow-y-auto">
                            <CardContent className="p-0">
                              {productosFiltrados.map((producto) => (
                                <div
                                  key={producto.id_unidad_venta}
                                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                                  onClick={() => agregarComponente(producto)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">{producto.nombre_producto}</p>
                                      <p className="text-sm text-gray-500">{producto.nombre_presentacion}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">${producto.precio_venta.toFixed(2)}</p>
                                      <p className="text-xs text-gray-500">Stock: {producto.stock_disponible_presentacion}</p>
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
                                    <p className="font-medium">{comp.nombre_producto}</p>
                                    <p className="text-sm text-gray-500">{comp.nombre_presentacion}</p>
                                    <p className="text-xs text-gray-400">
                                      Stock disponible: {comp.stock_disponible}
                                    </p>
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