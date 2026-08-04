import {
    encodeVentaTicket,
    encodeMovimientoTicket,
    encodeCorteTicket,
    encodeAbonoTicket,
    encodeTransferenciaTicket,
    encodeTestTicket,
    type VentaTicketData,
    type MovimientoTicketData,
    type CorteTicketData,
    type AbonoTicketData,
    type TransferenciaTicketData,
} from "@/utils/webTicketEncoder";

const STORAGE_KEY = "web_bluetooth_printer";
const CUT_KEY = "web_printer_cut";

export interface SavedWebPrinter {
    id: string;
    name: string;
}

export type WebTicketKind =
    | "venta"
    | "movimiento"
    | "corte"
    | "abono"
    | "transferencia"
    | "test";

interface ActiveConnection {
    deviceId: string;
    deviceName: string;
    device: BluetoothDevice;
    characteristic: BluetoothRemoteGATTCharacteristic;
}

let active: ActiveConnection | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
    for (const fn of listeners) fn();
}

export function subscribeWebPrinter(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export function isWebPlatform(): boolean {
    return typeof window !== "undefined" && !(window as unknown as { [key: string]: unknown })["electron-api"];
}

function getBluetooth(): Bluetooth {
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
        throw new Error(
            "Este navegador no soporta Web Bluetooth. Usa Chrome/Edge en Android o en escritorio (HTTPS)."
        );
    }
    return navigator.bluetooth;
}

function storageAvailable(): boolean {
    try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        return true;
    } catch {
        return false;
    }
}

export function getSavedWebPrinter(): SavedWebPrinter | null {
    if (!storageAvailable()) return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SavedWebPrinter;
        return parsed && typeof parsed.id === "string" ? parsed : null;
    } catch {
        return null;
    }
}

export function saveWebPrinter(printer: SavedWebPrinter): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(printer));
}

export function clearSavedWebPrinter(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function getWebCut(): boolean {
    return localStorage.getItem(CUT_KEY) === "true";
}

export function setWebCut(value: boolean): void {
    localStorage.setItem(CUT_KEY, String(value));
}

export function isWebPrinterConnected(): boolean {
    return active !== null && active.device.gatt?.connected === true;
}

export function getConnectedWebPrinter(): SavedWebPrinter | null {
    if (!active) return null;
    return { id: active.deviceId, name: active.deviceName };
}

const KNOWN_SERVICES: Array<[BluetoothServiceUUID, BluetoothServiceUUID]> = [
    ["49535343-fe7d-4ae5-8fa9-9fafd205e455", "49535343-8841-43f4-a8d4-ecbe34729bb3"],
    ["000018f0-0000-1000-8000-00805f9b34fb", "00002af1-0000-1000-8000-00805f9b34fb"],
    ["0000ffe0-0000-1000-8000-00805f9b34fb", "0000ffe2-0000-1000-8000-00805f9b34fb"],
    ["0000ff00-0000-1000-8000-00805f9b34fb", "0000ff02-0000-1000-8000-00805f9b34fb"],
    ["0000fee7-0000-1000-8000-00805f9b34fb", "0000fec7-0000-1000-8000-00805f9b34fb"],
];

async function findWritableCharacteristic(
    server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic | null> {
    for (const [serviceUuid, charUuid] of KNOWN_SERVICES) {
        try {
            const service = await server.getPrimaryService(serviceUuid);
            const characteristic = await service.getCharacteristic(charUuid);
            if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                return characteristic;
            }
        } catch {
            // siguiente par conocido
        }
    }

    try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const c of characteristics) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                    return c;
                }
            }
        }
    } catch {
        // Algunas impresoras no permiten enumerar servicios; usamos solo pares conocidos.
    }

    return null;
}

