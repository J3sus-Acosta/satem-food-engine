import 'server-only'

import { NotImplementedError } from '@/lib/errors'

/**
 * Interface representing n8n payload structure.
 */
export interface N8nTriggerPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

/**
 * Integration service for n8n webhook triggers.
 *
 * Responsibilities:
 * - Sending webhooks to configured n8n workflows.
 * - Abstracting connection details (headers, auth keys).
 */
export class N8nIntegration {
  /**
   * Triggers an n8n workflow by its webhook URL.
   */
  async triggerWorkflow(
    webhookUrl: string,
    payload: N8nTriggerPayload
  ): Promise<Record<string, unknown>> {
    throw new NotImplementedError('N8nIntegration.triggerWorkflow')
  }
}
