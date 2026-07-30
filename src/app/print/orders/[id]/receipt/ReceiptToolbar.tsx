"use client";
import { useEffect } from "react";

export default function ReceiptToolbar() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-[300px] mx-auto mb-4 flex items-center justify-between print:hidden">
      <button onClick={() => history.back()} className="text-sm font-bold text-sumi/60 hover:text-shu">
        ‹ Kembali
      </button>
      <button onClick={() => window.print()} className="rounded-xl bg-shu text-white text-sm font-bold px-4 py-2 btn-press">
        🖨️ Cetak Struk
      </button>
    </div>
  );
}
