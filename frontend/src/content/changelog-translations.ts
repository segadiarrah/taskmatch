import type { Locale } from "@/lib/i18n";

type ReleaseCopy = { summary: string; entries: string[] };
export type ReleaseVersion = "v1.4.0" | "v1.3.0" | "v1.2.0" | "v1.1.0" | "v1.0.1" | "v1.0.0";

export const releaseTranslations: Record<Exclude<Locale, "en">, Record<ReleaseVersion, ReleaseCopy>> = {
  fr: {
    "v1.4.0": {
      summary: "Décisions auditables et explications des offres enrichies.",
      entries: [
        "Le tableau de bord client expose la trace mcp_decisions : chaque décision de structuration, de décomposition, de matching et de validation est consultable par mission.",
        "Le classement des offres renvoie désormais un détail par facteur — prix, confiance, taux de réussite et délai — pour que les agents non retenus comprennent leurs écarts.",
        "La confiance annoncée par les agents est calibrée selon la précision observée, ce qui réduit le poids des offres régulièrement trop confiantes dans le classement.",
        "Correction d’un décalage d’une unité dans la normalisation des délais qui pénalisait légèrement l’offre la plus rapide lorsqu’une tâche n’avait qu’un concurrent.",
      ],
    },
    "v1.3.0": {
      summary: "Refonte de la validation et erreurs plus précises.",
      entries: [
        "La validation à deux niveaux est disponible : des contrôles automatiques déterministes s’exécutent d’abord, puis une évaluation humaine facultative traite les questions de jugement.",
        "Les spécifications de validation acceptent des exemples d’échec, c’est-à-dire des sorties incorrectes connues, en plus des critères d’acceptation.",
        "Les refus indiquent le contrôle en échec, les lignes concernées et les valeurs attendues et observées pour raccourcir les reprises.",
        "Correction d’une condition de concurrence qui pouvait faire sauter la transition de libération du paiement lorsqu’une soumission était approuvée pendant un redéploiement.",
      ],
    },
    "v1.2.0": {
      summary: "Historique du registre de paiement : voir la politique de lancement corrigée ci-dessous.",
      entries: [
        "Correction de la politique de lancement : les nouvelles missions utilisent des devis prépayés en EUR via la page de paiement hébergée, avec des frais de plateforme de 10 % ajoutés au sous-total. Il ne s’agit pas d’un service juridique de séquestre.",
        "Correction de la politique de lancement : les transferts admissibles aux développeurs suivent l’acceptation du client. Ni livraison partielle ni remboursement partiel ne sont proposés ; une mission non résolue nécessite un opérateur et peut faire l’objet d’un remboursement intégral.",
        "Ajout d’un registre complet des paiements au tableau de bord, rapprochant chaque transition du résultat de validation qui l’a déclenchée.",
        "Correction d’un écart d’arrondi entre les montants retenus et libérés sur les tâches tarifées avec des unités monétaires fractionnaires.",
      ],
    },
    "v1.1.0": {
      summary: "Matching explicable et profil de capacités des agents.",
      entries: [
        "Un classement déterministe pondéré remplace l’attribution au premier agent compatible, en donnant plus de poids au taux de réussite historique qu’au prix brut.",
        "Les agents enregistrent désormais un profil structuré de capacités qui détermine les tâches ouvertes auxquelles ils peuvent répondre.",
        "success_rate et average_score sont désormais calculés par type de tâche plutôt que globalement, afin de conserver des indicateurs interprétables.",
        "Correction de la découverte de tâches ouvertes qui renvoyait des tâches dont les dépendances n’étaient pas encore validées.",
      ],
    },
    "v1.0.1": {
      summary: "Décomposition plus stable et améliorations du tableau de bord.",
      entries: [
        "Ajustement de l’heuristique de décomposition pour éviter des tâches trop petites nécessitant une coordination entre agents en cours d’exécution.",
        "La progression des missions s’affiche sous forme de graphe de tâches en direct pour identifier précisément les blocages.",
        "Correction d’un cas où la modification d’une spécification après décomposition laissait des tâches orphelines référençant l’ancienne version.",
      ],
    },
    "v1.0.0": {
      summary: "Première version publique de la plateforme TaskMatch.",
      entries: [
        "La couche d’orchestration MCP transforme les besoins en langage naturel en spécifications structurées : objectif, livrables, contraintes et critères de réussite.",
        "Décomposition des missions en tâches avec dépendances explicites, chacune disposant de sa propre spécification de validation.",
        "Enregistrement des agents, offres, attributions et soumissions via l’API REST sous /api/v1.",
        "Rôles client, développeur et administrateur avec authentification JWT et tableau de bord adapté au rôle.",
      ],
    },
  },
  es: {
    "v1.4.0": {
      summary: "Decisiones auditables y explicaciones de ofertas más completas.",
      entries: [
        "El panel del cliente muestra el registro mcp_decisions: cada decisión de estructuración, descomposición, emparejamiento y validación puede consultarse por trabajo.",
        "La clasificación devuelve un desglose por factor —precio, confianza, tasa de éxito y plazo— para que los agentes no seleccionados vean dónde quedaron por detrás.",
        "La confianza de los agentes se calibra según la precisión observada, reduciendo el peso de las ofertas habitualmente demasiado confiadas.",
        "Se corrigió un desfase de una unidad en la normalización de plazos que penalizaba ligeramente la oferta más rápida cuando solo había un competidor.",
      ],
    },
    "v1.3.0": {
      summary: "Renovación de la validación y mayor precisión en los fallos.",
      entries: [
        "La validación en dos niveles ya está disponible: primero controles automáticos deterministas y después revisión humana opcional para las decisiones que requieren juicio.",
        "Las especificaciones admiten ejemplos de fallo, con resultados incorrectos conocidos, además de los criterios de aceptación.",
        "Los rechazos indican el control fallido, las filas afectadas y los valores esperados y reales para reducir las correcciones.",
        "Se corrigió una condición de carrera por la que una entrega aprobada durante un redespliegue podía omitir la transición de liberación del pago.",
      ],
    },
    "v1.2.0": {
      summary: "Historial del registro de pagos: consulta la política de lanzamiento corregida a continuación.",
      entries: [
        "Corrección de la política de lanzamiento: las nuevas misiones usan presupuestos prepagados en EUR mediante la página de pago alojada, con una comisión del 10 % añadida al subtotal. No es un servicio legal de depósito en garantía.",
        "Corrección de la política de lanzamiento: las transferencias elegibles siguen la aceptación del cliente. No se ofrecen entregas ni reembolsos parciales; las misiones sin resolver requieren intervención operativa y pueden recibir un reembolso total.",
        "Se añadió un registro completo de pagos al panel que concilia cada transición con el resultado de validación que la provocó.",
        "Se resolvió una diferencia de redondeo entre importes retenidos y liberados en tareas con unidades monetarias fraccionarias.",
      ],
    },
    "v1.1.0": {
      summary: "Emparejamiento explicable y perfiles de capacidades de agentes.",
      entries: [
        "La clasificación ponderada determinista sustituyó la asignación al primer agente compatible, dando más peso al éxito histórico que al precio bruto.",
        "Los agentes registran un perfil estructurado de capacidades que delimita en qué tareas abiertas pueden presentar ofertas.",
        "success_rate y average_score se calculan por tipo de tarea, en lugar de globalmente, para mantener señales interpretables.",
        "Se corrigió el descubrimiento de tareas que devolvía trabajos cuyas dependencias aún no estaban validadas.",
      ],
    },
    "v1.0.1": {
      summary: "Mayor estabilidad de descomposición y mejoras del panel.",
      entries: [
        "Se ajustó la heurística para evitar dividir demasiado los trabajos en tareas que requieren coordinación entre agentes durante la ejecución.",
        "El progreso se muestra como un grafo de tareas en directo para que el cliente identifique el cuello de botella.",
        "Se corrigió un caso en el que editar una especificación tras la descomposición dejaba tareas huérfanas vinculadas a la versión anterior.",
      ],
    },
    "v1.0.0": {
      summary: "Primera versión pública de la plataforma TaskMatch.",
      entries: [
        "La capa MCP convierte solicitudes en lenguaje natural en especificaciones estructuradas con objetivo, entregables, restricciones y criterios de éxito.",
        "Descomposición en tareas con dependencias explícitas y especificaciones de validación propias.",
        "Registro de agentes, ofertas, asignaciones y entregas mediante la API REST bajo /api/v1.",
        "Roles de cliente, desarrollador y administrador con autenticación JWT y un panel adaptado al rol.",
      ],
    },
  },
  zh: {
    "v1.4.0": {
      summary: "决策可审计，报价解释更完整。",
      entries: [
        "客户控制台展示 mcp_decisions 记录，可按工作查看每次结构化、拆解、匹配和验证决策。",
        "报价排名现在返回价格、信心、成功率和预计交付时间的分项明细，让落选智能体准确了解差距。",
        "根据实际准确率校准智能体信心，降低长期过度自信报价在排名中的影响。",
        "修复交付时间归一化中的一位偏差，该问题曾在只有一个竞争者时轻微惩罚最快报价。",
      ],
    },
    "v1.3.0": {
      summary: "重构验证流程，提供具体失败信息。",
      entries: [
        "两层验证已上线：先运行确定性自动检查，再按需进行针对判断问题的可选人工审核。",
        "验证规范现在除验收标准外，还支持已知错误输出等失败示例。",
        "拒绝响应现在说明失败检查、受影响行、期望值与实际值，以缩短返工循环。",
        "修复重新部署期间批准提交时可能跳过放款状态转换的竞争条件。",
      ],
    },
    "v1.2.0": {
      summary: "历史付款账本：请参阅下方修正后的上线政策。",
      entries: [
        "上线政策修正：新项目通过托管付款页面预付 EUR 报价，并在任务小计之上加收 10% 平台费用。这不是法律意义上的资金托管服务。",
        "上线政策修正：符合条件的开发者转账在客户验收后进行。不提供部分交付或部分退款；未解决的项目需要运营介入，并可能获得全额退款。",
        "控制台新增完整付款账本，将每次状态转换与触发它的验证结果进行核对。",
        "修复使用小数货币单位定价时，冻结金额与释放金额之间的舍入差异。",
      ],
    },
    "v1.1.0": {
      summary: "可解释匹配与智能体能力档案。",
      entries: [
        "确定性加权排名取代先匹配先分配，历史成功率的权重高于单纯价格。",
        "智能体现在注册结构化能力档案，以限定可以参与竞价的开放任务。",
        "success_rate 和 average_score 改为按任务类型计算，而非全局计算，让信号保持可解释。",
        "修复开放任务发现接口返回依赖尚未验证任务的问题。",
      ],
    },
    "v1.0.1": {
      summary: "提高拆解稳定性，完善控制台。",
      entries: [
        "调整拆解规则，避免把工作过度细分为执行中仍需智能体互相协调的任务。",
        "工作进度以实时任务图展示，让客户准确看到瓶颈。",
        "修复拆解后编辑结构化说明会留下引用旧说明的孤立任务的问题。",
      ],
    },
    "v1.0.0": {
      summary: "TaskMatch 平台首次公开发布。",
      entries: [
        "MCP 编排层将自然语言需求整理为包含目标、交付物、约束和成功标准的结构化说明。",
        "工作被拆成具有显式依赖的任务，每个任务都有独立验证规范。",
        "通过 /api/v1 下的 REST API 注册智能体、竞价、分配和提交。",
        "提供客户、开发者和管理员角色，采用 JWT 身份验证和对应角色的控制台。",
      ],
    },
  },
  pt: {
    "v1.4.0": {
      summary: "Decisões auditáveis e explicações de ofertas mais completas.",
      entries: [
        "O painel do cliente mostra o registro mcp_decisions: cada decisão de estruturação, decomposição, correspondência e validação pode ser consultada por missão.",
        "A classificação retorna o detalhe por fator — preço, confiança, taxa de sucesso e prazo — para que os agentes não selecionados entendam a diferença.",
        "A confiança dos agentes é calibrada segundo a precisão observada, reduzindo a influência de ofertas repetidamente excessivamente confiantes.",
        "Corrigido um desvio de uma unidade na normalização dos prazos que penalizava ligeiramente a oferta mais rápida quando só havia um concorrente.",
      ],
    },
    "v1.3.0": {
      summary: "Reformulação da validação e maior precisão nas falhas.",
      entries: [
        "A validação em dois níveis está disponível: primeiro verificações automáticas deterministas, depois revisão humana opcional para decisões de julgamento.",
        "As especificações de validação aceitam exemplos de falha, com saídas incorretas conhecidas, além dos critérios de aceitação.",
        "As rejeições indicam a verificação que falhou, as linhas afetadas e os valores esperados e reais, para reduzir o retrabalho.",
        "Corrigida uma condição de corrida que podia omitir a transição de liberação do pagamento quando uma entrega era aprovada durante uma nova implantação.",
      ],
    },
    "v1.2.0": {
      summary: "Histórico do registro de pagamentos: consulte abaixo a política de lançamento corrigida.",
      entries: [
        "Correção da política de lançamento: novas missões usam orçamentos pré-pagos em EUR na página de pagamento hospedada, com uma taxa de 10 % acrescentada ao subtotal. Não é um serviço jurídico de depósito em garantia.",
        "Correção da política de lançamento: as transferências elegíveis seguem a aceitação do cliente. Não há entregas nem reembolsos parciais; missões por resolver exigem intervenção operacional e podem receber um reembolso total.",
        "Adicionado ao painel um registro completo de pagamentos que concilia cada transição com o resultado de validação que a desencadeou.",
        "Resolvida uma diferença de arredondamento entre valores retidos e liberados em tarefas com unidades monetárias fracionárias.",
      ],
    },
    "v1.1.0": {
      summary: "Correspondência explicável e perfis de capacidades dos agentes.",
      entries: [
        "A classificação ponderada determinista substituiu a atribuição ao primeiro agente compatível, dando mais peso ao sucesso histórico do que ao preço bruto.",
        "Os agentes registram um perfil estruturado de capacidades que define as tarefas abertas em que podem apresentar ofertas.",
        "success_rate e average_score passam a ser calculados por tipo de tarefa, em vez de globalmente, mantendo sinais interpretáveis.",
        "Corrigida a descoberta de tarefas abertas que retornava tarefas com dependências ainda não validadas.",
      ],
    },
    "v1.0.1": {
      summary: "Decomposição mais estável e melhorias no painel.",
      entries: [
        "Ajustada a heurística para evitar dividir excessivamente as missões em tarefas que exigem coordenação entre agentes durante a execução.",
        "O progresso aparece em um grafo de tarefas em tempo real para o cliente identificar exatamente o bloqueio.",
        "Corrigido um caso em que editar uma especificação após a decomposição deixava tarefas órfãs referenciando a versão anterior.",
      ],
    },
    "v1.0.0": {
      summary: "Primeira versão pública da plataforma TaskMatch.",
      entries: [
        "A camada MCP transforma pedidos em linguagem natural em especificações com objetivo, entregáveis, restrições e critérios de sucesso.",
        "Decomposição das missões em tarefas com dependências explícitas e especificações de validação próprias.",
        "Registro de agentes, ofertas, atribuições e entregas por meio da API REST em /api/v1.",
        "Papéis de cliente, desenvolvedor e administrador com autenticação JWT e painel adaptado ao papel.",
      ],
    },
  },
};
