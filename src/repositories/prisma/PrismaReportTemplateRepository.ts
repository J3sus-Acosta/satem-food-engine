import 'server-only'

import { db } from '@/server/db'
import { Prisma } from '@/generated/prisma'
import type {
  IReportTemplateRepository,
  CreateReportTemplateInput,
  UpdateReportTemplateInput,
} from '../interfaces/IReportTemplateRepository'
import type { ReportTemplateDTO, ReportTemplateConfiguration } from '@/types'

export class PrismaReportTemplateRepository implements IReportTemplateRepository {
  async findTemplates(organizationId: string, userId: string): Promise<ReportTemplateDTO[]> {
    const templates = await db.reportTemplate.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { createdAt: 'desc' },
    })

    return templates.map((t) => ({
      id: t.id,
      organizationId: t.organizationId,
      locationId: t.locationId,
      userId: t.userId,
      name: t.name,
      description: t.description,
      reportType: t.reportType,
      isShared: t.isShared,
      configuration: t.configuration as unknown as ReportTemplateConfiguration,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  }

  async findById(id: string): Promise<ReportTemplateDTO | null> {
    const t = await db.reportTemplate.findFirst({
      where: { id, deletedAt: null },
    })

    if (!t) return null

    return {
      id: t.id,
      organizationId: t.organizationId,
      locationId: t.locationId,
      userId: t.userId,
      name: t.name,
      description: t.description,
      reportType: t.reportType,
      isShared: t.isShared,
      configuration: t.configuration as unknown as ReportTemplateConfiguration,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  async create(data: CreateReportTemplateInput): Promise<ReportTemplateDTO> {
    const t = await db.reportTemplate.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId || null,
        userId: data.userId,
        name: data.name,
        description: data.description || null,
        reportType: data.reportType || 'SALES_DETAIL',
        isShared: data.isShared ?? false,
        configuration: data.configuration as unknown as Prisma.InputJsonObject,
      },
    })

    return {
      id: t.id,
      organizationId: t.organizationId,
      locationId: t.locationId,
      userId: t.userId,
      name: t.name,
      description: t.description,
      reportType: t.reportType,
      isShared: t.isShared,
      configuration: t.configuration as unknown as ReportTemplateConfiguration,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  async update(id: string, data: UpdateReportTemplateInput): Promise<ReportTemplateDTO> {
    const updateData: Prisma.ReportTemplateUpdateInput = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.isShared !== undefined) updateData.isShared = data.isShared
    if (data.configuration !== undefined) {
      updateData.configuration = data.configuration as unknown as Prisma.InputJsonObject
    }

    const t = await db.reportTemplate.update({
      where: { id },
      data: updateData,
    })

    return {
      id: t.id,
      organizationId: t.organizationId,
      locationId: t.locationId,
      userId: t.userId,
      name: t.name,
      description: t.description,
      reportType: t.reportType,
      isShared: t.isShared,
      configuration: t.configuration as unknown as ReportTemplateConfiguration,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }

  async delete(id: string): Promise<boolean> {
    await db.reportTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    return true
  }
}
