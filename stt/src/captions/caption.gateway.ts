/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
// } from '@nestjs/websockets';
// import { Socket } from 'socket.io';
// import { RoomService } from 'src/room/room.service';
// import { TranscriptionService } from './transcription.service';

// @WebSocketGateway({ cors: { origin: true } }) // tighten origin before deploying
// export class CaptionsGateway implements OnGatewayDisconnect {
//   constructor(private readonly rooms: RoomService) {}

//   // TV/computer: create (or resume) a room
//   @SubscribeMessage('room:create')
//   handleCreate(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() body: { code?: string },
//   ) {
//     const code = this.rooms.create(body?.code);
//     client.data.role = 'display';
//     client.data.code = code;
//     client.join(code);
//     return { code }; // sent back as the acknowledgement
//   }

//   // Phone: join a room using the code
//   @SubscribeMessage('room:join')
//   async handleJoin(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() body: { code?: string },
//   ) {
//     const code = body?.code?.trim().toUpperCase();
//     if (!code || !this.rooms.exists(code)) {
//       return { ok: false, error: 'Room not found' };
//     }
//     client.data.role = 'speaker';
//     client.data.code = code;
//     await client.join(code);
//     client.to(code).emit('speaker:connected');
//     return { ok: true };
//   }

//   // Temporary: lets you verify the pipe before adding Deepgram
//   @SubscribeMessage('caption:test')
//   handleTest(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() body: { text: string },
//   ) {
//     if (client.data.role !== 'speaker') return;
//     client
//       .to(client.data.code)
//       .emit('caption', { text: body.text, isFinal: true });
//   }

//   handleDisconnect(client: Socket) {
//     if (client.data.role === 'speaker') {
//       client.to(client.data.code).emit('speaker:disconnected');
//     }
//   }
// }
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { TranscriptionService } from './transcription.service';

@WebSocketGateway({ cors: { origin: true } })
export class CaptionsGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly rooms: RoomService,
    private readonly transcription: TranscriptionService,
  ) {}

  @SubscribeMessage('room:create')
  handleCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { code?: string },
  ) {
    const code = this.rooms.create(body?.code);
    client.data.role = 'display';
    client.data.code = code;
    client.join(code);
    return { code };
  }

  @SubscribeMessage('room:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { code?: string },
  ) {
    const code = body?.code?.trim().toUpperCase();
    if (!code || !this.rooms.exists(code)) {
      return { ok: false, error: 'Room not found' };
    }
    client.data.role = 'speaker';
    client.data.code = code;
    client.join(code);
    client.to(code).emit('speaker:connected');
    return { ok: true };
  }

  @SubscribeMessage('speech:start')
  handleStart(@ConnectedSocket() client: Socket) {
    if (client.data.role !== 'speaker') return;
    const code: string = client.data.code;
    this.transcription.start(code, (caption) => {
      this.server.to(code).emit('caption', caption); // goes to the TV and the phone
    });
  }

  @SubscribeMessage('audio')
  handleAudio(@ConnectedSocket() client: Socket, @MessageBody() chunk: Buffer) {
    if (client.data.role !== 'speaker') return;
    this.transcription.send(client.data.code, chunk);
  }

  @SubscribeMessage('speech:stop')
  handleStop(@ConnectedSocket() client: Socket) {
    if (client.data.role !== 'speaker') return;
    this.transcription.stop(client.data.code);
  }

  @SubscribeMessage('caption:test')
  handleTest(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { text: string },
  ) {
    if (client.data.role !== 'speaker') return;
    client
      .to(client.data.code)
      .emit('caption', { text: body.text, isFinal: true });
  }

  handleDisconnect(client: Socket) {
    if (client.data.role === 'speaker') {
      this.transcription.stop(client.data.code);
      client.to(client.data.code).emit('speaker:disconnected');
    }
  }
}
