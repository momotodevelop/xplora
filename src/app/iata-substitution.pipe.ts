import { Pipe, PipeTransform } from '@angular/core';

interface AirportSubstitution {
  iata: string;
  text: string;
}

// Asumiendo que este es el array con las sustituciones proporcionadas
const substitutions: AirportSubstitution[] = [
  { iata: 'NLU', text: 'santa lucia' },
  { iata: 'TLC', text: 'toluca' },
  { iata: 'AZP', text: 'atizapan' },
  { iata: 'BVA', text: 'beauvais tillé' },
  { iata: 'ORY', text: 'París-Orly' },
  { iata: 'TOJ', text: 'Torrejón de Ardoz' }
  // Añade más sustituciones según sea necesario
];

@Pipe({
  name: 'iataSubstitution',
  standalone: true
})
export class IataSubstitutionPipe implements PipeTransform {

  transform(value: string, iataCode: string): string {
    if (!value || !iataCode) return value;

    const substitution = substitutions.find(sub => sub.iata === iataCode);
    return substitution ? substitution.text : value;
  }
}
