// Convenience re-exports for any consumer that wants to discover routers
// programmatically. app.js mounts each one explicitly (some need different
// body parsing), so this file is informational rather than load-bearing.

export { default as authRoutes } from "./authRoutes.js";
export { default as userRoutes } from "./userRoutes.js";
export { default as orderRoutes } from "./orderRoutes.js";
export { default as paymentRoutes } from "./paymentRoutes.js";
export { default as webhookRoutes } from "./webhookRoutes.js";
export { default as healthRoutes } from "./healthRoutes.js";
