import Link from "next/link";
import { Logo, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-asanoha grid place-items-center p-6 text-center">
      <div className="animate-fade-up">
        <div className="mb-6 flex justify-center"><Logo size={44} /></div>
        <div className="hanko h-24 w-24 text-5xl mx-auto animate-float">迷</div>
        <h1 className="font-display text-5xl font-extrabold text-sumi mt-6">404</h1>
        <p className="font-round text-shu mt-1">迷子 · Tersesat</p>
        <p className="text-sumi/50 mt-2 max-w-xs mx-auto">Halaman yang kamu cari tidak ada. Mungkin sudah habis seperti katsu jam makan siang 🍤</p>
        <Link href="/" className="inline-block mt-6"><Button>← Kembali ke Beranda</Button></Link>
      </div>
    </div>
  );
}
