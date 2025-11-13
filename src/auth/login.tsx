
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import "../App.css";
import { iniciarSesionApi } from "@/api/authApi/authApi";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";

const formSchema = z.object({
  usuario: z.string().min(2, {
    message: "El usuario debe tener al menos 2 caracteres.",
  }),
  password: z.string().min(3, {
    message: "La contraseña debe tener al menos 3 caracteres.",
  }),
});

export default function LoginPage() {
    const navigate=useNavigate();
    const {addUser}=useCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: "",
      password: "",
    },
  });

  async function  login(values: z.infer<typeof formSchema>) {
        const res=await iniciarSesionApi(values.usuario,values.password);
        if(res.success){
            localStorage.setItem('tkn',res.token);
            addUser(res.data)
            navigate(res.ruta);
        }else{
            alert('Error al iniciar sesion: '+res.message);
            navigate(res.ruta);
        }
  }

  return (
    <div className="login-bg min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white/90 backdrop-blur-md border-none">
        <CardHeader className="mb-6 text-center">
          <img src="/logo.png" alt="Logo" className="mx-auto mb-2 w-16 h-16 rounded-full shadow-lg" />
          <CardTitle className="text-3xl font-bold text-primary mb-1">Bienvenido</CardTitle>
          <CardDescription className="text-base text-muted-foreground">Sistema POS de Abarrotes y Bebidas</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(login)} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Usuario</label>
            <Input
              type="text"
              placeholder="Ingresa tu usuario"
              {...register("usuario")}
              aria-invalid={!!errors.usuario}
            />
            {errors.usuario && (
              <span className="text-xs text-red-500 mt-1 block">{errors.usuario.message}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Contraseña</label>
            <Input
              type="password"
              placeholder="Ingresa tu contraseña"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>
          <Button type="submit" className="mt-2 w-full text-lg font-semibold" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}