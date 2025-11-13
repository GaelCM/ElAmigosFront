/* eslint-disable react-hooks/rules-of-hooks */
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useEffect, useState } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { Sucursal } from "@/types/Sucursal";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { insertarProductoApi } from "@/api/productosApi/productosApi";
import { toast } from "sonner";




// ==================== SCHEMA DE VALIDACIÓN ====================
const presentacionSchema = z.object({
  nombre_presentacion: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  factor_conversion_cantidad: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser mayor a 0")
    .min(1, "Mínimo 1"),
  sku_presentacion: z.string().max(50, "Máximo 50 caracteres").optional(),
});

const precioSucursalSchema = z.object({
  id_sucursal: z.number(),
  precio_venta: z
    .number()
    .positive("El precio debe ser mayor a 0")
    .min(0.01, "Precio mínimo $0.01"),
});

const presentacionConPreciosSchema = presentacionSchema.extend({
  precios: z
    .array(precioSucursalSchema)
    .min(1, "Debe asignar al menos una sucursal"),
});

const formSchema = z.object({
  // SECCIÓN 1: Datos del Producto
  nombre_producto: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  sku_pieza: z.string().max(50, "Máximo 50 caracteres").optional(),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional(),
  id_categoria: z.number().min(1, "La categoría es requerida"),
  precio_costo: z
    .number()
    .positive("El precio debe ser mayor a 0")
    .min(0.01, "Precio mínimo $0.01"),

  // SECCIÓN 2: sucursales seleccionadas
  sucursales_seleccionadas: z
    .array(z.number())
    .min(1, "Debe seleccionar al menos una sucursal"),

  // SECCIÓN 3: Presentaciones con sus precios
  presentaciones: z
    .array(presentacionConPreciosSchema)
    .min(1, "Debe agregar al menos una presentación"),
});

export type NuevoProductoFormValues = z.infer<typeof formSchema>;



