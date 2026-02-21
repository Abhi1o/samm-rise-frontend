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
        <link rel="canonical" href="https://samm.one/" />
        <meta property="og:title" content="SAMM DEX | Sharded AMM — Trade on RiseChain" />
        <meta property="og:description" content="Trade crypto with ultra-low slippage on SAMM, the first Dynamically Sharded AMM on RiseChain. Swap tokens and earn fees at GigaGas speed." />
        <meta property="og:url" content="https://samm.one/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="SAMM DEX | Sharded AMM on RiseChain" />
        <meta name="twitter:description" content="Swap tokens, provide liquidity, and earn trading fees on the first Dynamically Sharded AMM on RiseChain." />
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
