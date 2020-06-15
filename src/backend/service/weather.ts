import axios from "axios";
import { Observable } from "rxjs";
import { concatMap, map, tap } from "rxjs/operators";
import { ClimaCellApiKey } from "../config";
import { GeographicCoordinate, SpacetimeRange, TimeRange } from "./types";

interface Temperature {
    value: number,
    units: string
}

interface Observation {
    value: string
}

interface Measurement {
    observation_time: Observation;
    temp: Temperature;
}

const climacellClient = axios.create({
    baseURL: 'https://api.climacell.co/v3/weather',
    headers: { 'apikey': ClimaCellApiKey }
});

const vilnius: GeographicCoordinate = { latitude: 54.687157, longitude: 25.279652 };

export const toCurrentVilniusWeather = <R>(anything$: Observable<R>) =>
    anything$.pipe(map(_ => vilnius), toCurrentWeather);

export const toVilniusWeatherRange = (timeRange$: Observable<TimeRange>) =>
    timeRange$.pipe(tap(v => console.log(v)), map(timeRange => ({ location: vilnius, timeRange })), toWeatherRange);


const toCurrentWeather = (spacetimeObservable: Observable<GeographicCoordinate>) =>
    spacetimeObservable.pipe(concatMap(async location =>
        await climacellClient.get("realtime", {
            params: {
                lat: location.latitude,
                lon: location.longitude,
                unit_system: 'si',
                fields: ['temp']
            }
        }).then(resp => resp.data as Measurement)
    ));

const chuckTimeRange = (timeRange: TimeRange, maxChunkMillis: number) => {
    const getDiff = (s: Date, e: Date) => e.getTime() - s.getTime();
    const timeRangeChunks: TimeRange[] = [];

    let startTime = timeRange.startTime;
    let endTime = timeRange.endTime;
    let i = 0;
    while (startTime.getTime() < endTime.getTime()) {
        const timeDiff = getDiff(startTime, endTime);
        const middleTime = new Date(startTime.getTime() + maxChunkMillis);
        if (timeDiff > maxChunkMillis) {
            timeRangeChunks.push({ startTime, endTime: middleTime });
        } else {
            timeRangeChunks.push({ startTime, endTime })
        }
        startTime = middleTime;
    }
    return timeRangeChunks;
}

const toWeatherRange = (spacetimeObservable: Observable<SpacetimeRange>) =>
    spacetimeObservable.pipe(
        concatMap(async spacetimeRange => {
            console.log(spacetimeRange);
            const timeChunks = chuckTimeRange(spacetimeRange.timeRange, 24 * 60 * 60 * 1000);
            const responses = await Promise.all(timeChunks
                .map(timeRange => climacellClient.get("historical/station", {
                        params: {
                            lat: spacetimeRange.location.latitude,
                            lon: spacetimeRange.location.longitude,
                            start_time: timeRange.startTime.toISOString(),
                            end_time: timeRange.endTime.toISOString(),
                            unit_system: 'si',
                            fields: ['temp']
                        }
                    }))
                );
            const result : any[] = [];
            responses.forEach(r => {result.push(...(r.data as Measurement[]))});
            return result as Measurement[];
        }));