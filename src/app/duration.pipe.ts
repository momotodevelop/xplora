import { Pipe, PipeTransform } from '@angular/core';
import moment from 'moment';
import humanizeDuration from 'humanize-duration';
@Pipe({
    name: 'duration',
    standalone: true
})
export class DurationPipe implements PipeTransform {
    transform(value: string, ...args: any[]): any {
    let lang = args[0]!==undefined?args[0]:'spShort';
    
    const spanisHumanizerShort = humanizeDuration.humanizer({
        language: lang,
        largest: 2,
        conjunction: " y ",
        units: ["d", "h", "m"],
        languages: {
            spShort: {
            y: () => "A",
            mo: () => "M",
            w: () => "S",
            d: () => "Dia",
            h: () => "Hr",
            m: () => "Min",
            s: () => "Seg",
            ms: () => "MS",
            },
        },
    });
        return spanisHumanizerShort(moment.duration(value).asMilliseconds());
    }
}
