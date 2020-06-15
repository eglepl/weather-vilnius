import { httpListener } from '@marblejs/core';
import { logger$ } from '@marblejs/middleware-logger';
import { bodyParser$ } from '@marblejs/middleware-body';
import { main$, api$, weather$, weatherRange$ } from './api.effects';

const middlewares = [
  logger$(),
  bodyParser$(),
  // middleware3$
  // middleware4$
  // ...
];

const effects = [
  main$,
  api$,
  weather$,
  weatherRange$,
  // endpoint2$
  // endpoint3$
  // ...
];

export const listener = httpListener({
  middlewares,
  effects,
});