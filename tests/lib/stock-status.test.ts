import { describe, it, expect } from 'vitest'
import { getStockVisualStatus, getStockCardBgClass } from '@/lib/stock-status'

describe('Stock Visual Status Utility', () => {
  it('debe retornar NORMAL cuando el stock es null, undefined o >= 15', () => {
    expect(getStockVisualStatus(null)).toBe('NORMAL')
    expect(getStockVisualStatus(undefined)).toBe('NORMAL')
    expect(getStockVisualStatus(15)).toBe('NORMAL')
    expect(getStockVisualStatus(20)).toBe('NORMAL')

    expect(getStockCardBgClass(null)).toBe('bg-card')
    expect(getStockCardBgClass(undefined)).toBe('bg-card')
    expect(getStockCardBgClass(15)).toBe('bg-card')
  })

  it('debe retornar LOW (amarillo) cuando el stock está entre 4 y 14', () => {
    expect(getStockVisualStatus(14)).toBe('LOW')
    expect(getStockVisualStatus(10)).toBe('LOW')
    expect(getStockVisualStatus(4)).toBe('LOW')

    expect(getStockCardBgClass(14)).toBe('bg-amber-200/60 dark:bg-amber-950/50')
    expect(getStockCardBgClass(4)).toBe('bg-amber-200/60 dark:bg-amber-950/50')
  })

  it('debe retornar CRITICAL (rojo) cuando el stock es menor a 4', () => {
    expect(getStockVisualStatus(3)).toBe('CRITICAL')
    expect(getStockVisualStatus(1)).toBe('CRITICAL')
    expect(getStockVisualStatus(0)).toBe('CRITICAL')
    expect(getStockVisualStatus(-1)).toBe('CRITICAL')

    expect(getStockCardBgClass(3)).toBe('bg-red-200/60 dark:bg-red-950/50')
    expect(getStockCardBgClass(0)).toBe('bg-red-200/60 dark:bg-red-950/50')
  })
})
