/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { insertarProductoApi } from "@/api/productosApi/productosApi";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { ProductoFormFinal } from "@/types/Producto";

const formSchema = z.object({
  nombre_producto: z.string().min(1, 'El nombre del producto es requerido'),
  descripcion: z.string().optional().default(''),
  id_categoria: z.string().min(1, 'La categoría es requerida'),
  precio_costo: z.coerce.number().positive({ message: 'El precio de costo debe ser mayor a 0' }),
  sku_pieza: z.string().optional(),
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
          precio_mayoreo: z.coerce.number().positive({ message: 'El precio de venta debe ser mayor a 0' })
        })
      ).min(1, 'Asigna al menos una sucursal a esta presentación')
    })
  ).min(1, 'Debes agregar al menos una presentación')
});

// El tipo se genera automáticamente con los campos numéricos correctos
type FormValues = z.infer<typeof formSchema>;


export default function NuevoProductoForm() {

  const [currentStep, setCurrentStep] = useState(1);
  const navigate=useNavigate();
  const [sucursales] = useState([
    { id_sucursal: 1, nombre: 'Sucursal Central' },
    { id_sucursal: 2, nombre: 'Sucursal Xoxo' },
    { id_sucursal: 3, nombre: 'Sucursal Test' }
  ]);

  const [categorias] = useState([
    { id_categoria: 1, category_name: 'Bebidas' }
  ]);

  const [creating, setCreating] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_producto: '',
      descripcion: '',
      id_categoria: '',
      precio_costo: 0,
      sku_pieza: '',
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

  const variantes = watch("variantes");
  const sucursalesInventario = watch("sucursales_inventario")||[];
  const sucursalesInventarioIds = (sucursalesInventario as any[]).map((s) => s.id_sucursal);

  /* ---------------------- ON SUBMIT ----------------------- */
  const onSubmit = async (values: FormValues) => {
    console.log(values);
    setCreating(true);
    const res=await insertarProductoApi(values as ProductoFormFinal)
    if(res.success){
      toast.success('Producto creado con éxito');
      form.reset();
      setCreating(false);
      navigate('/productos');
    }else{
      toast.error('Error al crear el producto: '+res.message);
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
        "descripcion",
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
      form.setValue("sucursales_inventario", curr.filter((s: any) => s.id_sucursal !== idSucursal));
    } else {
      form.setValue("sucursales_inventario", [...curr, { id_sucursal: idSucursal, cantidad_actual: 0, cantidad_minima: 0 }]);
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
              <Textarea {...field} rows={3} />
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

    </div>
  );

  /* ----------------------- STEP 2 --------------------------- */
  const renderStep2 = () => (
    <div className="space-y-4">

      <Alert>
        <AlertDescription>
          Selecciona las sucursales donde se guardará inventario y define cantidades.
        </AlertDescription>
      </Alert>

      <FormField
        control={form.control}
        name="sucursales_inventario"
        render={({ field }) => (
          <FormItem>
            <div className="space-y-3">
              {sucursales.map(s => {
                const invIndex = (field.value || []).findIndex((si: any) => si.id_sucursal === s.id_sucursal);
                const selected = invIndex !== -1;
                return (
                  <div key={s.id_sucursal} className="p-3 border rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSucursalInventario(s.id_sucursal)}
                      />
                      <span>{s.nombre}</span>
                    </div>

                    {selected && (
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`sucursales_inventario.${invIndex}.cantidad_actual`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Cantidad en sucursal</FormLabel>
                              <FormControl>
                                <Input type="number" value={f.value} onChange={(e) => f.onChange(e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sucursales_inventario.${invIndex}.cantidad_minima`}
                          render={({ field: f }) => (
                            <FormItem>
                              <FormLabel>Cantidad mínima</FormLabel>
                              <FormControl>
                                <Input type="number" value={f.value} onChange={(e) => f.onChange(e.target.value)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                  </div>
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
        <AlertDescription>
          Administra las variantes del producto.
        </AlertDescription>
      </Alert>

      {variantes.map((v, index) => (
        <Card key={index} className={`${v}`} >
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
                    <FormLabel>Factor *</FormLabel>
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
    <div className="space-y-6">

      <Alert>
        <AlertDescription>
          Seleccione en que sucursal y a que precio se venderan  los productos.
        </AlertDescription>
      </Alert>

      {variantes.map((v, vIndex) => (
        <Card key={vIndex}>
          <CardHeader>
            <CardTitle>{v.nombre_presentacion}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {sucursales
              .filter(s => sucursalesInventarioIds.includes(s.id_sucursal))
              .map(suc => {

                const svIndex = v.sucursales_venta.findIndex(s => s.id_sucursal === suc.id_sucursal);
                const selected = svIndex !== -1;

                return (
                  <div key={suc.id_sucursal} className="p-4 border rounded space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSucursalVenta(vIndex, suc.id_sucursal)}
                      />
                      <span>{suc.nombre}</span>
                    </div>

                    {selected && (
                      <div>
                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_venta`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio *</FormLabel>
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
                        <FormField
                          control={form.control}
                          name={`variantes.${vIndex}.sucursales_venta.${svIndex}.precio_mayoreo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Precio Mayoreo *</FormLabel>
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
                    )}

                  </div>
                );
              })}

            <FormField
              control={form.control}
              name={`variantes.${vIndex}.sucursales_venta`}
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>

        </Card>
      ))}

    </div>
  );

  /* ----------------------- STEPS REMOVED - NO LONGER NEEDED --------------------------- */

  /* ------------------------- RETURN ------------------------ */
  return (
    <div className="p-6">

      <Card>
        <CardHeader>
          <div className="w-full flex justify-between">
                    <Link to={"/productos"} className="bg-primary text-white p-2 flex rounded-2xl">
                        <ArrowLeft></ArrowLeft>
                        regresar
                    </Link>
          </div>
          <CardTitle>Crear Producto</CardTitle>
          <CardDescription>Formulario paso a paso</CardDescription>
          
        </CardHeader>

        <CardContent>

          {/* PASOS */}
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

          {/* FORM */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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
                  <Button type="submit" className="bg-green-600 text-white" disabled={creating}>
                    <Check className="mr-2" /> Crear Producto
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