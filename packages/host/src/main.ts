/* eslint-disable @typescript-eslint/no-var-requires, global-require */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as ejs from 'ejs';
import { join } from 'path';
import { HostModule } from './host.module';

async function bootstrap() {
  // const isDevelopment = process.env.NODE_ENV === 'development';
  const port = process.env.APPSHELL_PORT || 9000;

  const app = await NestFactory.create<NestExpressApplication>(HostModule);
  // if (isDevelopment) {
  //   const webpack = require('webpack');
  //   const webpackDevMiddleware = require('webpack-dev-middleware');
  //   const webpackHotMiddleware = require('webpack-hot-middleware');
  //   const webpackConfig = require('../webpack.config');

  //   const config = webpackConfig(null, { mode: process.env.NODE_ENV });
  //   const compiler = webpack(config);

  //   app.use(
  //     webpackDevMiddleware(compiler, {
  //       publicPath: 'auto',
  //     }),
  //   );

  //   app.use(webpackHotMiddleware(compiler));
  // }

  app.engine('html', ejs.renderFile);
  app.setBaseViewsDir(join(__dirname, '..', 'public'));
  app.setViewEngine('html');

  await app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Appshell host listening on port ${port} in ${process.env.NODE_ENV} mode`,
    );
  });
}
bootstrap();
