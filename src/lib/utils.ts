import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function redondearPrecio(monto: number): number {
  const entero = Math.floor(monto);
  const decimal = monto - entero;
  return decimal >= 0.75 ? entero + 1 : entero;
}

