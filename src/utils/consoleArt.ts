/**
 * Console Art & Production Console Management
 * Displays branded ASCII art and useful information in production console
 * Removes/redirects console logs in production for security and performance
 */

export const initProductionConsole = () => {
  const isDev = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    // Display branded console art
    displayConsoleBranding();

    // Override console methods in production
    overrideConsoleMethods();
  }
};

const displayConsoleBranding = () => {
  // SAMM ASCII Art Logo
  const logo = `
  ███████╗ █████╗ ███╗   ███╗███╗   ███╗
  ██╔════╝██╔══██╗████╗ ████║████╗ ████║
  ███████╗███████║██╔████╔██║██╔████╔██║
  ╚════██║██╔══██║██║╚██╔╝██║██║╚██╔╝██║
  ███████║██║  ██║██║ ╚═╝ ██║██║ ╚═╝ ██║
  ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝     ╚═╝
  `;

  const styles = {
    logo: 'color: #FF6B00; font-weight: bold; font-size: 12px; font-family: monospace;',
    title: 'color: #FF6B00; font-weight: bold; font-size: 16px;',
    subtitle: 'color: #888; font-size: 12px;',
    link: 'color: #4A9EFF; font-size: 12px;',
    warning: 'color: #FF4444; font-weight: bold; font-size: 14px; background: #FFF3CD; padding: 4px 8px;',
    info: 'color: #666; font-size: 11px;',
  };

  // Clear console first
  console.clear();

  // Display logo
  console.log('%c' + logo, styles.logo);

  // Display title
  console.log('%c🚀 SAMM DEX - Dynamically Sharded AMM', styles.title);
  console.log('%cThe First Dynamically Sharded Automated Market Maker', styles.subtitle);
  console.log('');

  // Security warning
  console.log(
    '%c⚠️ SECURITY WARNING',
    styles.warning
  );
  console.log(
    '%c🛑 Stop! This is a browser feature intended for developers.',
    'color: #FF4444; font-size: 13px; font-weight: bold;'
  );
  console.log(
    '%cIf someone told you to copy/paste something here, it is a scam and will give them access to your wallet!',
    'color: #FF4444; font-size: 12px;'
  );
  console.log('');

  console.log('%c─'.repeat(60), 'color: #333;');
  console.log('');
  console.log(
    '%c💻 Developer? Type __SAMM_DEBUG__.enable() to see all logs',
    'color: #4A9EFF; font-size: 11px; font-style: italic;'
  );
};

const overrideConsoleMethods = () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  // Create no-op function
  const noop = () => {};

  // Completely suppress all console methods in production
  console.error = noop;
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;

  // Add custom method for developers who want to see logs
  (window as any).__SAMM_DEBUG__ = {
    enable: () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      originalConsole.log('%c🔓 Debug mode enabled!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
      originalConsole.log('%cAll console methods are now active.', 'color: #666; font-size: 12px;');
    },
    disable: () => {
      console.error = noop;
      console.log = noop;
      console.info = noop;
      console.debug = noop;
      console.warn = noop;
      originalConsole.log('%c🔒 Debug mode disabled!', 'color: #FF6B00; font-weight: bold; font-size: 14px;');
    },
  };
};

// Export for use in main.tsx
export default initProductionConsole;
