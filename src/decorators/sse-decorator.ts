import { applyDecorators, Header } from '@nestjs/common';

export function SseHeader() {
  return applyDecorators(
    Header('Content-Type', 'text/event-stream'),
    Header('Cache-Control', 'no-cache'),
    Header('Connection', 'keep-alive'),
    Header('Transfer-Encoding', 'chunked'),
  );
}
