export type ValidationErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function required(value: unknown, label = "This field"): string {
    if (value === null || value === undefined || String(value).trim() === "") {
        return `${label} is required`;
    }
    return "";
}

export function validEmail(value: string): string {
    if (!value.trim()) return "Email is required";
    if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address";
    return "";
}

export function positiveNumber(value: string, label = "Value"): string {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return `${label} must be a positive number`;
    return "";
}

export function minLength(value: string, min: number, label = "This field"): string {
    if (value.trim().length < min) return `${label} must be at least ${min} characters`;
    return "";
}

export function maxValue(value: string, max: number, label = "Value"): string {
    const n = parseFloat(value);
    if (!isNaN(n) && n > max) return `${label} cannot exceed ${max}`;
    return "";
}

export function hasErrors(errors: ValidationErrors): boolean {
    return Object.values(errors).some(Boolean);
}
