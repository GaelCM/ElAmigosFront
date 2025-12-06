import { insertarSucursalApi } from "@/api/sucursalApi/sucursalApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, Phone, Store } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"


const formSchema = z.object({
    nombre: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    direccion: z.string().min(5, {
        message: "La dirección debe tener al menos 5 caracteres.",
    }),
    telefono: z.string().min(10, {
        message: "El teléfono debe tener al menos 10 caracteres.",
    }),
})

export default function NuevaSucursalForm() {

    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            direccion: "",
            telefono: "",
        },
    })
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setLoading(true)
        const res = await insertarSucursalApi(data)
        if (res.success) {
            toast.success(res.message, {
                description: `se ha registrado la sucursal ${res.data}`
            })
            form.reset()
            setLoading(false)
            navigate("/sucursales")
        } else {
            toast.error(res.message, {
                description: `No se pudo registrar la sucursal ${res.message}`
            })
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center  p-15 bg-muted/20">
            <Card className="w-full shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Store className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Nueva Sucursal</CardTitle>
                    <CardDescription>
                        Ingresa los datos para registrar una nueva sucursal en el sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de la Sucursal</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej. Sucursal Centro" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej. Av. Principal #123" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej. 951234567" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex flex-col gap-2">
                                <Button type="button" variant="outline" className="w-full" asChild>
                                    <Link to="/sucursales">
                                        Cancelar
                                    </Link>
                                </Button>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Registrando..." : "Registrar Sucursal"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}