import { useState } from "react";
import { Orbit, Lock, Zap, TrendingUp } from "lucide-react";

const features = [
  {
    id: 1,
    icon: Orbit,
    title: "Orbital AMM",
    subtitle: "Multi-Dimensional Liquidity",
    description:
      "Our revolutionary AMM uses orbital mechanics to create dynamic liquidity pools that adapt to market conditions in real-time.",
  },
  {
    id: 2,
    icon: Lock,
    title: "Secure Swaps",
    subtitle: "Zero-Knowledge Proofs",
    description:
      "Every transaction is secured with cutting-edge cryptographic proofs, ensuring your assets remain safe while maintaining privacy.",
  },
  {
    id: 3,
    icon: Zap,
    title: "Lightning Speed",
    subtitle: "Sub-Second Execution",
    description:
      "Experience near-instant swaps with our optimized smart contracts, reducing gas costs and maximizing efficiency.",
  },
  {
    id: 4,
    icon: TrendingUp,
    title: "Capital Efficiency",
    subtitle: "Concentrated Liquidity",
    description:
      "Maximize your returns with concentrated liquidity positions that put your capital to work exactly where it's needed most.",
  },
];

const HowItWorks = () => {
  const [activeFeature, setActiveFeature] = useState<number>(1);
  const activeData = features.find((f) => f.id === activeFeature);

  // Calculate progress percentage
  const progressPercent = (activeFeature / features.length) * 100;

  return (
    <section id="how-it-works" className="py-20 md:py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-5"
          style={{
            background: "radial-gradient(circle, hsl(24, 100%, 50%) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            How <span className="text-primary">LiquidDEX</span> Works
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Revolutionary <span className="text-primary">AMM mechanism</span> using orbital dynamics
            and liquid metal efficiency for optimal capital utilization
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-10 md:mb-12">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-orange-light transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 md:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = feature.id === activeFeature;

            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`feature-card text-left transition-all duration-300 ${
                  isActive
                    ? "border-primary/50 orange-glow-subtle"
                    : "border-border hover:border-primary/20"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-300 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    0{feature.id}
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Active Feature Detail */}
        {activeData && (
          <div 
            key={activeData.id}
            className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center orange-glow-subtle flex-shrink-0">
                <activeData.icon className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{activeData.title}</h3>
                <p className="text-primary font-medium mb-3 md:mb-4">{activeData.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{activeData.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HowItWorks;
