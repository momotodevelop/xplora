import { Pipe, PipeTransform } from '@angular/core';
import { formatDurationShortEs } from './utils/duration.utils';
@Pipe({
    name: 'duration',
    standalone: true
})
export class DurationPipe implements PipeTransform {
    transform(value: string, ...args: any[]): any {
        return formatDurationShortEs(value, 2);
    }
}
