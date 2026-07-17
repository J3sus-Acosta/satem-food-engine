import 'server-only'

import { NotImplementedError } from '@/lib/errors'

export interface TelegramMessagePayload {
  chatId: string
  text: string
  parseMode?: 'MarkdownV2' | 'HTML'
  replyMarkup?: Record<string, unknown>
}

/**
 * Integration service for Telegram Bot API.
 *
 * Responsibilities:
 * - Sending text and rich messages to chats/users.
 * - Abstracting API calls (sendChatAction, answerCallbackQuery).
 */
export class TelegramIntegration {
  /**
   * Sends a message to a Telegram chat.
   */
  async sendMessage(payload: TelegramMessagePayload): Promise<void> {
    throw new NotImplementedError('TelegramIntegration.sendMessage')
  }

  /**
   * Registers a webhook URL for incoming bot messages.
   */
  async setWebhook(webhookUrl: string): Promise<void> {
    throw new NotImplementedError('TelegramIntegration.setWebhook')
  }
}
