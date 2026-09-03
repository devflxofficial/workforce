export interface WorkflowDefinitionListItem {
  id: string;
  code: string;
  name: string;
  requestType: string;
  status: string;
  stageCount: number;
  versionNo: number | null;
  currentVersionId: string | null;
}

export interface WorkflowStageInput {
  sequenceNo: number;
  stageName: string;
  approvalMode?: string;
  approverSource: string;
  minimumApprovals?: number;
  dueAfterMinutes?: number;
}

export interface CreateWorkflowDefinitionPayload {
  code: string;
  name: string;
  requestType: string;
  stages: WorkflowStageInput[];
}

export interface ApprovalDelegation {
  id: string;
  delegatorUserId: string;
  delegateUserId: string;
  requestTypes: string[];
  scope: Record<string, unknown>;
  startsAt: string;
  endsAt: string;
  reason: string;
  status: string;
}

export interface CreateDelegationPayload {
  delegatorUserId: string;
  delegateUserId: string;
  requestTypes: string[];
  startsAt: string;
  endsAt: string;
  reason: string;
  scope?: Record<string, unknown>;
}

export interface ApprovalHistoryItem {
  id: string;
  source: string;
  requestType: string;
  requestId: string;
  actionType: string;
  actorUserId: string | null;
  comment: string | null;
  occurredAt: string;
  employeeName?: string | null;
}
