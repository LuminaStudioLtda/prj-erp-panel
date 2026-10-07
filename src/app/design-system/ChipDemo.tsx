"use client";

import { useState } from "react";

import { Chip } from "@/components/ui/chip";

const OPTIONS = ["Todos", "Em andamento", "Concluídos"];

export function ChipDemo() {
  const [selected, setSelected] = useState(OPTIONS[0]);

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <Chip
          key={option}
          selected={selected === option}
          onClick={() => setSelected(option)}
        >
          {option}
        </Chip>
      ))}
    </div>
  );
}
