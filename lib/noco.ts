export async function getUserByEmail(base: string, token: string, tableId: string, email: string) {
  const urlBase = base.replace(/\/$/, "");
  const where = encodeURIComponent(`(email,eq,${email})`);
  const url = `${urlBase}/tables/${encodeURIComponent(tableId)}/records?where=${where}&limit=1`;
  const res = await fetch(url, { headers: { "xc-token": token, accept: "application/json" }, cache: "no-store" });
  const data = await res.json();
  const list = data?.list ?? data?.records ?? [];
  return Array.isArray(list) && list[0] ? list[0] : null;
}
export async function createUser(base: string, token: string, tableId: string, rec: any) {
  const urlBase = base.replace(/\/$/, "");
  const url = `${urlBase}/tables/${encodeURIComponent(tableId)}/records`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xc-token": token, "Content-Type": "application/json" },
    body: JSON.stringify(rec),
  });
  if (!res.ok) throw new Error(`NocoDB create user failed: ${res.status} ${await res.text()}`);
  return res.json();
}