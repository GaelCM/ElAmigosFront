import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function redondearPrecio(monto: number): number {
  return Math.round(monto * 2) / 2;
}

