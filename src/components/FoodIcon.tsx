import type { ReactNode } from "react";

/**
 * Hand-drawn style food illustrations matching the Rialto logo
 * (brown outline, pastel fills — like the pizza slice and oven in the badge).
 */

const O = "#6b4a3a"; // outline brown
const C = { crust: "#e9b77f", cheese: "#f7e2a0", sauce: "#d9735a", basil: "#9fbf8a", cream: "#fbf1de", peach: "#efbf8f", meat: "#b9785a", lettuce: "#a9cc8e", tomato: "#e07a5f", bowl: "#b2d1d6", dish: "#f3e6d0", lemon: "#f6dc7a" };

export type FoodIconName =
  | "pizza"
  | "pizzabroetchen"
  | "pasta"
  | "doener"
  | "burger"
  | "schnitzel"
  | "auflaeufe"
  | "salate"
  | "oven";

const icons: Record<FoodIconName, ReactNode> = {
  pizza: (
    <>
      <path d="M18 34 Q60 14 102 34 L64 104 Q60 110 56 104 Z" fill={C.cheese} />
      <path d="M14 30 Q60 6 106 30 L102 40 Q60 20 18 40 Z" fill={C.crust} />
      <circle cx="46" cy="48" r="8" fill={C.sauce} />
      <circle cx="72" cy="46" r="7" fill={C.sauce} />
      <circle cx="60" cy="72" r="7" fill={C.sauce} />
      <path d="M52 60 q6 -8 12 0 q-6 6 -12 0z" fill={C.basil} />
      <path d="M74 64 q5 -6 10 0 q-5 5 -10 0z" fill={C.basil} />
      <path d="M40 66 q2 10 -2 16" stroke={C.cheese} strokeWidth="6" />
      <path d="M14 30 Q60 6 106 30 L64 104 Q60 110 56 104 Z" fill="none" />
    </>
  ),
  pizzabroetchen: (
    <>
      <ellipse cx="60" cy="92" rx="48" ry="10" fill={C.dish} />
      {[
        [36, 66],
        [60, 58],
        [84, 66],
      ].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x - 16} ${y + 6} q0 -22 16 -22 q16 0 16 22 v12 q-16 6 -32 0z`} fill={C.crust} />
          <ellipse cx={x} cy={y - 10} rx="12" ry="5" fill={C.cream} />
          <circle cx={x - 4} cy={y - 11} r="2.2" fill={C.basil} stroke="none" />
          <circle cx={x + 5} cy={y - 9} r="2.2" fill={C.basil} stroke="none" />
        </g>
      ))}
    </>
  ),
  pasta: (
    <>
      <path d="M14 58 h92 q-4 34 -46 38 q-42 -4 -46 -38z" fill={C.bowl} />
      <path d="M24 58 q8 -22 22 -14 q10 -16 24 -4 q14 -10 24 8z" fill={C.cheese} />
      <path d="M34 54 q8 -8 16 0 M52 50 q8 -8 16 0 M70 52 q8 -8 14 2" fill="none" />
      <circle cx="46" cy="44" r="5" fill={C.sauce} />
      <circle cx="66" cy="42" r="4" fill={C.sauce} />
      <path d="M58 36 q5 -7 10 0 q-5 5 -10 0z" fill={C.basil} />
      <path d="M92 18 l-14 34 M98 20 l-14 34" fill="none" />
    </>
  ),
  doener: (
    <>
      <path d="M20 46 q40 -34 80 0 l-8 46 q-32 14 -64 0z" fill={C.crust} />
      <path d="M28 50 q32 -20 64 0 l-4 10 q-28 -12 -56 0z" fill={C.lettuce} />
      <path d="M32 60 q28 -12 56 0 l-2 10 q-26 -10 -52 0z" fill={C.meat} />
      <circle cx="44" cy="58" r="5" fill={C.tomato} />
      <circle cx="74" cy="58" r="5" fill={C.tomato} />
      <path d="M34 72 q26 -8 52 0 l-2 8 q-24 -6 -48 0z" fill={C.cream} />
    </>
  ),
  burger: (
    <>
      <path d="M18 54 q0 -32 42 -32 q42 0 42 32z" fill={C.crust} />
      <circle cx="44" cy="36" r="1.8" fill={O} stroke="none" />
      <circle cx="60" cy="31" r="1.8" fill={O} stroke="none" />
      <circle cx="76" cy="37" r="1.8" fill={O} stroke="none" />
      <path d="M14 58 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 12 0" fill={C.lettuce} />
      <path d="M20 66 h80 l-4 6 h-72z" fill={C.cheese} />
      <rect x="18" y="72" width="84" height="12" rx="6" fill={C.meat} />
      <path d="M20 88 h80 q0 14 -40 14 q-40 0 -40 -14z" fill={C.crust} />
    </>
  ),
  schnitzel: (
    <>
      <ellipse cx="60" cy="76" rx="50" ry="24" fill={C.dish} />
      <path d="M26 74 q4 -24 34 -26 q30 -2 34 20 q2 18 -32 22 q-38 2 -36 -16z" fill={C.peach} />
      <path d="M40 66 l4 4 M56 60 l4 4 M70 66 l4 4 M50 78 l4 4 M66 80 l4 4" fill="none" />
      <circle cx="88" cy="48" r="14" fill={C.lemon} />
      <path d="M88 34 v28 M74 48 h28 M78 38 l20 20 M98 38 l-20 20" fill="none" strokeWidth="1.6" />
      <path d="M30 56 q4 -10 12 -8 q-2 8 -12 8z" fill={C.basil} />
    </>
  ),
  auflaeufe: (
    <>
      <path d="M14 62 h92 l-8 30 q-38 10 -76 0z" fill={C.dish} />
      <path d="M10 62 h100" fill="none" />
      <path d="M18 62 q6 -14 16 -6 q8 -12 18 -2 q8 -12 18 0 q10 -10 18 2 q8 -6 14 6z" fill={C.cheese} />
      <circle cx="40" cy="58" r="3" fill={C.sauce} stroke="none" />
      <circle cx="70" cy="56" r="3" fill={C.sauce} stroke="none" />
      <path className="food-icon__steam" d="M44 40 q-6 -8 0 -16 M60 38 q-6 -8 0 -16 M76 40 q-6 -8 0 -16" fill="none" />
    </>
  ),
  salate: (
    <>
      <path d="M14 60 h92 q-4 32 -46 36 q-42 -4 -46 -36z" fill={C.bowl} />
      <path d="M22 60 q2 -22 18 -18 q4 -16 20 -10 q14 -10 22 6 q16 -2 16 22z" fill={C.lettuce} />
      <circle cx="44" cy="52" r="7" fill={C.tomato} />
      <circle cx="74" cy="50" r="6" fill={C.tomato} />
      <path d="M56 46 q6 -6 12 0 q-6 6 -12 0z" fill={C.cream} />
      <circle cx="62" cy="58" r="3" fill={O} stroke="none" />
    </>
  ),
  oven: (
    <>
      <path d="M12 100 v-38 q0 -46 48 -46 q48 0 48 46 v38z" fill={C.peach} />
      {[0, 1, 2, 3].map((r) => (
        <path key={r} d={`M14 ${88 - r * 14} h92`} fill="none" strokeWidth="1.6" />
      ))}
      <path d="M32 100 v-24 q0 -28 28 -28 q28 0 28 28 v24z" fill="#5a3f33" />
      <path className="food-icon__flame" d="M60 96 q-14 -6 -6 -22 q4 8 8 4 q-2 -12 8 -18 q-2 12 6 18 q6 14 -16 18z" fill="#f2a65a" />
      <path className="food-icon__steam" d="M48 12 q-6 -6 0 -12 M60 12 q-6 -6 0 -12 M72 12 q-6 -6 0 -12" fill="none" />
      <rect x="6" y="100" width="108" height="8" rx="3" fill={C.crust} />
    </>
  ),
};

export default function FoodIcon({ name, className }: { name: FoodIconName; className?: string }) {
  return (
    <svg
      className={`food-icon${className ? ` ${className}` : ""}`}
      viewBox="0 -4 120 120"
      width="120"
      height="120"
      stroke={O}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}
