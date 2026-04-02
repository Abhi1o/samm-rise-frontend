/**
 * Console Art & Production Console Management
 * Displays branded ASCII art and useful information in production console
 * Removes/redirects console logs in production for security and performance
 * 
 * NOTE: Browser network errors (CORS, XMLHttpRequest) are logged by the browser's
 * network layer and cannot be fully suppressed via JavaScript. Users can filter
 * these in DevTools using the console filter or by hiding network messages.
 */

export const initProductionConsole = () => {
  const isDev = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    // Store original console methods FIRST
    const originalConsole = storeOriginalConsole();
    
    // Suppress ALL error events at window level
    suppressAllErrors();
    
    // Override ALL console methods
    overrideAllConsoleMethods(originalConsole);

    // Display branded console art using original methods
    displayConsoleBranding(originalConsole);
  }
};

const storeOriginalConsole = () => {
  return {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
    trace: console.trace.bind(console),
    table: console.table.bind(console),
    group: console.group.bind(console),
    groupCollapsed: console.groupCollapsed.bind(console),
    groupEnd: console.groupEnd.bind(console),
    dir: console.dir.bind(console),
    dirxml: console.dirxml.bind(console),
    assert: console.assert.bind(console),
    clear: console.clear.bind(console),
  };
};

const suppressAllErrors = () => {
  // Suppress window.onerror (catches runtime errors)
  window.onerror = function() {
    return true; // Returning true prevents the error from being logged
  };

  // Suppress unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }, true);

  // Suppress all error events
  window.addEventListener('error', (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }, true);

  // Suppress rejectionhandled events
  window.addEventListener('rejectionhandled', (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }, true);
};

const overrideAllConsoleMethods = (originalConsole: any) => {
  // Create no-op function
  const noop = () => {};

  // Override ALL console methods
  console.log = noop;
  console.warn = noop;
  console.error = noop;
  console.info = noop;
  console.debug = noop;
  console.trace = noop;
  console.table = noop;
  console.group = noop;
  console.groupCollapsed = noop;
  console.groupEnd = noop;
  console.dir = noop;
  console.dirxml = noop;
  console.assert = noop;
  console.count = noop;
  console.countReset = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.timeLog = noop;
  console.profile = noop;
  console.profileEnd = noop;

  // Expose debug toggle for developers
  (window as any).__SAMM_DEBUG__ = {
    enable: () => {
      Object.assign(console, originalConsole);
      originalConsole.log('%c🔓 Debug mode enabled!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
      originalConsole.log('%cAll console methods are now active.', 'color: #666; font-size: 12px;');
      originalConsole.log('%cNote: Browser network errors cannot be suppressed via JavaScript.', 'color: #888; font-size: 11px;');
    },
    disable: () => {
      overrideAllConsoleMethods(originalConsole);
      originalConsole.log('%c🔒 Debug mode disabled!', 'color: #FF6B00; font-weight: bold; font-size: 14px;');
    },
    originalConsole,
  };
};

const displayConsoleBranding = (originalConsole: any) => {
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
    warning: 'color: #FF4444; font-weight: bold; font-size: 14px; background: #FFF3CD; padding: 4px 8px;',
    debug: 'color: #4A9EFF; font-size: 11px; font-style: italic;',
  };

  // Clear console first
  originalConsole.clear();

  // Display logo
  originalConsole.log('%c' + logo, styles.logo);

  // Display title
  originalConsole.log('%c🚀 SAMM DEX - Dynamically Sharded AMM', styles.title);
  originalConsole.log('%cThe First Dynamically Sharded Automated Market Maker', styles.subtitle);
  originalConsole.log('');

  // Security warning
  originalConsole.log('%c⚠️ SECURITY WARNING', styles.warning);
  originalConsole.log(
    '%c🛑 Stop! This is a browser feature intended for developers.',
    'color: #FF4444; font-size: 13px; font-weight: bold;'
  );
  originalConsole.log(
    '%cIf someone told you to copy/paste something here, it is a scam and will give them access to your wallet!',
    'color: #FF4444; font-size: 12px;'
  );
  originalConsole.log('');

  originalConsole.log('%c─'.repeat(60), 'color: #333;');
  originalConsole.log('');
  originalConsole.log(
    '%c💻 Developer? Type __SAMM_DEBUG__.enable() to see all logs',
    styles.debug
  );
};

// Export for use in main.tsx
export default initProductionConsole;
