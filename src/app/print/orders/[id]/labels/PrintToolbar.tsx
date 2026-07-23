"use client";

export default function PrintToolbar() {
  return (
    <div className="max-w-md mx-auto mb-4 flex items-center justify-between print:hidden">
      <button onClick={() => history.back()} className="text-sm font-bold text-sumi/60 hover:text-shu">
        ‹ Kembali
      </button>
      <button onClick={() => window.print()} className="rounded-xl bg-shu text-white text-sm font-bold px-4 py-2 btn-press">
        🖨️ Cetak Stiker
      </button>
    </div>
  );
}
