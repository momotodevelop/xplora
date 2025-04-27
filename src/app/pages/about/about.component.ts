import { Component } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TripadvisorComponent } from './tripadvisor/tripadvisor.component';
import { SecturComponent } from './sectur/sectur.component';
import { AmavComponent } from './amav/amav.component';
import { IataComponent } from './iata/iata.component';
import { SharedDataService } from '../../services/shared-data.service';
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
    nombre: "María",
    apellido: "García",
    titulo: "Luna de miel inolvidable en Cancún",
    texto: "Contratamos nuestra luna de miel a Cancún con Xplora Travel y fue maravillosa. El paquete incluyó vuelos y un resort todo incluido frente al mar, tal como lo soñábamos. 🌅 La agencia nos consiguió un precio excelente y hasta decoraron la habitación con motivos de recién casados. Tuvimos un pequeño retraso en el traslado del aeropuerto al hotel, pero la atención fue tan buena que igual le doy la máxima calificación. ¡Gracias por una experiencia inolvidable!",
    servicioContratado: "Paquete Cancún All-Inclusive (7 días)",
    rating: 5
  },
  {
    nombre: "Juan",
    apellido: "Hernández",
    titulo: "Excelente servicio y atención",
    texto: "Viajé con mi familia a Puerto Vallarta y todo estuvo muy bien organizado. 🏖️ Xplora nos encontró un hotel familiar con todo incluido y los vuelos directos desde CDMX. La agente fue muy amable y nos dio recomendaciones de tours (hasta hicimos uno para avistar ballenas 🐋). Hubo un cambio de horario en nuestro vuelo de regreso, pero nos avisaron con tiempo. En general, súper contentos con el servicio.",
    servicioContratado: "Paquete Familiar Puerto Vallarta (5 noches)",
    rating: 5
  },
  {
    nombre: "Carlos",
    apellido: "López",
    titulo: "Festival de música bien organizado",
    texto: "Contraté con Xplora un viaje al Vive Latino 2024 y la experiencia fue genial. 🎸 Me dieron los boletos para ambos días del festival y reservaron un hotel cerca del Foro Sol. Fue muy cómodo tener transporte al concierto incluido, así evité el tráfico y estacionamiento. Todo estuvo tal cual lo prometieron, sin sorpresas. Fue mi primer festival fuera de casa y tener todo planeado con la agencia me dio mucha tranquilidad. ¡Repetiría sin dudarlo!",
    servicioContratado: "Paquete Vive Latino CDMX 2024 (Hotel + Boletos)",
    rating: 5
  },
  {
    nombre: "Ana",
    apellido: "Martínez",
    titulo: "Vacaciones en Los Cabos de ensueño",
    texto: "Mi esposo y yo viajamos a Los Cabos celebrando nuestro aniversario y Xplora Travel nos ayudó a hacerlo especial. 🌇 Desde la llegada, el transporte privado al hotel fue puntual y cómodo. Nos hospedamos en un resort hermoso en Cabo San Lucas con vista al Arco. Tuvimos un contratiempo menor con una excursión (la salida a Isla Espíritu Santo se reprogramó por clima), pero la agencia nos avisó y reacomodó el itinerario rápidamente. La atención personalizada marcó la diferencia. ¡Muy recomendables!",
    servicioContratado: "Viaje Romántico Los Cabos (4 días)",
    rating: 5
  },
  {
    nombre: "Luis",
    apellido: "Rodríguez",
    titulo: "Buena experiencia en general",
    texto: "Reservé con Xplora Travel unas vacaciones a Huatulco para 4 amigos. El precio del paquete fue competitivo y nos incluyó un hotel bonito cerca de la playa Chahué. Disfrutamos mucho los paseos a las bahías. Hubo un detalle: la confirmación del hotel tardó un par de días en llegarnos y nos puso nerviosos, pero finalmente todo estaba ok. Fuera de eso, el viaje salió excelente. La relación calidad-precio de la agencia es muy buena.",
    servicioContratado: "Paquete Amigos Huatulco (Hotel + Vuelo)",
    rating: 4
  },
  {
    nombre: "Fernanda",
    apellido: "Sánchez",
    titulo: "Atención excelente, pequeños detalles a mejorar",
    texto: "Fuimos a Playa del Carmen con Xplora. La verdad nos atendieron súper bien desde la cotización hasta el final del viaje. 💙 Conseguimos un resort en Riviera Maya precioso y nos regalaron un descuento para el parque Xcaret. Solo noté que podrían mejorar la comunicación: al llegar al destino no encontramos al chofer de traslado de inmediato y tuvimos que llamar. Respondieron rápido y todo siguió sin problemas, pero ese pequeño susto evitó que fuera perfecto. Aún así, ¡muy recomendados!",
    servicioContratado: "Viaje a Playa del Carmen All-Inclusive",
    rating: 4
  },
  {
    nombre: "Miguel",
    apellido: "Castro",
    titulo: "Viaje al Cervantino, ¡magnífico!",
    texto: "Contraté un paquete para el Festival Cervantino en Guanajuato y fue una gran decisión. 🎭 Xplora se encargó del hotel céntrico y entradas para un par de eventos culturales. Además incluía un tour por las callejoneadas y museos. Todo estuvo muy bien coordinado; el guía que nos contactó allá fue puntual y amable. Solo el bus desde CDMX salió con 30 minutos de retraso, pero considerando el tráfico fue comprensible. El resto del viaje, una maravilla cultural. Sin duda volveré a usar sus servicios para eventos especiales.",
    servicioContratado: "Paquete Festival Cervantino 2024 (Guanajuato)",
    rating: 5
  },
  {
    nombre: "Sofía",
    apellido: "Navarro",
    titulo: "Diversión en familia en Cancún",
    texto: "Llevé a mis hijos a Cancún con un paquete de Xplora Travel y fue la mejor decisión. 🐠 Nos alojaron en un hotel con parque acuático para niños, ¡no querían salir de ahí! Además nos agendaron un tour a Xel-Há y a ruinas mayas muy educativo. La atención de la agencia fue excelente, siempre al pendiente por WhatsApp durante el viaje. Lo único: el check-in del hotel tomó más tiempo de lo esperado porque estaba lleno, pero eso escapa del control de la agencia. En general, mis respetos por la organización.",
    servicioContratado: "Paquete Familiar Cancún (Hotel + Tours)",
    rating: 5
  },
  {
    nombre: "Ricardo",
    apellido: "Ortega",
    titulo: "Paquete a Cozumel bien organizado",
    texto: "Xplora nos ayudó con un viaje de buceo a Cozumel. 🤿 Nos consiguieron un paquete que incluía ferry desde Playa del Carmen, hotel y 2 días de salidas de buceo con instructores certificados. Fue una experiencia fantástica nadar en los arrecifes. Todo estuvo muy bien coordinado; incluso cuando nuestro vuelo hacia Cancún se demoró, la agencia reprogramó el traslado al ferry sin costo adicional. Aprecio mucho esa rapidez para resolver. Un viaje redondo, ¡los recomiendo!",
    servicioContratado: "Viaje de Buceo en Cozumel (Hotel + Inmersiones)",
    rating: 5
  },
  {
    nombre: "Alejandro",
    apellido: "Flores",
    titulo: "Carnaval de Mazatlán con amigos",
    texto: "Viajamos al Carnaval de Mazatlán con un paquete de Xplora Travel y la pasamos increíble. 🎉 El hotel estaba en el malecón, justo en medio de toda la fiesta, perfecto para disfrutar los desfiles y conciertos. Nos incluyeron entradas a un evento de coronación y un tour a la Isla de la Piedra. La verdad superó expectativas. Únicamente sugiero que mejoren la información previa: no sabíamos que el tráfico por los desfiles retrasaría los traslados, hubiera sido bueno que nos advirtieran. Fuera de eso, ¡experiencia genial!",
    servicioContratado: "Paquete Carnaval de Mazatlán 2025",
    rating: 4
  },
  {
    nombre: "Elena",
    apellido: "Villaseñor",
    titulo: "Viaje redondo a Acapulco",
    texto: "Reservé un fin de semana en Acapulco vía Xplora. Todo sencillo y rápido. 🌴 Nos tocó un hotel histórico en la Costera Miguel Alemán con vista al mar. Incluyó desayuno buffet y el autobús de lujo ida y vuelta desde CDMX. No tuvimos que preocuparnos por nada, solo de disfrutar la playa y ver los clavadistas de La Quebrada. La agencia entregó lo prometido; incluso nos consiguió late check-out sin costo. Cero quejas, muy recomendable para escapadas cortas.",
    servicioContratado: "Escapada Acapulco Fin de Semana",
    rating: 5
  },
  {
    nombre: "Héctor",
    apellido: "Guzmán",
    titulo: "Tour por la Riviera Maya espectacular",
    texto: "Hicimos un circuito por la Riviera Maya que Xplora organizó: Cancún, Playa del Carmen y Tulum en un solo viaje. 🏝️ Fueron 7 días increíbles. Nos hospedamos 3 noches en Cancún y 3 en Playa del Carmen, con tours a cenotes y a Chichén Itzá. Todo el transporte terrestre entre ciudades lo cubrieron ellos y fue muy cómodo en van con A/C. Tuvimos un guía en las ruinas que explicaba todo en español e inglés. Sinceramente fue más de lo que esperábamos por el precio que pagamos. Excelente opción para conocer varios destinos de un jalón.",
    servicioContratado: "Circuito Riviera Maya (7 días)",
    rating: 5
  },
  {
    nombre: "Gabriela",
    apellido: "Pérez",
    titulo: "Experiencia buena aunque con un detalle",
    texto: "Utilizamos Xplora Travel para un viaje a Ixtapa Zihuatanejo. La cotización fue rápida y nos dieron varias opciones de hotel. Elegimos uno todo incluido que resultó muy cómodo y bonito. 🌺 En general el paquete cumplió todo lo ofrecido y pasamos vacaciones muy agradables. Solo un detalle: al llegar al hotel, la habitación no estaba lista y tuvimos que esperar casi 2 horas para el check-in. Entiendo que era temporada alta, pero quizá la agencia podría coordinar con el hotel esos tiempos. Aun con eso, calificación alta porque el resto estuvo excelente.",
    servicioContratado: "Paquete Ixtapa Todo Incluido (4 noches)",
    rating: 4
  },
  {
    nombre: "Jorge",
    apellido: "Ramírez",
    titulo: "Viaje a la F1 en Ciudad de México",
    texto: "¡Viajé desde Monterrey al Gran Premio de México con Xplora y fue sensacional! 🏎️ Me armaron un paquete con vuelo, hotel en Polanco y boletos para las tres jornadas de la Fórmula 1 (prácticas, quali y carrera). Todo funcionó de maravilla; incluso organizaron traslados al Autódromo Hermanos Rodríguez para evitar el caos de movilidad. Ver la F1 sin preocuparme por logística hizo la experiencia mucho mejor. Precio justo y servicio de primera. Nos vemos el próximo año, seguro repito con ellos.",
    servicioContratado: "Paquete Fórmula 1 CDMX 2024 (Vuelo+Hotel+Entrada)",
    rating: 5
  },
  {
    nombre: "Andrea",
    apellido: "Medina",
    titulo: "Concierto en Guadalajara con viaje incluido",
    texto: "Compré un paquete para ver a mi banda favorita en Guadalajara. 🎤 Xplora consiguió boletos para el concierto en el Estadio 3 de Marzo y además el hotel por dos noches. Viajé en autobús desde Ciudad de México incluido en el costo. Todo salió perfecto: el hotel estaba lleno de otros fans y la vibra era genial. La agencia siempre respondió mis preguntas (era la primera vez que viajaba sola a un concierto). Me sentí segura y disfruté cada momento. ¡Muy recomendable para melómanos viajeros!",
    servicioContratado: "Viaje Concierto Imagine Dragons GDL (Bus+Hotel+Boleto)",
    rating: 5
  },
  {
    nombre: "José",
    apellido: "Cruz",
    titulo: "Servicio cumplido en viaje a Holbox",
    texto: "Contratamos nuestro viaje a la isla de Holbox con Xplora Travel. Nos incluyeron el traslado terrestre desde Cancún y el ferry, además del hotel boutique en la isla. 🐬 Holbox es un paraíso y por suerte todo estuvo bien coordinado: el chofer nos esperaba en el aeropuerto y no tuvimos contratiempos. La única cosa es que el hotel inicialmente nos dio una habitación distinta a la que habíamos reservado. Llamamos a la agencia y en pocas horas lo solucionaron, nos cambiaron a la correcta. Aprecié mucho su intervención rápida. Fuera de eso, ¡excelente viaje!",
    servicioContratado: "Paquete Isla Holbox 2025 (Traslados + Hotel)",
    rating: 4
  },
  {
    nombre: "Roberto",
    apellido: "Chávez",
    titulo: "Festival de Jazz en la playa",
    texto: "Soy amante del jazz y este año decidí ir al Riviera Maya Jazz Festival. 🎷 Xplora Travel me ayudó con un paquete que incluía hotel en Playa del Carmen y un pase VIP para el festival. La experiencia fue fantástica: escuchar jazz bajo las estrellas en la playa Mamitas, algo inolvidable. El hotel resultó ser pequeño pero cómodo y muy cerca del venue, tal como quería. Todo el proceso de compra fue fácil en la web de Xplora y cumplieron con todo lo ofrecido. Definitivamente recomiendo sus servicios para este tipo de eventos.",
    servicioContratado: "Paquete Riviera Maya Jazz Fest 2023",
    rating: 5
  },
  {
    nombre: "Ángel",
    apellido: "Díaz",
    titulo: "Puntuales y profesionales",
    texto: "Viajé solo a Tulum y reservé con esta agencia porque quería algo de confianza. ✈️ Desde el inicio fueron muy puntuales: recibí mis boletos electrónicos y vaucher del hotel al pagar. El transfer del aeropuerto de Cancún a Tulum llegó a tiempo y me ofrecieron agua y toalla refrescante (detalle nice). El hotel boutique en Tulum estaba increíble, tal como lo describieron. No tuve ni un solo problema, sinceramente superó mis expectativas en servicio. ¡Volveré a viajar con Xplora sin pensarlo!",
    servicioContratado: "Viaje Solo Tulum (hotel boutique)",
    rating: 5
  },
  {
    nombre: "Patricia",
    apellido: "Aguilar",
    titulo: "Cumplieron lo prometido en viaje a Disneyland",
    texto: "Llevé a mi hijo a Disneyland Los Ángeles utilizando a Xplora para que me armara el viaje. 🏰 Nos consiguieron un paquete con vuelos, hotel cerca del parque y los pases de 3 días a Disneyland y California Adventure. Fue un alivio no tener que pelear con la web de Disney para los boletos, la agencia se encargó. Todo salió genial; además nos dieron tips para ahorrar tiempo en filas. Aunque este viaje fue fuera de México, la gestión fue igual de buena. Mi hijo regresó feliz y yo también. ¡Gracias!",
    servicioContratado: "Paquete Disneyland California (Vuelo+Hotel+Pases)",
    rating: 5
  },
  {
    nombre: "Adriana",
    apellido: "Luna",
    titulo: "Buen viaje pero el hotel podía mejorar",
    texto: "Compramos un paquete a Vallarta para Navidad. 🎄 En general la agencia respondió bien: vuelos en horario cómodo, traslados privados y cena de Navidad incluida. Sin embargo, el hotel aunque bonito, tenía el servicio un poco lento (posiblemente por ser temporada alta). No es culpa directa de Xplora, pero quizás podrían elegir hoteles con mejor evaluación para esas fechas. Aun así, lo pasamos muy bien en familia y la agencia nos llamó durante el viaje para asegurarse de que todo estuviera en orden, eso se aprecia. Calificación positiva con esa pequeña reserva.",
    servicioContratado: "Navidad en Puerto Vallarta 2024 (Todo incluido)",
    rating: 4
  },
  {
    nombre: "Diego",
    apellido: "Reyes",
    titulo: "Súper viaje a la Baja",
    texto: "Xplora nos organizó un viaje por Baja California Sur espectacular. 🚗 Volamos a La Paz, ahí nos recibieron y nos dieron coche rentado incluido en el paquete. Recorrimos La Paz, Todos Santos y terminamos en Los Cabos. Los hoteles en cada ciudad fueron de primera y la ruta muy bien pensada (nos sugirieron paradas en playas hermosas como Balandra). Fue un roadtrip sin contratiempos gracias a la buena planeación. Ningún detalle negativo que mencionar, ¡10/10 en organización!",
    servicioContratado: "Roadtrip La Paz–Los Cabos (Vuelo+Auto+Hoteles)",
    rating: 5
  },
  {
    nombre: "Verónica",
    apellido: "Mendoza",
    titulo: "Viaje a Europa con concierto incluido",
    texto: "Usé Xplora Travel para un viaje a Londres ya que quería asistir al concierto de una orquesta especial en Royal Albert Hall. 🎻 La agencia armó todo: vuelo, un hotelito en Kensington y me consiguió el boleto para el concierto (que era complicado de obtener). La verdad me sorprendió la dedicación, porque no era un paquete común y aun así atendieron mi petición especial. Todo salió de maravilla, Londres fue un sueño y el evento musical ni se diga. Muy contenta con el servicio personalizado que recibí.",
    servicioContratado: "Viaje Londres + Concierto (personalizado)",
    rating: 5
  },
  {
    nombre: "Raúl",
    apellido: "Fernández",
    titulo: "Cumplió expectativas en tour de Día de Muertos",
    texto: "Tomamos el tour de Día de Muertos en Oaxaca con esta agencia. 💀 Incluyó vuelo, hotel en el centro de Oaxaca y tours a los principales eventos (visita a panteones, la comparsa de Catrinas, etc.). Fue una experiencia cultural increíble. La logística estuvo bien coordinada; en los tours éramos un grupo pequeño con guía local muy conocedor. Solo recomendaría que nos dieran más información previa sobre el clima y qué ropa llevar para las noches (pasamos algo de frío por no ir preparados). Por lo demás, excelente, un viaje muy especial que recordaremos siempre.",
    servicioContratado: "Tour Día de Muertos Oaxaca (Cultural)",
    rating: 5
  },
  {
    nombre: "Ismael",
    apellido: "Núñez",
    titulo: "Servicio atento, sin sobresaltos",
    texto: "Viajé a Cancún por trabajo pero quise quedarme el fin de semana de relax, así que contacté a Xplora para que gestionara mi estancia adicional. Me consiguieron una tarifa buenísima en un resort en la Zona Hotelera por dos noches extra con todo incluido. 🍹 Fue muy eficiente: en cuanto aprobé la cotización me enviaron la confirmación del hotel. No hubo contratiempos, la verdad es que fue un pequeño lujo bien organizado. Aunque fue algo sencillo, valoré la rapidez y atención al detalle. Seguramente los consideraré para un viaje más largo.",
    servicioContratado: "Extensión Cancún All-Inclusive (Fin de semana)",
    rating: 5
  },
  {
    nombre: "Yolanda",
    apellido: "Campos",
    titulo: "Experiencia mixta en viaje a Chiapas",
    texto: "Hicimos un recorrido por Chiapas con Xplora: Queríamos visitar San Cristóbal, Palenque y cascadas de Agua Azul. La agencia nos armó el itinerario completo y en general cumplió: los lugares hermosos, el chofer-guía local muy amable. 🌄 Pero tuvimos un inconveniente: el hotel de Palenque que nos asignaron no tenía disponible la habitación familiar la primera noche y nos reubicaron en otro hotel de menor categoría. Xplora nos compensó esa noche con un reembolso parcial, lo cual agradecemos, pero fue un mal rato llegando cansados. Fuera de eso, disfrutamos mucho el viaje. Calificación intermedia por ese detalle.",
    servicioContratado: "Circuito Chiapas (Selva y Cascadas)",
    rating: 3
  },
  {
    nombre: "Daniel",
    apellido: "Fuentes",
    titulo: "Viaje a Tomorrowland increible!",
    texto: "I used Xplora Travel to attend Tomorrowland 2024 in Belgium and it was amazing! 🎶 They handled flight, hotel in Brussels, and my Full Madness pass for the festival. As a customer from Mexico, I appreciated that they guided me through the Schengen visa process too. Everything went smoothly: flights were on time and the hotel was comfortable and festival-friendly. The agent spoke good English and was responsive. Honestly, this trip was a dream come true and Xplora made it hassle-free. Thank you so much!",
    servicioContratado: "Tomorrowland 2024 Package (Belgium)",
    rating: 5
  },
  {
    nombre: "Jazmín",
    apellido: "Salazar",
    titulo: "Viaje de graduación a Cancún",
    texto: "Organizamos el viaje de graduación con Xplora Travel para toda la clase. Éramos 25 alumnos y nos consiguieron un paquete a Cancún muy padre. 🎓🏖️ El hotel era enorme, con discoteca para el ambiente de chavos, justo lo que queríamos. Además incluía una noche en Coco Bongo para todo el grupo. La logística con tanta gente resultó bien, solo el check-in fue algo lento por ser muchos, pero nos recibieron con coctel de bienvenida así que ni lo sentimos. Gran servicio para grupos grandes, nos divertimos al máximo!",
    servicioContratado: "Paquete Graduación Cancún 2025 (Grupo)",
    rating: 5
  },
  {
    nombre: "Martin",
    apellido: "Gutierrez",
    titulo: "Great tour, but could improve communication",
    texto: "I went on a guided tour to Chichen Itza and Cenote Ik Kil from Cancun. The tour itself was wonderful, and Xplora’s price was reasonable. The guide was knowledgeable and funny. My only issue was the pickup – I waited almost 40 minutes at my hotel lobby because the van was late and I wasn’t updated of the delay until I called. It would be better if they inform in real time about delays. Other than that, a great experience and I’d still recommend the service because the places were amazing.",
    servicioContratado: "Chichén Itzá Day Tour desde Cancún",
    rating: 4
  },
  {
    nombre: "Pedro",
    apellido: "Solís",
    titulo: "Experiencia agradable en crucero",
    texto: "Contratamos un crucero por el Caribe con Xplora (salida desde Miami). 🚢 La agencia nos gestionó vuelos a Miami, una noche de hotel pre-crucero y el crucero de 7 noches que hizo escala en Bahamas, Jamaica y Cozumel. Fue una experiencia redonda. Ellos se encargaron incluso de nuestro traslado al puerto. No tuvimos que preocuparnos por documentos, todo nos lo proporcionaron en orden. Durante el viaje no hubo ningún contratiempo. Quedamos muy satisfechos, se nota la experiencia que tienen armando estos paquetes complejos.",
    servicioContratado: "Crucero Caribe Royal (Vuelo+Crucero)",
    rating: 5
  },
  {
    nombre: "Tatiana",
    apellido: "Vega",
    titulo: "Mucha aventura en poco tiempo",
    texto: "Compré el paquete multi-parque (Xcaret + Xplor + Xel-Há) a través de Xplora Travel y fue increíble. 🌟 En 3 días visitamos tres parques diferentes en Riviera Maya, con todo el transporte incluido desde nuestro hotel. Valió la pena totalmente porque nos dieron descuento por combo. El servicio fue bueno; un día el chofer llegó 10 minutos tarde al pick-up pero nada grave, además traía aguas frías para todos. Nos encantó la aventura y tener todo coordinado fue perfecto para no perdernos nada. ¡Muy recomendado para viajeros activos!",
    servicioContratado: "Combo Xcaret-Xplor-XelHá (3 días de aventura)",
    rating: 5
  },
  {
    nombre: "Santiago",
    apellido: "Juárez",
    titulo: "Vacaciones de verano excelentes",
    texto: "Mis papás y yo fuimos a la Riviera Nayarit con un paquete de Xplora. 🏖️ Nos quedamos en un resort en Nuevo Vallarta precioso, con alimentos incluidos. Lo mejor fueron los tours: uno en barco por la Bahía de Banderas donde vimos delfines y otro al pueblo de Sayulita para aprender a surfear. Todo eso venía en el paquete y lo aprovechamos al máximo. En serio fueron de las mejores vacaciones familiares. La agencia siempre fue profesional, desde que cotizamos hasta que regresamos nos dieron seguimiento. Un diez para ellos.",
    servicioContratado: "Paquete Verano Riviera Nayarit (Resort + Tours)",
    rating: 5
  },
  {
    nombre: "Kate",
    apellido: "Johnson",
    titulo: "Could be better honestly",
    texto: "I expected more from this agency. We booked a trip to Mexico City with a side trip to Teotihuacan pyramids. The flight and hotel were fine, but the tour day was a bit messy. The driver was late and we had to rush through some sites. Also, there was some confusion with the entrance tickets (they eventually sorted it out, but it caused delay). The staff was polite and apologized, but I felt things could have been organized better. It wasn’t a bad trip, but not as smooth as I hoped.",
    servicioContratado: "City + Teotihuacan Tour Package",
    rating: 3
  },
  {
    nombre: "Iván",
    apellido: "Carrillo",
    titulo: "Salida de Año Nuevo en la playa",
    texto: "Recibimos el Año Nuevo en Playa del Carmen gracias a Xplora. 🎆 El paquete incluyó la cena de gala de fin de año en el hotel y fue espectacular: música en vivo y brindis en la playa. Todo el viaje estuvo muy bien, desde los vuelos hasta las maletas que llegaron bien (siempre me preocupa). No hubo ningún contratiempo digno de mencionar, realmente disfrutamos cada momento. La agencia nos mandó un mensaje el 31 de diciembre para desearnos feliz año, pequeño detalle que se agradece. ¡Volveremos a contratar seguro!",
    servicioContratado: "Año Nuevo Playa del Carmen 2025",
    rating: 5
  },
  {
    nombre: "Marisol",
    apellido: "Peña",
    titulo: "Muy buena opción para viajar",
    texto: "He viajado dos veces con Xplora Travel, una a Chiapas y otra a Los Cabos, y en ambas la experiencia fue positiva. ✅ Destaco que tienen facilidad de pago en mensualidades, eso me ayudó mucho para el viaje de Chiapas. Todo lo que ofrecen lo cumplen: traslados, tours, hoteles buenos. En Los Cabos incluso tuve un percance que perdí un tour por llegar tarde y la agencia me gestionó reponerlo al día siguiente sin costo, cosa que no tenían obligación de hacer. Esa atención me ganó. Los recomiendo ampliamente.",
    servicioContratado: "Paquete Chiapas 2023 y Viaje Los Cabos 2024",
    rating: 5
  },
  {
    nombre: "Samuel",
    apellido: "Delgado",
    titulo: "Super concierto de rock en CDMX",
    texto: "Viaje desde Tijuana a CDMX para el concierto de los Foo Fighters en el Foro Sol. 🤘 Xplora me facilitó todo: vuelo redondo, hotel cerca del aeropuerto y boleto en gradas para el concierto. Me preocupaba la logística por la distancia, pero salió perfecto. Además conocí a otros fans en el tour del evento que también compraron con la agencia, lo cual estuvo padre. Ningún problema en absoluto, fue emocionante y sin estrés. Ya estoy viendo qué otro concierto puedo ir con su ayuda.",
    servicioContratado: "Viaje Foo Fighters CDMX 2024",
    rating: 5
  },
  {
    nombre: "Ximena",
    apellido: "Cortés",
    titulo: "Crucero por Bahamas espectacular",
    texto: "Reservé un crucero por Bahamas con Xplora y fue una gran elección. 🏝️ Me dieron un precio mejor que el que yo encontraba en internet por separado. Incluyeron el vuelo a Miami, traslados, y el crucero de 4 noches. La experiencia en el barco fue increíble (¡bebidas, comida 24h, shows!). Todo ese proceso de check-in del crucero la agencia lo hizo por mí, así llegué con todo listo. Cero contratiempos. La verdad me sentí muy tranquila dejando en sus manos la planeación, y ahora que vi lo bien que salió, repetiré sin duda en otro viaje.",
    servicioContratado: "Crucero Bahamas 2024 (Vuelo+Barco)",
    rating: 5
  },
  {
    nombre: "Miguel Ángel",
    apellido: "Hernán",
    titulo: "Excelente viaje a pesar de pequeño contratiempo",
    texto: "Nos fuimos de viaje de pareja a San Miguel de Allende aprovechando las fiestas patrias. Xplora nos consiguió un hotel boutique precioso en el centro. 🍷 La ciudad estaba llena por el 15 de septiembre y ambientazo. Todo salió de acuerdo al itinerario, salvo que el transporte de regreso se retrasó una hora por tráfico. La agencia nos informó y nos ofreció una cortesía (nos invitaron a una cata de vino en lo que esperábamos). Esos detalles hablan muy bien de su servicio. Fue un viaje corto pero muy dulce, definitivamente satisfechos.",
    servicioContratado: "Escapada Romántica San Miguel (Fiestas Patrias)",
    rating: 5
  },
  {
    nombre: "Linda",
    apellido: "Morales",
    titulo: "Magical Pueblos Mágicos trip!",
    texto: "I joined a group tour of Mexico’s Pueblos Mágicos through Xplora Travel and it was magical indeed. 🌵 We visited Peña de Bernal, Tequisquiapan, and San Miguel de Allende over 5 days. As an English speaker, I appreciated that the guide spoke English and Spanish. The itinerary was well-paced and hotels were charming and clean. I had a wonderful time meeting other travelers. The only slight issue was one hotel didn’t have WiFi in the rooms (only lobby), but that’s more a hotel thing. Overall, great organization by the agency. Highly recommend!",
    servicioContratado: "Tour Pueblos Mágicos (Querétaro & Guanajuato)",
    rating: 5
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
  constructor(private bs: MatBottomSheet, private shared: SharedDataService){
    this.rating = this.calcularPromedio(this.opinions);
    this.shared.changeHeaderType("dark");
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
