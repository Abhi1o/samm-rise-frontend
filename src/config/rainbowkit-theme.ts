import { Theme } from '@rainbow-me/rainbowkit';

/**
 * Custom RainbowKit theme matching SAMM's liquid metal design
 */
export const customRainbowKitTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: 'hsl(24, 100%, 50%)', // Primary orange
    accentColorForeground: 'hsl(0, 0%, 100%)',
    actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
    actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
    actionButtonSecondaryBackground: 'rgba(255, 255, 255, 0.05)',
    closeButton: 'rgba(255, 255, 255, 0.6)',
    closeButtonBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonBackground: 'hsl(240, 10%, 8%)',
    connectButtonBackgroundError: 'hsl(0, 100%, 50%)',
    connectButtonInnerBackground: 'hsl(240, 10%, 12%)',
    connectButtonText: 'hsl(0, 0%, 100%)',
    connectButtonTextError: 'hsl(0, 0%, 100%)',
    connectionIndicator: 'hsl(120, 100%, 50%)',
    downloadBottomCardBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4))',
    downloadTopCardBackground: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
    error: 'hsl(0, 100%, 50%)',
    generalBorder: 'rgba(255, 255, 255, 0.1)',
    generalBorderDim: 'rgba(255, 255, 255, 0.05)',
    menuItemBackground: 'rgba(255, 255, 255, 0.05)',
    modalBackdrop: 'rgba(0, 0, 0, 0.7)',
    modalBackground: 'hsl(240, 10%, 8%)',
    modalBorder: 'rgba(255, 255, 255, 0.1)',
    modalText: 'hsl(0, 0%, 100%)',
    modalTextDim: 'hsl(0, 0%, 60%)',
    modalTextSecondary: 'hsl(0, 0%, 70%)',
    profileAction: 'rgba(255, 255, 255, 0.05)',
    profileActionHover: 'rgba(255, 255, 255, 0.1)',
    profileForeground: 'rgba(0, 0, 0, 0.03)',
    selectedOptionBorder: 'hsl(24, 100%, 50%)',
    standby: 'hsl(50, 100%, 50%)',
  },
  fonts: {
    body: 'Outfit, system-ui, sans-serif',
  },
  radii: {
    actionButton: '12px',
    connectButton: '12px',
    menuButton: '12px',
    modal: '24px',
    modalMobile: '24px',
  },
  shadows: {
    connectButton: '0 4px 12px rgba(255, 107, 0, 0.15)',
    dialog: '0 20px 60px rgba(0, 0, 0, 0.5)',
    profileDetailsAction: '0 2px 6px rgba(0, 0, 0, 0.2)',
    selectedOption: '0 0 0 2px hsl(24, 100%, 50%)',
    selectedWallet: '0 0 0 2px hsl(24, 100%, 50%)',
    walletLogo: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
};

/**
 * Get theme based on current theme mode
 */
export function getRainbowKitTheme(isDark: boolean): Theme {
  if (!isDark) {
    // Light mode overrides
    return {
      ...customRainbowKitTheme,
      colors: {
        ...customRainbowKitTheme.colors,
        modalBackground: 'hsl(0, 0%, 98%)',
        modalText: 'hsl(0, 0%, 10%)',
        modalTextDim: 'hsl(0, 0%, 40%)',
        modalTextSecondary: 'hsl(0, 0%, 30%)',
        connectButtonBackground: 'hsl(0, 0%, 100%)',
        connectButtonInnerBackground: 'hsl(0, 0%, 95%)',
        connectButtonText: 'hsl(0, 0%, 10%)',
        closeButton: 'rgba(0, 0, 0, 0.6)',
        closeButtonBackground: 'rgba(0, 0, 0, 0.05)',
        menuItemBackground: 'rgba(0, 0, 0, 0.03)',
        profileAction: 'rgba(0, 0, 0, 0.03)',
        profileActionHover: 'rgba(0, 0, 0, 0.06)',
        generalBorder: 'rgba(0, 0, 0, 0.1)',
        generalBorderDim: 'rgba(0, 0, 0, 0.05)',
      },
    };
  }

  return customRainbowKitTheme;
}
