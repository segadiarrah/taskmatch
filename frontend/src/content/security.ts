export const securityCopy = {
  "en": {
    "items": [
      [
        "Service boundaries",
        "The web interface and agents call versioned APIs. Database access is handled by backend services."
      ],
      [
        "Credentials",
        "Passwords are stored as hashes. Keep access tokens and provider keys private, and use HTTPS when connecting to the service."
      ],
      [
        "Identity and access",
        "Authenticated API requests are checked against account roles and resource ownership."
      ],
      [
        "API validation",
        "Requests are validated against endpoint schemas and rejected when fields, permissions or workflow states are invalid."
      ],
      [
        "Operational records",
        "Jobs, assignments, submissions and reviews retain explicit workflow states. Audit records support operational investigation."
      ],
      [
        "Independent assurance",
        "No SOC 2 audit or certification is claimed. Contact the team for current security evidence and contractual documentation."
      ],
      [
        "Sensitive inputs",
        "Only submit data you are authorized to share. Consider which executors and configured model providers need access before including sensitive material."
      ]
    ],
    "arch": [
      "Browser",
      "API",
      "Services",
      "Database",
      "Executors"
    ],
    "check": [
      "Which roles can access this resource?",
      "Where will the supplied data be processed?",
      "Which external providers are enabled?",
      "What evidence is available for the requested security control?",
      "How can credentials be revoked or replaced?",
      "How can data access or deletion be requested?"
    ],
    "compliance": [
      "TaskMatch.ai is operated by Tauraco. The privacy policy describes the controller, processing purposes, retention criteria and contact details.",
      "Limit submitted personal data to what the work requires, and ensure you have authority to share it with the selected executors and configured providers.",
      "Access, correction, deletion and related requests can be sent to privacy@tauraco.ai. Describe the request and identify the associated account so the team can verify it.",
      "The platform uses role and ownership checks and records workflow state. Technical controls do not by themselves establish legal compliance or independent certification. Contact the team for the evidence relevant to your requirements.",
      "Privacy requests and requests for current contractual documentation should be addressed to the privacy team. Do not include passwords or access tokens in the message."
    ]
  },
  "fr": {
    "items": [
      [
        "Frontières des services",
        "L’interface web et les agents utilisent des API versionnées. Les services backend gèrent l’accès à la base de données."
      ],
      [
        "Identifiants",
        "Les mots de passe sont stockés sous forme de hachages. Gardez les jetons et clés privés et utilisez HTTPS pour vous connecter."
      ],
      [
        "Identité et accès",
        "Les requêtes authentifiées sont contrôlées selon le rôle du compte et la propriété des ressources."
      ],
      [
        "Validation API",
        "Les données sont validées selon les schémas des routes. Des champs, permissions ou états incompatibles entraînent un refus."
      ],
      [
        "Registres opérationnels",
        "Missions, affectations, soumissions et évaluations conservent des états explicites. Les journaux facilitent les investigations."
      ],
      [
        "Assurance indépendante",
        "Aucun audit ou certification SOC 2 n’est revendiqué. Contactez l’équipe pour obtenir les justificatifs de sécurité et documents contractuels actuels."
      ],
      [
        "Données sensibles",
        "Ne soumettez que des données que vous êtes autorisé à partager. Identifiez les exécutants et fournisseurs de modèles qui devront y accéder avant d’inclure des informations sensibles."
      ]
    ],
    "arch": [
      "Navigateur",
      "API",
      "Services",
      "Base de données",
      "Exécutants"
    ],
    "check": [
      "Quels rôles peuvent accéder à cette ressource ?",
      "Où les données seront-elles traitées ?",
      "Quels fournisseurs externes sont activés ?",
      "Quels justificatifs existent pour le contrôle demandé ?",
      "Comment révoquer ou remplacer les identifiants ?",
      "Comment demander l’accès ou la suppression des données ?"
    ],
    "compliance": [
      "TaskMatch.ai est exploité par Tauraco. La politique de confidentialité décrit le responsable, les finalités, les critères de conservation et les coordonnées.",
      "Limitez les données personnelles soumises aux besoins du travail. Vérifiez votre autorisation de les partager avec les exécutants et fournisseurs sélectionnés.",
      "Les demandes d’accès, de rectification, de suppression et demandes connexes peuvent être adressées à privacy@tauraco.ai. Décrivez la demande et identifiez le compte concerné pour permettre sa vérification.",
      "La plateforme contrôle les rôles et la propriété des ressources et conserve les états du travail. Ces contrôles ne prouvent pas à eux seuls la conformité juridique ou une certification indépendante. Contactez l’équipe pour les justificatifs pertinents.",
      "Adressez à l’équipe de confidentialité vos demandes relatives aux données et aux documents contractuels actuels. Ne joignez aucun mot de passe ni jeton d’accès."
    ]
  },
  "es": {
    "items": [
      [
        "Límites de los servicios",
        "La interfaz web y los agentes usan API versionadas. Los servicios del backend gestionan el acceso a la base de datos."
      ],
      [
        "Credenciales",
        "Las contraseñas se almacenan como hashes. Mantén privados los tokens y claves y usa HTTPS al conectarte."
      ],
      [
        "Identidad y acceso",
        "Las peticiones autenticadas se comprueban según el rol de la cuenta y la propiedad del recurso."
      ],
      [
        "Validación de la API",
        "Los datos se validan según los esquemas. Los campos, permisos o estados incompatibles producen un rechazo."
      ],
      [
        "Registros operativos",
        "Trabajos, asignaciones, entregas y revisiones conservan estados explícitos. Los registros de auditoría facilitan las investigaciones."
      ],
      [
        "Garantía independiente",
        "No se afirma disponer de auditoría ni certificación SOC 2. Contacta al equipo para obtener evidencias de seguridad y documentación contractual actuales."
      ],
      [
        "Datos sensibles",
        "Envía solo datos que puedas compartir legalmente. Antes de incluir información sensible, considera qué ejecutores y proveedores de modelos necesitan acceder a ella."
      ]
    ],
    "arch": [
      "Navegador",
      "API",
      "Servicios",
      "Base de datos",
      "Ejecutores"
    ],
    "check": [
      "¿Qué roles pueden acceder a este recurso?",
      "¿Dónde se tratarán los datos?",
      "¿Qué proveedores externos están activos?",
      "¿Qué evidencia existe para el control solicitado?",
      "¿Cómo revocar o sustituir credenciales?",
      "¿Cómo solicitar acceso o eliminación de datos?"
    ],
    "compliance": [
      "TaskMatch.ai es operado por Tauraco. La política de privacidad describe el responsable, las finalidades, los criterios de conservación y los contactos.",
      "Limita los datos personales enviados a lo necesario y asegúrate de estar autorizado a compartirlos con los ejecutores y proveedores seleccionados.",
      "Las solicitudes de acceso, corrección, eliminación y otros derechos se pueden enviar a privacy@tauraco.ai. Describe la solicitud e identifica la cuenta para que el equipo pueda verificarla.",
      "La plataforma comprueba roles y propiedad de recursos y registra estados del trabajo. Estos controles no demuestran por sí solos cumplimiento legal ni certificación independiente. Solicita al equipo las evidencias pertinentes.",
      "Envía las solicitudes de privacidad y documentación contractual actual al equipo de privacidad. No incluyas contraseñas ni tokens de acceso."
    ]
  },
  "zh": {
    "items": [
      [
        "服务边界",
        "网页界面和智能体通过版本化 API 进行访问。后端服务负责数据库访问。"
      ],
      [
        "凭据",
        "密码以哈希形式存储。请妥善保管访问令牌和服务商密钥，并使用 HTTPS 连接服务。"
      ],
      [
        "身份与访问",
        "经过身份验证的 API 请求会检查账户角色及资源所有权。"
      ],
      [
        "API 验证",
        "请求数据按照接口结构进行验证。当字段、权限或工作流状态不符合要求时，请求会被拒绝。"
      ],
      [
        "运营记录",
        "工作、分配、提交和审核都保留明确的流程状态。审计记录可用于运营调查。"
      ],
      [
        "独立认证",
        "我们不声称已通过 SOC 2 审计或认证。有关当前安全证明和合同文件，请联系团队。"
      ],
      [
        "敏感输入",
        "仅提交你有权分享的数据。包含敏感资料前，请先考虑哪些执行者和模型服务商需要访问。"
      ]
    ],
    "arch": [
      "浏览器",
      "API",
      "服务",
      "数据库",
      "执行者"
    ],
    "check": [
      "哪些角色可以访问此资源？",
      "提交的数据将在哪里处理？",
      "启用了哪些外部服务商？",
      "所需安全控制有哪些证明？",
      "如何撤销或更换凭据？",
      "如何申请数据访问或删除？"
    ],
    "compliance": [
      "TaskMatch.ai 由 Tauraco 运营。隐私政策说明了数据控制者、处理目的、保留标准和联系方式。",
      "请将提交的个人数据限制在工作所需范围内，并确保你有权与所选执行者及服务商共享数据。",
      "访问、更正、删除及其他请求可发送至 privacy@tauraco.ai。请说明请求并提供相关账户，以便团队核实。",
      "平台检查角色和资源所有权，并记录工作流程状态。这些技术措施本身不等于法律合规或独立认证。请联系团队获取相关证明。",
      "隐私请求和当前合同文件请求请发送给隐私团队。请勿在消息中包含密码或访问令牌。"
    ]
  }
};
