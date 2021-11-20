import { Telegraf } from 'telegraf';
import { UserMiddleware } from '../middlewares/user.middleware';
import { HelpController } from '../controllers/help.controller';
import { UserContext } from '../types/ctx.type';
import config from '../../libs/config';
import { createOrmConnection } from '../../libs/database';
import logger from '../../libs/logger';
import { wrapper } from '../wrapper';
import { EventEmitter } from '../../libs/event-emitter';

export class TgModule {
  private telegramApi: Telegraf<UserContext>;
  private helpController: HelpController;

  constructor() {
    this.telegramApi = new Telegraf<UserContext>(config.botToken);
    this.helpController = new HelpController();
  }

  public async init(): Promise<void> {
    await createOrmConnection();

    this.telegramApi.use(UserMiddleware);

    this.telegramApi.hears(
      '/start',
      wrapper(this.helpController.start.bind(this)),
    );
    this.telegramApi.on(
      'message',
      wrapper(this.helpController.setGithubUsername.bind(this)),
    );

    EventEmitter.on('follower', (args) => {
      this.telegramApi.telegram.sendMessage(args.telegramId, args.message);
    });
    logger.info({
      level: 'info',
      message: 'TG Bot Initialization',
    });
    this.telegramApi.launch();
  }
}
