import 'server-only'

import { NotImplementedError } from '@/lib/errors'

export interface GeocodingResult {
  lat: number
  lng: number
  formattedAddress: string
}

/**
 * Integration service for Google APIs (Maps, Business Profile, Place API).
 *
 * Responsibilities:
 * - Address validation and geocoding.
 * - Distance calculation for delivery fees.
 */
export class GoogleIntegration {
  /**
   * Translates a text address into geographic coordinates.
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    throw new NotImplementedError('GoogleIntegration.geocodeAddress')
  }

  /**
   * Calculates driving distance and duration between two coordinates.
   */
  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distanceMeters: number; durationSeconds: number }> {
    throw new NotImplementedError('GoogleIntegration.calculateDistance')
  }
}
