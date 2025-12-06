import { actualizarCategoriaApi, obtenerCategoriaApi } from "@/api/categoriasApi/categoriasApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tag } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
    category_name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    estatus: z.string(),
})

export default function EditarCategoriaForm() {

    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category_name: "",
            estatus: "1",
        },
    })

    useEffect(() => {
        if (id) {
            obtenerCategoria(parseInt(id));
        }
    }, [id]);

    const obtenerCategoria = async (id: number) => {
        try {
            const res = await obtenerCategoriaApi(id);
            if (res.success) {
                form.reset({
                    category_name: res.data.category_name,
                    estatus: res.data.estatus.toString(),
                });
            } else {
                toast.error("Error al cargar la categoría");
                navigate("/categorias");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la categoría");
            navigate("/categorias");
        }
    }

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        if (!id) return;
        setLoading(true)
        try {
            const payload = { ...data, estatus: parseInt(data.estatus) };
            const res = await actualizarCategoriaApi(parseInt(id), payload)
            if (res.success) {
                toast.success(res.message, {
                    description: `Se ha actualizado la categoría correctamente`
                })
                setLoading(false)
                navigate("/categorias")
            } else {
                toast.error(res.message, {
                    description: `No se pudo actualizar la categoría`
                })
                setLoading(false)
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al actualizar la categoría")
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-muted/20">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Tag className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Editar Categoría</CardTitle>
                    <CardDescription>
                        Actualiza los datos de la categoría seleccionada.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="category_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Categoría</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej. Bebidas" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="estatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estatus</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona el estatus" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="1">Activo</SelectItem>
                                                <SelectItem value="0">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-3 pt-4">
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <Link to="/categorias">
                                        Cancelar
                                    </Link>
                                </Button>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
