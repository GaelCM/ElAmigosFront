
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { AlertCircle, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { checkPasswordApi } from "@/api/authApi/authApi";
import { cancelarVentaApi } from "@/api/ventasApi/ventasApi";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useCurrentUser } from "@/contexts/currentUser";

interface DialogCancelarVentaProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    idVenta: number | null;
    onSuccess: () => void;
}

export default function DialogCancelarVenta({ isOpen, setIsOpen, idVenta, onSuccess }: DialogCancelarVentaProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'password' | 'success'>('password');
    const { user } = useCurrentUser();

    const handleCancelarVenta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idVenta || !user) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Verificar contraseña
            const checkPass = await checkPasswordApi(user.id_usuario, password);

            if (!checkPass.success) {
                setError(checkPass.message || "Contraseña incorrecta");
                setLoading(false);
                return;
            }

            // 2. Cancelar venta
            const res = await cancelarVentaApi(idVenta, user.id_usuario);

            if (res.success) {
                setStep('success');
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 2000);
            } else {
                setError(res.message || "Error al cancelar la venta");
            }
        } catch (err) {
            setError("Error de conexión al procesar la solicitud");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Reset state after a short delay to avoid flickering while closing
        setTimeout(() => {
            setPassword("");
            setError(null);
            setLoading(false);
            setStep('password');
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px]">
                {step === 'password' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-5 w-5" />
                                ¿Confirmar cancelación?
                            </DialogTitle>
                            <DialogDescription>
                                Estás a punto de cancelar la venta <span className="font-bold underline">#{idVenta}</span>.
                                Esta acción es irreversible y afectará el inventario.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCancelarVenta} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña de Usuario</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Ingrese su contraseña"
                                        className="pl-9"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertDescription className="text-xs">
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClose}
                                    disabled={loading}
                                >
                                    No, mantener venta
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={loading || !password}
                                    className="gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        'Sí, cancelar venta'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-in zoom-in duration-300" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">¡Venta Cancelada!</h3>
                            <p className="text-muted-foreground">La venta ha sido anulada correctamente.</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
