"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChefHat,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Power,
  X,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import {
  initialPosCatalog,
  makeCatalogId,
  posCatalogEvent,
  readPosCatalog,
  writePosCatalog,
} from "@/lib/pos-shared";
import type { PosCatalog, PosCategory, Product } from "@/lib/pos-shared";

type Editor =
  | { type: "category"; category?: PosCategory }
  | { type: "product"; product?: Product }
  | null;

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function PosCatalogClient() {
  const [catalog, setCatalog] = useState<PosCatalog>(initialPosCatalog);
  const [editor, setEditor] = useState<Editor>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const syncCatalog = () => setCatalog(readPosCatalog());
    syncCatalog();
    window.addEventListener("storage", syncCatalog);
    window.addEventListener(posCatalogEvent, syncCatalog);
    return () => {
      window.removeEventListener("storage", syncCatalog);
      window.removeEventListener(posCatalogEvent, syncCatalog);
    };
  }, []);

  const sortedCategories = useMemo(
    () => [...catalog.categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [catalog.categories],
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function updateCatalog(updater: (current: PosCatalog) => PosCatalog, message: string) {
    setCatalog((current) => {
      const next = updater(current);
      writePosCatalog(next);
      return next;
    });
    showToast(message);
  }

  function saveCategory(name: string) {
    const editing = editor?.type === "category" ? editor.category : undefined;
    updateCatalog(
      (current) => ({
        ...current,
        categories: editing
          ? current.categories.map((category) => (category.id === editing.id ? { ...category, name } : category))
          : [
              ...current.categories,
              {
                id: makeCatalogId("category"),
                name,
                active: true,
                sortOrder: current.categories.length,
              },
            ],
      }),
      editing ? "Categoría actualizada" : "Categoría creada",
    );
    setEditor(null);
  }

  function toggleCategory(categoryId: string) {
    updateCatalog(
      (current) => ({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId ? { ...category, active: !category.active } : category,
        ),
      }),
      "Categoría actualizada",
    );
  }

  function moveCategory(categoryId: string, direction: -1 | 1) {
    updateCatalog(
      (current) => {
        const ordered = [...current.categories].sort((a, b) => a.sortOrder - b.sortOrder);
        const index = ordered.findIndex((category) => category.id === categoryId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ordered.length) return current;
        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        return {
          ...current,
          categories: ordered.map((category, sortOrder) => ({ ...category, sortOrder })),
        };
      },
      "Orden de categorías actualizado",
    );
  }

  function saveProduct(product: Product) {
    const exists = catalog.products.some((item) => item.id === product.id);
    updateCatalog(
      (current) => ({
        ...current,
        products: exists
          ? current.products.map((item) => (item.id === product.id ? product : item))
          : [...current.products, product],
      }),
      exists ? "Producto actualizado" : "Producto creado",
    );
    setEditor(null);
  }

  function toggleProduct(productId: string) {
    updateCatalog(
      (current) => ({
        ...current,
        products: current.products.map((product) =>
          product.id === productId ? { ...product, available: !product.available } : product,
        ),
      }),
      "Disponibilidad actualizada",
    );
  }

  return (
    <div className="space-y-8">
      {toast ? (
        <div className="fixed right-5 top-5 z-[90] flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-xl">
          <Check size={20} />
          {toast}
        </div>
      ) : null}

      <SectionHeader
        eyebrow="Punto de Venta"
        title="Productos"
        description="Organiza lo que aparece en el POS y decide qué debe pasar por cocina."
        actions={
          <>
            <Link href="/app/pos" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-base font-semibold text-stone-900">
              <ArrowLeft size={21} />
              Volver al POS
            </Link>
            <button type="button" onClick={() => setEditor({ type: "product" })} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white">
              <Plus size={21} />
              Nuevo producto
            </button>
          </>
        }
      />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-500">Orden del menú</p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-950">Categorías</h2>
          </div>
          <button type="button" onClick={() => setEditor({ type: "category" })} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-900">
            <Plus size={19} />
            Nueva categoría
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {sortedCategories.map((category, index) => (
            <article key={category.id} className={["rounded-2xl border p-4", category.active ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-100 opacity-70"].join(" ")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-stone-950">{category.name}</p>
                  <p className="mt-1 text-sm font-medium text-stone-500">{catalog.products.filter((product) => product.categoryId === category.id).length} productos</p>
                </div>
                <StatusPill active={category.active} activeText="Activa" inactiveText="Oculta" />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <IconButton label={`Subir ${category.name}`} disabled={index === 0} onClick={() => moveCategory(category.id, -1)}><ChevronUp size={19} /></IconButton>
                <IconButton label={`Bajar ${category.name}`} disabled={index === sortedCategories.length - 1} onClick={() => moveCategory(category.id, 1)}><ChevronDown size={19} /></IconButton>
                <IconButton label={`Editar ${category.name}`} onClick={() => setEditor({ type: "category", category })}><Pencil size={18} /></IconButton>
                <IconButton label={category.active ? `Desactivar ${category.name}` : `Activar ${category.name}`} onClick={() => toggleCategory(category.id)}><Power size={18} /></IconButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div>
          <p className="text-sm font-semibold text-stone-500">Catálogo</p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-950">Productos del POS</h2>
        </div>
        <div className="mt-4 space-y-7">
          {sortedCategories.map((category) => {
            const categoryProducts = catalog.products.filter((product) => product.categoryId === category.id);
            if (!categoryProducts.length) return null;
            return (
              <div key={category.id}>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-stone-950">{category.name}</h3>
                  {!category.active ? <StatusPill active={false} activeText="" inactiveText="Categoría oculta" /> : null}
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => setEditor({ type: "product", product })}
                      onToggle={() => toggleProduct(product.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editor?.type === "category" ? (
        <CategoryModal category={editor.category} onClose={() => setEditor(null)} onSave={saveCategory} />
      ) : null}
      {editor?.type === "product" ? (
        <ProductModal product={editor.product} categories={sortedCategories} onClose={() => setEditor(null)} onSave={saveProduct} />
      ) : null}
    </div>
  );
}

function ProductCard({ product, onEdit, onToggle }: { product: Product; onEdit: () => void; onToggle: () => void }) {
  return (
    <article className={["rounded-3xl border bg-white p-5 shadow-sm", product.available && product.visible ? "border-stone-200" : "border-stone-200 opacity-70"].join(" ")}>
      <div className="flex items-start gap-4">
        <div className={["grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-xl font-semibold text-stone-700", product.tone].join(" ")}>
          {initials(product.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-stone-950">{product.name}</h3>
              <p className="mt-1 text-2xl font-semibold text-stone-950">{money.format(product.price)}</p>
            </div>
            <StatusPill active={product.available} activeText="Disponible" inactiveText="No disponible" />
          </div>
          {product.description ? <p className="mt-3 text-sm font-medium text-stone-500">{product.description}</p> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SmallFact icon={product.visible ? <Eye size={16} /> : <EyeOff size={16} />} text={product.visible ? "Visible en POS" : "Oculto en POS"} />
        <SmallFact icon={product.sendToKitchen ? <ChefHat size={16} /> : <CircleDollarSign size={16} />} text={product.sendToKitchen ? "Va a cocina" : "Cobro directo"} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={onEdit} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-base font-semibold text-stone-900"><Pencil size={19} /> Editar</button>
        <button type="button" onClick={onToggle} className={["h-14 rounded-2xl text-base font-semibold", product.available ? "bg-stone-100 text-stone-900" : "bg-emerald-600 text-white"].join(" ")}>{product.available ? "Desactivar" : "Activar"}</button>
      </div>
    </article>
  );
}

function ProductModal({ product, categories, onClose, onSave }: { product?: Product; categories: PosCategory[]; onClose: () => void; onSave: (product: Product) => void }) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [available, setAvailable] = useState(product?.available ?? true);
  const [visible, setVisible] = useState(product?.visible ?? true);
  const [sendToKitchen, setSendToKitchen] = useState(product?.sendToKitchen ?? true);
  const valid = name.trim().length > 0 && categoryId.length > 0 && price > 0;

  function save() {
    if (!valid) return;
    onSave({
      id: product?.id ?? makeCatalogId("product"),
      name: name.trim(),
      categoryId,
      price,
      description: description.trim() || undefined,
      available,
      visible,
      sendToKitchen,
      recipeId: product?.recipeId ?? null,
      tone: product?.tone ?? "from-stone-100 to-emerald-100",
    });
  }

  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre"><input value={name} onChange={(event) => setName(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" /></Field>
        <Field label="Categoría"><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-950">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
        <Field label="Precio"><input type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" /></Field>
        <Field label="Descripción corta (opcional)"><input value={description} onChange={(event) => setDescription(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" /></Field>
      </div>
      <div className="mt-5 space-y-3">
        <SettingToggle label="Disponible" description="Se puede vender ahora" active={available} onChange={setAvailable} />
        <SettingToggle label="Visible en POS" description="Aparece en el catálogo de venta" active={visible} onChange={setVisible} />
        <SettingToggle label="Enviar a cocina" description="Debe entrar en la comanda antes de cobrar" active={sendToKitchen} onChange={setSendToKitchen} />
      </div>
      <button type="button" disabled={!valid} onClick={save} className="mt-6 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Guardar producto</button>
    </Modal>
  );
}

function CategoryModal({ category, onClose, onSave }: { category?: PosCategory; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(category?.name ?? "");
  return (
    <Modal title={category ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
      <Field label="Nombre"><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="h-14 w-full rounded-2xl border border-stone-200 px-4 text-base text-stone-950" /></Field>
      <button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim())} className="mt-6 h-16 w-full rounded-3xl bg-stone-950 text-lg font-semibold text-white disabled:bg-stone-300">Guardar categoría</button>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/65 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold text-stone-950">{title}</h2><IconButton label="Cerrar" onClick={onClose}><X size={20} /></IconButton></div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, active, onChange }: { label: string; description: string; active: boolean; onChange: (active: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={active} onClick={() => onChange(!active)} className="flex min-h-18 w-full items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left">
      <span><span className="block text-base font-semibold text-stone-950">{label}</span><span className="mt-1 block text-sm font-medium text-stone-500">{description}</span></span>
      <span className={["flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition", active ? "justify-end bg-emerald-600" : "justify-start bg-stone-300"].join(" ")}><span className="size-6 rounded-full bg-white shadow-sm" /></span>
    </button>
  );
}

function StatusPill({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return <span className={["inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-semibold", active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-stone-300 bg-stone-100 text-stone-600"].join(" ")}>{active ? activeText : inactiveText}</span>;
}

function SmallFact({ icon, text }: { icon: ReactNode; text: string }) {
  return <span className="inline-flex h-9 items-center gap-2 rounded-full bg-stone-100 px-3 text-xs font-semibold text-stone-600">{icon}{text}</span>;
}

function IconButton({ children, label, onClick, disabled = false }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} aria-label={label} title={label} className="grid size-10 place-items-center rounded-xl border border-stone-200 bg-white text-stone-700 disabled:opacity-30">{children}</button>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-stone-700">{label}<span className="mt-2 block">{children}</span></label>;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}
