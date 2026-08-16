/**
 * Spanish dictionary.
 *
 * The redesigned public pages and the site chrome (nav/footer) carry their own
 * per-locale copy inline, so this central dictionary acts as a safety net:
 * it inherits the English base to guarantee no raw translation keys ever
 * render, and overrides the small set of shared strings below in Spanish.
 */

const es = {
  client: {
    welcome: "Hola de nuevo, {name}",
    welcomeFallbackName: "\u00a1hola!",
    overview: "Este es un resumen de tus proyectos y tareas.",
    createJob: "Crear encargo",
    tryAgain: "Reintentar",
    loadFailed: "No se pudieron cargar los datos del panel",
    kpi: {
      myJobs: "Mis encargos",
      activeTasks: "Tareas activas",
      pendingReviews: "Revisiones pendientes",
      totalSpent: "Total gastado",
    },
    jobs: {
      title: "Mis encargos",
      subtitle: "Gestiona todos tus encargos publicados y sigue su progreso.",
      create: "Crear encargo",
      createFirst: "Crear mi primer encargo",
      retry: "Reintentar",
      found: { one: "{count} encargo encontrado", other: "{count} encargos encontrados" },
      emptyTitle: "No se encontraron encargos",
      emptyFiltered: "Ning\u00fan encargo coincide con el filtro actual. Prueba a cambiar el estado.",
      emptyAll: "Todav\u00eda no has creado ning\u00fan encargo. Publica el primero para empezar.",
      allStatuses: "Todos los estados",
      status: {
        draft: "Borrador",
        pending: "Pendiente",
        active: "Activo",
        in_progress: "En curso",
        client_review: "Revisi\u00f3n del cliente",
        completed: "Completado",
        cancelled: "Cancelado",
      },
      column: {
        title: "T\u00edtulo",
        status: "Estado",
        budget: "Presupuesto",
        tasks: "Tareas",
        deadline: "Fecha l\u00edmite",
        created: "Creado",
      },
      page: "P\u00e1gina {page} de {total}",
      previous: "Anterior",
      next: "Siguiente",
    },
    recent: {
      title: "Encargos recientes",
      subtitle: "Tus 5 encargos m\u00e1s recientes",
      viewAll: "Ver todo",
      emptyTitle: "A\u00fan no hay encargos",
      emptyBody: "Crea tu primer encargo para empezar con TaskMatch.",
      emptyCta: "Crear encargo",
      taskCount: "{count} tareas",
    },
  },

  dashboard: {
    overview: "Resumen",
    jobs: "Encargos",
    tasks: "Tareas",
    agents: "Agentes",
    bids: "Ofertas",
    submissions: "Entregas",
    validations: "Validaciones",
    payments: "Pagos",
    learning: "Aprendizaje",
    audit: "Registro de auditor\u00eda",
    loading: "Cargando\u2026",
    empty: "Todav\u00eda no hay nada aqu\u00ed.",
    error: "Algo ha salido mal. Int\u00e9ntalo de nuevo.",
    loadErrorTitle: "No se pudieron cargar estos datos",
    loadErrorBody:
      "La solicitud al servidor ha fallado. La p\u00e1gina no muestra nada en lugar de datos que podr\u00edan ser incorrectos.",
    retry: "Reintentar",
  },

  /* ------------------------------------------------------------------------ */
  /*  Presupuesto \u2014 TaskMatch fija el precio, el cliente lo aprueba          */
  /* ------------------------------------------------------------------------ */
  quote: {
    title: "Tu presupuesto",
    subtitle:
      "TaskMatch fija el precio de cada tarea \u2014 no est\u00e1s pujando en un marketplace. Nada se ejecuta ni se factura hasta que lo apruebes.",
    pricingInProgress: "Calculando el precio de tu solicitud \u2014 tarda unos segundos.",
    pricingHint:
      "TaskMatch fija un precio por tarea. Nada se ejecuta hasta que lo apruebes.",
    totalLabel: "Total",
    totalBreakdown: "Incluye",
    platformFee: "de comisi\u00f3n de plataforma",
    humanEquivalent: "Equivalente de experto humano",
    savings: "Ahorras",
    validUntil: "V\u00e1lido hasta",
    perTask: "Precio por tarea",
    routeLlm: "Agente IA",
    routeHuman: "Experto humano",
    routeHybrid: "IA + revisi\u00f3n humana",
    tokenCost: "Coste de tokens",
    compute: "C\u00f3mputo",
    orchestration: "Orquestaci\u00f3n",
    validation: "Validaci\u00f3n",
    expertRange: "Rango ofrecido a los expertos:",
    humanWouldCost: "Un experto humano costar\u00eda:",
    hoursShort: " h",
    gateNotice:
      "Aprobar libera el trabajo para su ejecuci\u00f3n y deposita el importe en dep\u00f3sito de garant\u00eda. Solo se abona contra una entrega validada.",
    accept: "Aprobar e iniciar",
    accepting: "Aprobando\u2026",
    decline: "Rechazar",
    rejecting: "Rechazando\u2026",
    confirmReject: "Confirmar rechazo",
    cancel: "Cancelar",
    rejectPrompt: "\u00bfQu\u00e9 no encaja en este precio?",
    statusAccepted: "Aprobado",
    statusRejected: "Rechazado",
    statusExpired: "Caducado",
    acceptedNotice: "Presupuesto aprobado \u2014 la ejecuci\u00f3n ha comenzado.",
    rejectedReason: "Motivo indicado:",
    requoteHint:
      "Ajusta tu brief o el modo de entrega y solicita un nuevo presupuesto.",
    errorLoad: "No se pudo cargar el presupuesto.",
    errorAccept: "No se pudo aceptar el presupuesto. Int\u00e9ntalo de nuevo.",
    errorReject: "No se pudo rechazar el presupuesto. Int\u00e9ntalo de nuevo.",
  },

  /* ------------------------------------------------------------------------ */
  /*  Entrega y traspaso                                                      */
  /* ------------------------------------------------------------------------ */
  delivery: {
    title: "Entrega y traspaso",
    subtitle:
      "C\u00f3mo te llega el trabajo terminado \u2014 un documento, un repositorio o instalado en tu propia infraestructura.",
    loading: "Cargando el plan de entrega\u2026",
    signedOff: "Conforme firmada",
    modeTitle: "Modo de entrega",
    mode: {
      document: "Documento",
      repository: "Repositorio",
      dataset: "Conjunto de datos",
      installation: "Instalaci\u00f3n",
      hosted: "Alojado",
    },
    requirements: "Lo que necesitamos de ti",
    requoteNotice:
      "Cambiar el modo de entrega cambia el trabajo necesario. Solicita un nuevo presupuesto para que el precio coincida.",
    accessTitle: "Credenciales de acceso",
    accessHelp:
      "Cifradas en reposo, reveladas un n\u00famero limitado de veces, cada acceso registrado y revocadas autom\u00e1ticamente al dar la conformidad.",
    vaultUnavailable:
      "La b\u00f3veda de credenciales no est\u00e1 configurada en este entorno, por lo que no se pueden almacenar. Contacta con tu administrador.",
    addGrant: "Compartir una credencial",
    grantLabel: "Para qu\u00e9 sirve",
    grantSecret: "Credencial",
    store: "Guardar de forma segura",
    reveal: "Revelar",
    reveals: "revelaciones",
    revoke: "Revocar",
    grantRevoked: "Revocada",
    grantExpired: "Caducada",
    signOffHelp:
      "Confirma que la entrega ha llegado. Todas las credenciales que compartiste se revocan de inmediato.",
    signOffAction: "Confirmar traspaso",
    errorUpdate: "No se pudo actualizar el modo de entrega.",
    errorGrant: "No se pudo guardar la credencial.",
    errorReveal: "Esta credencial ya no puede revelarse.",
    errorRevoke: "No se pudo revocar la credencial.",
    errorSignOff: "No se pudo confirmar el traspaso.",
  },

};

export default es;
