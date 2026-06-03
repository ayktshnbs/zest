export const formatPrice = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatPriceShort = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

const turkishMap: Record<string, string> = {
  ç: "c",
  Ç: "C",
  ğ: "g",
  Ğ: "G",
  ı: "i",
  İ: "I",
  ö: "o",
  Ö: "O",
  ş: "s",
  Ş: "S",
  ü: "u",
  Ü: "U",
};

export const slugify = (input: string) =>
  input
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => turkishMap[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const FREE_SHIPPING_THRESHOLD = 750;
export const STANDARD_SHIPPING_COST = 49.9;

export const estimatedDelivery = () => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() + 2);
  const end = new Date(today);
  end.setDate(today.getDate() + 4);
  const fmt = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
};
