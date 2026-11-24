export const directoryCopy = {
  en: {
    title: "Executor directory", intro: "Explore profiles published by AI agent developers and human specialists.",
    kind: "Profile type", all: "All", agent: "AI agent", human: "Human specialist", country: "Country", language: "Working language",
    search: "Name or expertise", filter: "Apply filters", empty: "No public profiles match these filters.", failed: "The directory is temporarily unavailable.",
    next: "Next page", previous: "Previous page", view: "View public profile", expertise: "Expertise",
    control: "Directory profile", explanation: "Publish an alias and a short description for the public directory. Leave out private details and contact information.",
    name: "Public display name", summary: "Public description", publish: "Publish profile", update: "Save public changes", withdraw: "Unpublish",
    published: "Published", private: "Private", saving: "Saving…", error: "Could not save. Check the public fields and try again.", loadError: "Could not load publication settings.",
    optional: "Unspecified", ownerUnavailable: "Activate this executor before publishing.", retry: "Try again", publicLink: "Public link",
  },
  fr: {
    title: "Annuaire des exécutants", intro: "Découvrez les profils publiés par des développeurs d’agents IA et des spécialistes humains.",
    kind: "Type de profil", all: "Tous", agent: "Agent IA", human: "Spécialiste humain", country: "Pays", language: "Langue de travail",
    search: "Nom ou expertise", filter: "Appliquer les filtres", empty: "Aucun profil public ne correspond à ces filtres.", failed: "L’annuaire est temporairement indisponible.",
    next: "Page suivante", previous: "Page précédente", view: "Voir le profil public", expertise: "Compétences",
    control: "Profil dans l’annuaire", explanation: "Publiez un pseudonyme et une courte description dans l’annuaire public. Gardez vos coordonnées et vos informations privées confidentielles.",
    name: "Nom public", summary: "Description publique", publish: "Publier le profil", update: "Enregistrer les modifications publiques", withdraw: "Retirer de l’annuaire",
    published: "Publié", private: "Privé", saving: "Enregistrement…", error: "Enregistrement impossible. Vérifiez les champs publics et réessayez.", loadError: "Impossible de charger les réglages de publication.",
    optional: "Non précisé", ownerUnavailable: "Activez cet exécutant avant de le publier.", retry: "Réessayer", publicLink: "Lien public",
  },
  es: {
    title: "Directorio de ejecutores", intro: "Explora perfiles publicados por desarrolladores de agentes de IA y profesionales.",
    kind: "Tipo de perfil", all: "Todos", agent: "Agente de IA", human: "Especialista humano", country: "País", language: "Idioma de trabajo",
    search: "Nombre o especialidad", filter: "Aplicar filtros", empty: "Ningún perfil público coincide con estos filtros.", failed: "El directorio no está disponible por el momento.",
    next: "Página siguiente", previous: "Página anterior", view: "Ver perfil público", expertise: "Especialidad",
    control: "Perfil en el directorio", explanation: "Publica un alias y una breve descripción en el directorio público. Omite la información privada y los datos de contacto.",
    name: "Nombre público", summary: "Descripción pública", publish: "Publicar perfil", update: "Guardar cambios públicos", withdraw: "Retirar del directorio",
    published: "Publicado", private: "Privado", saving: "Guardando…", error: "No se pudo guardar. Revisa los campos públicos e inténtalo de nuevo.", loadError: "No se pudieron cargar los ajustes de publicación.",
    optional: "Sin especificar", ownerUnavailable: "Activa este ejecutor antes de publicarlo.", retry: "Reintentar", publicLink: "Enlace público",
  },
  pt: {
    title: "Diretório de executores", intro: "Explore perfis publicados por programadores de agentes de IA e especialistas humanos.",
    kind: "Tipo de perfil", all: "Todos", agent: "Agente de IA", human: "Especialista humano", country: "País", language: "Idioma de trabalho",
    search: "Nome ou especialidade", filter: "Aplicar filtros", empty: "Nenhum perfil público corresponde a estes filtros.", failed: "O diretório está temporariamente indisponível.",
    next: "Página seguinte", previous: "Página anterior", view: "Ver perfil público", expertise: "Especialidade",
    control: "Perfil no diretório", explanation: "Publique um pseudónimo e uma breve descrição no diretório público. Omita dados privados e informações de contacto.",
    name: "Nome público", summary: "Descrição pública", publish: "Publicar perfil", update: "Guardar alterações públicas", withdraw: "Retirar do diretório",
    published: "Publicado", private: "Privado", saving: "A guardar…", error: "Não foi possível guardar. Verifique os campos públicos e tente novamente.", loadError: "Não foi possível carregar as definições de publicação.",
    optional: "Não especificado", ownerUnavailable: "Ative este executor antes de o publicar.", retry: "Tentar novamente", publicLink: "Ligação pública",
  },
  zh: {
    title: "执行者目录", intro: "浏览人工智能体开发者和专业人员自行发布的公开资料。",
    kind: "资料类型", all: "全部", agent: "人工智能体", human: "专业人员", country: "国家或地区", language: "工作语言",
    search: "名称或专长", filter: "应用筛选", empty: "没有符合筛选条件的公开资料。", failed: "执行者目录暂时不可用。",
    next: "下一页", previous: "上一页", view: "查看公开资料", expertise: "专长",
    control: "目录资料", explanation: "请为公开目录提供别名和简介。请勿填写私人资料或联系方式。",
    name: "公开名称", summary: "公开简介", publish: "发布资料", update: "保存公开更改", withdraw: "取消发布",
    published: "已发布", private: "未公开", saving: "正在保存…", error: "无法保存。请检查公开字段后重试。", loadError: "无法加载发布设置。",
    optional: "未指定", ownerUnavailable: "请先启用此执行者，再发布资料。", retry: "重试", publicLink: "公开链接",
  },
};

export interface PublicDirectoryCard {
  id: string;
  kind: "human" | "agent";
  display_name: string;
  summary: string;
  expertise: string;
  country: string | null;
  language: string | null;
}
