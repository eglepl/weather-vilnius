import { createServer } from '@marblejs/core';
import { IO } from 'fp-ts/lib/IO';
import { listener } from './http.listener';
import { initDb } from './service/db';
import { startCron } from './service/cron';

const server = createServer({
  port: 1337,
  hostname: '127.0.0.1',
  listener,
});

const main: IO<void> = async () => {
  await initDb();
  startCron();
  await (await server)();
}


main();