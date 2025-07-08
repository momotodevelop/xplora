import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-xplorers-landing',
  imports: [],
  templateUrl: './xplorers-landing.component.html',
  styleUrl: './xplorers-landing.component.scss'
})
export class XplorersLandingComponent implements OnInit {
  constructor(private shared: SharedDataService, private title: Title){}
  faqs: {question: string, answer: string}[] = [
    {
      question: "¿Quién puede unirse al Xplorers Club?",
      answer: "Cualquier persona mayor de edad puede participar, ya sea usuario, amigo, familiar o influencer."
    },
    {
      question: "¿Cuál es el objetivo principal del Xplorers Club?",
      answer: "El Xplorers Club está diseñado para recompensar a nuestros usuarios por compartir su amor por Xplora Travel y referir nuevos clientes."
    },
    {
      question: "¿Necesito tener experiencia previa en ventas o marketing para unirme?",
      answer: "No, no necesitas experiencia previa. El programa está diseñado para ser fácil de usar para todos."
    },
    {
      question: "¿Hay algún costo por unirme al Xplorers Club?",
      answer: "No, unirse al Xplorers Club es completamente gratis."
    },
    {
      question: "¿Qué es Xplorer Points?",
      answer: "Todas tus ganancias de referidos se abonan en Xplorer Points, donde 1 Xplorer Point equivale a $1 MXN."
    },
    {
      question: "¿Cómo me registro en el Xplorers Club?",
      answer: "Puedes registrarte a través del botón 'Regístrate' en la página principal del Xplorers Club."
    },
    {
      question: "¿Cuándo recibo mi enlace de referido?",
      answer: "Una vez registrado, tu enlace de referido personalizado estará disponible en tu panel de usuario."
    },
    {
      question: "¿Puedo personalizar mi enlace de referido?",
      answer: "Actualmente, los enlaces son generados automáticamente, pero estamos trabajando en futuras opciones de personalización."
    },
    {
      question: "¿Qué pasa si olvido mi contraseña de mi panel de Xplorer?",
      answer: "Puedes restablecer tu contraseña a través de la opción 'Olvidé mi contraseña' en la página de inicio de sesión."
    },
    {
      question: "¿Mi enlace de referido tiene una fecha de caducidad?",
      answer: "No, tu enlace de referido no caduca mientras tu cuenta de Xplorers Club esté activa."
    },
    {
      question: "¿Cómo se rastrean mis referidos?",
      answer: "Tus referidos se rastrean automáticamente a través de tu enlace único. Cuando alguien hace clic en tu enlace y realiza una reservación, se te atribuye la referencia."
    },
    {
      question: "¿Cómo sé si una reservación fue hecha a través de mi enlace?",
      answer: "Podrás ver todas las reservaciones atribuidas a tu enlace en tu panel de usuario de Xplorer."
    },
    {
      question: "¿Qué es el bono de $450 MXN?",
      answer: "Es un bono adicional que recibes por cada nuevo cliente que se registra y realiza su primera reservación a través de tu enlace. Este bono se aplica solo a la primera reservación de cada cliente."
    },
    {
      question: "¿Cuándo se paga el bono de $450 MXN?",
      answer: "El bono se paga 3 días después de la fecha de viaje del referido. En caso de vuelos redondos o paquetes con avión, la fecha de pago será 3 días después de la fecha de ida."
    },
    {
      question: "¿Qué porcentaje de comisión obtengo por cada reservación referida?",
      answer: "Tu porcentaje de comisión varía según tu nivel en el Xplorers Club, comenzando en un 15% y llegando hasta un 25%."
    },
    {
      question: "¿Se aplica la comisión a cualquier tipo de reservación (vuelos, hoteles, paquetes, etc.)?",
      answer: "Sí, tu comisión se aplica sobre el monto total en bruto de cualquier reservación realizada a través de tu enlace."
    },
    {
      question: "¿Hay límite de referidos que puedo tener?",
      answer: "¡No hay límite! Puedes invitar a tantas personas como desees."
    },
    {
      question: "¿Un mismo cliente puede usar mi código de referido varias veces?",
      answer: "Sí, el código de referido de un usuario puede ser usado múltiples veces por el mismo cliente. Sin embargo, el bono de referido de primera ocasión solo se aplicará la primera vez."
    },
    {
      question: "¿Qué sucede si un referido cancela su reservación?",
      answer: "Las cancelaciones de referidos no son cancelables. En caso de problemas relacionados con el pago de la reservación posterior a la fecha de pago del bono (contracargos, etc.), se descontará del total disponible de Xplorers Points."
    },
    {
      question: "¿Si un cliente usa un código de descuento diferente al mío, aún recibo mi comisión?",
      answer: "Para que la reservación se atribuya a ti y recibas comisión, el cliente debe usar tu enlace de referido."
    },
    {
      question: "¿Cómo subo de nivel en el Xplorers Club?",
      answer: "Subes de nivel acumulando el monto total bruto de todas las reservaciones referidas a través de tu enlace."
    },
    {
      question: "¿El monto acumulado para subir de nivel se reinicia?",
      answer: "Sí, el monto se reinicia cada año en el aniversario de tu registro en el Xplorers Club."
    },
    {
      question: "¿Puedo bajar de nivel si no cumplo las metas anuales?",
      answer: "No, una vez que alcanzas un nivel, nunca podrás disminuir, manteniéndote en ese nivel por 5 años. Sin embargo, para mantener tu nivel, es necesario realizar al menos una reservación referida al año. Después de 5 años sin actividad, tu nivel comenzará a disminuir 1 nivel por año."
    },
    {
      question: "¿Qué es el Kit de Bienvenida del Nivel 5?",
      answer: "Es un kit especial que incluye dos playeras, un termo tipo Yeti, un kit de ventas (libreta rotulada, juego de estampas) y una terminal bancaria (Clip) para procesar cobros de tus reservaciones."
    },
    {
      question: "¿Cómo funcionan los descuentos para mis referidos a partir del Nivel 5?",
      answer: "A partir del Nivel 5, tus referidos recibirán un porcentaje de descuento adicional sobre el monto total de sus reservaciones, que se aplicará automáticamente al usar tu enlace."
    },
    {
      question: "¿Qué son los sorteos para eventos exclusivos?",
      answer: "Los usuarios de Nivel 5 o superiores tendrán acceso a sorteos para asistir a eventos exclusivos en algunos de los destinos donde Xplora Travel tiene operaciones."
    },
    {
      question: "¿Cómo puedo canjear los vuelos redondos nacionales gratuitos?",
      answer: "Podrán ser canjeados desde tu cuenta de Xplorers, y el titular de la reservación puede ser cualquier persona."
    },
    {
      question: "¿Los vuelos gratuitos tienen restricciones de aerolíneas o fechas?",
      answer: "Se aplican términos y condiciones que se especificarán al momento del canje, pero ofrecemos flexibilidad para que puedas aprovecharlos al máximo."
    },
    {
      question: "¿Qué tipo de eventos exclusivos puedo esperar si llego al Nivel 5 o superior?",
      answer: "Estos eventos pueden incluir lanzamientos de productos, fiestas de celebración, y experiencias de viaje VIP, entre otros."
    },
    {
      question: "¿Hay algún otro beneficio sorpresa en los niveles más altos?",
      answer: "¡Sí! En los niveles más altos te esperan sorpresas y beneficios aún más exclusivos, como un viaje anual pagado para 2 personas a un destino sorpresa de Xplora Travel en el Nivel 10."
    },
    {
      question: "¿Cómo recibo mis recompensas?",
      answer: "Las recompensas se otorgan automáticamente en Xplorer Points cuando tus referidos se registran y usan Xplora."
    },
    {
      question: "¿Hay un monto mínimo para poder retirar mis ganancias?",
      answer: "Sí, para realizar un retiro, necesitas acumular al menos $1999 MXN en Xplorer Points."
    },
    {
      question: "¿Cómo se realiza el retiro de mis Xplorer Points?",
      answer: "Los retiros se realizan por medio de transferencia a una cuenta CLABE mexicana."
    },
    {
      question: "¿Cuánto tiempo tarda en procesarse un retiro?",
      answer: "Los retiros suelen procesarse en un plazo de 3 a 5 días hábiles después de la solicitud."
    },
    {
      question: "¿Mis Xplorer Points caducan?",
      answer: "No, tus Xplorer Points no tienen fecha de caducidad mientras tu cuenta de Xplorers Club esté activa."
    },
    {
      question: "¿Dónde encuentro mi panel de control de Xplorers Club?",
      answer: "Tu panel de control se habilitará en el área de usuario de Xplora Travel."
    },
    {
      question: "¿Qué información puedo ver en mi panel de control?",
      answer: "En tu panel, podrás ver tus ganancias, el estado de tus referidos, tu progreso de nivel y herramientas de marketing."
    },
    {
      question: "¿Hay algún material de marketing que pueda usar?",
      answer: "Sí, especialmente a partir del Nivel 5 con el kit de ventas, y también tendrás acceso a recursos digitales en tu panel."
    },
    {
      question: "¿A quién puedo contactar si tengo dudas o problemas con mi cuenta de Xplorers Club?",
      answer: "Puedes contactar a nuestra línea de atención exclusiva para Xplorers Club: (+52) 5596603305."
    },
    {
      question: "¿Existe una comunidad para Xplorers Club donde pueda conectar con otros miembros?",
      answer: "Estamos trabajando en la creación de una comunidad exclusiva para Xplorers, ¡mantente atento a las novedades!"
    },
    {
      question: "¿Xplora Travel ofrece capacitación o consejos para ayudarme a ser un mejor referente?",
      answer: "Sí, a partir de ciertos niveles, ofrecemos webinars y sesiones de capacitación personalizadas para ayudarte a maximizar tus referidos."
    },
    {
      question: "¿Dónde puedo encontrar los términos y condiciones completos del Xplorers Club?",
      answer: "Los términos y condiciones completos están disponibles en nuestra página web, en la sección del Xplorers Club."
    },
    {
      question: "¿El Xplorers Club está disponible en todos los países?",
      answer: "Actualmente, el Xplorers Club está enfocado en el mercado mexicano, con beneficios aplicables a este territorio."
    },
    {
      question: "¿Xplora Travel puede modificar los términos y condiciones del Xplorers Club?",
      answer: "Sí, Xplora Travel se reserva el derecho de modificar los términos y condiciones del programa, siempre notificando a sus miembros con anticipación."
    },
    {
      question: "¿Qué sucede si se detecta un fraude o abuso en el uso del enlace de referido?",
      answer: "Xplora Travel se reserva el derecho de suspender o cancelar la cuenta de Xplorers Club en caso de detectarse fraude o abuso."
    }
  ]
  ngOnInit(): void {
    this.title.setTitle("Xplora Travel || Xplorers Club");
    this.shared.changeHeaderType("dark");
  }

}
