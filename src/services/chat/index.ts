import 'server-only'

import { NotImplementedError } from '@/lib/errors'
import type { ICustomerRepository, IOrderRepository } from '@/repositories'
import type { Message, ChannelSession, MessageRole } from '@/types'

/**
 * Service managing chatbot interactions and message handling.
 *
 * Responsibilities:
 * - Processing incoming user messages from WhatsApp/Telegram integrations.
 * - Managing conversation state (ChannelSession).
 * - Generating context-aware responses (future AI/flow orchestrator).
 */
export class ChatService {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  /**
   * Processes a message received from a channel.
   * Finds or creates the ChannelSession and runs it through the state machine.
   */
  async handleIncomingMessage(
    channelId: string,
    externalId: string,
    role: MessageRole,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    throw new NotImplementedError('ChatService.handleIncomingMessage')
  }

  /**
   * Identifies or initializes a chatbot session.
   */
  async findOrCreateSession(channelId: string, externalId: string): Promise<ChannelSession> {
    throw new NotImplementedError('ChatService.findOrCreateSession')
  }

  /**
   * Closes or resolves an active session (e.g. after successful order creation).
   */
  async resolveSession(sessionId: string): Promise<void> {
    throw new NotImplementedError('ChatService.resolveSession')
  }
}
