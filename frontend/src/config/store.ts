export const STORE_WHATSAPP_NUMBER = "5583921527960";

// Delivery is opt-in for the public checkout. Set NEXT_PUBLIC_DELIVERY_ENABLED=true
// in the frontend deployment when the store starts accepting home deliveries again.
export const DELIVERY_ENABLED = process.env.NEXT_PUBLIC_DELIVERY_ENABLED === "true";
