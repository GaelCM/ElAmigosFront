/* eslint-disable @typescript-eslint/no-explicit-any */
import { obtenerCategoriasApi } from "@/api/categoriasApi/categoriasApi";
import { actualizarProductoApi, obtenerProductoGeneral } from "@/api/productosApi/productosApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/contexts/currentUser";
import type { Categoria } from "@/types/Categoria";
import type { ProductoFormFinal } from "@/types/Producto";
import type { Sucursal } from "@/types/Sucursal";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { redondearPrecio } from "@/lib/utils";


const formSchema = z.object({
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional().default(''),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  precio_costo: z.coerce.number().positive({ message: 'El precio de costo debe ser mayor a 0' }),
  sku_pieza: z.string().optional(),
  es_granel: z.boolean().default(false),
  sucursales_inventario: z.array(z.object({
    id_sucursal: z.number(),
    cantidad_actual: z.coerce.number().min(0, { message: 'La cantidad debe ser un número válido' }),
    cantidad_minima: z.coerce.number().min(0, { message: 'La cantidad mínima debe ser un número válido' })
  })).min(1, 'Selecciona al menos una sucursal para el inventario'),
  variantes: z.array(
    z.object({
      id_unidad_venta: z.number().optional(), // ID para actualizar
      nombre_presentacion: z.string().min(1, 'El nombre es requerido'),
      factor_conversion_cantidad: z.number().positive('El factor debe ser mayor a 0'),
      sku_presentacion: z.string().optional(),
      sucursales_venta: z.array(
        z.object({
          id_precio: z.number().optional(), // ID para actualizar
          id_sucursal: z.number(),
          precio_venta: z.coerce.number().positive({ message: 'El precio de venta debe ser mayor a 0' }),
          precio_mayoreo: z.coerce.number().positive({ message: 'El precio de mayoreo debe ser mayor a 0' })
        })
      ).min(1, 'Asigna al menos una sucursal a esta presentación')
    })
  ).min(1, 'Debes agregar al menos una presentación')
});

type FormValues = z.infer<typeof formSchema>;


