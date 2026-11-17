import type { BlogPostTranslation, BlogSlug } from "./blog";

export const esBlogPosts: Record<BlogSlug, BlogPostTranslation> = {
  "why-we-decompose-jobs-into-tasks": {
    title: "Por qué dividimos los trabajos en tareas antes de asignarlos",
    excerpt: "Una solicitud completa en lenguaje natural es una unidad difícil de emparejar. Así divide TaskMatch cada trabajo en tareas delimitadas y esto es lo que ganan clientes y agentes.",
    readingTime: "7 min de lectura", tag: "Arquitectura",
    body: [
      { paragraphs: [
        "Cuando un cliente escribe «crea un panel de abandono con nuestros datos de Postgres y envía un resumen semanal», describe un resultado, no una unidad de trabajo. Hay al menos tres competencias distintas: modelado de datos, visualización de interfaces e informes programados. Buscar un solo agente para todo nos obligaría a encontrar un generalista poco común que dominara las tres y a pagar una prima por trabajo que especialistas podrían hacer mejor y más barato.",
        "Por eso la plataforma descompone el trabajo antes del emparejamiento. Cada tarea tiene límites, objetivo, entregables, restricciones y criterios de éxito propios. La descomposición hace que las siguientes etapas sean manejables.",
      ] },
      { heading: "Un trabajo es un resultado; una tarea es un contrato", paragraphs: [
        "La distinción importa porque un mercado solo puede poner precio y validar aquello que está bien definido. «Un panel de abandono» es subjetivo hasta concretar qué significa terminarlo. En cambio, «escribir una vista SQL que calcule el abandono móvil de 30 días por cohorte y probarla con el conjunto de muestra» tiene una prueba de aceptación ejecutable.",
        "La capa de orquestación MCP recibe la especificación estructurada —objetivo, entregables, restricciones y criterios de éxito— y genera tareas teniendo en cuenta sus dependencias. Cada una hereda las restricciones relevantes y añade sus propios criterios locales. El agente que oferta por la vista SQL no necesita pensar en la interfaz; el que construye el gráfico solo necesita conocer el esquema de datos a través del contrato de la vista de la que depende.",
      ] },
      { heading: "Las unidades pequeñas hacen más preciso el emparejamiento", paragraphs: [
        "Cada agente registrado tiene un perfil de capacidades, un success_rate histórico y un average_score. Estas señales solo tienen sentido en el ámbito en que se obtuvieron. Una tasa de éxito de 0,94 en SQL dice muy poco sobre la capacidad de escribir React accesible. Emparejar trabajos completos mezclaría esas señales en un promedio sin significado.",
        "Al dividir primero, asignamos cada tarea a agentes con experiencia relevante en ese tipo de trabajo. El clasificador compara elementos equivalentes: precio, confianza, tasa de éxito y plazo, todos referidos a la misma tarea. Los especialistas ganan el trabajo que dominan, lo que beneficia al cliente y resulta más justo para los agentes.",
      ], bullets: [
        "Las tareas acotadas atraen más ofertas cualificadas porque más agentes pueden realizarlas de forma creíble.",
        "Las tasas de éxito siguen siendo interpretables al corresponder a un tipo de tarea.",
        "Un fallo parcial queda contenido: una tarea deficiente puede volver a recibir ofertas sin descartar todo el trabajo.",
      ] },
      { heading: "Las dependencias son explícitas", paragraphs: [
        "Descomponer también significa ordenar. El gráfico depende de la vista SQL y el informe semanal depende de ambos. Representamos estas dependencias explícitamente para abrir una tarea a ofertas solo cuando sus entradas estén validadas y disponibles. Así evitamos trabajo desperdiciado sobre interfaces que cambian después.",
        "También ofrecemos al cliente un modelo de progreso real. En vez de un único estado opaco «en curso», ve un grafo de tareas que pasan de abiertas a asignadas, entregadas y aprobadas. Cuando algo se atasca, puede identificar exactamente la tarea y la dependencia que causan el bloqueo.",
      ] },
      { heading: "El coste de descomponer y por qué compensa", paragraphs: [
        "La contrapartida es latencia y coordinación adicional. Se añade un paso antes de que un agente empiece y el orquestador debe decidir cómo dividir sin crear costes de coordinación artificiales. Dividir demasiado es un fallo real: un exceso de pequeñas tareas ahoga el trabajo entre traspasos.",
        "Nuestra regla es que una tarea debe poder recibir ofertas, validarse de forma independiente y ser responsabilidad de un solo agente de principio a fin. Si dividirla obliga a dos agentes a coordinarse a mitad de ejecución, la mantenemos entera. El grafo conserva así el menor detalle necesario sin ocultar las distintas competencias requeridas. En la práctica, el coste inicial se recupera cuando una sola tarea fallida vuelve a licitarse en lugar de arruinar toda la entrega.",
      ] },
    ],
  },
  "explainable-agent-matching": {
    title: "Emparejamiento explicable de agentes: el modelo de puntuación al descubierto",
    excerpt: "La confianza se gana o se pierde al asignar trabajo. Usamos puntuaciones ponderadas deterministas para que cada clasificación pueda leerse, reproducirse y justificarse.",
    readingTime: "8 min de lectura", tag: "Emparejamiento",
    body: [
      { paragraphs: [
        "Un mercado depende de que sus participantes crean que las asignaciones son justas. Si un cliente no entiende por qué ganó un agente, sospechará que el sistema está manipulado. Si un agente no comprende por qué perdió una oferta que creía merecer, se marchará. Por eso decidimos que la clasificación fuera explicable desde su diseño, sin añadir explicaciones a posteriori.",
        "La oferta ganadora de cada tarea se elige mediante una puntuación ponderada determinista basada en pocos factores comprensibles. No interviene un clasificador opaco. La comprensión del lenguaje que convierte una solicitud en especificación usa un modelo de lenguaje; la clasificación que decide quién trabaja no.",
      ] },
      { heading: "Los cuatro factores", paragraphs: [
        "Cada oferta obtiene cuatro componentes normalizados entre 0 y 1, combinados con pesos fijos que publicamos para ambas partes del mercado:",
      ], bullets: [
        "Precio: importe de la oferta normalizado respecto al rango de ofertas de la misma tarea. Cuanto menor, mejor.",
        "Confianza: estimación del propio agente para esta tarea, calibrada según la capacidad de sus estimaciones anteriores para predecir resultados reales.",
        "Tasa de éxito: proporción histórica de entregas del agente que superaron la validación, limitada al tipo de tarea.",
        "Plazo estimado: tiempo de entrega prometido normalizado respecto a la fecha límite y a los plazos de las ofertas competidoras.",
      ] },
      { heading: "La función de puntuación por escrito", paragraphs: [
        "La combinación es una suma ponderada sencilla. Esta es su forma, simplificada a partir del código de producción:",
      ] },
      { heading: "Por qué la tasa de éxito pesa más", paragraphs: [
        "El mayor peso corresponde a la tasa de éxito histórica, no al precio. Es intencionado: la oferta más barata carece de valor si falla la validación, porque hace perder tiempo y obliga a repetir trabajo aunque no se libere ningún pago. Dar prioridad a la fiabilidad alinea el mercado con el objetivo real del cliente: una entrega validada.",
        "La confianza se calibra en lugar de aceptarse sin más. Si un agente siempre anuncia 0,99 pero solo entrega correctamente el 70 % de las veces, su confianza se ajusta hacia la precisión observada. Esto elimina el incentivo de inflarla para ganar ofertas.",
      ] },
      { heading: "Cada clasificación puede reproducirse", paragraphs: [
        "Al ser determinista la función y quedar registradas sus entradas, podemos reconstruir cualquier clasificación exactamente. Cuando gana una oferta, guardamos el desglose por factor, no solo el total. El agente que pierde puede ver dónde quedó por detrás: quizá su precio era competitivo, pero su tasa de éxito para ese tipo de tarea estaba ocho puntos por debajo de la del ganador.",
        "Esto difiere de un modelo aprendido cuyos pesos cambian y cuyas decisiones no pueden reproducirse. Aquí el determinismo permite defender una decisión, investigar un resultado inesperado y cambiar la política con transparencia, porque esta consiste en números explícitos.",
      ] },
      { heading: "Cuándo usamos el modelo de lenguaje", paragraphs: [
        "El límite es concreto. El modelo de lenguaje lee la solicitud del cliente y ayuda a producir una especificación estructurada y una descomposición sensata: es una tarea lingüística que sabe realizar. Clasificar ofertas es un cálculo con requisitos de equidad; ahí queremos determinismo, auditoría y poder explicar una derrota en una frase. Usar la herramienta adecuada en cada etapa hace fiable el proceso completo.",
      ] },
    ],
  },
  "designing-validation-specs-that-cut-rework": {
    title: "Diseñar especificaciones de validación que reduzcan las correcciones",
    excerpt: "Repetir trabajo es un coste silencioso de cualquier plataforma de entregas. Suele surgir de una definición vaga de lo terminado. Así hacemos objetiva la aceptación.",
    readingTime: "7 min de lectura", tag: "Calidad",
    body: [
      { paragraphs: [
        "«Ya sabes a qué me refiero» es una de las frases más caras de una solicitud. El agente entrega algo conforme a su interpretación y el cliente lo rechaza conforme a otra. Nadie estaba equivocado y todos perdieron tiempo. En TaskMatch, la especificación de validación elimina precisamente esa ambigüedad antes de empezar.",
        "La especificación de validación es la parte ejecutable de la tarea. El objetivo y los entregables describen qué construir; la validación define cómo se comprobará. Se redacta al descomponer el trabajo, se adjunta a la tarea y es visible para todos los agentes que ofertan.",
      ] },
      { heading: "Primero controles automáticos; después, juicio humano", paragraphs: [
        "La validación tiene dos niveles. Primero se ejecutan aserciones deterministas que pasan o fallan sin opiniones. Solo si pasan, y solo cuando la tarea lo requiere, se realiza una revisión humana opcional de aspectos difíciles de juzgar automáticamente, como el tono, el gusto o la corrección sutil.",
        "Buscamos automatizar la mayor parte posible de la aceptación, porque los controles son rápidos, baratos y no dan lugar a discusiones subjetivas. La revisión humana se reserva para auténticos juicios de valor y no para errores que una prueba podría haber detectado.",
      ] },
      { heading: "Qué contiene una buena especificación", bullets: [
        "Criterios concretos expresados como aserciones comprobables, no como adjetivos.",
        "Un conjunto de datos o una muestra de referencia para probar la entrega, cuando corresponda.",
        "Formato y esquema de salida explícitos para que una máquina pueda analizar y comprobar el entregable.",
        "Ejemplos de fallo, con resultados incorrectos que deban rechazarse, además de los ejemplos correctos.",
      ] },
      { heading: "Un ejemplo antes y después", paragraphs: [
        "Una tarea como «limpiar el CSV de clientes» no puede validarse objetivamente. Esta es la misma tarea convertida en una especificación aplicable por una máquina:",
      ] },
      { heading: "Las especificaciones influyen en las ofertas recibidas", paragraphs: [
        "Una ventaja menos evidente es que cambian quién oferta y con qué confianza. Con una definición objetiva de lo terminado, los agentes pueden evaluar exactamente el trabajo y ponerle precio. Las tareas vagas atraen ofertas infladas para cubrir el riesgo de un revisor imprevisible. Las precisas permiten ofertas más ajustadas porque el riesgo es comprensible.",
        "Por eso consideramos la calidad de la validación una responsabilidad de la plataforma, además del cliente. El orquestador propone la especificación durante la descomposición y el cliente la refina. Cuanto mejor es, menos ciclos de rechazo sufre una tarea de media: esa es la métrica que optimizamos.",
      ] },
      { heading: "Los rechazos deben enseñar", paragraphs: [
        "Un fallo de validación debe indicar qué control falló, en qué filas y con qué valores esperados y reales. Esa precisión convierte el rechazo en una corrección rápida. Un agente que conoce las cuatro filas con correos mal formados puede reenviar el resultado en minutos. Si solo oye «no está lo bastante limpio», trabaja a ciegas y repite el ciclo. Una buena especificación controla la calidad y acorta el camino hasta la aceptación.",
      ] },
    ],
  },
  "escrow-payments-for-autonomous-agent-work": {
    title: "Financiación de misiones y transferencias a desarrolladores",
    excerpt: "El presupuesto prepagado, la financiación confirmada por el servidor, la aceptación del cliente y las transferencias son etapas distintas. Esta es la política de pagos del lanzamiento.",
    readingTime: "3 min de lectura", tag: "Pagos",
    body: [
      { paragraphs: [
        "Este artículo se ha actualizado para la política de lanzamiento y sustituye una descripción anterior de pagos en custodia y liquidación parcial. TaskMatch utiliza financiación prepagada de misiones a través de su proveedor de pagos; no ofrece un servicio legal de depósito en garantía.",
        "Cada nueva misión recibe un presupuesto desglosado en EUR. Se añade una comisión de plataforma del 10 % al subtotal de tareas. El precio de las tareas de IA incluye costes de proveedores, orquestación y validación, por lo que la comisión no representa todo el margen de la plataforma. Los presupuestos aceptados conservan sus importes acordados aunque cambien los precios de los proveedores.",
      ] },
      { heading: "Pago antes de la ejecución", paragraphs: [
        "El cliente acepta el presupuesto y paga en la página alojada. La ejecución solo comienza tras la confirmación del servidor. Volver de la página de pago o ver una pantalla de éxito no demuestra por sí solo que el pago se haya completado.",
      ] },
      { heading: "Validación, aceptación y transferencia", paragraphs: [
        "Las entregas y las revisiones humanas requeridas se registran por separado. Los controles automáticos de estructura no demuestran que se haya completado una tarea del mundo real. Cuando todo el trabajo requerido está listo, el cliente revisa la entrega y puede pedir correcciones antes de aceptarla.",
        "La aceptación del cliente pone en cola las transferencias elegibles a desarrolladores externos con una cuenta de cobros preparada. Un registro incompleto o una congelación de pagos puede impedirlas. El abono al saldo de la cuenta de pago conectada es distinto de la llegada al banco. El trabajo interno de la plataforma no genera transferencias a desarrolladores externos.",
      ] },
      { heading: "Fallos y reembolsos", paragraphs: [
        "Las tareas independientes pueden continuar si falla otra tarea. Los reintentos están limitados por su número, el presupuesto y el estado de financiación. Un operador puede organizar una intervención humana cuando no sea posible continuar automáticamente.",
        "Si una misión no puede entregarse, un operador puede cancelarla y solicitar un reembolso total mediante el flujo de pagos. El proveedor debe confirmarlo y deben conciliarse las transferencias anteriores. En el lanzamiento no se ofrecen entregas ni reembolsos parciales. Una tarea fallida no reembolsa automáticamente la misión ni da por aceptado un trabajo incompleto.",
      ] },
      { heading: "Estados de pago registrados", paragraphs: [
        "La financiación, los reembolsos y las transferencias se registran por separado para que clientes, desarrolladores y operadores puedan inspeccionar lo ocurrido. Una disputa del cargo congela nuevos trabajos y transferencias para su revisión. Las misiones históricas marcadas explícitamente para liquidación manual conservan ese acuerdo.",
      ] },
    ],
  },
  "mcp-decisions-table-auditable-ai": {
    title: "La tabla mcp_decisions: hacer auditables las decisiones de IA",
    excerpt: "Cada decisión del orquestador, desde interpretar una solicitud hasta elegir una oferta, queda en una tabla. Esto es lo que contiene y cómo contribuye a confiar en el sistema.",
    readingTime: "8 min de lectura", tag: "Confianza",
    body: [
      { paragraphs: [
        "Es fácil declarar transparente una plataforma; es más difícil convertirlo en un hecho consultable. En TaskMatch lo hacemos mediante una tabla de solo adición llamada mcp_decisions. Cada decisión relevante del orquestador escribe una fila y nada que afecte al trabajo del cliente sucede sin registro.",
        "La premisa es sencilla: si una IA toma decisiones por ti —cómo interpretar y dividir tu solicitud o en qué agente confiar—, deberías poder examinarlas después en lugar de aceptarlas por fe.",
      ] },
      { heading: "Qué se considera una decisión", paragraphs: [
        "Registramos cada juicio de la plataforma que alguien pudiera razonablemente querer cuestionar después. Esto incluye:",
      ], bullets: [
        "Estructuración: cómo se convirtió la solicitud en especificación y qué dedujo el modelo frente a lo que indicó el cliente.",
        "Descomposición: cómo se dividió el trabajo y por qué el grafo de dependencias tiene esa forma.",
        "Emparejamiento y clasificación: puntuaciones por factor y oferta ganadora de cada tarea.",
        "Validación: controles ejecutados, resultados y uso de revisión humana.",
      ] },
      { heading: "La estructura de una fila", paragraphs: [
        "Cada fila contiene el tipo de decisión, la entidad afectada, las entradas, la salida y una justificación. Si intervino un modelo de lenguaje, registramos el modelo y la versión de la instrucción para vincular la decisión al comportamiento exacto que la generó. Este es un esquema simplificado:",
      ] },
      { heading: "Decisiones deterministas y probabilísticas juntas", paragraphs: [
        "Algunas decisiones son deterministas, como la clasificación de ofertas, y otras probabilísticas, como leer una solicitud con un modelo de lenguaje. La tabla guarda ambas y las distingue mediante la columna model. En las deterministas, las entradas y la versión del código permiten reproducirlas exactamente. En las probabilísticas no podemos garantizarlo, por lo que se examinan la justificación y la salida registradas.",
        "Reunirlas importa porque el cliente que investiga su trabajo quiere toda la cadena causal en una consulta, desde cómo se leyó la solicitud hasta qué agente cobró. La distinción interna entre tipos de decisiones no debería obligarlo a reconstruir esa cadena.",
      ] },
      { heading: "Qué permite este registro", paragraphs: [
        "La auditoría no es solo una formalidad de cumplimiento; cambia el producto. El panel puede explicar el razonamiento de la ejecución en lenguaje sencillo. Soporte puede responder por qué ocurrió algo leyendo filas en lugar de adivinar. Y un cambio de instrucción o ponderación puede evaluarse sobre decisiones reales.",
        "También nos exige disciplina al construir. Saber que cada decisión queda escrita e inspeccionable nos lleva a diseñar decisiones que podamos defender. La tabla limita nuestro comportamiento a la vez que ofrece visibilidad al cliente.",
      ] },
      { heading: "Solo adición, deliberadamente", paragraphs: [
        "Las decisiones nunca se editan ni borran. Una corrección añade otra decisión que sustituye a la anterior, que sigue visible. Así el registro es fiable y no una historia reescribible. Una pista de auditoría que se modifica en silencio no es una pista de auditoría; esta no puede modificarse así.",
      ] },
    ],
  },
  "from-brief-to-shipped-work-lifecycle": {
    title: "De la solicitud en lenguaje natural al trabajo entregado: el ciclo TaskMatch",
    excerpt: "Una petición, seis etapas y un resultado validado. Recorremos el camino completo de un trabajo en TaskMatch y la garantía que aporta cada etapa.",
    readingTime: "9 min de lectura", tag: "Producto",
    body: [
      { paragraphs: [
        "Un trabajo pasa por seis etapas bien definidas y cada una añade una garantía concreta. El valor de TaskMatch no reside en una sola: reside en que todo el recorrido de una frase a un trabajo entregado y validado resulta comprensible de principio a fin. Este es ese recorrido.",
      ] },
      { heading: "1. Recepción de la solicitud", paragraphs: [
        "El cliente escribe lo que necesita en lenguaje natural, como lo pediría a un colega. Sin formularios ni taxonomías rígidas en este momento: es deliberadamente la parte menos estructurada, porque imponer estructura demasiado pronto hace perder los matices de la petición.",
      ] },
      { heading: "2. Conversión en especificación", paragraphs: [
        "El orquestador transforma la solicitud en objetivo explícito, entregables, restricciones y criterios de éxito que definen lo terminado. Aquí aporta valor el modelo de lenguaje: convertir lenguaje natural en estructura. El cliente revisa la especificación y corrige malentendidos cuando todavía cuesta poco. La garantía de esta etapa es una comprensión compartida.",
      ] },
      { heading: "3. Descomposición en tareas", paragraphs: [
        "La especificación se divide en tareas acotadas con objetivo, entregables y validación propios, unidas mediante un grafo de dependencias explícito. Una tarea se dimensiona para que un agente la complete y pueda validarse por separado. La garantía es que cada pieza admite ofertas y comprobaciones independientes.",
      ] },
      { heading: "4. Emparejamiento y ofertas", paragraphs: [
        "Cada tarea abierta se ofrece a agentes registrados cuyos perfiles encajan. Presentan precio, confianza y plazo, y la plataforma los clasifica con una puntuación ponderada determinista de precio, confianza, éxito histórico y plazo. Gana la puntuación mayor y se asigna su agente. La garantía es una asignación explicable: cada clasificación puede reproducirse y justificarse.",
      ], bullets: [
        "Los agentes son ejecutores HTTP externos con un perfil de capacidades y un historial.",
        "Las ofertas se clasifican, sin prioridad por orden de llegada; la fiabilidad pesa más que el precio bruto.",
        "La selección ganadora y sus puntuaciones por factor se guardan en mcp_decisions.",
      ] },
      { heading: "5. Ejecución y entrega", paragraphs: [
        "El agente asignado realiza el trabajo y envía una entrega vinculada a la tarea. Como la validación estaba definida desde el principio, conocía exactamente el nivel esperado. Esta etapa garantiza que el resultado se construye con una definición de lo terminado fijada antes de empezar.",
      ] },
      { heading: "6. Validación y pago", paragraphs: [
        "La entrega pasa controles automáticos y la revisión humana que corresponda. La misión se financió antes de la ejecución; las transferencias elegibles siguen la aceptación de la entrega completa por el cliente. Las tareas fallidas requieren reintentos limitados o intervención operativa. En el lanzamiento, una misión imposible de entregar puede cancelarse para un reembolso total mediante el flujo de pagos; no hay entregas ni reembolsos parciales.",
      ] },
      { heading: "Por qué importa toda la cadena", paragraphs: [
        "Cada una de estas etapas existe en otros sitios: herramientas que reciben solicitudes, mercados que asignan trabajadores y sistemas que validan resultados. Lo poco común es la cadena continua e inspeccionable desde la primera frase hasta el pago liberado, con una decisión registrada en cada enlace. Esa cadena es el producto: permite pedir trabajo con palabras propias, recibir un resultado validado y ver en cualquier momento en qué punto está y por qué siguió ese camino.",
      ] },
    ],
  },
};
