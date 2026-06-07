export const inventoryUnits = ["kg", "g", "l", "ml", "piece", "box", "bottle", "pack"];
export const inventoryMovementTypes = ["sale", "waste", "adjustment", "transfer"];

export function getBatchStatus(expirationDate: string | null) {
  if (!expirationDate) {
    return "ok";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(`${expirationDate}T00:00:00`);
  const diffDays = Math.ceil(
    (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "expired";
  if (diffDays <= 1) return "urgent";
  if (diffDays <= 3) return "near_expiration";

  return "ok";
}

export function getRiskLevel(batchStatus: string) {
  if (batchStatus === "expired") return "urgent";
  if (batchStatus === "urgent") return "high";
  if (batchStatus === "near_expiration") return "medium";

  return "low";
}
