import { CronJob } from "cron";
import { from } from "rxjs";
import { toCurrentVilniusWeather } from "./weather";
import { addWeatherMeasurement } from "./db";
import { map } from "rxjs/operators";

const hourlyGetTemperature = new CronJob("0 * * * *", async () => {
    console.log("Executing cron. Getting temperature");
    await from([0]).pipe(toCurrentVilniusWeather, map(weather => {
        addWeatherMeasurement(new Date(), weather.temp.value);
    })).toPromise();
});

export const startCron = () => {

    hourlyGetTemperature.start();
};