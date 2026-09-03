import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { MessageCatalogueModule } from '../../common/messages/message-catalogue.module';
import { HolidayCalendarController } from './controllers/holiday-calendar.controller';
import { CustomFieldController } from './controllers/custom-field.controller';
import { PayrollCalendarController } from './controllers/payroll-calendar.controller';
import { HolidayCalendarService } from './services/holiday-calendar.service';
import { CustomFieldService } from './services/custom-field.service';
import { PayrollCalendarService } from './services/payroll-calendar.service';

@Module({
  imports: [PrismaModule, AuthenticationModule, MessageCatalogueModule],
  controllers: [HolidayCalendarController, CustomFieldController, PayrollCalendarController],
  providers: [HolidayCalendarService, CustomFieldService, PayrollCalendarService],
  exports: [HolidayCalendarService, CustomFieldService, PayrollCalendarService],
})
export class TenantSettingsModule {}
