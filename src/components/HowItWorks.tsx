import { useState } from "react";
import { Network, Shield, Sparkles, Coins } from "lucide-react";

const features = [
  {
    id: 1,
    icon: Network,
    title: "Dynamic Sharding",
    subtitle: "Horizontal Scaling",
    description:
      "Horizontal scaling boosts AMM throughput without wasting liquidity.",
  },
  {
    id: 2,
    icon: Shield,
    title: "Fair Sequencing",
    subtitle: "Batch Execution",
    description:
      "Batch execution cuts MEV, front-running, and sandwich risk.",
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Marginal Price Optimization",
    subtitle: "Cross-Shard Price Sync",
    description:
      "Cross-shard price sync keeps execution consistent.",
  },
  {
    id: 4,
    icon: Coins,
    title: "Liquidity-Aware Fees",
    subtitle: "Adaptive Incentives",
    description:
      "Adaptive incentives rebalance liquidity and improve LP yield.",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 md:mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = feature.id === activeFeature;

            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`group text-left transition-all duration-300 relative ${
                  isActive ? "scale-105" : "hover:scale-102"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card container */}
                <div className={`glass-card rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? "border-primary/50 orange-glow-subtle"
                    : "border-border hover:border-primary/30"
                }`}>
                  {/* Orange gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-light/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                  
                  {/* Animated border glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-primary to-orange-light opacity-0 ${isActive ? 'opacity-10' : 'group-hover:opacity-10'} blur-xl transition-opacity duration-300 rounded-2xl`} />
                  
                  {/* Large number INSIDE the box, bottom-right corner with ultra-low opacity */}
                  <div 
                    className={`absolute -bottom-4 -right-3 text-[7rem] font-black leading-none pointer-events-none transition-all duration-500 select-none ${
                      isActive 
                        ? 'text-primary/[0.08]' 
                        : 'text-foreground/[0.02] group-hover:text-primary/[0.04]'
                    }`}
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontWeight: 900,
                      textShadow: isActive 
                        ? '0 0 40px hsla(24, 100%, 50%, 0.1)' 
                        : 'none'
                    }}
                  >
                    {feature.id}
                  </div>
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-primary to-orange-light text-white shadow-lg"
                          : "bg-secondary text-muted-foreground group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-orange-light group-hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    </div>

                    {/* Content */}
                    <h3 className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                      isActive ? 'text-foreground' : 'text-foreground group-hover:text-primary'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground transition-colors duration-300">
                      {feature.subtitle}
                    </p>

                    {/* Mobile-only expanded description */}
                    <div 
                      className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
                        isActive ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                      }`}
                    >
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Feature Detail - Desktop/Tablet only */}
        {activeData && (
          <div 
            key={activeData.id}
            className="hidden lg:block glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-3xl mx-auto relative overflow-hidden"
          >
            {/* Animated orange gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-light/5" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary to-orange-light opacity-10 blur-3xl rounded-full" />
            
            <div className="flex flex-col sm:flex-row items-start gap-4 relative z-10">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-orange-light flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-slow">
                <activeData.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
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
