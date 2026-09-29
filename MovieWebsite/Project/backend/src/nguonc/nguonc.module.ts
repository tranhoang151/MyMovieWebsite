import { Module } from '@nestjs/common';
import { NguonCService } from './nguonc.service';

@Module({
  providers: [NguonCService],
  exports: [NguonCService],
})
export class NguonCModule {}
