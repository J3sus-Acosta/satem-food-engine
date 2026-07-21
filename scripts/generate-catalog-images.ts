import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

interface ProductDesign {
  slug: string
  name: string
  category: string
  primaryColor: string
  secondaryColor: string
  detailColor: string
  accentColor?: string
}

const products: ProductDesign[] = [
  // Cafés
  {
    slug: 'espresso',
    name: 'Espresso',
    category: 'espresso',
    primaryColor: '#1A0C0A',
    secondaryColor: '#5C3A21',
    detailColor: '#C88D4B',
  },
  {
    slug: 'americano',
    name: 'Americano',
    category: 'coffee',
    primaryColor: '#2B170E',
    secondaryColor: '#6B4423',
    detailColor: '#A47551',
  },
  {
    slug: 'latte',
    name: 'Latte',
    category: 'latte',
    primaryColor: '#8C5A3C',
    secondaryColor: '#FFF3E0',
    detailColor: '#D4A373',
  },
  {
    slug: 'capuccino',
    name: 'Capuccino',
    category: 'coffee',
    primaryColor: '#6B4423',
    secondaryColor: '#F5E6D3',
    detailColor: '#FFFFFF',
  },
  {
    slug: 'mocaccino',
    name: 'Mocaccino',
    category: 'coffee',
    primaryColor: '#3D1C06',
    secondaryColor: '#8D5B4C',
    detailColor: '#FDFBF7',
  },
  {
    slug: 'chocolate-caliente',
    name: 'Chocolate Caliente',
    category: 'coffee',
    primaryColor: '#301300',
    secondaryColor: '#5C2D0C',
    detailColor: '#FFFFFF',
  },

  // Té
  {
    slug: 'te-verde-organico',
    name: 'Té Verde Orgánico',
    category: 'green-tea',
    primaryColor: '#4A7C29',
    secondaryColor: '#8BC34A',
    detailColor: '#C8E6C9',
  },
  {
    slug: 'te-negro-earl-grey',
    name: 'Té Negro Earl Grey',
    category: 'black-tea',
    primaryColor: '#7B3F00',
    secondaryColor: '#D97706',
    detailColor: '#FDE68A',
  },

  // Jugos
  {
    slug: 'limonada-menta-jengibre',
    name: 'Limonada Menta Jengibre',
    category: 'lemonade',
    primaryColor: '#A3E635',
    secondaryColor: '#4ADE80',
    detailColor: '#ECFDF5',
  },
  {
    slug: 'jugo-natural-naranja',
    name: 'Jugo Natural Naranja',
    category: 'juice',
    primaryColor: '#F97316',
    secondaryColor: '#FB923C',
    detailColor: '#FFEDD5',
  },
  {
    slug: 'jugo-natural-frambuesa',
    name: 'Jugo Natural Frambuesa',
    category: 'raspberry-juice',
    primaryColor: '#BE123C',
    secondaryColor: '#E11D48',
    detailColor: '#FFE4E6',
    accentColor: '#9F1239',
  },

  // Bebidas Frías
  {
    slug: 'agua-mineral-sin-gas',
    name: 'Agua Mineral Sin Gas',
    category: 'water-still',
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    detailColor: '#E0F2FE',
  },
  {
    slug: 'agua-mineral-con-gas',
    name: 'Agua Mineral Con Gas',
    category: 'water-sparkling',
    primaryColor: '#0284C7',
    secondaryColor: '#7DD3FC',
    detailColor: '#F0F9FF',
  },
  {
    slug: 'coca-cola-original',
    name: 'Coca-Cola Original',
    category: 'cola',
    primaryColor: '#DC2626',
    secondaryColor: '#18181B',
    detailColor: '#FECACA',
  },
  {
    slug: 'coca-cola-zero',
    name: 'Coca-Cola Zero',
    category: 'cola-zero',
    primaryColor: '#18181B',
    secondaryColor: '#DC2626',
    detailColor: '#A1A1AA',
  },

  // Sandwiches & Croissants
  {
    slug: 'croissant-sencillo',
    name: 'Croissant Sencillo',
    category: 'croissant',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B',
    detailColor: '#78350F',
  },
  {
    slug: 'croissant-jamon-queso',
    name: 'Croissant Jamón Queso',
    category: 'croissant-filled',
    primaryColor: '#D97706',
    secondaryColor: '#FBBF24',
    detailColor: '#F87171',
  },
  {
    slug: 'sandwich-ave-italiano',
    name: 'Sandwich Ave Italiano',
    category: 'sandwich',
    primaryColor: '#65A30D',
    secondaryColor: '#EF4444',
    detailColor: '#FEF08A',
  },
  {
    slug: 'sandwich-ave-palta',
    name: 'Sandwich Ave Palta',
    category: 'sandwich',
    primaryColor: '#65A30D',
    secondaryColor: '#84CC16',
    detailColor: '#FEF9C3',
  },

  // Paninis
  {
    slug: 'panini-pollo-pesto',
    name: 'Panini Pollo Pesto',
    category: 'panini',
    primaryColor: '#4D7C0F',
    secondaryColor: '#A3E635',
    detailColor: '#E7E5E4',
  },
  {
    slug: 'panini-jamon-queso-mozzarella',
    name: 'Panini Jamón Queso Mozzarella',
    category: 'panini',
    primaryColor: '#F59E0B',
    secondaryColor: '#F87171',
    detailColor: '#FAFAF9',
  },

  // Ensaladas
  {
    slug: 'ensalada-cesar-pollo',
    name: 'Ensalada César Pollo',
    category: 'salad',
    primaryColor: '#4D7C0F',
    secondaryColor: '#FACC15',
    detailColor: '#E7E5E4',
  },
  {
    slug: 'ensalada-mediterranea',
    name: 'Ensalada Mediterránea',
    category: 'salad',
    primaryColor: '#15803D',
    secondaryColor: '#DC2626',
    detailColor: '#1E3A8A',
  },

  // Pastelería & Postres
  {
    slug: 'brownie-fudge-chocolate',
    name: 'Brownie Fudge Chocolate',
    category: 'brownie',
    primaryColor: '#291810',
    secondaryColor: '#4A2A18',
    detailColor: '#78350F',
  },
  {
    slug: 'muffin-arandano',
    name: 'Muffin Arándano',
    category: 'muffin',
    primaryColor: '#581C87',
    secondaryColor: '#D97706',
    detailColor: '#7E22CE',
  },
  {
    slug: 'cookie-chips-de-chocolate',
    name: 'Cookie Chips de Chocolate',
    category: 'cookie',
    primaryColor: '#B45309',
    secondaryColor: '#291810',
    detailColor: '#F59E0B',
  },
  {
    slug: 'cheesecake-frambuesa',
    name: 'Cheesecake Frambuesa',
    category: 'cheesecake',
    primaryColor: '#BE123C',
    secondaryColor: '#FEF3C7',
    detailColor: '#FDA4AF',
  },

  // Mock Items
  {
    slug: 'hamburguesa-clasica',
    name: 'Hamburguesa Clásica',
    category: 'burger',
    primaryColor: '#78350F',
    secondaryColor: '#F59E0B',
    detailColor: '#22C55E',
  },
  {
    slug: 'hamburguesa-italiana',
    name: 'Hamburguesa Italiana',
    category: 'burger',
    primaryColor: '#65A30D',
    secondaryColor: '#EF4444',
    detailColor: '#FEF08A',
  },
  {
    slug: 'papas-fritas',
    name: 'Papas Fritas',
    category: 'fries',
    primaryColor: '#EAB308',
    secondaryColor: '#CA8A04',
    detailColor: '#DC2626',
  },
]

