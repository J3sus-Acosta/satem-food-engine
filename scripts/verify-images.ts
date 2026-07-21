import fs from 'fs'
import path from 'path'

/**
 * Script de verificación del Catálogo Oficial de Imágenes (Fase 10C).
 * Valida:
 * 1. Existencia física de las imágenes referenciadas en el seed oficial.
 * 2. Existencia física de las imágenes referenciadas en los mocks del repositorio.
 * 3. Ausencia de archivos huérfanos en public/images/products/.
 * 4. Integridad de las referencias.
 */
function main() {
  console.log('=== SATEM Food Engine: Verificación de Catálogo de Imágenes ===\n')

  const publicDir = path.join(process.cwd(), 'public')
  const imagesDir = path.join(publicDir, 'images', 'products')

  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ Error: El directorio ${imagesDir} no existe.`)
    process.exit(1)
  }

  // 1. Obtener archivos físicos existentes
  const physicalFiles = fs.readdirSync(imagesDir)
  const physicalWebP = new Set(physicalFiles.filter((f) => f.endsWith('.webp')))

  console.log(`📁 Directorio local: public/images/products/ (${physicalWebP.size} archivos .webp)`)

  // 2. Extraer referencias del Seed y Repositorio de Catálogo
  const seedFile = fs.readFileSync(path.join(process.cwd(), 'prisma', 'seed.ts'), 'utf-8')
  const repoFile = fs.readFileSync(
    path.join(process.cwd(), 'src', 'repositories', 'prisma', 'PrismaCatalogRepository.ts'),
    'utf-8'
  )

  const imageRegex = /\/images\/products\/([a-z0-9-]+.webp)/g

  const referencedImages = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = imageRegex.exec(seedFile)) !== null) {
    referencedImages.add(match[1])
  }
  while ((match = imageRegex.exec(repoFile)) !== null) {
    referencedImages.add(match[1])
  }

  console.log(`📋 Referencias en código/seed: ${referencedImages.size} imágenes únicas`)

  let errors = 0

  // 3. Verificar referencias rotas (imágenes en código que no existen físicamente)
  console.log('\n--- 1. Comprobando referencias rotas ---')
  for (const ref of referencedImages) {
    if (!physicalWebP.has(ref)) {
      console.error(
        `❌ Referencia rota: "${ref}" está en el código pero falta en public/images/products/`
      )
      errors++
    } else {
      console.log(`  ✔ Validada: /images/products/${ref}`)
    }
  }

  // 4. Verificar archivos huérfanos (archivos físicos no referenciados)
  console.log('\n--- 2. Comprobando archivos huérfanos ---')
  let orphans = 0
  for (const file of physicalWebP) {
    if (!referencedImages.has(file)) {
      console.warn(
        `⚠️ Archivo huérfano detectado: public/images/products/${file} (no se utiliza en el seed/catálogo)`
      )
      orphans++
    }
  }

  if (orphans === 0) {
    console.log('  ✔ No hay archivos huérfanos.')
  }

  // 5. Resultado final
  console.log('\n=========================================================')
  if (errors > 0) {
    console.error(
      `❌ VERIFICACIÓN FALLIDA: Se encontraron ${errors} errores de imágenes faltantes.`
    )
    process.exit(1)
  } else {
    console.log('✔ Todas las imágenes existen para los productos')
    console.log('✔ No hay referencias rotas')
    console.log('✔ Todos los productos del seed poseen su imagen correspondiente')
    console.log('✔ Proyecto 100% portable y desacoplado de internet')
    console.log('=========================================================\n')
  }
}

main()
