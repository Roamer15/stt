import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CaptionsGateway } from './captions/caption.gateway';
import { RoomService } from './room/room.service';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionService } from './captions/transcription.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [AppService, CaptionsGateway, RoomService, TranscriptionService],
})
export class AppModule {}
