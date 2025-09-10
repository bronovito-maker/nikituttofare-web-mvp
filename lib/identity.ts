/**
 * Pseudo-ID compatibile con il normalizzatore n8n (fnv1a + salt).
 * Replica la logica del workflow "TG groups – text only".
 */
const SALT = process.env.NTF_ID_SALT || "ntf_salt_2025_cambialo";

export function normEmail(s?: string) {
  return (s || "").trim().toLowerCase();
}
export function normPhoneIntl(s?: string) {
  const d = (s || "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("39") ? `+${d}` : `+39${d}`;
}
export function normStr(s?: string) {
  return (s || "").trim().toLowerCase();
}

export function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return ("00000000" + h.toString(16)).slice(-8);
}

export function buildUserId({
  email,
  phone,
  tgId,
  igUser,
  name,
  city
}: {
  email?: string;
  phone?: string;
  tgId?: string;
  igUser?: string;
  name?: string;
  city?: string;
}) {
  const ids: string[] = [];
  if (phone) ids.push(`tel:${normPhoneIntl(phone)}`);
  if (email) ids.push(`mail:${normEmail(email)}`);
  if (tgId) ids.push(`tg:${String(tgId).trim()}`);
  if (igUser) ids.push(`ig:${String(igUser).trim().toLowerCase()}`);
  if (!ids.length) {
    if (name) ids.push(`weak:name:${normStr(name)}`);
    if (city) ids.push(`weak:city:${normStr(city)}`);
  }
  ids.sort();
  const input = `${SALT}|${ids.join("|")}`;
  return `u_${fnv1a(input)}`;
}
