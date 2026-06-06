import Link from "next/link";
import { Crown } from "lucide-react";
import { registerAction } from "@/app/auth/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <form
        action={registerAction}
        className="w-full max-w-2xl rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Crown size={18} />
          </span>
          <span className="text-sm font-semibold text-stone-950">
            Royalty Hospitality OS
          </span>
        </Link>
        <h1 className="mt-8 text-3xl font-semibold text-stone-950">
          Crear cuenta y negocio
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Se creara tu usuario, el negocio, tu rol owner y los modulos base.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {decodeURIComponent(params.error)}
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Nombre
            <input required name="fullName" className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Email
            <input required type="email" name="email" className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Password
            <input required type="password" name="password" minLength={6} className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Nombre del negocio
            <input required name="businessName" className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          </label>
          <label className="block text-sm font-medium text-stone-700 sm:col-span-2">
            Tipo de negocio
            <select required name="businessType" className="mt-2 h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              <option value="">Seleccionar</option>
              <option value="restaurant">Restaurante</option>
              <option value="bar">Bar</option>
              <option value="beach_club">Beach club</option>
              <option value="nightclub">Antro</option>
              <option value="cafe">Cafeteria</option>
            </select>
          </label>
        </div>
        <button className="mt-6 h-11 w-full rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
          Crear cuenta
        </button>
        <p className="mt-5 text-center text-sm text-stone-500">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-stone-950">
            Iniciar sesion
          </Link>
        </p>
      </form>
    </main>
  );
}