export default function NuevoProductoForm(){

    const CATEGORIAS = [
  { id_categoria: 1, nombre: "Bebidas" },
  { id_categoria: 2, nombre: "Botanas" },
  { id_categoria: 3, nombre: "Lácteos" },
  { id_categoria: 4, nombre: "Abarrotes" },
    ];

  

    const [sucursales,setSucursales]=useState<Sucursal[]>([])
    const [loading,setLoading]=useState<boolean>(false);
    const [send,setSend]=useState(false);
    const [error,setError]=useState<string|null>(null);
     const {user}=useCurrentUser();
     const navigate=useNavigate();

    useEffect(()=>{
        if (user.id_rol === 2) {
            navigate(`/`);
            return;
        }

        obtenerSucursalesApi().then(res=>{setSucursales(res.data)}).catch(err=>{setError(err)}).finally(()=>setLoading(false))
            
    },[navigate,user.id_rol])
    
    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Cargando sucursales...</p>
            </div>
        </div>
        );
    }

    if(error){
            return(
                <div>
                    <h1>Error al encontrar el id</h1>
                </div>
            )
    }
    
    const form = useForm<NuevoProductoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre_producto: "",
      sku_pieza: "",
      descripcion: "",
      precio_costo: 0,
      sucursales_seleccionadas: [],
      presentaciones: [
        {
          nombre_presentacion: "Pieza",
          factor_conversion_cantidad: 1,
          sku_presentacion: "",
          precios: [],
        },
      ],
    },
    });

    const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "presentaciones",
    });

    const sucursalesSeleccionadas = form.watch("sucursales_seleccionadas");

  // Sincronizar precios cuando cambian las sucursales seleccionadas
  const handleSucursalChange = (sucursalId: number, checked: boolean) => {
    const current = form.getValues("sucursales_seleccionadas");
    const presentaciones = form.getValues("presentaciones");

    if (checked) {
      form.setValue("sucursales_seleccionadas", [...current, sucursalId]);

      // Agregar precio para esta sucursal en todas las presentaciones
      presentaciones.forEach((_, idx) => {
        const preciosActuales = form.getValues(`presentaciones.${idx}.precios`);
        form.setValue(`presentaciones.${idx}.precios`, [
          ...preciosActuales,
          { id_sucursal: sucursalId, precio_venta: 0 },
        ]);
      });
    } else {
      form.setValue(
        "sucursales_seleccionadas",
        current.filter((id) => id !== sucursalId)
      );

      // Remover precios de esta sucursal en todas las presentaciones
      presentaciones.forEach((_, idx) => {
        const preciosActuales = form.getValues(`presentaciones.${idx}.precios`);
        form.setValue(
          `presentaciones.${idx}.precios`,
          preciosActuales.filter((p) => p.id_sucursal !== sucursalId)
        );
      });
    }
    };

    const agregarPresentacion = () => {
        append({
            nombre_presentacion: "",
            factor_conversion_cantidad: 1,
            sku_presentacion: "",
            precios: sucursalesSeleccionadas.map((id) => ({
                id_sucursal: id,
                precio_venta: 0,
            })),
        });
    };

    const onSubmit = async(values: NuevoProductoFormValues) => {
        setSend(true)
        console.log("Datos del formulario:", values);
        const res=await insertarProductoApi(values)
        if(res.success){
          toast.success(res.message)
          setSend(false)
          navigate("/productos")
        }else{
          toast.error(res.message)
          setSend(false)
        }
    };

    return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-10">
        {/* ==================== SECCIÓN 1: DATOS DEL PRODUCTO ==================== */}
        <Card>
          <CardHeader>
            <CardTitle>1. Información del Producto</CardTitle>
            <CardDescription>
              Datos generales del producto base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre_producto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Coca Cola 600ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku_pieza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU Pieza</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: BEB001" {...field} />
                    </FormControl>
                    <FormDescription>
                      Código único del producto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del producto..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id_categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem
                            key={cat.id_categoria}
                            value={cat.id_categoria.toString()}
                          >
                            {cat.nombre}
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
                    <FormLabel>Precio de Costo (por pieza) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ==================== SECCIÓN 2: sucursales ==================== */}
        <Card>
          <CardHeader>
            <CardTitle>2. sucursales</CardTitle>
            <CardDescription>
              Selecciona en qué sucursales estará disponible este producto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="sucursales_seleccionadas"
              render={() => (
                <FormItem>
                  <div className="space-y-3">
                    {sucursales.map((sucursal) => (
                      <FormField
                        key={sucursal.id_sucursal}
                        control={form.control}
                        name="sucursales_seleccionadas"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={sucursal.id_sucursal}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    sucursal.id_sucursal
                                  )}
                                  onCheckedChange={(checked) =>
                                    handleSucursalChange(
                                      sucursal.id_sucursal,
                                      checked as boolean
                                    )
                                  }
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {sucursal.nombre}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ==================== SECCIÓN 3: PRESENTACIONES Y PRECIOS ==================== */}
        <Card>
          <CardHeader>
            <CardTitle>3. Presentaciones y Precios</CardTitle>
            <CardDescription>
              Define las diferentes presentaciones del producto y sus precios
              por sucursal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sucursalesSeleccionadas.length === 0 && (
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                ⚠️ Primero selecciona al menos una sucursal para poder asignar
                precios
              </div>
            )}

            {fields.map((field, index) => (
              <Card key={field.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Presentación {index + 1}
                    </CardTitle>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`presentaciones.${index}.nombre_presentacion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej: Paquete, Caja"
                              {...field}
                              disabled={index === 0}
                            />
                          </FormControl>
                          {index === 0 && (
                            <FormDescription className="text-xs">
                              Presentación base (pieza)
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`presentaciones.${index}.factor_conversion_cantidad`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad de piezas *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                              disabled={index === 0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`presentaciones.${index}.sku_presentacion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU Presentación</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: BEB001-PQ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {sucursalesSeleccionadas.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-3">
                          Precios por Sucursal
                        </h4>
                        <div className="space-y-3">
                          {sucursalesSeleccionadas.map((sucursalId, pIdx) => {
                            const sucursal = sucursales.find(
                              (s) => s.id_sucursal === sucursalId
                            );
                            return (
                              <FormField
                                key={`${index}-${sucursalId}`}
                                control={form.control}
                                name={`presentaciones.${index}.precios.${pIdx}.precio_venta`}
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center gap-4">
                                      <FormLabel className="w-40 text-sm">
                                        {sucursal?.nombre}
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.00"
                                          className="max-w-xs"
                                          {...field}
                                          onChange={(e) =>
                                            field.onChange(
                                              parseFloat(e.target.value)
                                            )
                                          }
                                        />
                                      </FormControl>
                                      {form.getValues(
                                        `presentaciones.${index}.factor_conversion_cantidad`
                                      ) > 1 && (
                                        <span className="text-sm text-muted-foreground">
                                          $
                                          {(
                                            field.value /
                                            form.getValues(
                                              `presentaciones.${index}.factor_conversion_cantidad`
                                            )
                                          ).toFixed(2)}{" "}
                                          por pieza
                                        </span>
                                      )}
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={agregarPresentacion}
              disabled={sucursalesSeleccionadas.length === 0}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar otra presentación
            </Button>
          </CardContent>
        </Card>

        {/* ==================== BOTONES DE ACCIÓN ==================== */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit" disabled={send}>Guardar Producto</Button>
        </div>
      </form>
    </Form>
  );
}