import { Component } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TripadvisorComponent } from './tripadvisor/tripadvisor.component';
import { SecturComponent } from './sectur/sectur.component';
import { AmavComponent } from './amav/amav.component';
import { IataComponent } from './iata/iata.component';
export interface Opinion {
  nombre: string;
  titulo: string;
  texto: string;
  apellido: string;
  servicioContratado: string;
  rating: number;
}
export const OPINIONS: Opinion[] = [
  {
    nombre: "Carlos",
    apellido: "Ramírez",
    titulo: "¡Todo muy bien!",
    texto: "El vuelo a Cancún estuvo súper cómodo, lo único que no me gustó fue que me cambiaron de asiento a último minuto, pero fuera de eso todo bien.",
    servicioContratado: "Vuelo a Cancún",
    rating: 4,
  },
  {
    nombre: "Ana",
    apellido: "González",
    titulo: "Recomendado para vacaciones familiares",
    texto: "Reservamos un paquete con hotel en el Hotel Xcaret México. La experiencia fue increíble, aunque el check-in fue un poquito lento. Pero en general todo perfecto.",
    servicioContratado: "Estancia en Hotel Xcaret México",
    rating: 5,
  },
  {
    nombre: "José",
    apellido: "Martínez",
    titulo: "Buen servicio pero...",
    texto: "El vuelo a Guadalajara fue excelente, aunque la aerolínea retrasó la salida 20 minutos. No es culpa de la agencia, pero valía la pena mencionarlo.",
    servicioContratado: "Vuelo a Guadalajara",
    rating: 4,
  },
  {
    nombre: "Claudia",
    apellido: "Pérez",
    titulo: "Todo en orden",
    texto: "Reservamos un vuelo a CDMX y el servicio fue bueno, la aerolínea bien. Aunque me molestó un poco que no había comida incluida en el vuelo.",
    servicioContratado: "Vuelo a Ciudad de México",
    rating: 4,
  },
  {
    nombre: "Luis",
    apellido: "Hernández",
    titulo: "Vale la pena",
    texto: "El hotel en Mérida estuvo excelente. Lo único que no me gustó fue que no había suficiente sombra en la alberca, pero el resto estuvo perfecto.",
    servicioContratado: "Estancia en Hotel Fiesta Americana Mérida",
    rating: 4,
  },
  {
    nombre: "Sofía",
    apellido: "Lopez",
    titulo: "Experiencia de lujo",
    texto: "Mi experiencia en Los Cabos fue maravillosa. El hotel era de lujo, aunque tuve un pequeño inconveniente con el aire acondicionado en la habitación, pero lo arreglaron rápido.",
    servicioContratado: "Estancia en Hotel Riu Palace Cabo San Lucas",
    rating: 5,
  },
  {
    nombre: "Alejandro",
    apellido: "Gutiérrez",
    titulo: "Sin problemas",
    texto: "El vuelo a Monterrey fue rápido y cómodo, todo salió según lo planeado. A veces la comida en el avión no es la mejor, pero bueno, llegamos bien.",
    servicioContratado: "Vuelo a Monterrey",
    rating: 5,
  },
  {
    nombre: "Teresa",
    apellido: "Vázquez",
    titulo: "Increíble atención",
    texto: "La estancia en Tulum fue increíble. Todo estuvo muy bien, solo que el Wi-Fi del hotel no estaba disponible en todo momento, pero todo lo demás fue genial.",
    servicioContratado: "Estancia en Hotel Dreams Tulum",
    rating: 5,
  },
  {
    nombre: "Ricardo",
    apellido: "Sánchez",
    titulo: "Todo a tiempo",
    texto: "Reservé el vuelo a Puerto Vallarta para mis vacaciones y todo salió bien. Lo único que no me gustó fue que no pudimos llevar más de una maleta gratis.",
    servicioContratado: "Vuelo a Puerto Vallarta",
    rating: 5,
  },
  {
    nombre: "Gabriela",
    apellido: "Ríos",
    titulo: "Buen destino, buen hotel",
    texto: "Oaxaca fue un destino precioso. El hotel era muy bonito, pero el personal tardó un poquito en darnos la habitación, todo lo demás perfecto.",
    servicioContratado: "Estancia en Hotel Quinta Real Oaxaca",
    rating: 4,
  },
  {
    nombre: "Marco",
    apellido: "Díaz",
    titulo: "Perfecto para descansar",
    texto: "La atención fue excelente, pero el transporte desde el aeropuerto en Huatulco se tardó un poco. Aún así, un destino hermoso y el servicio de la agencia impecable.",
    servicioContratado: "Vuelo a Huatulco",
    rating: 5,
  },
  {
    nombre: "Elena",
    apellido: "Gómez",
    titulo: "Recomiendo el lugar",
    texto: "La vista del hotel en San Miguel de Allende era maravillosa, todo estuvo bien, aunque el aire acondicionado del cuarto estuvo un poco ruidoso por la noche.",
    servicioContratado: "Estancia en Hotel Rosewood San Miguel de Allende",
    rating: 5,
  },
  {
    nombre: "Marcos",
    apellido: "Pérez",
    titulo: "Bonita experiencia",
    texto: "El vuelo a Mérida estuvo bien, aunque la salida se retrasó un poquito por el clima. Pero todo en general estuvo bien. Me agradó mucho la atención.",
    servicioContratado: "Vuelo a Mérida",
    rating: 5,
  },
  {
    nombre: "Patricia",
    apellido: "Ramírez",
    titulo: "Más que satisfechos",
    texto: "Mi familia y yo tomamos el paquete a Playa del Carmen y la experiencia fue maravillosa. El hotel era impresionante y el servicio estuvo al 100.",
    servicioContratado: "Paquete Vuelo + Hotel en Playa del Carmen",
    rating: 5,
  },
  {
    nombre: "Ricardo",
    apellido: "Mendoza",
    titulo: "Recomendable",
    texto: "El vuelo a León fue bastante bueno, aunque el aterrizaje fue algo movido. Aún así, la atención fue buena y llegamos sin contratiempos.",
    servicioContratado: "Vuelo a León",
    rating: 5,
  },
  {
    nombre: "Verónica",
    apellido: "Torres",
    titulo: "Un destino increíble",
    texto: "Holbox fue impresionante. El hotel era muy bonito, aunque en la playa no había muchas sombrillas disponibles, pero todo lo demás fue espectacular.",
    servicioContratado: "Paquete Vuelo + Hotel en Holbox",
    rating: 5,
  },
  {
    nombre: "Jesús",
    apellido: "Vargas",
    titulo: "Un buen servicio",
    texto: "Todo estuvo bastante bien con el vuelo y la estancia en el hotel de Guanajuato. El servicio fue excelente, aunque el Wi-Fi del hotel no era muy estable.",
    servicioContratado: "Estancia en Hotel Boutique 1850 Guanajuato",
    rating: 5,
  },
  {
    nombre: "Monica",
    apellido: "Cabrera",
    titulo: "Perfecto",
    texto: "La renta de auto en Playa del Carmen fue súper fácil. El único problema fue que no tenían el modelo exacto que pedí, pero el que me dieron estaba bien.",
    servicioContratado: "Renta de Auto en Playa del Carmen",
    rating: 5,
  },
  {
    nombre: "Antonio",
    apellido: "Ramírez",
    titulo: "Viajé con amigos",
    texto: "Todo salió bien con el vuelo a Guadalajara. Los chicos que nos atendieron en el aeropuerto fueron amables, solo que la comida no estuvo tan buena.",
    servicioContratado: "Vuelo a Guadalajara",
    rating: 5,
  },
  {
    nombre: "Margarita",
    apellido: "Hernández",
    titulo: "Muy buen servicio",
    texto: "La estancia en el Hotel Riu Palace fue excelente. Aunque tuvimos un pequeño contratiempo con la reservación del spa, fue solucionado rápidamente.",
    servicioContratado: "Estancia en Hotel Riu Palace Cabo San Lucas",
    rating: 5,
  },
  {
    nombre: "Diego",
    apellido: "García",
    titulo: "Excelente, aunque...",
    texto: "El paquete a Cancún estuvo increíble. Solo que la aerolínea se tardó un poco en entregarnos las maletas, pero no fue un gran inconveniente.",
    servicioContratado: "Paquete Vuelo + Hotel en Cancún",
    rating: 5,
  },
  {
    nombre: "Patricia",
    apellido: "Sánchez",
    titulo: "Todo estuvo bien",
    texto: "El vuelo y el hotel en Los Cabos fueron geniales. Sólo que el wifi del hotel era un poco lento, pero fuera de eso todo perfecto.",
    servicioContratado: "Estancia en Hotel Grand Hyatt Los Cabos",
    rating: 5,
  },
  {
    nombre: "Oscar",
    apellido: "Álvarez",
    titulo: "Muy recomendable",
    texto: "El servicio de transportación del aeropuerto al hotel fue puntual. Aunque el tráfico en la ciudad retrasó un poco el traslado, todo estuvo bien.",
    servicioContratado: "Transportación aeropuerto-hotel",
    rating: 5,
  },
  {
    nombre: "Juliana",
    apellido: "Cordero",
    titulo: "Todo según lo esperado",
    texto: "Los vuelos y el hotel en Cancún fueron muy buenos. El único detalle fue que nos cambiaron de habitación sin previo aviso, pero no fue un gran problema.",
    servicioContratado: "Paquete Vuelo + Hotel en Cancún",
    rating: 5,
  },
  {
    nombre: "Miguel",
    apellido: "Serrano",
    titulo: "Buen viaje",
    texto: "El viaje fue muy bueno, aunque en el hotel no había suficiente información sobre los servicios disponibles. De todos modos, disfrutamos mucho el viaje.",
    servicioContratado: "Estancia en Hotel Iberostar Playa Paraíso",
    rating: 5,
  },
  {
    nombre: "Lucía",
    apellido: "Martínez",
    titulo: "Feliz con el resultado",
    texto: "Todo salió bien en mi viaje a Puerto Escondido. Solo que la aerolínea perdió una de mis maletas, pero me la entregaron al día siguiente.",
    servicioContratado: "Vuelo a Puerto Escondido",
    rating: 4,
  },
  {
    nombre: "Isabel",
    apellido: "Suárez",
    titulo: "Hermoso destino",
    texto: "Tulum es increíble, el hotel es hermoso, aunque la comida podría ser mejor. A veces el servicio en los restaurantes del hotel fue lento, pero la experiencia general fue muy buena.",
    servicioContratado: "Estancia en Hotel Tulum",
    rating: 4,
  },
  {
    nombre: "Eduardo",
    apellido: "Solis",
    titulo: "Muy buen paquete",
    texto: "El paquete de vuelo y hotel en Cancún estuvo excelente, solo que el wifi del hotel no era tan rápido, pero nada que nos impidiera disfrutar el viaje.",
    servicioContratado: "Paquete Vuelo + Hotel en Cancún",
    rating: 4,
  },
  {
    nombre: "Beatriz",
    apellido: "Villarreal",
    titulo: "Recomiendo la agencia",
    texto: "Todo estuvo bien con el vuelo y el hotel en Puerto Vallarta, aunque el aire acondicionado de la habitación hizo ruido durante la noche, pero me cambiaron de habitación sin problema.",
    servicioContratado: "Estancia en Hotel Garza Blanca Puerto Vallarta",
    rating: 4,
  },
  {
    nombre: "Javier",
    apellido: "Gómez",
    titulo: "Rápido y eficiente",
    texto: "El vuelo a Mazatlán fue rápido y puntual. La agencia me ayudó a coordinar el traslado del aeropuerto al hotel, pero el conductor no hablaba mucho, aunque no fue un gran inconveniente.",
    servicioContratado: "Vuelo a Mazatlán",
    rating: 5,
  },
  {
    nombre: "Liliana",
    apellido: "Martínez",
    titulo: "De ensueño",
    texto: "La estancia en el Hotel Secrets Akumal fue increíble. Sólo que el servicio en la piscina fue un poco lento, pero fuera de eso todo fue espectacular.",
    servicioContratado: "Estancia en Hotel Secrets Akumal Riviera Maya",
    rating: 5,
  },
  {
    nombre: "Héctor",
    apellido: "López",
    titulo: "Todo salió bien",
    texto: "Mi vuelo a Monterrey fue muy cómodo, aunque el proceso de embarque fue un poco desorganizado, pero en general el servicio fue bueno.",
    servicioContratado: "Vuelo a Monterrey",
    rating: 5,
  },
  {
    nombre: "María",
    apellido: "Rodríguez",
    titulo: "Un viaje muy bonito",
    texto: "La renta de auto en Playa del Carmen estuvo muy bien, aunque el auto que me dieron no tenía suficiente espacio para las maletas, pero me ayudaron a resolverlo rápido.",
    servicioContratado: "Renta de Auto en Playa del Carmen",
    rating: 5,
  },
  {
    nombre: "Ricardo",
    apellido: "Sánchez",
    titulo: "Todo correcto",
    texto: "La agencia organizó todo muy bien para mi vuelo a Ciudad de México. El único inconveniente fue que la comida del avión no estaba muy buena, pero el vuelo fue puntual.",
    servicioContratado: "Vuelo a Ciudad de México",
    rating: 5,
  },
  {
    nombre: "Esteban",
    apellido: "González",
    titulo: "Muy contento",
    texto: "El hotel en Guadalajara estuvo bien, aunque el Wi-Fi no estaba disponible en todas las áreas del hotel. El servicio en general fue muy bueno.",
    servicioContratado: "Estancia en Hotel Hilton Guadalajara",
    rating: 4,
  },
  {
    nombre: "Luz",
    apellido: "Torres",
    titulo: "Vacaciones perfectas",
    texto: "La experiencia en el Hotel Xcaret fue maravillosa. El único detalle fue que en el parque de atracciones hubo un poco de espera en algunas actividades, pero todo lo demás estuvo increíble.",
    servicioContratado: "Estancia en Hotel Xcaret México",
    rating: 5,
  },
  {
    nombre: "Felipe",
    apellido: "Méndez",
    titulo: "Vale la pena",
    texto: "El vuelo a Puerto Vallarta fue excelente. Lo único malo fue que el aire acondicionado en el avión estaba muy fuerte, pero fuera de eso todo estuvo bien.",
    servicioContratado: "Vuelo a Puerto Vallarta",
    rating: 4,
  },
  {
    nombre: "Jessica",
    apellido: "Ramírez",
    titulo: "Agradable experiencia",
    texto: "El paquete con vuelo y estancia en Playa del Carmen fue muy bueno. La única sugerencia sería que el servicio de transporte del aeropuerto al hotel pudiera ser más rápido.",
    servicioContratado: "Paquete Vuelo + Hotel en Playa del Carmen",
    rating: 4,
  },
  {
    nombre: "Mauricio",
    apellido: "Alvarez",
    titulo: "Muy buen trato",
    texto: "La atención en el hotel en Los Cabos fue excelente, aunque el servicio de restaurante en la playa tardó más de lo esperado. Sin embargo, la comida estuvo muy rica.",
    servicioContratado: "Estancia en Hotel Riu Palace Los Cabos",
    rating: 4,
  },
  {
    nombre: "Sandra",
    apellido: "Fuentes",
    titulo: "Excelente servicio",
    texto: "Todo muy bien en mi vuelo a Veracruz, aunque el personal de abordo no fue tan amable como esperaba. De todas formas, todo salió muy bien.",
    servicioContratado: "Vuelo a Veracruz",
    rating: 5,
  },
  {
    nombre: "Gabriel",
    apellido: "Jiménez",
    titulo: "Buen servicio en general",
    texto: "La estancia en el Hotel Royalton Riviera fue buena, aunque el Wi-Fi solo funcionaba en las áreas comunes. Fue algo incómodo, pero no arruinó mi estadía.",
    servicioContratado: "Estancia en Hotel Royalton Riviera",
    rating: 4,
  },
  {
    nombre: "Montserrat",
    apellido: "Vega",
    titulo: "¡Qué gran viaje!",
    texto: "El hotel en Cancún fue excelente. Sólo que el aire acondicionado en la habitación estaba demasiado fuerte y tuve que ajustarlo varias veces. Aparte de eso, todo perfecto.",
    servicioContratado: "Estancia en Hotel Moon Palace Cancún",
    rating: 4,
  },
  {
    nombre: "Raúl",
    apellido: "Hernández",
    titulo: "Un viaje muy relajante",
    texto: "La experiencia en Huatulco fue muy buena. El único inconveniente fue que el transporte de regreso al aeropuerto se retrasó un poco, pero el viaje estuvo excelente.",
    servicioContratado: "Vuelo a Huatulco",
    rating: 4,
  },
  {
    nombre: "Felicia",
    apellido: "Castro",
    titulo: "Recomendable para descansar",
    texto: "El hotel en Acapulco estuvo genial, aunque el servicio de transporte hacia el hotel desde el aeropuerto fue un poco largo, pero la calidad del servicio compensó todo.",
    servicioContratado: "Estancia en Hotel Princess Mundo Imperial Acapulco",
    rating: 4,
  },
  {
    nombre: "Vicente",
    apellido: "Paredes",
    titulo: "Buen servicio",
    texto: "Todo muy bien con mi vuelo a Cancún, aunque el servicio de abordo podría mejorar un poco. El resto fue perfecto.",
    servicioContratado: "Vuelo a Cancún",
    rating: 4,
  },
  {
    nombre: "Angélica",
    apellido: "Salazar",
    titulo: "Bonito destino, buen hotel",
    texto: "La experiencia en el Hotel Riu Cancún fue muy buena, aunque el proceso de check-in fue algo lento. Pero fuera de eso, todo muy bien.",
    servicioContratado: "Estancia en Hotel Riu Cancún",
    rating: 4,
  }
]
@Component({
    selector: 'app-about',
    imports: [MatBottomSheetModule],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss'
})
export class AboutComponent {
  opinions:Opinion[]=OPINIONS;
  rating:number=0;
  constructor(private bs: MatBottomSheet){
    this.rating = this.calcularPromedio(this.opinions);
  }
  calcularPromedio(opiniones: Opinion[]): number {
    if (opiniones.length === 0) {
      return 5; // Si no hay opiniones, el promedio es 5
    }
    const suma = opiniones.reduce((total, opinion) => total + opinion.rating, 0);
    const promedio = suma / opiniones.length;
    return Math.round(promedio * 100) / 100; // Redondear a 2 decimales
  }
  openTA(){
    this.bs.open(TripadvisorComponent, {panelClass: 'bottomsheet-no-padding'});
  }
  openRNT(){
    this.bs.open(SecturComponent, {panelClass: 'bottomsheet-no-padding'})
  }
  openAMAV(){
    this.bs.open(AmavComponent, {panelClass: 'bottomsheet-no-padding'})
  }
  openIATA(){
    this.bs.open(IataComponent, {panelClass: 'bottomsheet-no-padding'})
  }
}
