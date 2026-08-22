"use client";

import { STEP_SUBTITLES, STEP_TITLES } from "@/components/estimator/wizard-constants";
import { groupedMaterials } from "@/lib/pricing/materials";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";

export function MaterialStep({
  materials,
  selected,
  onPick,
}: {
  materials: Material[];
  selected: string;
  onPick: (name: string) => void;
}) {
  const groups = groupedMaterials(materials);

  return (
    <div>
      <h2 className="heading-font text-3xl md:text-4xl font-semibold tracking-tight">
        {STEP_TITLES[1]}
      </h2>
      <p className="mt-2 font-mono text-xs text-slate-500 max-w-xl">
        {STEP_SUBTITLES[1]}
      </p>
      {!groups.length ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
          No catalog substrates match this product. Pick a different product or
          add a material in the EXAMPLE catalog.
        </div>
      ) : (
        <div className="mt-8 space-y-8 max-w-xl">
          {groups.map((group) => (
            <div key={group.group}>
              <div className="mb-3 text-sm font-semibold text-slate-700">
                {group.group}
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((material) => {
                  const on = selected === material.name;
                  return (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() => onPick(material.name)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                        on
                          ? "border-teal bg-teal/5"
                          : "border-slate-200 bg-white hover:border-teal/40"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          on ? "bg-teal" : "bg-slate-300"
                        )}
                      />
                      <span className={cn("text-sm", on && "font-semibold text-teal")}>
                        {material.name}
                      </span>
                      {on && (
                        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-teal">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
