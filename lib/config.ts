// The site's featured developer, shown on the home page and its OG card.
// Override per-deployment with NEXT_PUBLIC_DEFAULT_USERNAME.
export const DEFAULT_USER =
  process.env.NEXT_PUBLIC_DEFAULT_USERNAME?.trim() || "PATILYASHH";
