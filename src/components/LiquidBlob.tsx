const LiquidBlob = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main liquid metal blob */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2">
        <div 
          className="w-[500px] h-[500px] opacity-20 dark:opacity-20 animate-liquid"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, 
              hsl(24, 100%, 50%) 0%, 
              hsl(24, 80%, 70%) 40%, 
              transparent 70%)`,
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Secondary chrome blob */}
      <div 
        className="absolute top-2/3 right-1/4 translate-x-1/2"
        style={{ animationDelay: "2s" }}
      >
        <div 
          className="w-[400px] h-[400px] opacity-10 dark:opacity-10 animate-liquid"
          style={{
            background: `radial-gradient(ellipse at 70% 70%, 
              hsl(220, 20%, 60%) 0%, 
              hsl(220, 15%, 80%) 50%, 
              transparent 70%)`,
            filter: "blur(60px)",
            animationDelay: "1.5s",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute top-1/4 right-1/3 w-2 h-2 rounded-full bg-primary/40 animate-float" style={{ animationDelay: "0s" }} />
      <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 rounded-full bg-chrome/30 animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-2/3 left-1/4 w-1 h-1 rounded-full bg-chrome/40 animate-float" style={{ animationDelay: "0.5s" }} />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(220, 15%, 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(220, 15%, 50%) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
};

export default LiquidBlob;
