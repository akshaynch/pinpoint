// Re-export runtime enum values from backend
// (cannot import values from .d.ts; backend.ts provides the runtime implementation)
export { AppRole } from "./backend";
