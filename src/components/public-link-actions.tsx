"use client";

import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";

export function PublicLinkActions({ href }: { href: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(href)}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-xs font-medium text-stone-800 transition hover:border-stone-300"
      >
        <Copy size={14} />
        Copiar link
      </button>
      <Link
        href={href}
        target="_blank"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-medium text-white transition hover:bg-stone-800"
      >
        <ExternalLink size={14} />
        Abrir
      </Link>
    </div>
  );
}
