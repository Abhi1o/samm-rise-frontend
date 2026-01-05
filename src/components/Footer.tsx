import { Github, Twitter, MessageCircle } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-glass-border py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-light flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-lg">Ω</span>
              </div>
            <span className="font-bold text-xl">
              <span className="text-foreground">SAMM</span>
              <span className="text-primary"> DEX</span>
            </span>
            </div>
            <p className="text-muted-foreground text-sm">
              The next generation decentralized exchange with liquid metal precision trading.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Protocol</h4>
            <ul className="space-y-2">
              <li>
                <a href="#swap" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Swap
                </a>
              </li>
              <li>
                <a href="#pools" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Liquidity Pools
                </a>
              </li>
              <li>
                <a href="#stake" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Stake
                </a>
              </li>
              <li>
                <a href="#analytics" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#audit" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Security Audits
                </a>
              </li>
              <li>
                <a href="#whitepaper" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Whitepaper
                </a>
              </li>
              <li>
                <a href="#brand" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Brand Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Community</h4>
            <div className="flex gap-3">
              <a
                href="#twitter"
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#discord"
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#github"
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} SAMM DEX. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
