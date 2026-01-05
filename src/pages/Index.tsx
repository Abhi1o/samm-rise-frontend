import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SAMM - Trade with GigaGas Speed</title>
        <meta
          name="description"
          content="The First Dynamically Sharded AMM. Trade with GigaGas speed on SAMM."
        />
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
