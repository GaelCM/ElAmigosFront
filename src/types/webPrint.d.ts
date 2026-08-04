type BluetoothServiceUUID = string | number;

interface BluetoothManufacturerDataFilter {
    companyIdentifier: number;
    dataPrefix?: BufferSource;
}

interface BluetoothServiceDataFilter {
    service: BluetoothServiceUUID;
    dataPrefix?: BufferSource;
}

interface BluetoothRequestDeviceFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: BluetoothManufacturerDataFilter[];
    serviceData?: BluetoothServiceDataFilter[];
}

interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    acceptAllDevices?: boolean;
    optionalServices?: BluetoothServiceUUID[];
}

interface BluetoothCharacteristicProperties {
    broadcast: boolean;
    read: boolean;
    writeWithoutResponse: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
    authenticatedSignedWrites: boolean;
    reliableWrite: boolean;
    writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
    readonly uuid: string;
    readonly properties: BluetoothCharacteristicProperties;
    readonly value?: DataView;
    writeValue(value: Uint8Array): Promise<void>;
    writeValueWithoutResponse(value: Uint8Array): Promise<void>;
}

interface BluetoothRemoteGATTService {
    readonly uuid: string;
    readonly isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
}

interface Bluetooth extends EventTarget {
    getAvailability(): Promise<boolean>;
    onavailabilitychanged?: (event: Event) => void;
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    getDevices(): Promise<BluetoothDevice[]>;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions
    ): void;
}

interface Navigator {
    bluetooth?: Bluetooth;
}

declare module "@point-of-sale/receipt-printer-encoder" {
    export interface ReceiptPrinterEncoderOptions {
        language?: string;
        columns?: number;
        width?: number;
        printerModel?: string;
        codepage?: string;
        beep?: boolean;
        cut?: boolean;
    }

    export default class ReceiptPrinterEncoder {
        constructor(options?: ReceiptPrinterEncoderOptions);
        initialize(): this;
        codepage(value: string): this;
        align(value: "left" | "center" | "right"): this;
        bold(value?: boolean): this;
        size(value: number): this;
        text(value: string): this;
        line(value: string): this;
        raw(value: string): this;
        newline(count?: number): this;
        rule(options?: { style?: "single" | "double"; width?: number }): this;
        table(options?: { width?: number[]; padding?: number[]; separator?: string[] }): this;
        qrcode(value: string, options?: { cellSize?: number; model?: number; errorCorrectionLevel?: string }): this;
        cut(): this;
        encode(): Uint8Array;
    }
}
