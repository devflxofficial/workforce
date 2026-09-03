import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { MessageCatalogueModule } from '../../common/messages/message-catalogue.module';
import { ApprovalsController } from './controllers/approvals.controller';
import { WorkflowDefinitionsController } from './controllers/workflow-definitions.controller';
import { DelegationsController } from './controllers/delegations.controller';
import { ApprovalsInboxService } from './services/approvals-inbox.service';
import { WorkflowDefinitionService } from './services/workflow-definition.service';
import { DelegationService } from './services/delegation.service';
import { ApprovalHistoryService } from './services/approval-history.service';

@Module({
  imports: [PrismaModule, AuthenticationModule, MessageCatalogueModule],
  controllers: [ApprovalsController, WorkflowDefinitionsController, DelegationsController],
  providers: [
    ApprovalsInboxService,
    WorkflowDefinitionService,
    DelegationService,
    ApprovalHistoryService,
  ],
  exports: [ApprovalsInboxService, WorkflowDefinitionService, DelegationService, ApprovalHistoryService],
})
export class WorkflowModule {}
