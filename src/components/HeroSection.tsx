import EnhancedSwapCard from "./EnhancedSwapCard";
import LiquidBlob from "./LiquidBlob";

const HeroSection = () => {
  return (
    <section id="swap" className="relative min-h-screen pt-28 pb-16 flex items-center overflow-hidden">
      {/* Background Effects */}
      <LiquidBlob />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side - Text Content */}
          <div className="text-center lg:text-left">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-6 animate-fade-in"
              style={{ animationDelay: "0s" }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">Live on Testnet</span>
            </div>

            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="text-foreground">Trade with</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-light to-primary">
                GigaGas
              </span>
              <br />
              <span className="text-foreground">Speed</span>
            </h1>

            <p 
              className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              The First Dynamically Sharded AMM
            </p>

            <div 
              className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xl md:text-2xl font-bold text-foreground font-mono">$2.4B+</span>
                <span className="text-xs md:text-sm text-muted-foreground">Total Volume</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xl md:text-2xl font-bold text-foreground font-mono">50K+</span>
                <span className="text-xs md:text-sm text-muted-foreground">Users</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xl md:text-2xl font-bold text-primary font-mono">0.01%</span>
                <span className="text-xs md:text-sm text-muted-foreground">Avg Slippage</span>
              </div>
            </div>
          </div>

          {/* Right Side - Swap Card */}
          <div 
            className="animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <EnhancedSwapCard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
