"use client";

type BotanicalDecorProps = {
  variant: "monstera" | "sansevieria";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right";
  size?: "sm" | "md" | "lg";
  opacity?: number;
  animate?: boolean;
};

const SIZE_MAP = { sm: 80, md: 130, lg: 200 };

const POSITION_CLASSES: Record<BotanicalDecorProps["position"], string> = {
  "top-left":     "absolute top-0 left-0 origin-top-left",
  "top-right":    "absolute top-0 right-0 origin-top-right",
  "bottom-left":  "absolute bottom-0 left-0 origin-bottom-left",
  "bottom-right": "absolute bottom-0 right-0 origin-bottom-right",
  "left":         "absolute top-1/3 left-0 origin-left",
  "right":        "absolute top-1/3 right-0 origin-right",
};

const POSITION_FLIP: Record<BotanicalDecorProps["position"], boolean> = {
  "top-left": false, "bottom-left": false, "left": false,
  "top-right": true, "bottom-right": true, "right": true,
};

function MonsteraSVG({ color = "#4A5A3C" }: { color?: string }) {
  return (
    <svg viewBox="0 0 160 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Petiole */}
      <path d="M 80 205 L 80 175" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Main leaf body with characteristic splits */}
      <path
        d="
          M 80 15
          C 105 18, 140 38, 150 68
          C 155 85, 152 96, 143 100
          C 150 108, 148 122, 133 128
          C 136 142, 130 162, 108 175
          L 80 178
          L 52 175
          C 30 162, 24 142, 27 128
          C 12 122, 10 108, 17 100
          C 8 96, 5 85, 10 68
          C 20 38, 55 18, 80 15
          Z
        "
        fill={color}
        fillOpacity="0.9"
      />
      {/* Left split cut */}
      <path
        d="M 17 100 C 28 95, 42 98, 52 112 C 42 108, 30 108, 27 128"
        fill="transparent"
        stroke="transparent"
      />
      <ellipse cx="36" cy="112" rx="12" ry="22" transform="rotate(-18 36 112)" fill="black" fillOpacity="0" />
      {/* Fenestrations (holes) — left */}
      <ellipse cx="52" cy="108" rx="10" ry="20" transform="rotate(-15 52 108)" fill="white" fillOpacity="0.9" />
      {/* Fenestrations — right */}
      <ellipse cx="108" cy="108" rx="10" ry="20" transform="rotate(15 108 108)" fill="white" fillOpacity="0.9" />
      {/* Left deep cut notch */}
      <path
        d="M 10 68 C 22 72, 34 78, 38 95 C 30 85, 18 82, 17 100"
        fill="white" fillOpacity="0.9"
      />
      {/* Right deep cut notch */}
      <path
        d="M 150 68 C 138 72, 126 78, 122 95 C 130 85, 142 82, 143 100"
        fill="white" fillOpacity="0.9"
      />
      {/* Central vein */}
      <path d="M 80 15 L 80 175" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" strokeLinecap="round" />
      {/* Secondary veins */}
      <path d="M 80 70 C 60 75, 38 90, 27 110" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <path d="M 80 70 C 100 75, 122 90, 133 110" stroke="white" strokeWidth="1" strokeOpacity="0.25" />
      <path d="M 80 100 C 65 105, 48 118, 40 135" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
      <path d="M 80 100 C 95 105, 112 118, 120 135" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
}

function SansevieraSVG({ color = "#4A5A3C" }: { color?: string }) {
  const darkColor = "#2E3B26";
  return (
    <svg viewBox="0 0 100 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back-left leaf */}
      <path
        d="M 25 255 C 18 200, 10 150, 14 80 C 16 50, 20 30, 24 10 C 28 30, 30 55, 30 85 C 32 155, 28 205, 25 255 Z"
        fill={darkColor}
        fillOpacity="0.8"
      />
      {/* Back-right leaf */}
      <path
        d="M 75 255 C 72 205, 68 155, 70 85 C 70 55, 72 30, 76 10 C 80 30, 84 50, 86 80 C 90 150, 82 200, 75 255 Z"
        fill={darkColor}
        fillOpacity="0.8"
      />
      {/* Center leaf */}
      <path
        d="M 50 258 C 38 210, 32 160, 36 100 C 38 68, 42 40, 50 8 C 58 40, 62 68, 64 100 C 68 160, 62 210, 50 258 Z"
        fill={color}
        fillOpacity="0.95"
      />
      {/* Horizontal stripe bands on center leaf */}
      {[50, 90, 130, 165, 198, 228].map((y, i) => (
        <path
          key={i}
          d={`M ${50 - (i < 3 ? 10 : 12)} ${y} Q 50 ${y + 2} ${50 + (i < 3 ? 10 : 12)} ${y}`}
          stroke={darkColor}
          strokeWidth="2"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />
      ))}
      {/* Tip highlight on center leaf */}
      <path
        d="M 50 8 C 48 18, 47 30, 47 42 C 49 32, 51 20, 50 8 Z"
        fill="white"
        fillOpacity="0.15"
      />
    </svg>
  );
}

export default function BotanicalDecor({
  variant,
  position,
  size = "md",
  opacity = 0.08,
  animate = true,
}: BotanicalDecorProps) {
  const px = SIZE_MAP[size];
  const posClass = POSITION_CLASSES[position];
  const flipped = POSITION_FLIP[position];
  const animClass = animate
    ? position.includes("right") ? "animate-sway-reverse" : "animate-sway"
    : "";

  return (
    <div
      className={`${posClass} pointer-events-none select-none hidden md:block`}
      style={{ opacity, width: px }}
    >
      <div className={animClass} style={{ transformOrigin: flipped ? "100% 0%" : "0% 0%" }}>
        {variant === "monstera" ? (
          <MonsteraSVG color={flipped ? "#6B7D5A" : "#4A5A3C"} />
        ) : (
          <SansevieraSVG color="#4A5A3C" />
        )}
      </div>
    </div>
  );
}
