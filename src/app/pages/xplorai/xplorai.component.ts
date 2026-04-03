import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { MetaHandlerService } from '../../services/meta-handler.service';

@Component({
  selector: 'app-xplorai',
  imports: [],
  templateUrl: './xplorai.component.html',
  styleUrl: './xplorai.component.scss'
})
export class XploraiComponent implements OnInit {
  constructor(private shared: SharedDataService, private meta: MetaHandlerService){}
  faqs: {question: string, answer: string}[] = [
    {
      question: "¿Qué es XplorAI?",
      answer: "Es el motor de inteligencia artificial de Xplora que analiza mercados y monedas para encontrar y priorizar la tarifa total más conveniente."
    },
    {
      question: "¿Cómo encuentra mejores tarifas?",
      answer: "Contrasta múltiples mercados, proveedores y divisas, aplica conversión inteligente y detecta ventanas de precio bajo según historial y demanda."
    },
    {
      question: "¿Cada cuánto actualiza los precios?",
      answer: "De forma continua; los listados se refrescan en segundos/minutos según la fuente. En resultados verás cuándo se actualizó por última vez."
    },
    {
      question: "¿Qué productos cubre XplorAI?",
      answer: "Vuelos primero; también soporta hoteles, paquetes y próximamente traslados y actividades cuando haya inventario elegible."
    },
    {
      question: "¿Qué es una Smart Fare?",
      answer: "Una tarifa que XplorAI marca como óptima por costo total efectivo (precio + tipo de cambio + condiciones) frente a opciones comparables."
    },
    {
      question: "¿Usa múltiples monedas y mercados?",
      answer: "Sí. Evalúa el mismo itinerario en diferentes países y monedas para aprovechar diferencias favorables de mercado."
    },
    {
      question: "¿Cómo maneja el tipo de cambio?",
      answer: "Aplica tasas de conversión confiables y muestra el total estimado en MXN, indicando la moneda original de cobro cuando aplica."
    },
    {
      question: "¿Incluye aerolíneas low-cost?",
      answer: "Sí, cuando la fuente permite comparación transparente de tarifas, cargos y políticas de equipaje."
    },
    {
      question: "¿Muestra precios finales con impuestos?",
      answer: "Sí. Prioriza el costo total con impuestos y cargos obligatorios. Extras opcionales se detallan aparte."
    },
    {
      question: "¿El precio incluye equipaje y asientos?",
      answer: "XplorAI te indica qué incluye cada tarifa. Puedes añadir equipaje/asientos antes de pagar si el proveedor lo permite."
    },
    {
      question: "¿Puedo pagar en otra moneda?",
      answer: "En ciertas ofertas sí; verás la moneda de cobro y la conversión estimada a MXN antes de confirmar."
    },
    {
      question: "¿Puedo desactivar XplorAI y ver tarifas estándar?",
      answer: "Sí. Puedes filtrar para ver únicamente tarifas locales/estándar sin optimización multi-mercado."
    },
    {
      question: "¿Qué tan precisa es la predicción de precios?",
      answer: "Es probabilística. Mejora con datos y tendencia, pero no puede garantizar futuros. Te muestra confianza y recomendaciones."
    },
    {
      question: "¿Ofrece alertas de baja de precio?",
      answer: "Sí. Puedes activar alertas por ruta/fechas y XplorAI te notificará cuando detecte una oportunidad."
    },
    {
      question: "¿XplorAI reserva por mí?",
      answer: "No decide por ti. Propone la mejor opción y tú confirmas; el flujo de pago es seguro dentro de Xplora."
    },
    {
      question: "¿Cómo decide el “mejor momento” para comprar?",
      answer: "Cruza estacionalidad, ocupación, días para el viaje y señales de inventario; sugiere comprar ahora o esperar."
    },
    {
      question: "¿Qué datos personales usa?",
      answer: "Lo mínimo necesario para tu cuenta y búsqueda. No vende datos; solo se usan para mejorar recomendaciones."
    },
    {
      question: "¿Puedo pedir que no se usen mis datos para aprendizaje?",
      answer: "Sí. En tu perfil puedes limitar personalización y excluir tus datos de modelos donde aplique."
    },
    {
      question: "¿Cómo afecta la disponibilidad real?",
      answer: "Los asientos/habitaciones cambian rápido. XplorAI valida stock al pasar al pago; si cambia, te sugiere la mejor alternativa."
    },
    {
      question: "¿Qué pasa si el precio cambia al pagar?",
      answer: "Se te avisa antes de confirmar. Si sube, verás opciones similares; si baja, se te aplica el menor precio disponible."
    },
    {
      question: "¿Funciona en todos los destinos?",
      answer: "Cubre la mayoría de rutas globales; algunas regiones pueden tener menos fuentes o reglas especiales."
    },
    {
      question: "¿En qué horarios opera?",
      answer: "24/7. Algunas fuentes externas pueden tener ventanas de mantenimiento sin afectar la búsqueda general."
    },
    {
      question: "¿Necesito crear cuenta?",
      answer: "Para guardar alertas, preferencias y emitir boletos sí; puedes explorar sin cuenta de forma limitada."
    },
    {
      question: "¿Puedo combinar puntos o millas?",
      answer: "Cuando el proveedor admite programa de lealtad, puedes capturar tu número y ver beneficios aplicables."
    },
    {
      question: "¿Cómo maneja escalas y conexiones?",
      answer: "Optimiza por tiempo total, riesgo de conexión y precio; puedes fijar mínimos de conexión y máximo de escalas."
    },
    {
      question: "¿Soporta viajes multi-ciudad?",
      answer: "Sí. Multi-city está disponible y XplorAI evalúa combinaciones que reducen costo total."
    },
    {
      question: "¿Qué pasa con cambios y cancelaciones?",
      answer: "Se muestran reglas antes de pagar. XplorAI destaca tarifas con mayor flexibilidad cuando lo priorizas."
    },
    {
      question: "¿XplorAI cobra comisión extra?",
      answer: "No. El precio mostrado ya incluye nuestra gestión; no hay sobrecargos ocultos por usar XplorAI."
    },
    {
      question: "¿En qué se diferencia de un metabuscador?",
      answer: "No solo lista; optimiza por mercado/moneda, valida reglas y recomienda el costo efectivo mejor para ti."
    },
    {
      question: "¿Qué fuentes de datos usa?",
      answer: "Consolida GDS, NDC, mayoristas, consolidadores y tarifas públicas locales cuando la integración lo permite."
    },
    {
      question: "¿Cómo se muestran las reglas de tarifa?",
      answer: "En tarjetas expandibles: cambios, cancelaciones, equipaje y restricciones clave."
    },
    {
      question: "¿Qué pasa si una tarifa parece “demasiado buena”?",
      answer: "Se revalida origen, moneda y condiciones. Si no cumple criterios de transparencia, no se ofrece para pago."
    },
    {
      question: "¿Puedo fijar preferencias de aerolínea y horarios?",
      answer: "Sí. Guarda aerolíneas favoritas, horarios, aeropuertos y XplorAI ajusta el ranking."
    },
    {
      question: "¿Cómo prioriza precio vs. tiempo de viaje?",
      answer: "Usa un score. Puedes mover el deslizador entre Precio, Duración y Flexibilidad para reordenar."
    },
    {
      question: "¿Incluye tarifas corporativas o de agencia?",
      answer: "Si tu cuenta está habilitada, XplorAI evalúa esas tarifas junto con las públicas y sugiere la mejor."
    },
    {
      question: "¿Cómo trata errores del proveedor?",
      answer: "Detecta discrepancias, limpia resultados y propone la opción válida más cercana sin perder contexto."
    },
    {
      question: "¿Puedo exportar resultados?",
      answer: "Sí. CSV/PDF y enlace compartible; las alertas guardan el criterio para futuras búsquedas."
    },
    {
      question: "¿Hay soporte humano si algo falla?",
      answer: "Sí. Contamos con atención 24/7 por WhatsApp y correo para cambios, incidencias y post-venta."
    },
    {
      question: "¿Tiene modo para agentes o marcas aliadas?",
      answer: "Sí. Existe modo profesional/white-label con políticas, márgenes y reportes dedicados."
    },
    {
      question: "¿Qué significa “transparencia total”?",
      answer: "Que ves moneda de cobro, tasas, reglas y extras antes de pagar. Sin letra chiquita."
    },
    {
      question: "¿Qué garantías ofrece?",
      answer: "Revalidación de tarifa antes de pagar y soporte para incidencias. No garantiza futuros, sí precisión y claridad."
    },
    {
      question: "¿Hay costo por usar XplorAI?",
      answer: "No hay costo adicional para el usuario final; su valor está integrado en la experiencia de compra."
    },
    {
      question: "¿Qué viene en el roadmap?",
      answer: "Pronóstico de ventanas de compra por ruta, bundles dinámicos y optimización avanzada de hoteles."
    },
    {
      question: "¿Dónde veo términos y privacidad?",
      answer: "En las secciones de Términos y Aviso de Privacidad de Xplora; enlazadas en el checkout y tu perfil."
    },
    {
      question: "¿Cómo contacto soporte?",
      answer: "Desde tu cuenta: chat/WhatsApp 24/7 y correo. Incluye tu código de búsqueda para agilizar respuesta."
    }
  ];
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || XplorAI - Inteligencia Artificial para Viajes',
      description: 'Descubre cómo XplorAI optimiza tarifas, monedas y disponibilidad para encontrar el mejor precio total en vuelos, hoteles y más.',
      image: '/assets/img/pages/xplorai/xplorai-image.jpg'
    });
    this.shared.changeHeaderType("dark");
  }
}
