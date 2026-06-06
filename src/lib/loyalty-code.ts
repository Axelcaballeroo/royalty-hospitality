export function getBusinessPrefix(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase() || "CLUB"
  );
}

export function generateLoyaltyCode(prefixSource: string) {
  const prefix = getBusinessPrefix(prefixSource);
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${suffix}`;
}