async function pairDevice(device: BluetoothDevice): Promise<void> {
    if (active && active.deviceId === device.id && device.gatt?.connected) return;

    const server = await device.gatt!.connect();
    const characteristic = await findWritableCharacteristic(server);
    if (!characteristic) {
        try {
            server.disconnect();
        } catch {
            // ignorar
        }
        throw new Error("No se encontró una característica de escritura en la impresora.");
    }

    active = {
        deviceId: device.id,
        deviceName: device.name || "Impresora Bluetooth",
        device,
        characteristic,
    };

    device.addEventListener("gattserverdisconnected", () => {
        if (active?.deviceId === device.id) {
            active = null;
            emitChange();
        }
    });

    emitChange();
}

export async function connectToWebPrinter(): Promise<SavedWebPrinter> {
    const bluetooth = getBluetooth();
    const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
            0x18f0,
            0xfee7,
            0xffe0,
            0xff00,
            0x18ee,
            "49535343-fe7d-4ae5-8fa9-9fafd205e455",
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        ],
    });

    await pairDevice(device);

    const saved: SavedWebPrinter = { id: device.id, name: device.name || "Impresora Bluetooth" };
    saveWebPrinter(saved);
    return saved;
}

export async function reconnectWebPrinter(saved: SavedWebPrinter): Promise<void> {
    const bluetooth = getBluetooth();
    const devices = await bluetooth.getDevices();
    const device = devices.find((d) => d.id === saved.id);
    if (!device) {
        throw new Error(
            "La impresora guardada ya no está disponible. Vuelve a emparejarla en Ajustes."
        );
    }
    await pairDevice(device);
}

export async function connectSavedWebPrinter(): Promise<void> {
    const saved = getSavedWebPrinter();
    if (!saved) return;
    await reconnectWebPrinter(saved);
}

export async function disconnectWebPrinter(): Promise<void> {
    if (!active) return;
    const device = active.device;
    active = null;
    emitChange();
    try {
        device.gatt?.disconnect();
    } catch {
        // ignorar
    }
}

async function writeBytes(
    characteristic: BluetoothRemoteGATTCharacteristic,
    bytes: Uint8Array
): Promise<void> {
    const useWithoutResponse = characteristic.properties.writeWithoutResponse;
    const chunkSize = 20;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        if (useWithoutResponse) {
            await characteristic.writeValueWithoutResponse(chunk);
        } else {
            await characteristic.writeValue(chunk);
        }
        await new Promise((resolve) => setTimeout(resolve, 15));
    }
}

async function ensureWebPrinter(): Promise<ActiveConnection> {
    if (active && active.device.gatt?.connected) return active;

    const saved = getSavedWebPrinter();
    if (!saved) {
        throw new Error("NO_PRINTER_CONFIGURED");
    }

    await reconnectWebPrinter(saved);
    if (!active) {
        throw new Error("NO_PRINTER_CONFIGURED");
    }
    return active;
}

function buildTicketBytes(kind: WebTicketKind, data: Record<string, unknown>, cortar: boolean): Uint8Array {
    switch (kind) {
        case "venta":
            return encodeVentaTicket(data as unknown as VentaTicketData, cortar);
        case "movimiento":
            return encodeMovimientoTicket(data as unknown as MovimientoTicketData, cortar);
        case "corte":
            return encodeCorteTicket(data as unknown as CorteTicketData, cortar);
        case "abono":
            return encodeAbonoTicket(data as unknown as AbonoTicketData, cortar);
        case "transferencia":
            return encodeTransferenciaTicket(data as unknown as TransferenciaTicketData, cortar);
        case "test":
            return encodeTestTicket(
                typeof data.name === "string" ? data.name : null,
                cortar
            );
    }
}

export async function printWebTicket(opts: {
    kind: WebTicketKind;
    data?: Record<string, unknown>;
}): Promise<void> {
    const connection = await ensureWebPrinter();
    const cortar = getWebCut();
    const bytes = buildTicketBytes(opts.kind, opts.data || {}, cortar);
    await writeBytes(connection.characteristic, bytes);
}

export function getWebPrinterError(): string {
    return "No se ha configurado una impresora Bluetooth en Ajustes.";
}
