'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string|undefined>();
  const [ok, setOk] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!email || !password || password !== password2) {
      setError("Controlla email e che le password coincidano.");
      return;
    }
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    const j = await res.json();
    if (!j.ok) { setError(j.error || "Registrazione non riuscita"); return; }
    setOk(true);
    setTimeout(()=> router.push("/login"), 1200);
  }

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Crea un account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input w-full" type="text" placeholder="Nome (opzionale)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input w-full" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <input className="input w-full" type="password" placeholder="Ripeti password" value={password2} onChange={e=>setPassword2(e.target.value)} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-green-600 text-sm">Registrazione ok! Reindirizzo…</div>}
        <button className="btn-primary w-full" type="submit">Registrati</button>
      </form>
    </div>
  );
}