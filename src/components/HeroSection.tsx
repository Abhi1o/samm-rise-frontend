import { useEffect, useRef, useState } from "react";
import EnhancedSwapCard from "./EnhancedSwapCard";
import LiquidBlob from "./LiquidBlob";
import { CREStatusStrip } from "./CREStatusStrip";

// ── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ── Marquee ticker data ──────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { pair: "WETH / USDC", fee: "0.299%", tvl: "$6.6M", shards: "4" },
  { pair: "WBTC / USDC", fee: "0.299%", tvl: "$6.6M", shards: "4" },
  { pair: "WETH / USDT", fee: "0.299%", tvl: "$6.6M", shards: "4" },
  { pair: "USDC / USDT", fee: "0.299%", tvl: "$6.5M", shards: "4" },
  { pair: "USDC / DAI",  fee: "0.299%", tvl: "$6.5M", shards: "4" },
];


const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Trigger counters when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tvl    = useCounter(32, 1400, inView);
  const shards = useCounter(20, 1200, inView);

  return (
    <section
      ref={sectionRef}
      id="swap"
      className="relative lg:min-h-screen pt-20 sm:pt-24 lg:pt-28 pb-0 flex flex-col items-center overflow-x-hidden"
    >
      {/* ── Background ───────────────────────────────────────────────────── */}
      <LiquidBlob />

      {/* Fine dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(220,15%,60%) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />


      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 relative z-10 w-full flex-1 flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full py-8 lg:py-0">

          {/* ── Left: Text content ─────────────────────────────────────── */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8">

            {/* Live network badge */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <div
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-background/40 backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: "0s" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Live · RiseChain Testnet
                </span>
              </div>
              <CREStatusStrip />
            </div>

            {/* Headline */}
            <div
              className="animate-fade-in overflow-visible"
              style={{ animationDelay: "0.1s" }}
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.4] tracking-tight overflow-visible">
                <span className="block text-foreground/90 overflow-visible">Trade with</span>
                <span
                  className="block text-transparent overflow-visible"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, hsl(24,100%,55%) 0%, hsl(30,100%,65%) 40%, hsl(24,100%,50%) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    paddingBottom: "0.5rem",
                    marginBottom: "-0.375rem",
                    minHeight: "1.2em",
                  }}
                >
                  GigaGas
                </span>
                <span className="block text-foreground/90 overflow-visible">Speed</span>
              </h1>

              {/* Subtitle with bracket decoration */}
              <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-md mx-auto lg:mx-0 font-mono tracking-wide">
                <span className="text-primary/60">{"// "}</span>
                The First Dynamically Sharded AMM
              </p>
            </div>

            {/* ── Inline stat strip ──────────────────────────────────── */}
            <div
              className="flex items-center gap-0 justify-center lg:justify-start animate-fade-in w-fit mx-auto lg:mx-0 rounded-2xl border border-border/60 overflow-hidden bg-secondary/20 backdrop-blur-sm"
              style={{ animationDelay: "0.25s" }}
            >
              <div className="flex flex-col px-5 py-3 border-r border-border/60">
                <span className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums leading-none">
                  ${tvl}M+
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Testnet TVL</span>
              </div>

              <div className="flex flex-col px-5 py-3 border-r border-border/60">
                <span className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums leading-none">
                  {shards}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Active Shards</span>
              </div>

              <div className="flex flex-col px-5 py-3">
                <span className="text-lg sm:text-xl font-bold font-mono text-primary leading-none">
                  ~0.3%
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">Swap Fee</span>
              </div>
            </div>
          </div>

          {/* ── Right: Swap card ───────────────────────────────────────── */}
          <div
            className="animate-fade-in relative"
            style={{ animationDelay: "0.15s" }}
          >
            {/* Glow halo behind card */}
            <div
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, hsla(24,100%,50%,0.08) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <EnhancedSwapCard />
          </div>
        </div>
      </div>

      {/* ── Pool ticker strip ──────────────────────────────────────────────── */}
      <div
        className="w-full border-t border-border/50 bg-background/30 backdrop-blur-sm relative z-10 animate-fade-in overflow-hidden"
        style={{ animationDelay: "0.5s" }}
      >
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, hsl(var(--background)) 0%, transparent 100%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, hsl(var(--background)) 0%, transparent 100%)" }} />

        <div className="flex items-center gap-0" style={{ animation: "ticker 28s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-2.5 border-r border-border/30 flex-shrink-0"
            >
              <span className="text-xs font-mono font-semibold text-foreground whitespace-nowrap">
                {item.pair}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                fee <span className="text-primary">{item.fee}</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                tvl <span className="text-foreground/70">{item.tvl}</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                {item.shards} shards
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
