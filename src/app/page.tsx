"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Calculator from "@/components/calculator";
import ConstructionCalculator from "@/components/construction-calculator";

function PageInner() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "construction") {
    return <ConstructionCalculator />;
  }
  return <Calculator />;
}

export default function Home() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <PageInner />
    </Suspense>
  );
}
