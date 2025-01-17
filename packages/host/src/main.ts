/* eslint-disable @typescript-eslint/no-var-requires, global-require */
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as ejs from 'ejs';
import { join } from 'path';
import { HostModule } from './host.module';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const port = process.env.APPSHELL_PORT || 9000;

  const app = await NestFactory.create<NestExpressApplication>(HostModule);
  if (isDevelopment) {
    logger.log(`Configuring webpack middleware for development...`);
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const webpackConfig = require('../webpack.config');

    const config = webpackConfig(null, { mode: process.env.NODE_ENV });
    const compiler = webpack(config);

    app.use(
      webpackDevMiddleware(compiler, {
        publicPath: '/shell/',
      }),
    );

    app.use(webpackHotMiddleware(compiler));
  }

  app.engine('html', ejs.renderFile);
  app.setBaseViewsDir(join(__dirname, '..', 'shell', 'views'));
  app.setViewEngine('html');

  await app.listen(port, () => {
    logger.log(
      `Appshell host listening on port ${port} in ${process.env.NODE_ENV} mode`,
    );
  });
}
bootstrap();
