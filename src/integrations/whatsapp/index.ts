import 'server-only'

import { NotImplementedError } from '@/lib/errors'

export interface WhatsAppMessagePayload {
  to: string
  type: 'text' | 'template' | 'interactive'
  text?: { body: string }
  template?: Record<string, unknown>
  interactive?: Record<string, unknown>
}

/**
 * Integration service for WhatsApp Cloud API.
 *
 * Responsibilities:
 * - Abstracting template messages, text messages, and interactive components.
 * - Handling media uploads/downloads (images, audio).
 */
export class WhatsAppIntegration {
  /**
   * Sends a message payload to a WhatsApp phone number.
   */
  async sendMessage(
    phoneNumberId: string,
    accessToken: string,
    payload: WhatsAppMessagePayload
  ): Promise<void> {
    throw new NotImplementedError('WhatsAppIntegration.sendMessage')
  }
}
