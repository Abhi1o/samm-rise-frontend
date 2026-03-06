import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>SAMM DEX | Sharded AMM — Trade on RiseChain with GigaGas Speed</title>
        <meta name="description" content="Trade crypto with ultra-low slippage on SAMM, the first Dynamically Sharded AMM built on RiseChain. Swap tokens, provide liquidity, and earn trading fees at GigaGas speed." />
        <meta name="keywords" content="SAMM, SAMM DEX, SAMM protocol, DEX, decentralized exchange, DeFi, AMM, sharded AMM, dynamically sharded AMM, RiseChain, RiseChain DEX, RISE DEX, swap crypto, token swap, liquidity pools, liquidity provider, LP tokens, yield farming, earn trading fees, Web3 trading, GigaGas, automated market maker, low slippage, no KYC swap, permissionless DEX, on-chain swap, USDC USDT WETH swap, crypto exchange" />
        <meta name="author" content="SAMM Protocol" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://samm.one/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content="SAMM DEX | Sharded AMM — Trade on RiseChain" />
        <meta property="og:description" content="Trade crypto with ultra-low slippage on SAMM, the first Dynamically Sharded AMM on RiseChain. Swap tokens and earn fees at GigaGas speed." />
        <meta property="og:url" content="https://samm.one/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SAMM DEX" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SAMM DEX | Sharded AMM on RiseChain" />
        <meta name="twitter:description" content="Swap tokens, provide liquidity, and earn trading fees on the first Dynamically Sharded AMM on RiseChain." />
        <meta name="twitter:site" content="@SAMMProtocol" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
      </Helmet>

      <div className="relative min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <HowItWorks />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
