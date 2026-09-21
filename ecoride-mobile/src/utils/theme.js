export const colors = {
  // Primary brand (Warm Lightish Brown / Mocha Corporate)
  green: '#8C5A3C',         // Main lightish brown primary
  greenHover: '#734427',    // Deep roasted brown hover
  greenLight: '#F7EFE9',    // Soft warm cream-brown tint
  greenBorder: '#E5D3C5',   // Gentle light brown border
  greenText: '#5A3219',     // Rich brown text for badges

  // Explicit brown aliases
  brown: '#8C5A3C',
  brownHover: '#734427',
  brownLight: '#F7EFE9',
  brownBorder: '#E5D3C5',
  brownText: '#5A3219',

  // Canvas / Backgrounds (Warm Light Neutral)
  ink: '#FBF8F5',           // Soft warm creamy-white canvas
  panel: '#FFFFFF',         // Card / Panel background
  panelSoft: '#F4ECE4',     // Soft tinted input & chip background
  panelElevated: '#FFFFFF',
  wash: '#FBF8F5',
  paper: '#FFFFFF',

  // Typography
  text: '#221A15',          // Deep espresso slate text
  textSecondary: '#4F3F35', // Warm dark coffee body text
  muted: '#7A695E',         // Muted brown helper text
  subtle: '#A8978C',        // Subtle placeholder text
  paperText: '#221A15',

  // Borders & Dividers
  line: '#EBE0D6',          // Warm subtle border
  lineDark: '#D9C8B9',      // Medium warm border

  // Status & Accents
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  blueText: '#1D4ED8',

  amber: '#D97706',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
  amberText: '#B45309',

  red: '#DC2626',
  redLight: '#FEF2F2',
  redBorder: '#FECACA',
  redText: '#B91C1C',

  purple: '#7C3AED',
  purpleLight: '#F5F3FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  page: 16,
  lg: 20,
  xl: 24,
  radiusSm: 8,
  radius: 12,
  radiusLg: 16,
  radiusFull: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#221A15',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#221A15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#221A15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
