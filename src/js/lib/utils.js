import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function displayOrNA(value) {
  return value === null || value === undefined || value === '' ? 'N/A' : String(value);
}
