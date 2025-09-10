'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Mostra il logo da /public/logo_ntf.png
 * Fallback automatico a "NTF" se l’immagine non esiste o fallisce.
 */
export default function Logo({
  href = '/',
  src = '/logo_ntf.png',
  label = 'Niki Tuttofare',
  size = 26,
}: { href?: string; src?: string; label?: string; size?: number }) {
  const [broken, setBroken] = useState(false);

  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      {!broken ? (
        <Image
          src={src}
          alt={label}
          width={size}
          height={size}
          priority
          onError={() => setBroken(true)}
          className="rounded-md"
        />
      ) : (
        <div
          className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-ntf-accent text-white text-[11px] font-bold"
          aria-label={label}
        >
          N
        </div>
      )}
      <span className="font-semibold tracking-tight">{label}</span>
    </Link>
  );
}