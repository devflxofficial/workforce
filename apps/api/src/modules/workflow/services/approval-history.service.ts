import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class ApprovalHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, limit = 50) {
    const actions = await this.prisma.workflowAction.findMany({
      where: { tenantId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });

    const leaveDecisions = await this.prisma.leaveRequest.findMany({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'REJECTED', 'CANCELLED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { employee: { select: { id: true, displayName: true } } },
    });

    const fromActions = actions.map((a) => ({
      id: a.id,
      source: 'WORKFLOW_ACTION',
      requestType: a.requestType,
      requestId: a.requestId,
      actionType: a.actionType,
      actorUserId: a.actorUserId,
      comment: a.comment,
      occurredAt: a.occurredAt.toISOString(),
    }));

    const fromLeave = leaveDecisions.map((lr) => ({
      id: `leave-${lr.id}`,
      source: 'LEAVE',
      requestType: 'LEAVE',
      requestId: lr.id,
      actionType: lr.status === 'APPROVED' ? 'APPROVED' : lr.status === 'REJECTED' ? 'REJECTED' : 'CANCELLED',
      actorUserId: lr.decidedBy ?? lr.updatedBy,
      comment: lr.reason ?? null,
      occurredAt: (lr.decidedAt ?? lr.updatedAt).toISOString(),
      employeeName: lr.employee?.displayName ?? null,
    }));

    const merged = [...fromActions, ...fromLeave]
      .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
      .slice(0, limit);

    return merged;
  }
}
