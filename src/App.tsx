import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider, useTheme } from "next-themes";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/config/web3";
import { getRainbowKitTheme } from "@/config/rainbowkit-theme";
import { riseChain } from "@/config/chains";
import { NetworkProvider } from "@/contexts/NetworkContext";
import Index from "./pages/Index";
import Pools from "./pages/Pools";
import Portfolio from "./pages/Portfolio";
import TransactionHistory from "./pages/TransactionHistory";
import NotFound from "./pages/NotFound";

import "@rainbow-me/rainbowkit/styles.css";

// Configure react-query for wagmi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Inner component to access theme
const RainbowKitWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "system";

  return (
    <RainbowKitProvider
      theme={getRainbowKitTheme(isDark)}
      initialChain={riseChain}
    >
      {children}
    </RainbowKitProvider>
  );
};

const App = () => (
  <HelmetProvider>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <RainbowKitWrapper>
            <NetworkProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/pools" element={<Pools />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/history" element={<TransactionHistory />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </NetworkProvider>
          </RainbowKitWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </HelmetProvider>
);

export default App;
