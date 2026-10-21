import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CaptionsGateway } from './captions/caption.gateway';
import { RoomService } from './room/room.service';

@Module({
  providers: [AppService, CaptionsGateway, RoomService],
})
export class AppModule {}
