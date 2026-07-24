"use client";
import { useState } from "react";
import { rupiah } from "@/lib/format";
import { Button } from "@/components/ui";

export type OptionGroup = { id: string; name: string; required: boolean; multiple: boolean; options: { id: string; name: string; priceDelta: number }[] };
export type SelectedOption = { groupId: string; optionId: string; name: string; priceDelta: number };

export default function VariantPicker({
  menuName,
  description,
  basePrice,
  groups,
  confirmLabel = "Tambahkan",
  onCancel,
  onConfirm,
}: {
  menuName: string;
  description?: string | null;
  basePrice: number;
  groups: OptionGroup[];
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (selected: SelectedOption[]) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of groups) if (g.required && !g.multiple && g.options[0]) init[g.id] = [g.options[0].id];
    return init;
  });

  function toggle(g: OptionGroup, optionId: string) {
    setSelected((prev) => {
      const cur = prev[g.id] ?? [];
      if (g.multiple) {
        const next = cur.includes(optionId) ? cur.filter((id) => id !== optionId) : [...cur, optionId];
        return { ...prev, [g.id]: next };
      }
      return { ...prev, [g.id]: cur[0] === optionId && !g.required ? [] : [optionId] };
    });
  }

  const flatSelected: SelectedOption[] = groups.flatMap((g) =>
    (selected[g.id] ?? []).map((optionId) => {
      const opt = g.options.find((o) => o.id === optionId)!;
      return { groupId: g.id, optionId, name: opt.name, priceDelta: opt.priceDelta };
    })
  );
  const total = basePrice + flatSelected.reduce((s, o) => s + o.priceDelta, 0);
  const missingRequired = groups.some((g) => g.required && (selected[g.id]?.length ?? 0) === 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-0 sm:p-4" onClick={onCancel}>
      <div className="w-full max-w-sm bg-washi rounded-t-[1.75rem] sm:rounded-3xl paper-card max-h-[85vh] flex flex-col animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-sumi/10">
          <h3 className="font-display text-lg font-extrabold">{menuName}</h3>
          {description && <p className="text-xs text-sumi/50 mt-1">{description}</p>}
          <p className="text-xs text-sumi/40 mt-1">Pilih varian sebelum ditambahkan</p>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="text-sm font-round font-bold text-sumi flex items-center gap-2">
                {g.name}
                {g.required && <span className="text-[10px] text-shu font-bold">wajib</span>}
                {g.multiple && <span className="text-[10px] text-sumi/40">(bisa lebih dari satu)</span>}
              </p>
              <div className="mt-1.5 space-y-1.5">
                {g.options.map((o) => {
                  const checked = (selected[g.id] ?? []).includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 ring-1 cursor-pointer transition ${checked ? "bg-shu/10 ring-shu" : "bg-washi/40 ring-sumi/10"}`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <input type={g.multiple ? "checkbox" : "radio"} checked={checked} onChange={() => toggle(g, o.id)} />
                        {o.name}
                      </span>
                      {o.priceDelta !== 0 && (
                        <span className="text-xs text-sumi/50">
                          {o.priceDelta > 0 ? "+" : ""}
                          {rupiah(o.priceDelta)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-sumi/10 bg-paper space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-sumi/50">Harga</span>
            <span className="font-display text-lg font-extrabold text-shu">{rupiah(total)}</span>
          </div>
          <Button onClick={() => onConfirm(flatSelected)} disabled={missingRequired} className="w-full py-3">
            {confirmLabel}
          </Button>
          <button onClick={onCancel} className="w-full text-center text-sm text-sumi/50 hover:text-sumi py-1">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
