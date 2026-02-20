
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useNavigate } from "react-router"

interface FormCerrarCajaProps {
    onSubmit: (efectivoContado: number, observaciones: string) => void;
    isLoading: boolean;
}

export default function FormCerrarCaja({ onSubmit, isLoading }: FormCerrarCajaProps) {
    const [efectivoContado, setEfectivoContado] = useState<string>("");
    const [observaciones, setObservaciones] = useState<string>("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Convert to number, default to 0 if empty/invalid
        const efectivo = parseFloat(efectivoContado) || 0;
        onSubmit(efectivo, observaciones);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="efectivo">Efectivo Contado (Real en Caja)</Label>
                    <Input
                        id="efectivo"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={efectivoContado}
                        onChange={(e) => setEfectivoContado(e.target.value)}
                        className="text-lg"
                        disabled={isLoading}
                        required
                    />
                    <p className="text-sm text-gray-500">
                        Ingresa la cantidad total de efectivo que hay físicamente en la caja.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones de Cierre</Label>
                    <Textarea
                        id="observaciones"
                        placeholder="Alguna anomalía o comentario..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cerrando Caja...
                        </>
                    ) : (
                        "Cerrar Caja y Ver Resumen"
                    )}
                </Button>
            </form>
            <Button className="w-full cursor-pointer mt-4" size="lg" variant="destructive" onClick={() => {
                localStorage.removeItem("tkn");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("openCaja");
                navigate("/login");
            }}>
                Salir del sistema
            </Button>
        </>
    )
}
