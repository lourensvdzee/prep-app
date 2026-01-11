interface ShopLogoProps {
  shop: string
  size?: number
}

// Mapping from shop names to their logo file paths
const SHOP_LOGOS: Record<string, string> = {
  'edeka': '/retailer-logos/logo_edeka.png',
  'rewe': '/retailer-logos/rewe_logo.png',
  'denns': '/retailer-logos/logo_denns.png',
  "denn's": '/retailer-logos/logo_denns.png',
  'aldi': '/retailer-logos/logo_aldi.png',
  'penny': '/retailer-logos/penny_logo.svg',
  'netto': '/retailer-logos/logo_netto.png',
  'kaufland': '/retailer-logos/logo_kaufland.png',
  'biocompany': '/retailer-logos/logo_biocompany.png',
  'bio company': '/retailer-logos/logo_biocompany.png',
  'plus': '/retailer-logos/logo_plus.png',
  'albert heijn': '/retailer-logos/albert_heijn_logo.png',
  'ah': '/retailer-logos/albert_heijn_logo.png',
  'jumbo': '/retailer-logos/jumbo_logo.png',
}

// Fallback colors for generic logo
const SHOP_COLORS: Record<string, { bg: string; text: string }> = {
  lidl: { bg: '#0050aa', text: '#fff100' },
  dm: { bg: '#008fd7', text: '#ffffff' },
  rossmann: { bg: '#c8102e', text: '#ffffff' },
}

export function ShopLogo({ shop, size = 24 }: ShopLogoProps) {
  const shopLower = shop.toLowerCase()
  const logoPath = SHOP_LOGOS[shopLower]

  // Use actual logo image if available
  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt={shop}
        width={size}
        height={size}
        style={{
          borderRadius: 4,
          objectFit: 'contain',
          backgroundColor: '#fff'
        }}
      />
    )
  }

  // Fallback to SVG for shops with known colors
  const colors = SHOP_COLORS[shopLower]
  if (colors) {
    const initial = shop.charAt(0).toUpperCase()
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill={colors.bg} rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill={colors.text} fontSize="16" fontWeight="bold" fontFamily="Arial">{initial}</text>
      </svg>
    )
  }

  // Generic logo for unknown shops
  const initial = shop.charAt(0).toUpperCase()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
      <rect width="32" height="32" fill="#333" rx="4"/>
      <text x="16" y="22" textAnchor="middle" fill="#888" fontSize="16" fontWeight="bold" fontFamily="Arial">{initial}</text>
    </svg>
  )
}
