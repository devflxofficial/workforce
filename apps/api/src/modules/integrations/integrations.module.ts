import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { IntegrationsController } from './controllers/integrations.controller';
import { TenantIntegrationsController } from './controllers/tenant-integrations.controller';
import { IntegrationsCatalogueService } from './services/integrations-catalogue.service';
import { TenantIntegrationService } from './services/tenant-integration.service';
import { MessageCatalogueModule } from '../../common/messages/message-catalogue.module';

@Module({
  imports: [PrismaModule, AuthenticationModule, MessageCatalogueModule],
  controllers: [IntegrationsController, TenantIntegrationsController],
  providers: [IntegrationsCatalogueService, TenantIntegrationService],
  exports: [IntegrationsCatalogueService, TenantIntegrationService],
})
export class IntegrationsModule {}
