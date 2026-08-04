import { useEffect, useState } from "react";
import {
    Check,
    Coins,
    Printer,
    RefreshCw,
    Bluetooth,
    Smartphone,
    Link2Off,
    Loader2,
    Trash2,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    isWebPlatform,
    connectToWebPrinter,
    connectSavedWebPrinter,
    disconnectWebPrinter,
    clearSavedWebPrinter,
    getSavedWebPrinter,
    isWebPrinterConnected,
    getConnectedWebPrinter,
    getWebCut,
    setWebCut,
    subscribeWebPrinter,
    printWebTicket,
    type SavedWebPrinter,
} from "@/utils/webPrinterService";

// Definimos la interfaz para lo que nos devuelve Electron
interface ElectronPrinter {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: any;
}

export function ListPrints() {
    const [printers, setPrinters] = useState<ElectronPrinter[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [cortarPapel, setCortarPapel] = useState(true);

    const web = isWebPlatform();
    const [webBusy, setWebBusy] = useState(false);
    const [savedPrinter, setSavedPrinter] = useState<SavedWebPrinter | null>(() =>
        getSavedWebPrinter()
    );
    const [connected, setConnected] = useState<boolean>(isWebPrinterConnected());
    const [connectedName, setConnectedName] = useState<string | null>(() =>
        getConnectedWebPrinter()?.name ?? null
    );
    const [webCut, setWebCutState] = useState<boolean>(getWebCut());

    const webSupported =
        typeof navigator !== "undefined" && typeof navigator.bluetooth !== "undefined";

    useEffect(() => {
        const unsubscribe = subscribeWebPrinter(() => {
            setConnected(isWebPrinterConnected());
            setConnectedName(getConnectedWebPrinter()?.name ?? null);
        });
        return unsubscribe;
    }, []);

    const fetchPrinters = async () => {
        setLoading(true);
        try {
            // @ts-ignore - Accedemos al API expuesto en preload
            const api = window["electron-api"];

            if (api && api.listPrints) {
                const list = await api.listPrints();
                console.log("Impresoras encontradas:", list);
                setPrinters(list);

                // Lógica de selección inicial:
                // 1. Buscamos si ya guardamos una en electron-store
                const savedPrinter = await api.getConfig("printer_device");
                const savedCut = await api.getConfig("printer_cut");

                if (savedCut !== undefined && savedCut !== null) {
                    setCortarPapel(savedCut === true || savedCut === "true");
                }

                // 2. Verificamos que la guardada aún exista
                const printerExists = list.find((p: any) => p.name === savedPrinter);

                if (savedPrinter && printerExists) {
                    setSelectedPrinter(savedPrinter);
                } else {
                    // 3. Si no, usamos la default del sistema
                    const systemDefault = list.find((p: any) => p.isDefault);
                    if (systemDefault) {
                        setSelectedPrinter(systemDefault.name);
                        await api.setConfig("printer_device", systemDefault.name);
                    }
                }
            } else {
                console.warn("API de electron no encontrada. ¿Estás en el navegador?");
            }
        } catch (error) {
            console.error("Error al cargar impresoras:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!web) {
            fetchPrinters();
        }
    }, [web]);

    const handlePrinterChange = async (value: string) => {
        setSelectedPrinter(value);
        // @ts-ignore
        await window["electron-api"]?.setConfig("printer_device", value);
    };

    const handleCutChange = async (checked: boolean) => {
        setCortarPapel(checked);
        // @ts-ignore
        await window["electron-api"]?.setConfig("printer_cut", checked);
    };

    const handleTestPrintEscPos = async () => {
        if (!selectedPrinter) return;

        try {
            // @ts-ignore
            await window["electron-api"]?.printTestEscPos(selectedPrinter);
        } catch (error) {
            console.error("Error imprimiendo modo RAW:", error);
        }
    };

    const handleOpenDrawer = async () => {
        if (!selectedPrinter) return;

        try {
            // @ts-ignore
            await window["electron-api"]?.openCashDrawer(selectedPrinter);
        } catch (error) {
            console.error("Error abriendo cajón:", error);
        }
    };

    const handleWebPair = async () => {
        setWebBusy(true);
        try {
            await connectToWebPrinter();
            setSavedPrinter(getSavedWebPrinter());
            setConnectedName(getConnectedWebPrinter()?.name ?? null);
            toast.success("Impresora Bluetooth conectada");
        } catch (error) {
            console.error("Error al emparejar impresora:", error);
            toast.error(error instanceof Error ? error.message : "No se pudo emparejar la impresora");
        } finally {
            setWebBusy(false);
        }
    };

    const handleWebConnect = async () => {
        setWebBusy(true);
        try {
            await connectSavedWebPrinter();
            toast.success("Impresora Bluetooth reconectada");
        } catch (error) {
            console.error("Error al reconectar impresora:", error);
            toast.error(error instanceof Error ? error.message : "No se pudo reconectar");
        } finally {
            setWebBusy(false);
        }
    };

    const handleWebDisconnect = async () => {
        await disconnectWebPrinter();
        toast.info("Impresora desconectada");
    };

    const handleWebForget = async () => {
        await disconnectWebPrinter();
        clearSavedWebPrinter();
        setSavedPrinter(null);
        toast.info("Impresora olvidada. Vuelve a emparejarla cuando la necesites.");
    };

    const handleWebCutChange = (checked: boolean) => {
        setWebCutState(checked);
        setWebCut(checked);
    };

    const handleWebTestPrint = async () => {
        setWebBusy(true);
        try {
            await printWebTicket({
                kind: "test",
                data: { name: connectedName || savedPrinter?.name || "" },
            });
            toast.success("Ticket de prueba enviado a imprimir");
        } catch (error) {
            console.error("Error imprimiendo ticket de prueba:", error);
            toast.error(error instanceof Error ? error.message : "No se pudo imprimir el ticket de prueba");
        } finally {
            setWebBusy(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-primary" />
                    <CardTitle>Configuración de Impresora</CardTitle>
                </div>
                <CardDescription>
                    {web
                        ? "Empareja tu impresora térmica Bluetooth portátil (58mm)."
                        : "Selecciona la impresora para los tickets de venta."}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {web ? (
                    <div className="space-y-4">
                        {!webSupported && (
                            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 border border-amber-200 flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <Smartphone className="h-4 w-4 mt-0.5 text-amber-600" />
                                    <p>
                                        Este navegador no soporta Web Bluetooth.
                                        <br />
                                        <span className="text-xs text-amber-700 opacity-80">
                                            Usa Chrome o Edge en Android (o en una computadora) y accede
                                            con HTTPS. En iPhone/Safari esta función no está disponible.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {connected ? (
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-900 border border-green-200 flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <Check className="h-4 w-4 mt-0.5 text-green-600" />
                                    <p>
                                        Impresora conectada: <strong>{connectedName}</strong>
                                    </p>
                                </div>
                            </div>
                        ) : savedPrinter ? (
                            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 border border-blue-100 flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <Bluetooth className="h-4 w-4 mt-0.5 text-blue-600" />
                                    <p>
                                        Impresora guardada: <strong>{savedPrinter.name}</strong>
                                        <br />
                                        <span className="text-xs text-blue-700 opacity-80">
                                            Se reconectará automáticamente al imprimir.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground flex flex-col gap-2">
                                <p>
                                    No hay impresora Bluetooth configurada. Esta terminal imprime por
                                    Bluetooth cuando la app corre en el navegador.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {!connected && webSupported && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleWebPair}
                                    disabled={webBusy}
                                >
                                    {webBusy ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Bluetooth className="mr-2 h-4 w-4" />
                                    )}
                                    Emparejar Impresora Bluetooth
                                </Button>
                            )}

                            {savedPrinter && !connected && webSupported && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleWebConnect}
                                    disabled={webBusy}
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Reconectar
                                </Button>
                            )}

                            {connected && (
                                <>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleWebTestPrint}
                                        disabled={webBusy}
                                    >
                                        {webBusy ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Printer className="mr-2 h-4 w-4" />
                                        )}
                                        Probar Impresión Bluetooth
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleWebDisconnect}
                                    >
                                        <Link2Off className="mr-2 h-4 w-4" />
                                        Desconectar
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-destructive text-destructive hover:bg-destructive/5"
                                        onClick={handleWebForget}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Olvidar Impresora
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                            <Label htmlFor="web-cut-mode" className="flex flex-col space-y-1">
                                <span>Cortar papel al finalizar</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Muchas impresoras portátiles no tienen corte automático.
                                </span>
                            </Label>
                            <Switch
                                id="web-cut-mode"
                                checked={webCut}
                                onCheckedChange={handleWebCutChange}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="printer-select">Impresora disponible</Label>
                            <div className="flex gap-2">
                                <Select
                                    value={selectedPrinter}
                                    onValueChange={handlePrinterChange}
                                    disabled={loading}
                                >
                                    <SelectTrigger id="printer-select" className="w-full">
                                        <SelectValue placeholder="Seleccionar impresora..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {printers.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                No se encontraron impresoras
                                            </div>
                                        ) : (
                                            printers.map((printer) => (
                                                <SelectItem key={printer.name} value={printer.name}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{printer.displayName || printer.name}</span>
                                                        {printer.description && (
                                                            <span className="text-xs text-muted-foreground">{printer.description}</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchPrinters}
                                    disabled={loading}
                                    title="Recargar lista"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                            <Label htmlFor="cut-mode" className="flex flex-col space-y-1">
                                <span>Cortar papel al finalizar</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Habilita el corte automático tras cada ticket
                                </span>
                            </Label>
                            <Switch
                                id="cut-mode"
                                checked={cortarPapel}
                                onCheckedChange={handleCutChange}
                            />
                        </div>

                        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 border border-blue-100 flex flex-col gap-2">
                            <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 mt-0.5 text-blue-600" />
                                <p>
                                    Impresora seleccionada: <strong>{selectedPrinter || "Ninguna"}</strong>
                                    <br />
                                    <span className="text-xs text-blue-700 opacity-80">
                                        Esta configuración se guardará automáticamente para esta terminal.
                                    </span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 mt-2">
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleTestPrintEscPos}
                                    disabled={!selectedPrinter || loading}
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Probar Impresora ESC/POS
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full col-span-2 border-primary text-primary hover:bg-primary/5 font-bold"
                                    onClick={handleOpenDrawer}
                                    disabled={!selectedPrinter || loading}
                                >
                                    <Coins className="mr-2 h-4 w-4" />
                                    Probar Cajón de Dinero
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
