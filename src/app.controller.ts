import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import {
  Client,
  FlexMessage,
  ImageMessage,
  StickerEventMessage,
  StickerMessage,
  TextMessage,
} from '@line/bot-sdk';
import { LineMessaging } from './types';
import { JsonDB, Config } from 'node-json-db';

@Controller()
export class AppController {
  client: Client;
  db: JsonDB;
  constructor(private readonly appService: AppService) {
    this.client = new Client({
      channelSecret: undefined,
      channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    });
    this.db = new JsonDB(new Config('myDataBase', true, false, '/'));
  }

  @Get('/callback')
  callbackGet(@Param() param: any): any {
    console.log(param);
    return 'hello';
  }

  @Post('/callback')
  async callback(@Body() messaging: LineMessaging): Promise<any> {
    messaging.events.map((o) => {
      let message:
        | TextMessage
        | FlexMessage
        | StickerMessage
        | StickerEventMessage
        | ImageMessage;

      console.log('text', o.message);
      this.db.push(`/messages/test/${o.timestamp}`, o.message);

      switch (o.message.text.trim()) {
        case 'flex':
          message = {
            type: 'flex',
            altText: 'this is a flex message',
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'hello',
                  },
                  {
                    type: 'text',
                    text: 'world',
                  },
                ],
              },
            },
          };
          break;
        case 'sticker':
          message = {
            type: 'sticker',
            packageId: '446',
            stickerId: '1988',
          };
          break;
        case 'image':
          message = {
            type: 'image',
            originalContentUrl: 'https://example.com/original.jpg',
            previewImageUrl: 'https://example.com/preview.jpg',
          };
          break;
        default:
          message = {
            type: 'text',
            text: 'replay: ' + o.message.text,
          };
          break;
      }
      this.client.replyMessage(o.replyToken, message);
    });
  }
}
