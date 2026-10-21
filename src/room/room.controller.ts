import { Controller, Get } from '@nestjs/common';

@Controller()
export class SpeechToTextController {
  @Get('read')
  readQR(): string {
    return 'hello';
  }
}
