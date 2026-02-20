/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Package, Plus, Trash2 } from "lucide-react";
import React from "react";
import { redondearPrecio } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { insertarProductoApi } from "@/api/productosApi/productosApi";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { ProductoFormFinal } from "@/types/Producto";
import type { Categoria } from "@/types/Categoria";
import { obtenerCategoriasApi } from "@/api/categoriasApi/categoriasApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { Sucursal } from "@/types/Sucursal";

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
      nombre_presentacion: z.string().min(1, 'El nombre es requerido'),
      factor_conversion_cantidad: z.number().positive('El factor debe ser mayor a 0'),
      sku_presentacion: z.string().optional(),
      sucursales_venta: z.array(
        z.object({
          id_sucursal: z.number(),
          precio_venta: z.coerce.number().positive({ message: 'El precio de venta debe ser mayor a 0' }),
          precio_mayoreo: z.coerce.number().positive({ message: 'El precio de mayoreo debe ser mayor a 0' })
        })
      ).min(1, 'Asigna al menos una sucursal a esta presentación')
    })
  ).min(1, 'Debes agregar al menos una presentación')
});

type FormValues = z.infer<typeof formSchema>;


export default function NuevoProductoForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  const [adjustments, setAdjustments] = useState<Record<number, Record<number, number | undefined>>>({}); // sucursalId -> variantIndex -> cantidad

  useEffect(() => {
    obtenerCategoriasApi().then(res => {
      if (res.success) {
        setCategorias(res.data);
      } else {
        setCategorias([]);
      }
    });
    obtenerSucursalesApi().then(res => {
      if (res.success) {
        setSucursales(res.data);
      } else {
        setSucursales([]);
      }
    });
  }, []);


  const [creating, setCreating] = useState(false);

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
      variantes: [
        {
          nombre_presentacion: 'Pieza',
          factor_conversion_cantidad: 1,
          sku_presentacion: '',
          sucursales_venta: []
        }
      ]
    }
  });

  const { watch } = form;
  const variantes = watch("variantes") || [];



  /* ---------------------- ON SUBMIT ----------------------- */
  const onSubmit = async (values: FormValues) => {
    setCreating(true);
    const res = await insertarProductoApi(values as ProductoFormFinal)
    if (res.success) {
      toast.success('Producto creado con éxito');
      form.reset();
      setCreating(false);
      navigate('/productos');
    } else {
      toast.error('Error al crear el producto: ' + res.message);
      setCreating(false);
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
      const promises = variantes.flatMap((_, i) => [
        form.trigger(`variantes.${i}.nombre_presentacion`),
        form.trigger(`variantes.${i}.factor_conversion_cantidad`)
      ]);
      valid = (await Promise.all(promises)).every(r => r);
    }
    else if (currentStep === 3) {
      // Validar precios en las variantes seleccionadas
      const fieldsToValidate: any[] = [];
      variantes.forEach((v, vIdx) => {
        v.sucursales_venta.forEach((_, svIdx) => {
          fieldsToValidate.push(`variantes.${vIdx}.sucursales_venta.${svIdx}.precio_venta`);
          fieldsToValidate.push(`variantes.${vIdx}.sucursales_venta.${svIdx}.precio_mayoreo`);
        });
      });

      if (fieldsToValidate.length === 0) {
        toast.error("Debes asignar al menos una sucursal de venta a una presentación.");
        valid = false;
      } else {
        valid = await form.trigger(fieldsToValidate);
      }
    }
    else if (currentStep === 4) {
      valid = await form.trigger(["sucursales_inventario"]);
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
      const updatedVenta = curr.filter(s => s.id_sucursal !== idSucursal);
      form.setValue(`variantes.${varIndex}.sucursales_venta`, updatedVenta);

      // Limpieza automática: Si tras quitar esta, ninguna otra variante se vende en esta sucursal,
      // la quitamos también de inventario para que no aparezca en el paso siguiente
      const allVariantes = form.getValues("variantes");
      const isStillSoldSomewhere = allVariantes.some((v, idx) => {
        const venta = idx === varIndex ? updatedVenta : v.sucursales_venta;
        return venta.some(sv => sv.id_sucursal === idSucursal);
      });

      if (!isStillSoldSomewhere) {
        const inv = form.getValues("sucursales_inventario") || [];
        form.setValue("sucursales_inventario", inv.filter((s: any) => s.id_sucursal !== idSucursal));
      }
    } else {
      // Al habilitar venta, asegurar que esté en inventario
      const inv = form.getValues("sucursales_inventario") || [];
      if (!inv.find((s: any) => s.id_sucursal === idSucursal)) {
        form.setValue("sucursales_inventario", [...inv, { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 10 }]);
      }

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
      const updatedInventario = curr.filter((s: any) => s.id_sucursal !== idSucursal);
      form.setValue("sucursales_inventario", updatedInventario);

      const currentVariantes = form.getValues("variantes");
      const updatedVariantes = currentVariantes.map(v => ({
        ...v,
        sucursales_venta: v.sucursales_venta.filter(sv => sv.id_sucursal !== idSucursal)
      }));
      form.setValue("variantes", updatedVariantes);
    } else {
      form.setValue("sucursales_inventario", [...curr, { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 0 }]);
    }
  };

  /* ----------------------- HELPERS UI ----------------------- */
  const handleVariantAdjustment = (idSucursal: number, variantIndex: number, amount: number | undefined) => {
    const newAdjustments = {
      ...adjustments,
      [idSucursal]: {
        ...(adjustments[idSucursal] || {}),
        [variantIndex]: amount
      }
    };
    setAdjustments(newAdjustments);

    let totalPiezas = 0;
    const branchAdjusts = newAdjustments[idSucursal];

    Object.keys(branchAdjusts).forEach(vIdx => {
      const vIndex = parseInt(vIdx);
      const factor = variantes[vIndex]?.factor_conversion_cantidad || 1;
      const cant = branchAdjusts[vIndex] ?? 0;
      totalPiezas += (cant * factor);
    });

    const currentInv = form.getValues("sucursales_inventario") || [];
    const idx = currentInv.findIndex((si: any) => si.id_sucursal === idSucursal);
    if (idx !== -1) {
      form.setValue(`sucursales_inventario.${idx}.cantidad_actual`, Math.max(0, parseFloat(totalPiezas.toFixed(2))));
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

  /* ----------------------- STEP 2 (DEFINIR VARIANTES) --------------------------- */
  const renderStep2 = () => (
    <div className="space-y-4">
      <Alert className="bg-orange-50 border-orange-200">
        <AlertTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
          📦 Definición de Paquetes y Piezas
        </AlertTitle>
        <AlertDescription className="text-orange-700 font-medium">
          Define cómo se vende este producto (Cajas, Six-packs, etc.).
          Esto permitirá que en el siguiente paso ajustes el inventario usando estas unidades físicamente.
        </AlertDescription>
      </Alert>

      {variantes.map((_, index) => (
        <Card key={index} className="relative shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6 space-y-4">
            {index > 0 && (
              <Button
                variant="ghost"
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                size="icon"
                type="button"
                onClick={() => removeVariante(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`variantes.${index}.nombre_presentacion`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Nombre Presentación *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={index === 0} placeholder="Ej: Caja 24 pzas" />
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
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">¿Cuántas piezas contiene? *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          className="font-bold"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          disabled={index === 0}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">piezas</span>
                      </div>
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
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">SKU Presentación</FormLabel>
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

      <Button type="button" variant="outline" onClick={addVariante} className="w-full border-dashed border-2 py-8 hover:bg-slate-50 text-slate-500 transition-all">
        <Plus className="w-5 h-5 mr-3" /> Agregar Nueva Presentación (Paquete, Caja, etc.)
      </Button>
    </div>
  );

  /* ----------------------- STEP 3 (INVENTARIO POR PRESENTACIÓN) --------------------------- */
  const renderStep3 = () => (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
          <Package className="w-5 h-5" /> Surtido Inicial de Stock
        </AlertTitle>
        <AlertDescription className="text-blue-700 font-medium">
          Indica cuánto stock inicial tienes de cada presentación.
          El sistema calculará automáticamente el total de piezas físicas.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="sucursales_inventario"
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sucursales.map(s => {
              const invIndex = (field.value || []).findIndex((si: any) => si.id_sucursal === s.id_sucursal);
              const selected = invIndex !== -1;

              return (
                <Card key={s.id_sucursal} className={`border-2 transition-all duration-300 ${selected ? 'border-primary shadow-lg bg-white scale-[1.02]' : 'border-dashed border-gray-200 bg-gray-50/50'}`}>
                  {/* Header */}
                  <div
                    className={`p-3 flex items-center justify-between cursor-pointer ${selected ? 'bg-primary/5 border-b border-primary/10' : ''}`}
                    onClick={() => toggleSucursalInventario(s.id_sucursal)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                        {selected && <Check className="w-3 h-3 text-white font-bold" />}
                      </div>
                      <span className={`font-bold ${selected ? 'text-primary uppercase tracking-tight' : 'text-gray-500'}`}>{s.nombre}</span>
                    </div>
                    {!selected && <Plus className="w-4 h-4 text-gray-400" />}
                  </div>

                  {selected && (
                    <CardContent className="p-4 space-y-4 animate-in slide-in-from-top-2">
                      <div className="bg-gray-200 text-slate-500 p-3 rounded-lg text-center">
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest mb-1 text-slate-500">Total Piezas Físicas</p>
                        <p className="text-2xl font-black text-green-600">
                          {form.watch(`sucursales_inventario.${invIndex}.cantidad_actual`)}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Surtir en Sucursal</Label>
                        <div className="space-y-2">
                          {variantes.map((v, vIdx) => {
                            // Verificar si está habilitada en esta sucursal en el paso de precios
                            const isEnabledInBranch = v.sucursales_venta.some(sv => sv.id_sucursal === s.id_sucursal);

                            if (!isEnabledInBranch) return null;

                            return (
                              <div key={vIdx} className="flex items-center gap-2 group p-2 rounded-md hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                  <p className="text-md font-bold text-slate-700 leading-none">{v.nombre_presentacion || "Sin nombre"}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">Contiene {v.factor_conversion_cantidad} pzas</p>
                                </div>
                                <div className="flex items-center">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="h-8 w-24 text-right font-bold text-sm bg-white border-red-600 focus:border-red-600"
                                    value={adjustments[s.id_sucursal]?.[vIdx] ?? ""}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                                      handleVariantAdjustment(s.id_sucursal, vIdx, val);
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <FormField
                          control={form.control}
                          name={`sucursales_inventario.${invIndex}.cantidad_minima`}
                          render={({ field: f }) => (
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] font-bold text-slate-500 uppercase">Aviso Stock Mínimo</Label>
                              <Input
                                type="number"
                                className="h-7 w-20 text-center text-xs font-bold"
                                {...f}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => f.onChange(e.target.value)}
                              />
                            </div>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      />
    </div>
  );

  /* ----------------------- STEP 4 (PRECIOS) --------------------------- */
  const renderStep4 = () => (
    <div className="space-y-8">
      <Alert className="bg-green-50 border-green-200">
        <AlertTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
          💲 Este producto se vende en las siguientes sucursales
        </AlertTitle>
        <AlertDescription className="text-green-700 font-medium">
          Define los precios de venta para cada presentación en las sucursales habilitadas.
        </AlertDescription>
      </Alert>

      {variantes.map((v, vIndex) => (
        <div key={vIndex} className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Presentación</span>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{v.nombre_presentacion || "Sin nombre"}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sucursales.map(suc => {
              const svIndex = v.sucursales_venta.findIndex(sv => sv.id_sucursal === suc.id_sucursal);
              const selected = svIndex !== -1;

              return (
                <Card key={suc.id_sucursal} className={`border-2 transition-all duration-200 overflow-hidden ${selected ? 'border-primary shadow-md bg-white' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'}`}>

                  <div
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${selected ? 'bg-green-50 border-b border-green-100' : ''}`}
                    onClick={() => toggleSucursalVenta(vIndex, suc.id_sucursal)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                        {selected && <Check className="w-3 h-3 text-white font-bold" />}
                      </div>
                      <span className={`text-sm font-bold ${selected ? 'text-green-900' : 'text-slate-800'}`}>
                        {suc.nombre}
                      </span>
                    </div>
                  </div>

                  {selected && (
                    <CardContent className="p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_venta`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio Público ($)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7 text-xl font-bold h-10 border-green-100 focus:border-green-500"
                                    value={field.value}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) field.onChange(redondearPrecio(val));
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_mayoreo`}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio Mayoreo ($)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    className="pl-7 text-lg font-bold h-9 border-dashed border-slate-200"
                                    value={field.value}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value);
                                      if (!isNaN(val)) field.onChange(redondearPrecio(val));
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
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <Card className="border-none shadow-xl overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="w-full flex justify-between items-center mb-4">
            <Link to={"/productos"} className="flex items-center text-slate-500 hover:text-primary transition-colors font-bold text-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Regresar
            </Link>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Paso {currentStep} de 4</span>
              <span className="font-bold text-slate-800">{["Producto Base", "Cajas y Paquetes", "Precios", "Surtido Inicial"][currentStep - 1]}</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 leading-none">Nuevo Producto</CardTitle>
          <CardDescription className="text-slate-400 font-medium">Define las variantes y el stock inicial por presentación</CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Progress Bar */}
          <div className="bg-slate-50 border-b border-slate-100 p-6">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              {[1, 2, 3, 4].map((stepNum, i) => (
                <div key={stepNum} className="relative z-10 flex flex-col items-center group">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500
                    ${currentStep > stepNum
                      ? "bg-green-500 text-white scale-110 shadow-lg shadow-green-100"
                      : currentStep === stepNum
                        ? "bg-primary text-white scale-125 shadow-xl shadow-blue-100 ring-4 ring-white"
                        : "bg-white border-2 border-slate-200 text-slate-400"
                    }
                  `}>
                    {currentStep > stepNum ? <Check className="h-5 w-5" /> : stepNum}
                  </div>
                  <span className={`text-[10px] mt-2 font-black uppercase tracking-tighter ${currentStep === stepNum ? "text-primary" : "text-slate-400"}`}>
                    {["Base", "Paquetes", "Precios", "Surtido"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
              <div className="min-h-[450px] transition-all duration-300">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep4()}
                {currentStep === 4 && renderStep3()}
              </div>

              <div className="flex justify-between pt-8 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-8 font-bold text-slate-500 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>

                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext} className="px-10 h-12 font-bold bg-slate-900 hover:bg-black text-white shadow-lg transition-all active:scale-95">
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="px-12 h-12 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100 transition-all active:scale-95"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Finalizar y Crear
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}