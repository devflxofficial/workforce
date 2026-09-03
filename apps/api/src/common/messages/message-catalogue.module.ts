import { Global, Module } from '@nestjs/common';
import { MessageCatalogueService } from './message-catalogue.service';

@Global()
@Module({
  providers: [MessageCatalogueService],
  exports: [MessageCatalogueService],
})
export class MessageCatalogueModule {}
