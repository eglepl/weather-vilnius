import { r } from '@marblejs/core';
import { mapTo, map } from 'rxjs/operators';
import { toCurrentVilniusWeather, toVilniusWeatherRange } from './service/weather';
import { toDbVilniusWeather } from './service/db';

const mockResponse = {
  foo: 'bar',
  bar: 'foo'
};

export const main$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    mapTo({ body: "Hello World!" }),
  )));

export const api$ = r.pipe(
  r.matchPath('/api'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    map((val, index) => { console.log(val); return val; }),
    mapTo({ body: mockResponse }),
  )));

export const weather$ = r.pipe(
  r.matchPath('/weather'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    map(_ => new Date()),
    toDbVilniusWeather,
    map(resp => ({ body: resp })),
  )));

export const weatherRange$ = r.pipe(
  r.matchPath('/weather/:starttime/:endtime'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    map(req => ({startTime: new Date(req.params.starttime), endTime: new Date(req.params.endtime)})),
    toVilniusWeatherRange,
    map((val, index) => { console.log(val); return val; }),
    map(resp => ({ body: resp })),
  )));