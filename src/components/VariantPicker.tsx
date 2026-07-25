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
    // a required single-choice group with only one possible option has nothing to actually decide, so it starts pre-selected
    for (const g of groups) if (g.required && !g.multiple && g.options.length === 1) init[g.id] = [g.options[0].id];
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
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-extrabold leading-snug">{menuName}</h3>
            <div className="text-right shrink-0">
              <p className="font-display text-base font-extrabold text-shu">{rupiah(basePrice)}</p>
              <p className="text-[10px] text-sumi/40">Harga dasar</p>
            </div>
          </div>
          {description && <p className="text-xs text-sumi/50 mt-1.5">{description}</p>}
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-5">
          {groups.map((g) => {
            const count = selected[g.id]?.length ?? 0;
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-round font-bold text-sumi">{g.name}</p>
                  {g.required ? (
                    count > 0 ? (
                      <span className="text-[10px] font-round font-bold bg-matcha text-white rounded-full px-2.5 py-1 shrink-0">Selesai</span>
                    ) : (
                      <span className="text-[10px] font-round font-bold bg-matcha/15 text-matcha rounded-full px-2.5 py-1 shrink-0">
                        {g.multiple ? "Pilih min. 1" : "Pilih 1"}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-round font-bold bg-sumi/8 text-sumi/40 rounded-full px-2.5 py-1 shrink-0">Opsional</span>
                  )}
                </div>
                {g.multiple && <p className="text-[11px] text-sumi/40 mt-0.5">Bisa pilih lebih dari satu</p>}
                <div className="mt-1.5 space-y-1.5">
                  {g.options.map((o) => {
                    const checked = (selected[g.id] ?? []).includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 ring-1 cursor-pointer transition ${checked ? "bg-matcha/10 ring-matcha" : "bg-washi/40 ring-sumi/10"}`}
                      >
                        <span className="flex items-center gap-2.5 text-sm text-sumi">
                          <input
                            type={g.multiple ? "checkbox" : "radio"}
                            checked={checked}
                            onChange={() => toggle(g, o.id)}
                            className="h-4 w-4 accent-matcha"
                          />
                          {o.name}
                        </span>
                        {o.priceDelta !== 0 && (
                          <span className="text-xs text-sumi/50 shrink-0">
                            {o.priceDelta > 0 ? "+" : ""}
                            {rupiah(o.priceDelta)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-sumi/10 bg-paper space-y-2">
          <Button onClick={() => onConfirm(flatSelected)} disabled={missingRequired} className="w-full py-3.5">
            {confirmLabel} · {rupiah(total)}
          </Button>
          <button onClick={onCancel} className="w-full text-center text-sm text-sumi/50 hover:text-sumi py-1">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