export default function EditarProductoForm() {
  const [searchParams] = useSearchParams();
  const id_producto = searchParams.get("id");
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const { user } = useCurrentUser();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [initialQuantities, setInitialQuantities] = useState<Record<number, number>>({});
  const [adjustments, setAdjustments] = useState<Record<number, { amount: number | undefined, type: 'add' | 'sub' }>>({});




  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_producto: '',
      descripcion: '',
      id_categoria: '',
      precio_costo: 0,
      sku_pieza: '',
      es_granel: false,
      sucursales_inventario: [],
      variantes: []
    }
  });

  const { watch } = form;
  const variantes = watch("variantes");
  const sucursalesInventario = watch("sucursales_inventario") || [];
  const sucursalesInventarioIds = (sucursalesInventario as any[]).map((s) => s.id_sucursal);

  // Cargar datos del producto
  useEffect(() => {
    if (!id_producto) return;

    const cargarProducto = async () => {
      try {
        setLoading(true);
        obtenerSucursalesApi().then(res => {
          if (res.success) {
            setSucursales(res.data);
          } else {
            setSucursales([]);
          }
        });
        const categoriasData = await obtenerCategoriasApi();
        if (categoriasData.success) {
          setCategorias(categoriasData.data);
        }

        const data = await obtenerProductoGeneral(parseInt(id_producto));

        // Si el backend devuelve sucursales_inventario como number[] (ids), mapear a objetos con cantidades por defecto
        const payload = { ...data.data } as any;
        if (payload.sucursales_inventario && payload.sucursales_inventario.length > 0 && typeof payload.sucursales_inventario[0] === 'number') {
          payload.sucursales_inventario = payload.sucursales_inventario.map((id: number) => ({ id_sucursal: id, cantidad_actual: 0, cantidad_minima: 0 }));
        }
        payload.descripcion = payload.descripcion ?? '';
        payload.sku_pieza = payload.sku_pieza ?? '';
        payload.es_granel = payload.es_granel ?? false;
        form.reset(payload);

        // Almacenar cantidades iniciales
        const initialQ: Record<number, number> = {};
        if (payload.sucursales_inventario) {
          payload.sucursales_inventario.forEach((si: any) => {
            initialQ[si.id_sucursal] = si.cantidad_actual || 0;
          });
        }
        setInitialQuantities(initialQ);

        setLoading(false);
      } catch (error) {
        toast.error('Error al cargar el producto');
        console.error(error);
        setLoading(false);
      }
    };

    cargarProducto();
  }, [id_producto, form]);


  const onSubmit = async (values: FormValues) => {
    setUpdating(true);
    try {
      const data = await actualizarProductoApi(parseInt(id_producto!), values as ProductoFormFinal, user?.id_usuario || 1);
      if (data.success) {
        toast.success(data.message);
        window.history.back();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error al actualizar el producto');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------------- SIGUIENTE ------------------------ */
  const handleNext = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let valid = false;

    if (currentStep === 1) {
      valid = await form.trigger([
        "nombre_producto",
        "id_categoria",
        "precio_costo",
      ]);
    }
    else if (currentStep === 2) {
      valid = await form.trigger(["sucursales_inventario"]);
    }
    else if (currentStep === 3) {
      const promises = variantes.flatMap((_, i) => [
        form.trigger(`variantes.${i}.nombre_presentacion`),
        form.trigger(`variantes.${i}.factor_conversion_cantidad`)
      ]);
      valid = (await Promise.all(promises)).every(r => r);
    }

    if (valid) setCurrentStep(currentStep + 1);
  };

  /* ----------------- AÑADIR / REMOVER VARIANTE ----------------- */
  const addVariante = () => {
    form.setValue("variantes", [
      ...form.getValues("variantes"),
      {
        nombre_presentacion: "",
        factor_conversion_cantidad: 1,
        sku_presentacion: "",
        sucursales_venta: []
      }
    ]);
  };

  const removeVariante = (index: number) => {
    const curr = form.getValues("variantes");
    if (curr.length > 1) {
      const varianteAEliminar = curr[index];
      if (varianteAEliminar.id_unidad_venta) {
        console.log('Marcar para eliminar:', varianteAEliminar.id_unidad_venta);
      }

      form.setValue(
        "variantes",
        curr.filter((_, i) => i !== index)
      );
    }
  };

  /* ----------------- TOGGLE SUCURSAL VENTA -------------------- */
  const toggleSucursalVenta = (varIndex: number, idSucursal: number) => {
    const curr = form.getValues(`variantes.${varIndex}.sucursales_venta`);
    const exists = curr.find(s => s.id_sucursal === idSucursal);

    if (exists) {
      if (exists.id_precio) {
        console.log('Marcar precio para eliminar:', exists.id_precio);
      }

      form.setValue(
        `variantes.${varIndex}.sucursales_venta`,
        curr.filter(s => s.id_sucursal !== idSucursal)
      );
    } else {
      form.setValue(
        `variantes.${varIndex}.sucursales_venta`,
        [...curr, { id_sucursal: idSucursal, precio_venta: 0, precio_mayoreo: 0 }]
      );
    }
  };

  /* ----------------- TOGGLE SUCURSAL INVENTARIO -------------------- */
  const toggleSucursalInventario = (idSucursal: number) => {
    const curr = form.getValues("sucursales_inventario") || [];
    const exists = curr.find((s: any) => s.id_sucursal === idSucursal);
    if (exists) {
      // 1. Remover de inventario
      const updatedInventario = curr.filter((s: any) => s.id_sucursal !== idSucursal);
      form.setValue("sucursales_inventario", updatedInventario);

      // 2. Mantener consistencia: remover de la venta en todas las variantes
      const currentVariantes = form.getValues("variantes");
      const updatedVariantes = currentVariantes.map(v => ({
        ...v,
        sucursales_venta: v.sucursales_venta.filter(sv => sv.id_sucursal !== idSucursal)
      }));
      form.setValue("variantes", updatedVariantes);
    } else {
      const newEntry = { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 0 };
      form.setValue("sucursales_inventario", [...curr, newEntry]);
    }
  };



  /* ----------------------- STEP 1 --------------------------- */
  const renderStep1 = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="nombre_producto"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nombre del producto" />
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
              <Textarea {...field} rows={3} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="id_categoria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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

        <FormField
          control={form.control}
          name="precio_costo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Costo *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>



      <FormField
        control={form.control}
        name="sku_pieza"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SKU Pieza</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="es_granel"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                ¿Este producto se vende a Granel?
              </FormLabel>
              <CardDescription>
                Este producto se vende por peso/medida (kg, litros, etc.)
              </CardDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );

  /* ----------------------- HELPERS UI ----------------------- */
  const handleAdjustmentChange = (idSucursal: number, amount: number | undefined, type: 'add' | 'sub') => {
    setAdjustments(prev => ({
      ...prev,
      [idSucursal]: { amount, type }
    }));

    const initial = initialQuantities[idSucursal] || 0;
    const effectiveAmount = amount ?? 0;
    const result = type === 'add' ? initial + effectiveAmount : initial - effectiveAmount;

    // Buscar el índice en el form
    const currentInv = form.getValues("sucursales_inventario") || [];
    const idx = currentInv.findIndex((si: any) => si.id_sucursal === idSucursal);
    if (idx !== -1) {
      form.setValue(`sucursales_inventario.${idx}.cantidad_actual`, Math.max(0, result));
    }
  };

  const handleSpaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll("input:not([type='hidden']), textarea, select, button[type='submit']")) as HTMLElement[];
      const currentIndex = inputs.indexOf(e.currentTarget);

      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        const nextInput = inputs[currentIndex + 1];
        nextInput.focus();
        if (nextInput instanceof HTMLInputElement) {
          nextInput.select();
        }
      }
    }
  };

  /* ----------------------- STEP 2 --------------------------- */
  const renderStep2 = () => (
    <div className="space-y-6">

      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
          Este producto se vende en
        </AlertTitle>
      </Alert>

      <FormField
        control={form.control}
        name="sucursales_inventario"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sucursales.map(s => {
                const invIndex = (field.value || []).findIndex((si: any) => si.id_sucursal === s.id_sucursal);
                const selected = invIndex !== -1;

                return (
                  <Card key={s.id_sucursal} className={`border-2 transition-all duration-200 overflow-hidden ${selected ? 'border-blue-600 shadow-md bg-white' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-blue-300'}`}>

                    {/* Header Clickable para activar/desactivar */}
                    <div
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selected ? 'bg-blue-50 border-b border-blue-100' : ''}`}
                      onClick={() => toggleSucursalInventario(s.id_sucursal)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                          {selected && <Check className="w-3 h-3 text-white font-bold" />}
                        </div>
                        <CardTitle className={`text-sm font-bold ${selected ? 'text-blue-900' : 'text-gray-500'}`}>
                          {s.nombre}
                        </CardTitle>
                      </div>

                      {!selected && <span className="text-[10px] text-muted-foreground mr-1 font-medium">Click habilitar</span>}
                    </div>

                    {selected && (
                      <CardContent className="pt-3 pb-3 px-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-3">
                          {/* Stock Info Row - Compacted */}
                          <div className="flex justify-between items-center bg-slate-50 rounded border p-2 px-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">Stock Actual</span>
                              <span className="text-lg font-bold text-slate-700 leading-none">{initialQuantities[s.id_sucursal] || 0}</span>
                            </div>
                            <div className="h-8 w-px bg-gray-300 mx-2"></div>
                            <div className="flex flex-col text-right">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">Stock Final</span>
                              <span className={`text-lg font-black leading-none ${form.watch(`sucursales_inventario.${invIndex}.cantidad_actual`) < (form.watch(`sucursales_inventario.${invIndex}.cantidad_minima`) || 0) ? 'text-red-600' : 'text-blue-600'}`}>
                                {form.watch(`sucursales_inventario.${invIndex}.cantidad_actual`)}
                              </span>
                            </div>
                          </div>

                          {/* Adjustment Row - Compacted */}
                          <div className="space-y-1">
                            <Label className="text-[10px] text-blue-800 font-bold uppercase block">Ajuste (+/-)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-base font-bold h-9 bg-white border-red-800 focus:border-red-800 flex-1 text-center"
                                value={adjustments[s.id_sucursal]?.amount ?? ""}
                                onKeyDown={handleSpaceKeyDown}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                  handleAdjustmentChange(s.id_sucursal, val, adjustments[s.id_sucursal]?.type || 'add');
                                }}
                              />

                              <div className="flex-1 flex items-center justify-center gap-1 bg-white border rounded-md h-9 shadow-sm px-1">
                                <span className={`text-[10px] font-bold ${adjustments[s.id_sucursal]?.type === 'sub' ? 'text-red-600' : 'text-gray-300'}`}>Restar</span>
                                <Switch
                                  checked={adjustments[s.id_sucursal]?.type !== 'sub'}
                                  onCheckedChange={(checked) => handleAdjustmentChange(s.id_sucursal, adjustments[s.id_sucursal]?.amount, checked ? 'add' : 'sub')}
                                  className="scale-75 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                                />
                                <span className={`text-[10px] font-bold ${adjustments[s.id_sucursal]?.type !== 'sub' ? 'text-green-600' : 'text-gray-300'}`}>Sumar</span>
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name={`sucursales_inventario.${invIndex}.cantidad_minima`}
                            render={({ field: f }) => (
                              <FormItem className="space-y-0">
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Mínimo Requerido</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="h-8 text-sm text-center bg-white"
                                    value={f.value}
                                    onKeyDown={handleSpaceKeyDown}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => f.onChange(e.target.value)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="w-full text-[10px] h-7 opacity-80 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdjustmentChange(s.id_sucursal, initialQuantities[s.id_sucursal] || 0, 'sub');
                            }}
                          >
                            MARCAR COMO AGOTADO (0)
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  /* ----------------------- STEP 3 --------------------------- */
  const renderStep3 = () => (
    <div className="space-y-4">
      <Alert>
        <AlertTitle className="text-lg text-left">Este producto se vende por</AlertTitle>
        <AlertDescription>
          Administra las variantes del producto <br />
          Nota: por defecto se crea una variante "Pieza" con el nombre del producto.
        </AlertDescription>
      </Alert>

      {variantes.map((v, index) => (
        <Card key={index} className={`relative ${v}`}>
          <CardContent className="pt-6 space-y-4">
            {index > 0 && (
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                type="button"
                onClick={() => removeVariante(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`variantes.${index}.nombre_presentacion`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={index === 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variantes.${index}.factor_conversion_cantidad`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Piezas *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                        disabled={index === 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`variantes.${index}.sku_presentacion`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addVariante} className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Agregar Variante
      </Button>
    </div>
  );

  /* ----------------------- STEP 4 --------------------------- */
  const renderStep4 = () => (
    <div className="space-y-8">
      <Alert className="bg-white border-green-200">
        <AlertTitle className="text-lg font-bold text-black flex items-center gap-2">
          💲 Asignación de Precios
        </AlertTitle>
        <AlertDescription className="">
          Define los precios de venta para cada presentación en las sucursales habilitadas.
        </AlertDescription>
      </Alert>

      {variantes.map((v, vIndex) => (
        <div key={vIndex} className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Presentación</span>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{v.nombre_presentacion || "Presentación Principal"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sucursales
              .filter(s => sucursalesInventarioIds.includes(s.id_sucursal))
              .map(suc => {
                const svIndex = v.sucursales_venta.findIndex(s => s.id_sucursal === suc.id_sucursal);
                const selected = svIndex !== -1;

                return (
                  <Card key={suc.id_sucursal} className={`border-2 transition-all duration-200 overflow-hidden ${selected ? 'border-blue-600 shadow-md bg-white' : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-green-300'}`}>

                    {/* Header Clickable */}
                    <div
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selected ? 'bg-green-50 border-b border-green-100' : ''}`}
                      onClick={() => toggleSucursalVenta(vIndex, suc.id_sucursal)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selected ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'}`}>
                          {selected && <Check className="w-3 h-3 text-white font-bold" />}
                        </div>
                        <CardTitle className={`text-sm font-bold ${selected ? 'text-green-900' : 'text-gray-500'}`}>
                          {suc.nombre}
                        </CardTitle>
                      </div>
                      {!selected && <span className="text-[10px] text-muted-foreground mr-1 font-medium">Click habilitar</span>}
                    </div>

                    {selected && (
                      <CardContent className="p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-3">

                          {/* Precio Venta */}
                          <FormField
                            control={form.control}
                            name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_venta`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Precio Público ($)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="pl-7 text-xl font-bold h-10 bg-white border-green-200 focus:border-green-500 text-slate-800"
                                      value={field.value}
                                      onKeyDown={handleSpaceKeyDown}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) {
                                          field.onChange(redondearPrecio(val));
                                        }
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Precio Mayoreo */}
                          <FormField
                            control={form.control}
                            name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_mayoreo`}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] text-muted-foreground uppercase font-bold">Precio Mayoreo ($)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      className="pl-7 text-lg font-bold h-9 bg-slate-50 border-gray-200 focus:border-green-500 text-slate-600 border-dashed"
                                      value={field.value}
                                      onKeyDown={handleSpaceKeyDown}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val)) {
                                          field.onChange(redondearPrecio(val));
                                        }
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
          </div>

          <FormField
            control={form.control}
            name={`variantes.${vIndex}.sucursales_venta`}
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );


  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }


  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="w-full flex justify-between">
            <Button onClick={() => { window.history.back() }} className="bg-primary text-white p-2 flex rounded-2xl">
              <ArrowLeft />
              Regresar
            </Button>
          </div>
          <CardTitle>Editar Producto</CardTitle>
          <CardDescription>Formulario de actualización paso a paso</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4].map((stepNum, i) => (
                <React.Fragment key={stepNum}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold
                      ${currentStep > stepNum
                        ? "bg-green-500 text-white"
                        : currentStep === stepNum
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }
                    `}>
                      {currentStep > stepNum ? <Check /> : stepNum}
                    </div>
                    <span className="text-xs mt-2">{["Producto Base", "Inventario", "Variantes", "Precios"][i]}</span>
                  </div>
                  {i < 3 && <div className="h-1 flex-1 bg-gray-200 mx-2" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Form {...form}>
            <div className="space-y-6">
              <div className="min-h-[400px]">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <ChevronLeft className="mr-2" /> Anterior
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Siguiente <ChevronRight className="ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit, (errors) => {
                      console.log('Errores de validación:', errors);
                      toast.error("Por favor revisa que todos los campos obligatorios estén llenos y los precios sean mayores a 0.");
                    })()}
                    className="bg-blue-600 text-white"
                    disabled={updating}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" /> Actualizando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2" /> Actualizar Producto
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}