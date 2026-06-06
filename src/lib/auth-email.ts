const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string) {
  return input.trim().replace(/['"]/g, "").toLowerCase();
}

export function ensureDevEmail(input: string) {
  const email = normalizeEmail(input);

  if (process.env.NODE_ENV === "development" && email && !email.includes("@")) {
    return `${email}@gmail.com`;
  }

  return email;
}

export function isValidEmail(input: string) {
  return emailRegex.test(input);
}
