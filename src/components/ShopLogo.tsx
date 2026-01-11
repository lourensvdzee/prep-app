interface ShopLogoProps {
  shop: string
  size?: number
}

const SHOP_COLORS: Record<string, string> = {
  edeka: '#fff100',
  denns: '#8bc34a',
  rewe: '#cc0000',
  aldi: '#00457c',
  lidl: '#0050aa',
  dm: '#008fd7',
  rossmann: '#c8102e',
}

const SHOP_BACKGROUNDS: Record<string, string> = {
  edeka: '#1a428a',
  denns: '#2e7d32',
  rewe: '#ffffff',
  aldi: '#ffffff',
  lidl: '#fff100',
  dm: '#ffffff',
  rossmann: '#ffffff',
}

export function ShopLogo({ shop, size = 24 }: ShopLogoProps) {
  const shopLower = shop.toLowerCase()
  const color = SHOP_COLORS[shopLower] || '#888'
  const bg = SHOP_BACKGROUNDS[shopLower] || '#333'
  const initial = shop.charAt(0).toUpperCase()

  // SVG logos for known shops
  if (shopLower === 'edeka') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#1a428a" rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill="#fff100" fontSize="16" fontWeight="bold" fontFamily="Arial">E</text>
      </svg>
    )
  }

  if (shopLower === 'denns' || shopLower === "denn's") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#2e7d32" rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial">D</text>
      </svg>
    )
  }

  if (shopLower === 'rewe') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#cc0000" rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial">R</text>
      </svg>
    )
  }

  if (shopLower === 'aldi') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#00457c" rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial">A</text>
      </svg>
    )
  }

  if (shopLower === 'lidl') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#0050aa" rx="4"/>
        <rect x="4" y="4" width="24" height="24" fill="#fff100" rx="2"/>
        <text x="16" y="22" textAnchor="middle" fill="#0050aa" fontSize="14" fontWeight="bold" fontFamily="Arial">L</text>
      </svg>
    )
  }

  if (shopLower === 'dm') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#008fd7" rx="4"/>
        <text x="16" y="21" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="Arial">dm</text>
      </svg>
    )
  }

  if (shopLower === 'rossmann') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
        <rect width="32" height="32" fill="#c8102e" rx="4"/>
        <text x="16" y="22" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Arial">R</text>
      </svg>
    )
  }

  // Generic logo for unknown shops
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ borderRadius: 4 }}>
      <rect width="32" height="32" fill={bg} rx="4"/>
      <text x="16" y="22" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="Arial">{initial}</text>
    </svg>
  )
}
