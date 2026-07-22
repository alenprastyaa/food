"use client";
import { useEffect, useState } from "react";

type Petal = { left: number; delay: number; dur: number; size: number };

export default function Petals({ count = 9 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    setPetals(
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 12,
        dur: 9 + Math.random() * 10,
        size: 12 + Math.random() * 12,
      }))
    );
  }, [count]);

  return (
    <>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{ left: `${p.left}vw`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, fontSize: p.size, opacity: 0.7 }}
        >
          🌸
        </span>
      ))}
    </>
  );
}
