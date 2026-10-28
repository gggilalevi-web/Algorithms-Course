// Validation shared by the /wig-studio form and POST /api/leads/wig-studio,
// so the browser and the server always agree on what a valid lead is.

export const PHONE_RE = /^0(5\d{8}|[2-489]\d{7}|7\d{8})$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const EMAIL_MAX = 120

// Accepts local and international Israeli formats and returns the local form:
// "050-123 4567", "+972 50-123-4567", "00972501234567", "972501234567",
// "+972 050 1234567" (a leading 0 kept after the country code) -> "0501234567".
export function normalizePhone(value: string): string {
  let p = value.replace(/[\s\-().⁦-⁩‎‏]/g, '')
  p = p.replace(/^(?:\+|00)?972/, '0')
  p = p.replace(/^00/, '0')
  return p
}

export const isValidPhone = (value: string) => PHONE_RE.test(normalizePhone(value))

// Email is optional: empty is fine, anything else must look like an address.
export const isValidEmail = (value: string) => {
  const v = value.trim()
  return v === '' || (v.length <= EMAIL_MAX && EMAIL_RE.test(v))
}
