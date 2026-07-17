import { describe, it, expect } from 'vitest'
import { validateSheetRows, type SheetRow } from '@/services/menu-sync'

describe('Google Sheets Sync - Validación de Hojas de Cálculo', () => {
  it('debe validar exitosamente filas con formato y datos correctos', () => {
    const validRows: SheetRow[] = [
      {
        Código: 'BUR001',
        Disponible: 'SI',
        Visible: 'SI',
        Precio: '3500',
        Stock: '20',
        Destacado: 'NO',
        Orden: '1',
        Nota: 'En oferta',
      },
      {
        Código: 'PAP001',
        Disponible: 'NO',
        Visible: 'SI',
        Precio: '', // vacío es válido (usa precio base)
        Stock: '', // vacío es válido (stock ilimitado)
        Destacado: 'SI',
        Orden: '',
        Nota: null,
      },
    ]

    const result = validateSheetRows(validRows)

    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('debe rechazar y retornar errores si hay columnas booleanas con valores diferentes a SI o NO', () => {
    const invalidRows: SheetRow[] = [
      {
        Código: 'BUR001',
        Disponible: 'YES', // inválido (debe ser SI/NO)
        Visible: 'SI',
        Precio: 3500,
        Stock: 10,
        Destacado: 'TAL VEZ', // inválido
        Orden: 1,
        Nota: '',
      },
    ]

    const result = validateSheetRows(invalidRows)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0].message).toContain("El campo Disponible debe ser 'SI' o 'NO'")
    expect(result.errors[1].message).toContain("El campo Destacado debe ser 'SI' o 'NO'")
  })

  it('debe rechazar y detectar códigos de producto duplicados en el mismo payload', () => {
    const duplicateRows: SheetRow[] = [
      {
        Código: 'BUR001',
        Disponible: 'SI',
        Visible: 'SI',
        Precio: 3500,
        Stock: 10,
        Destacado: 'NO',
        Orden: 1,
        Nota: '',
      },
      {
        Código: 'BUR001', // duplicado
        Disponible: 'SI',
        Visible: 'SI',
        Precio: 4000,
        Stock: 2,
        Destacado: 'NO',
        Orden: 2,
        Nota: 'Duplicado',
      },
    ]

    const result = validateSheetRows(duplicateRows)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('está duplicado en el archivo')
  })

  it('debe rechazar precios, stocks u órdenes con formatos negativos o no numéricos', () => {
    const invalidNumericRows: SheetRow[] = [
      {
        Código: 'BUR001',
        Disponible: 'SI',
        Visible: 'SI',
        Precio: -150, // negativo inválido
        Stock: 'veinte', // no numérico inválido
        Destacado: 'NO',
        Orden: 1.5, // decimal inválido para orden (debe ser entero)
        Nota: '',
      },
    ]

    const result = validateSheetRows(invalidNumericRows)

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(3)
    expect(result.errors[0].message).toContain('Precio debe ser un número positivo')
    expect(result.errors[1].message).toContain('Stock debe ser un número entero mayor o igual a 0')
    expect(result.errors[2].message).toContain('Orden debe ser un número entero')
  })
})
