export type CatMoodKind = "contente" | "neutro" | "faminto" | "zangado";
export type CatVariant = "fincat" | "siamesinho" | "frajolinha" | "persinha" | "laranjinha";

type Palette = { fur: string; secondary: string; eye: string; line: string; inner: string };

const palettes: Record<CatVariant, Palette> = {
  fincat: { fur: "#101014", secondary: "#cfff04", eye: "#cfff04", line: "#ffffff", inner: "#cfff04" },
  siamesinho: { fur: "#ead9ba", secondary: "#493838", eye: "#75c9ff", line: "#fffaf0", inner: "#493838" },
  frajolinha: { fur: "#17171b", secondary: "#f7f5ef", eye: "#cfff70", line: "#ffffff", inner: "#f7f5ef" },
  persinha: { fur: "#eee7d9", secondary: "#d7c8af", eye: "#6f8f3d", line: "#fffdf7", inner: "#d7c8af" },
  laranjinha: { fur: "#df8432", secondary: "#9e4b20", eye: "#dfff70", line: "#fff7e8", inner: "#9e4b20" },
};

function FaceShape({ variant, palette }: { variant: CatVariant; palette: Palette }) {
  if (variant === "siamesinho")
    return (
      <>
        <path
          d="M23 43 29 7l22 20c6-1 12-1 18 0L91 7l6 36c7 8 10 18 8 29-3 24-22 36-45 36S18 96 15 72c-2-11 1-21 8-29Z"
          fill={palette.fur}
          stroke={palette.line}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="m30 12 16 18-20 13Z" fill={palette.secondary} />
        <path d="m90 12-16 18 20 13Z" fill={palette.secondary} />
        <path d="M40 35c12-9 28-9 40 0l-4 31c-4 9-12 15-16 15s-12-6-16-15Z" fill={palette.secondary} />
      </>
    );
  if (variant === "frajolinha")
    return (
      <>
        <path
          d="M20 43 28 10l20 17c8-2 16-2 24 0l20-17 8 33c8 8 12 19 11 31-2 23-23 34-51 34S11 97 9 74c-1-12 3-23 11-31Z"
          fill={palette.fur}
          stroke={palette.line}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M46 27c6 8 7 18 4 28l-7 27 17 19 20-22-11-26c-4-9-3-18 3-26-9-2-18-2-26 0Z" fill={palette.secondary} />
        <path d="m28 14 13 17-17 10Zm64 0L79 31l17 10Z" fill={palette.inner} />
      </>
    );
  if (variant === "persinha")
    return (
      <>
        <path
          d="M23 45 31 17l18 12c7-2 15-2 22 0l18-12 8 28c10 7 15 18 14 31-2 22-22 32-51 32S11 98 9 76c-1-13 4-24 14-31Z"
          fill={palette.fur}
          stroke={palette.line}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="m32 21 12 11-17 10Zm56 0L76 32l17 10Z" fill={palette.inner} />
        <ellipse cx="60" cy="70" rx="40" ry="31" fill={palette.secondary} opacity=".43" />
        <ellipse cx="38" cy="77" rx="15" ry="18" fill={palette.fur} />
        <ellipse cx="82" cy="77" rx="15" ry="18" fill={palette.fur} />
      </>
    );
  if (variant === "laranjinha")
    return (
      <>
        <path
          d="M20 44 27 10l21 18c8-2 16-2 24 0l21-18 7 34c7 9 10 19 8 30-4 22-23 34-48 34S16 96 12 74c-2-11 1-21 8-30Z"
          fill={palette.fur}
          stroke={palette.line}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="m28 15 14 16-18 11Zm64 0L78 31l18 11Z" fill={palette.inner} />
        <g stroke={palette.secondary} strokeWidth="4" strokeLinecap="round">
          <path d="m47 29 5 13" />
          <path d="M60 26v16" />
          <path d="m73 29-5 13" />
          <path d="m22 55 12 4" />
          <path d="m98 55-12 4" />
        </g>
      </>
    );
  return (
    <>
      <path
        d="M21 42 27 8l21 19c8-2 16-2 24 0L93 8l6 34c8 8 12 19 12 31 0 24-22 35-51 35S9 97 9 73c0-12 4-23 12-31Z"
        fill={palette.fur}
        stroke={palette.line}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m29 15 13 16-17 11Zm62 0L78 31l17 11Z" fill={palette.inner} opacity=".8" />
    </>
  );
}

function Expression({ mood, palette }: { mood: CatMoodKind; palette: Palette }) {
  const happy = mood === "contente";
  return (
    <>
      <g
        className="cat-blink"
        style={{ transformOrigin: "60px 59px" }}
        fill="none"
        stroke={palette.eye}
        strokeWidth="5"
        strokeLinecap="round"
      >
        {happy ? (
          <>
            <path d="m35 58 9 6 9-6" />
            <path d="m67 58 9 6 9-6" />
          </>
        ) : (
          <>
            <ellipse
              cx="44"
              cy="58"
              rx={mood === "faminto" ? 3 : 5.5}
              ry={mood === "zangado" ? 3 : 8}
              fill={palette.eye}
              stroke="none"
            />
            <ellipse
              cx="76"
              cy="58"
              rx={mood === "faminto" ? 3 : 5.5}
              ry={mood === "zangado" ? 3 : 8}
              fill={palette.eye}
              stroke="none"
            />
          </>
        )}
      </g>
      {mood === "zangado" && (
        <g stroke={palette.line} strokeWidth="3" strokeLinecap="round">
          <path d="m35 49 15 4" />
          <path d="m85 49-15 4" />
        </g>
      )}
      <path d="m55 72 5-4 5 4-5 5Z" fill={palette.secondary} />
      <path
        d={
          mood === "faminto"
            ? "M55 82c3-5 7-5 10 0"
            : mood === "zangado"
              ? "M53 84c4-4 10-4 14 0"
              : "M60 77c-1 8-10 9-13 3m13-3c1 8 10 9 13 3"
        }
        fill="none"
        stroke={palette.line}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  );
}

export function CatMark({
  mood = "neutro",
  variant = "fincat",
  className = "",
  label,
}: {
  mood?: CatMoodKind;
  variant?: CatVariant;
  className?: string;
  label?: string;
}) {
  const palette = palettes[variant];
  return (
    <svg viewBox="0 0 120 112" className={className} role="img" aria-label={label ?? `Gato ${mood}`}>
      <FaceShape variant={variant} palette={palette} />
      <Expression mood={mood} palette={palette} />
      <g fill="none" stroke={palette.line} strokeWidth="2.5" strokeLinecap="round">
        <path d="m45 76-29-5" />
        <path d="m45 82-30 3" />
        <path d="m75 76 29-5" />
        <path d="m75 82 30 3" />
      </g>
    </svg>
  );
}

export function CatAvatar(
  props: Omit<Parameters<typeof CatMark>[0], "variant"> & { variant: Exclude<CatVariant, "fincat"> },
) {
  return <CatMark {...props} />;
}
export function CatMood(props: Omit<Parameters<typeof CatMark>[0], "variant">) {
  return <CatMark {...props} variant="fincat" />;
}
export function moodForBalance(cents: number): CatMoodKind {
  return cents > 0 ? "contente" : cents === 0 ? "neutro" : cents > -50000 ? "faminto" : "zangado";
}
