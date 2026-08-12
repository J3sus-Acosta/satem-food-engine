import type { ReportTemplateDTO, ReportTemplateConfiguration } from '@/types'

export interface CreateReportTemplateInput {
  organizationId: string
  locationId?: string | null
  userId: string
  name: string
  description?: string | null
  reportType?: string
  isShared?: boolean
  configuration: ReportTemplateConfiguration
}

export interface UpdateReportTemplateInput {
  name?: string
  description?: string | null
  isShared?: boolean
  configuration?: ReportTemplateConfiguration
}

export interface IReportTemplateRepository {
  findTemplates(organizationId: string, userId: string): Promise<ReportTemplateDTO[]>
  findById(id: string): Promise<ReportTemplateDTO | null>
  create(data: CreateReportTemplateInput): Promise<ReportTemplateDTO>
  update(id: string, data: UpdateReportTemplateInput): Promise<ReportTemplateDTO>
  delete(id: string): Promise<boolean>
}
