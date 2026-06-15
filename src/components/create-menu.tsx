"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

const createActions = [
  { label: "Nueva reserva", href: "/app/operacion?tab=reservas&action=nueva-reserva" },
  { label: "Nuevo cliente", href: "/app/clientes?action=new" },
  { label: "Registrar consumo", href: "/app/operacion?tab=sala" },
  { label: "Crear campana", href: "/app/marketing" },
  { label: "Registrar merma", href: "/app/inventario?action=waste" },
  { label: "Registrar cortesia", href: "/app/operacion?tab=cierre&action=cortesia" },
  { label: "Nueva tarea", href: "/app/crm-interno" },
];

export function CreateMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus size={16} />
        Crear
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_20px_60px_rgba(28,25,23,0.16)]">
          {createActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
