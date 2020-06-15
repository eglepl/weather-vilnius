import { from, Observable } from "rxjs";
import { map, tap, switchMap } from "rxjs/operators";
import { Database, OPEN_READWRITE } from "sqlite3";
import { toVilniusWeatherRange, toCurrentVilniusWeather } from "./weather";


const db = new Database('db/weather.db', OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the weather database.');
});

interface WeatherMeasurement {
    id?: number;
    observationTime: Date;
    temperature: number;
}

export const initDb = async () => {
    const now = new Date();
    const measurement = await findWeatherMeasurement(now);
    if(!measurement) {
        let monthBefore = new Date(); monthBefore.setDate(now.getDate() - 1);
        await from([{startTime: monthBefore, endTime: now}]).pipe(toVilniusWeatherRange, map(measurements => {
            measurements.forEach(item => addWeatherMeasurement(new Date(item.observation_time.value), item.temp.value))
        })).toPromise();
    }
}

export const findWeatherMeasurement = (time: Date): Promise<WeatherMeasurement|undefined> => {
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.all(`SELECT id, observation_time, temperature
                     FROM weather
                     WHERE observation_time <= ?
                     ORDER BY observation_time DESC
                     LIMIT 1`, [time.toISOString()], (err, rows) => {
                if(err) { 
                    reject(err); 
                } else if(rows.length === 0) {
                    resolve(undefined);
                } else {
                    const row = rows[0];
                    resolve({
                        id: row.id,
                        observationTime: row.observation_time,
                        temperature: row.temperature
                    });
                }
            });
        });
    });
}

export const getWeatherMeasurement = (id: number): Promise<WeatherMeasurement|undefined> => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.get(`SELECT id, observation_time, temperature
                     FROM weather
                     WHERE id = ?
                     LIMIT 1`, [id], (err, row) => {
                if(err) { 
                    reject(err); 
                } else if(row === undefined) {
                    resolve(undefined);
                } else {
                    resolve({
                        id: row.id,
                        observationTime: row.observation_time,
                        temperature: row.temperature
                    });
                }
            });
        });
    });
}

export const addWeatherMeasurement = (observationTime: Date, temperature: number) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO weather(observation_time, temperature) VALUES (?, ?)"
        db.run(sql, [observationTime.toISOString(), temperature], function(err) {
            if(err) {
                reject(err);
            } else {
                getWeatherMeasurement(this.lastID).then(m => resolve(m))
            }
          });
        });
    }

export const toDbVilniusWeather = (dates$: Observable<Date>) =>
    dates$.pipe(switchMap(date => findWeatherMeasurement(date)));