function generateSVG(p: ProductDesign): string {
  return `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Wood Table Surface Base -->
  <rect width="1024" height="1024" fill="#EAD9C2" />

  <!-- Wood Grain Stripes -->
  <rect x="0" y="0" width="1024" height="120" fill="#E2CFB4" opacity="0.5" />
  <rect x="0" y="240" width="1024" height="90" fill="#DFCAAC" opacity="0.4" />
  <rect x="0" y="450" width="1024" height="140" fill="#E5D3B8" opacity="0.6" />
  <rect x="0" y="700" width="1024" height="110" fill="#DCC5A4" opacity="0.5" />
  <rect x="0" y="880" width="1024" height="144" fill="#E2CFB4" opacity="0.4" />

  <!-- Subtle Lighting Vignette Overlay -->
  <circle cx="512" cy="450" r="600" fill="#FFFFFF" opacity="0.18" />

  <!-- Soft Shadow Base -->
  <ellipse cx="512" cy="760" rx="320" ry="90" fill="#3D2919" opacity="0.22" />
  <ellipse cx="512" cy="750" rx="260" ry="70" fill="#291A0E" opacity="0.28" />

  <!-- Center Graphic Element -->
  <g transform="translate(512, 490)">
    ${renderProductGraphic(p)}
  </g>
</svg>
`
}

function renderProductGraphic(p: ProductDesign): string {
  const { category, primaryColor, secondaryColor, detailColor, accentColor = '#9F1239' } = p

  switch (category) {
    case 'espresso':
      return `
        <!-- Espresso Saucer -->
        <ellipse cx="0" cy="140" rx="220" ry="90" fill="#E5E5E5" />
        <ellipse cx="0" cy="135" rx="190" ry="75" fill="#F5F5F5" />
        <!-- Small Demitasse Cup -->
        <path d="M -120,0 C -110,120 110,120 120,0 Z" fill="#FFFFFF" />
        <!-- Handle -->
        <path d="M 115,10 C 165,10 165,70 110,75" fill="none" stroke="#FFFFFF" stroke-width="20" stroke-linecap="round" />
        <!-- Cup Rim -->
        <ellipse cx="0" cy="0" rx="120" ry="55" fill="#EAEAEA" />
        <!-- Deep Espresso Liquid -->
        <ellipse cx="0" cy="0" rx="112" ry="50" fill="${primaryColor}" />
        <!-- Golden Crema Layer -->
        <ellipse cx="-10" cy="-5" rx="85" ry="36" fill="${secondaryColor}" opacity="0.9" />
        <ellipse cx="15" cy="5" rx="50" ry="22" fill="${detailColor}" opacity="0.8" />
        <ellipse cx="-20" cy="-8" rx="25" ry="12" fill="#E6A15C" opacity="0.85" />
      `

    case 'latte':
      return `
        <!-- Tall Glass Saucer -->
        <ellipse cx="0" cy="160" rx="210" ry="80" fill="#EAEAEA" />
        <!-- Glass Cup Body -->
        <path d="M -110,-140 L -90,140 C -80,165 80,165 90,140 L 110,-140 Z" fill="#F0F9FF" opacity="0.8" stroke="#D1E9F6" stroke-width="4" />
        <!-- Bottom Espresso Layer -->
        <path d="M -92,110 L -90,140 C -80,165 80,165 90,140 L 92,110 Z" fill="${primaryColor}" />
        <!-- Milk Layer Middle -->
        <path d="M -102,10 L -92,110 L 92,110 L 102,10 Z" fill="${secondaryColor}" />
        <!-- Coffee Blend Upper Layer -->
        <path d="M -109,-120 L -102,10 L 102,10 L 109,-120 Z" fill="${primaryColor}" opacity="0.85" />
        <!-- Steamed Milk Foam Top -->
        <ellipse cx="0" cy="-120" rx="109" ry="42" fill="#FFFFFF" />
        <!-- Latte Art Foam Leaf -->
        <path d="M 0,-135 C -35,-120 -35,-105 0,-95 C 35,-105 35,-120 0,-135 Z" fill="${detailColor}" opacity="0.9" />
        <path d="M 0,-130 C -20,-118 -20,-108 0,-100 C 20,-108 20,-118 0,-130 Z" fill="#FFFFFF" />
      `

    case 'green-tea':
      return `
        <!-- Teacup Saucer -->
        <ellipse cx="0" cy="130" rx="230" ry="90" fill="#DCEDC8" />
        <ellipse cx="0" cy="122" rx="195" ry="75" fill="#F1F8E9" />
        <!-- Ceramic Teacup Body -->
        <path d="M -130,-10 C -120,110 120,110 130,-10 Z" fill="#FFFFFF" />
        <path d="M 125,0 C 175,0 175,65 120,70" fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" />
        <ellipse cx="0" cy="-10" rx="130" ry="58" fill="#F5F5F5" />
        <!-- Vibrant Green Tea Liquid -->
        <ellipse cx="0" cy="-10" rx="122" ry="52" fill="${primaryColor}" />
        <ellipse cx="8" cy="-6" rx="90" ry="38" fill="${secondaryColor}" opacity="0.85" />
        <!-- Organic Tea Leaves Floating -->
        <path d="M -35,-15 Q -20,-30 0,-15 Q -15,0 -35,-15 Z" fill="#2E7D32" />
        <path d="M 15,-10 Q 30,-25 45,-10 Q 30,5 15,-10 Z" fill="#388E3C" />
      `

    case 'black-tea':
      return `
        <!-- Glass Teacup Saucer -->
        <ellipse cx="0" cy="130" rx="230" ry="90" fill="#FED7AA" />
        <ellipse cx="0" cy="122" rx="195" ry="75" fill="#FFEDD5" />
        <!-- Teacup Body -->
        <path d="M -130,-10 C -120,110 120,110 130,-10 Z" fill="#FFFFFF" />
        <path d="M 125,0 C 175,0 175,65 120,70" fill="none" stroke="#FFFFFF" stroke-width="22" stroke-linecap="round" />
        <ellipse cx="0" cy="-10" rx="130" ry="58" fill="#F5F5F5" />
        <!-- Rich Earl Grey Amber Tea Liquid -->
        <ellipse cx="0" cy="-10" rx="122" ry="52" fill="${primaryColor}" />
        <ellipse cx="10" cy="-6" rx="95" ry="40" fill="${secondaryColor}" opacity="0.85" />
        <!-- Lemon Slice Floating -->
        <circle cx="-30" cy="-10" r="28" fill="${detailColor}" />
        <circle cx="-30" cy="-10" r="21" fill="${secondaryColor}" opacity="0.9" />
      `

    case 'water-still':
      return `
        <!-- Water Tumbler Base Shadow -->
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#BAE6FD" opacity="0.5" />
        <!-- Glass Body -->
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#E0F2FE" opacity="0.75" stroke="#7DD3FC" stroke-width="4" />
        <!-- Pure Water Liquid -->
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" opacity="0.65" />
        <!-- Ice Cubes -->
        <rect x="-45" y="-60" width="50" height="50" rx="8" fill="#FFFFFF" opacity="0.8" transform="rotate(15)" />
        <rect x="5" y="-10" width="45" height="45" rx="8" fill="#FFFFFF" opacity="0.75" transform="rotate(-12)" />
        <!-- Water Surface Ring -->
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" opacity="0.7" />
        <ellipse cx="0" cy="-100" rx="96" ry="30" fill="${detailColor}" opacity="0.9" />
      `

    case 'water-sparkling':
      return `
        <!-- Sparkling Water Tumbler Base -->
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#93C5FD" opacity="0.5" />
        <!-- Glass Body -->
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#F0F9FF" opacity="0.8" stroke="#38BDF8" stroke-width="4" />
        <!-- Sparkling Water Liquid -->
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" opacity="0.7" />
        <!-- Effervescent Bubbles -->
        <circle cx="-35" cy="40" r="7" fill="#FFFFFF" opacity="0.9" />
        <circle cx="-15" cy="-10" r="9" fill="#FFFFFF" opacity="0.9" />
        <circle cx="20" cy="70" r="6" fill="#FFFFFF" opacity="0.8" />
        <circle cx="40" cy="15" r="8" fill="#FFFFFF" opacity="0.85" />
        <circle cx="-40" cy="-40" r="10" fill="#FFFFFF" opacity="0.9" />
        <circle cx="10" cy="-60" r="7" fill="#FFFFFF" opacity="0.95" />
        <!-- Water Surface Ring -->
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" opacity="0.75" />
        <ellipse cx="0" cy="-100" rx="96" ry="30" fill="${detailColor}" opacity="0.9" />
      `

    case 'raspberry-juice':
      return `
        <!-- Glass Base Shadow -->
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#FECDD3" opacity="0.6" />
        <!-- Highball Glass Body -->
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#FFF1F2" opacity="0.8" stroke="#FDA4AF" stroke-width="4" />
        <!-- Rich Berry Pink Raspberry Juice Liquid -->
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" />
        <!-- Liquid Surface -->
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" />
        <!-- Ice Cubes in Smoothie -->
        <rect x="-40" y="-70" width="45" height="45" rx="8" fill="#FFFFFF" opacity="0.75" transform="rotate(10)" />
        <rect x="5" y="-30" width="42" height="42" rx="8" fill="#FFFFFF" opacity="0.7" transform="rotate(-15)" />
        <!-- Fresh Whole Raspberries Floating -->
        <circle cx="-35" cy="-100" r="18" fill="${accentColor}" />
        <circle cx="-32" cy="-103" r="15" fill="${primaryColor}" />
        <circle cx="25" cy="-95" r="20" fill="${accentColor}" />
        <circle cx="28" cy="-98" r="16" fill="${primaryColor}" />
        <!-- Fresh Mint Garnish Leaf -->
        <path d="M -5,-125 Q 15,-140 25,-120 Q 10,-105 -5,-125 Z" fill="#15803D" />
        <path d="M -15,-120 Q -30,-135 -40,-115 Q -25,-105 -15,-120 Z" fill="#22C55E" />
      `

    case 'lemonade':
      return `
        <!-- Glass Base -->
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#ECFDF5" />
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#F0FDF4" opacity="0.8" stroke="#86EFAC" stroke-width="4" />
        <!-- Mint Lemonade Liquid -->
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" />
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" />
        <!-- Lemon Slices & Mint Leaves -->
        <circle cx="-25" cy="-100" r="25" fill="#FACC15" />
        <circle cx="-25" cy="-100" r="19" fill="#FEF08A" />
        <path d="M 15,-115 Q 35,-130 45,-110 Q 30,-95 15,-115 Z" fill="#15803D" />
      `

    case 'juice':
      return `
        <!-- Juice Glass Base -->
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#FFEDD5" />
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#FFF7ED" opacity="0.8" stroke="#FDBA74" stroke-width="4" />
        <!-- Orange Juice Liquid -->
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" />
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" />
        <circle cx="20" cy="-100" r="25" fill="#FED7AA" />
      `

    case 'cola':
    case 'cola-zero':
      return `
        <ellipse cx="0" cy="160" rx="140" ry="50" fill="#E4E4E7" />
        <path d="M -110,-130 L -90,150 C -85,170 85,170 90,150 L 110,-130 Z" fill="#FAFAFA" opacity="0.8" stroke="#D4D4D8" stroke-width="4" />
        <path d="M -106,-100 L -88,146 C -80,164 80,164 88,146 L 106,-100 Z" fill="${primaryColor}" />
        <rect x="-40" y="-60" width="45" height="45" rx="8" fill="#FFFFFF" opacity="0.75" transform="rotate(12)" />
        <ellipse cx="0" cy="-100" rx="106" ry="36" fill="${secondaryColor}" />
      `

    case 'croissant':
    case 'croissant-filled':
      return `
        <!-- Porcelain Plate -->
        <ellipse cx="0" cy="40" rx="280" ry="140" fill="#FAFAFA" stroke="#E5E5E5" stroke-width="6" />
        <ellipse cx="0" cy="30" rx="230" ry="115" fill="#FFFFFF" />
        <!-- Golden Crescent Croissant -->
        <path d="M -160,30 C -120,-80 120,-80 160,30 C 110,65 -110,65 -160,30 Z" fill="${primaryColor}" />
        <path d="M -130,20 C -90,-60 90,-60 130,20 C 80,50 -80,50 -130,20 Z" fill="${secondaryColor}" />
        <!-- Flaky Texture Details -->
        <ellipse cx="0" cy="-15" rx="70" ry="25" fill="${detailColor}" opacity="0.8" />
      `

    case 'sandwich':
    case 'panini':
      return `
        <!-- Plate -->
        <ellipse cx="0" cy="40" rx="300" ry="150" fill="#FAFAFA" stroke="#E5E5E5" stroke-width="6" />
        <ellipse cx="0" cy="30" rx="250" ry="120" fill="#FFFFFF" />
        <!-- Sandwich Bread Top & Bottom -->
        <ellipse cx="0" cy="15" rx="190" ry="90" fill="${primaryColor}" />
        <path d="M -195,20 Q 0,55 195,20 Q 170,65 -170,65 Z" fill="${secondaryColor}" />
        <path d="M -180,5 C -180,-95 180,-95 180,5 Z" fill="${primaryColor}" />
        <ellipse cx="-40" cy="-45" rx="9" ry="5" fill="${detailColor}" />
        <ellipse cx="30" cy="-55" rx="9" ry="5" fill="${detailColor}" />
      `

    case 'salad':
      return `
        <!-- Salad Bowl -->
        <ellipse cx="0" cy="50" rx="280" ry="150" fill="#FFFFFF" stroke="#E5E5E5" stroke-width="6" />
        <ellipse cx="0" cy="20" rx="240" ry="120" fill="${primaryColor}" />
        <circle cx="-70" cy="-10" r="42" fill="${secondaryColor}" />
        <circle cx="50" cy="15" r="38" fill="${secondaryColor}" />
        <circle cx="10" cy="-30" r="32" fill="${detailColor}" />
        <circle cx="-110" cy="20" r="28" fill="${detailColor}" />
      `

    case 'brownie':
      return `
        <ellipse cx="0" cy="40" rx="240" ry="130" fill="#FAFAFA" stroke="#E5E5E5" stroke-width="4" />
        <path d="M -120,20 L -120,-40 L 120,-40 L 120,20 Z" fill="${primaryColor}" />
        <ellipse cx="0" cy="-40" rx="120" ry="45" fill="${secondaryColor}" />
        <circle cx="-30" cy="-35" r="18" fill="${detailColor}" />
        <circle cx="40" cy="-35" r="16" fill="${detailColor}" />
      `

    case 'muffin':
    case 'cookie':
    case 'cheesecake':
    case 'burger':
    case 'fries':
    default:
      return `
        <ellipse cx="0" cy="40" rx="270" ry="140" fill="#FAFAFA" stroke="#E5E5E5" stroke-width="5" />
        <ellipse cx="0" cy="20" rx="210" ry="100" fill="${primaryColor}" />
        <ellipse cx="0" cy="-30" rx="190" ry="85" fill="${secondaryColor}" />
        <circle cx="0" cy="-40" r="30" fill="${detailColor}" />
      `
  }
}

async function main() {
  const outputDir = path.join(process.cwd(), 'public', 'images', 'products')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log(`Generating ${products.length} product images in 1024x1024 WebP format...`)

  for (const product of products) {
    const svg = generateSVG(product)
    const filePath = path.join(outputDir, `${product.slug}.webp`)

    await sharp(Buffer.from(svg)).resize(1024, 1024).webp({ quality: 95 }).toFile(filePath)

    console.log(`✓ Re-created: public/images/products/${product.slug}.webp`)
  }

  console.log('All 30 product WebP images successfully updated and regenerated!')
}

main().catch((err) => {
  console.error('Error generating product images:', err)
  process.exit(1)
})
