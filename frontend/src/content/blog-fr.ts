import type { BlogPostTranslation, BlogSlug } from "./blog";

export const frBlogPosts: Record<BlogSlug, BlogPostTranslation> = {
  "why-we-decompose-jobs-into-tasks": {
    title: "Pourquoi nous décomposons les missions en tâches avant le matching",
    excerpt: "Un besoin unique exprimé en langage naturel se prête mal au matching. Voici pourquoi TaskMatch découpe d’abord chaque mission en tâches délimitées, et ce que clients et agents y gagnent.",
    readingTime: "7 min de lecture", tag: "Architecture",
    body: [
      { paragraphs: [
        "Quand un client écrit « créez un tableau de bord d’attrition à partir de nos données Postgres et envoyez un résumé hebdomadaire », il décrit un résultat, pas une unité de travail. Cela mobilise au moins trois compétences : modélisation des données, visualisation front-end et rapports planifiés. Attribuer ce besoin à un seul agent reviendrait à chercher le rare généraliste performant sur les trois sujets, tout en payant plus cher un travail que des spécialistes pourraient mieux réaliser à moindre coût.",
        "La plateforme décompose donc la mission avant tout matching. Chaque tâche est un travail délimité, avec son propre objectif, ses livrables, ses contraintes et ses critères de réussite. Cette étape rend la suite du processus maîtrisable.",
      ] },
      { heading: "Une mission décrit un résultat ; une tâche définit un contrat", paragraphs: [
        "Cette distinction compte : une place de marché ne peut tarifer et valider que ce qui est bien défini. Un résultat comme « un tableau de bord d’attrition » reste subjectif tant que la notion de travail terminé n’est pas précisée. Une tâche comme « écrire une vue SQL calculant l’attrition glissante sur 30 jours par cohorte, testée sur le jeu de données fourni » dispose d’un test d’acceptation réellement exécutable.",
        "La couche d’orchestration MCP reçoit la spécification structurée de la mission — objectif, livrables, contraintes, critères de réussite — et produit un ensemble de tâches tenant compte de leurs dépendances. Chacune hérite des contraintes qui la concernent et ajoute ses critères locaux. L’agent qui propose une offre pour la vue SQL n’a donc pas à réfléchir au front-end ; celui qui construit le graphique n’a besoin du schéma de données qu’à travers le contrat de la vue dont il dépend.",
      ] },
      { heading: "Des unités plus petites rendent le matching pertinent", paragraphs: [
        "Chaque agent enregistré possède un profil de capacités, un success_rate historique et un average_score. Ces indicateurs n’ont de sens qu’à l’échelle où ils ont été obtenus. Un taux de réussite de 0,94 sur des tâches SQL renseigne très peu sur l’aptitude à écrire du React accessible. Un matching au niveau de la mission mélangerait ces signaux dans une moyenne sans valeur.",
        "La décomposition permet d’associer chaque tâche à des agents dont l’historique est pertinent pour ce type de travail. Le classement compare ensuite des éléments comparables : prix, confiance, taux de réussite de l’agent et délai, tous rapportés à la tâche concernée. Les spécialistes obtiennent ainsi les travaux qu’ils maîtrisent, au bénéfice du client et avec plus d’équité pour les agents.",
      ], bullets: [
        "Des tâches ciblées attirent davantage d’offres qualifiées, car plus d’agents peuvent raisonnablement les réaliser.",
        "Les taux de réussite restent interprétables puisqu’ils sont liés à un type de tâche.",
        "Un échec partiel reste circonscrit : une tâche défaillante peut être remise en concurrence sans abandonner toute la mission.",
      ] },
      { heading: "Les dépendances sont explicites", paragraphs: [
        "Décomposer, c’est aussi ordonner. Le graphique dépend de la vue SQL ; le rapport hebdomadaire dépend des deux. Nous représentons explicitement ces dépendances pour qu’une tâche ne s’ouvre aux offres qu’une fois ses entrées validées et disponibles. Cela évite de nombreux travaux inutiles construits sur une interface qui change ensuite.",
        "Le client dispose également d’un véritable modèle de progression. À la place d’un statut opaque « en cours » sur toute la mission, il voit un graphe de tâches passer d’ouvertes à attribuées, soumises puis approuvées. Si quelque chose bloque, la tâche et la dépendance responsables sont immédiatement identifiables.",
      ] },
      { heading: "Le coût de la décomposition et son intérêt", paragraphs: [
        "La contrepartie est un délai initial et un surcroît de coordination. La décomposition ajoute une étape avant qu’un agent commence et demande à l’orchestrateur de découper intelligemment, sans créer de coordination artificielle. Un découpage excessif constitue un vrai risque : trop de petites tâches noient la mission sous les passages de relais.",
        "Notre règle est qu’une tâche doit pouvoir recevoir des offres, être validée indépendamment et être menée de bout en bout par un seul agent. Si la diviser oblige deux agents à se coordonner en cours d’exécution, nous la conservons entière. Le graphe reste ainsi aussi simple que possible tout en reflétant les compétences distinctes nécessaires. En pratique, le coût initial s’amortit dès qu’une tâche défaillante peut être réattribuée au lieu de compromettre toute la livraison.",
      ] },
    ],
  },
  "explainable-agent-matching": {
    title: "Matching d’agents explicable : le modèle de classement en toute transparence",
    excerpt: "La confiance se gagne ou se perd lors du matching. Nous utilisons un score pondéré déterministe pour que chaque classement puisse être compris, reproduit et justifié.",
    readingTime: "8 min de lecture", tag: "Matching",
    body: [
      { paragraphs: [
        "Une place de marché dépend de la confiance dans l’équité de ses attributions. Un client qui ne comprend pas pourquoi un agent a gagné soupçonnera un système biaisé. Un agent qui perd une offre sans comprendre pourquoi finira par partir. Nous avons donc choisi très tôt un classement explicable dès sa conception, plutôt qu’une explication ajoutée après coup.",
        "Concrètement, l’offre retenue pour chaque tâche résulte d’un score pondéré déterministe fondé sur quelques facteurs lisibles. Aucun modèle opaque ne réalise le classement. Un grand modèle de langage transforme le besoin en spécification ; il ne décide pas qui exécutera le travail.",
      ] },
      { heading: "Les quatre facteurs", paragraphs: [
        "Chaque offre reçoit quatre composantes normalisées entre 0 et 1, combinées avec des poids fixes publiés pour les deux côtés de la place de marché :",
      ], bullets: [
        "Prix : montant de l’offre normalisé par rapport aux offres concurrentes sur la même tâche. Un prix plus bas est favorisé.",
        "Confiance : niveau annoncé par l’agent pour cette tâche précise, calibré selon la capacité de ses estimations passées à prédire les résultats réels.",
        "Taux de réussite de l’agent : proportion historique de ses soumissions ayant réussi la validation, pour le type de tâche concerné.",
        "Délai estimé : durée de livraison promise, normalisée par rapport à l’échéance de la tâche et aux délais des offres concurrentes.",
      ] },
      { heading: "La fonction de score, noir sur blanc", paragraphs: [
        "La combinaison est une simple somme pondérée. Voici sa forme, simplifiée à partir du code de production :",
      ] },
      { heading: "Pourquoi le taux de réussite pèse le plus", paragraphs: [
        "Le poids le plus élevé revient au taux de réussite historique, et c’est volontaire. L’offre la moins chère ne vaut rien si le résultat échoue à la validation : le client perd du temps et doit reprendre le travail, même si aucun paiement n’est libéré. Privilégier la fiabilité aligne la place de marché sur l’objectif réel du client : une livraison validée.",
        "La confiance est calibrée plutôt qu’acceptée telle quelle. Un agent qui annonce toujours 0,99 mais ne réussit que 70 % du temps voit son estimation ramenée vers sa précision réelle. Cela réduit l’intérêt de gonfler la confiance pour gagner des offres.",
      ] },
      { heading: "Chaque classement peut être reproduit", paragraphs: [
        "La fonction étant déterministe et ses entrées enregistrées, nous pouvons reconstituer exactement chaque classement. Lorsqu’une offre gagne, le journal conserve le détail par facteur, pas seulement le total. Un agent non retenu peut voir précisément ce qui lui a manqué : son prix était peut-être compétitif, mais son taux de réussite sur ce type de tâche était inférieur de huit points à celui du gagnant.",
        "À la différence d’un modèle appris dont les poids évoluent, le déterminisme permet ici de reproduire les décisions. Il aide à justifier un choix, à diagnostiquer un résultat surprenant et à modifier la politique de façon transparente, puisque celle-ci est définie par des nombres explicites.",
      ] },
      { heading: "Quand nous utilisons un modèle de langage", paragraphs: [
        "La frontière est précise : le modèle de langage lit le besoin du client et aide à produire une spécification structurée et une décomposition cohérente. C’est un travail linguistique qu’il sait réaliser. Classer des offres est un calcul soumis à des exigences d’équité, pour lequel nous voulons du déterminisme, une trace d’audit et la possibilité d’expliquer un refus en une phrase. Employer le bon outil à chaque étape rend l’ensemble du processus digne de confiance.",
      ] },
    ],
  },
  "designing-validation-specs-that-cut-rework": {
    title: "Concevoir des spécifications de validation qui réduisent les reprises",
    excerpt: "Les reprises constituent un coût souvent invisible des plateformes de livraison. Elles viennent surtout d’une définition floue du travail terminé. Voici comment rendre l’acceptation objective.",
    readingTime: "7 min de lecture", tag: "Qualité",
    body: [
      { paragraphs: [
        "« Vous voyez ce que je veux dire » est l’une des phrases les plus coûteuses d’un cahier des charges. Un agent livre un travail conforme à son interprétation ; le client le refuse selon une autre ; personne n’avait tort, mais tout le monde a perdu du temps. Sur TaskMatch, la spécification de validation sert précisément à supprimer cette ambiguïté avant le début du travail.",
        "Cette spécification est la partie exécutable de la tâche. L’objectif et les livrables décrivent ce qu’il faut construire ; la validation indique comment la soumission sera vérifiée. Elle est rédigée lors de la décomposition, attachée à la tâche et visible de tous les agents qui présentent une offre.",
      ] },
      { heading: "Des contrôles automatiques d’abord, le jugement humain ensuite", paragraphs: [
        "La validation comporte deux niveaux. D’abord, des assertions déterministes réussissent ou échouent sans appréciation subjective. Seulement si elles réussissent, et si la tâche le demande, une évaluation humaine facultative examine les aspects difficiles à automatiser : ton, goût ou justesse subtile.",
        "L’objectif est d’automatiser la plus grande part possible de l’acceptation, car les contrôles automatiques sont rapides, peu coûteux et sans débat d’interprétation. L’évaluation humaine est réservée aux véritables questions de jugement, plutôt qu’aux erreurs qu’un test aurait pu détecter.",
      ] },
      { heading: "Ce qu’une bonne spécification contient", bullets: [
        "Des critères d’acceptation concrets exprimés en assertions testables plutôt qu’en adjectifs.",
        "Un jeu de données ou un échantillon de référence pour tester la soumission, lorsque cela s’applique.",
        "Un format de sortie et un schéma explicites pour permettre une vérification automatique.",
        "Des exemples d’échec, c’est-à-dire des sorties incorrectes à refuser, en plus des exemples de réussite.",
      ] },
      { heading: "Un exemple avant et après", paragraphs: [
        "« Nettoyer le CSV client » ne peut pas être validé objectivement. Voici la même tâche réécrite sous forme de spécification qu’une machine peut faire respecter :",
      ] },
      { heading: "Les spécifications façonnent les offres reçues", paragraphs: [
        "Un bénéfice moins évident concerne les agents qui répondent et leur niveau de confiance. Une définition objective du résultat permet d’évaluer précisément le travail et de le tarifer. Une tâche vague attire des offres majorées pour couvrir le risque d’un évaluateur imprévisible. Une tâche précise permet des offres plus ajustées, car le risque est compréhensible.",
        "C’est pourquoi la qualité de la validation est une responsabilité de la plateforme, pas seulement du client. L’orchestrateur propose une spécification lors de la décomposition, puis le client l’affine. Plus elle est précise, moins la tâche connaît de cycles de refus en moyenne : c’est le critère que nous cherchons à améliorer.",
      ] },
      { heading: "Un refus doit permettre d’apprendre", paragraphs: [
        "En cas d’échec, le résultat doit préciser le contrôle concerné, les lignes touchées et les valeurs attendues et observées. Cette précision permet une correction rapide. Un agent qui sait quelles quatre lignes contiennent des e-mails mal formés peut soumettre à nouveau en quelques minutes. « Ce n’est pas assez propre » le laisse deviner et relance le cycle. Une bonne spécification contrôle la qualité et raccourcit le retour à l’acceptation.",
      ] },
    ],
  },
  "escrow-payments-for-autonomous-agent-work": {
    title: "Financement des missions et transferts aux développeurs",
    excerpt: "Devis prépayé, financement confirmé par le serveur, acceptation du client et transferts aux développeurs sont des étapes distinctes. Voici la politique de paiement au lancement.",
    readingTime: "3 min de lecture", tag: "Paiements",
    body: [
      { paragraphs: [
        "Cet article a été actualisé selon la politique de lancement et remplace une ancienne description de paiements de type séquestre et de règlements partiels. TaskMatch utilise un financement prépayé des missions via son prestataire de paiement ; la plateforme ne fournit pas de service juridique de séquestre.",
        "Chaque nouvelle mission reçoit un devis détaillé en EUR. Des frais de plateforme de 10 % s’ajoutent au sous-total des tâches. Le prix des tâches IA comprend les coûts des fournisseurs, l’orchestration et la validation : les frais ne constituent donc pas toute la marge de la plateforme. Un devis accepté conserve ses montants convenus si les tarifs des fournisseurs changent.",
      ] },
      { heading: "Payer avant l’exécution", paragraphs: [
        "Le client accepte le devis et paie sur la page hébergée. L’exécution ne commence qu’après confirmation du paiement côté serveur. Le retour de la page de paiement ou l’affichage d’un écran de succès ne prouve pas à lui seul que le paiement a réussi.",
      ] },
      { heading: "Validation, acceptation et transfert", paragraphs: [
        "Les soumissions et les évaluations humaines requises sont enregistrées séparément. Les contrôles automatiques de structure ne prouvent pas qu’une tâche réelle a été accomplie. Lorsque tout le travail requis est prêt, le client examine la livraison et peut demander des corrections avant de l’accepter.",
        "L’acceptation du client met en file les transferts admissibles aux développeurs externes disposant d’un compte de versement prêt. Une inscription incomplète ou un gel des paiements peut bloquer un transfert. Le crédit au solde du compte de paiement connecté est distinct de l’arrivée sur un compte bancaire. Le travail interne à la plateforme ne crée pas de transfert vers un développeur externe.",
      ] },
      { heading: "Échecs et remboursements", paragraphs: [
        "Les tâches indépendantes peuvent continuer si l’une d’elles échoue. Les nouvelles tentatives sont limitées par leur nombre, le budget et l’état du financement. Un opérateur peut organiser une intervention humaine si l’exécution automatique ne peut pas poursuivre.",
        "Si une mission ne peut pas être livrée, un opérateur peut l’annuler et demander un remboursement intégral dans le parcours de paiement. Le prestataire doit confirmer le remboursement et les transferts antérieurs doivent être rapprochés. Les livraisons et remboursements partiels ne sont pas proposés au lancement. L’échec d’une tâche ne rembourse pas automatiquement la mission et ne vaut pas acceptation d’un travail incomplet.",
      ] },
      { heading: "Des états de paiement enregistrés", paragraphs: [
        "Financement, remboursement et transfert ont des états distincts pour permettre aux clients, développeurs et opérateurs de comprendre ce qui s’est passé. Une contestation de paiement gèle les travaux et transferts suivants pour examen. Les anciennes missions explicitement prévues pour un règlement manuel conservent ce mode de règlement.",
      ] },
    ],
  },
  "mcp-decisions-table-auditable-ai": {
    title: "La table mcp_decisions : rendre les décisions IA auditables",
    excerpt: "Interprétation d’un besoin, décomposition d’une mission, sélection d’une offre : chaque décision de l’orchestrateur est enregistrée dans une table. Voici son contenu et son rôle dans la confiance.",
    readingTime: "8 min de lecture", tag: "Confiance",
    body: [
      { paragraphs: [
        "Déclarer une plateforme transparente est facile ; rendre cette transparence interrogeable l’est moins. Sur TaskMatch, le mécanisme est une table en ajout seul nommée mcp_decisions. Toute décision importante de la couche d’orchestration y ajoute une ligne ; rien de ce qui affecte le travail d’un client ne se fait sans trace.",
        "Le principe est simple : si une IA prend des décisions pour vous — interpréter le besoin, le découper ou choisir un agent — vous devez pouvoir les examiner ensuite, sans avoir à les croire sur parole.",
      ] },
      { heading: "Ce que nous considérons comme une décision", paragraphs: [
        "Nous enregistrons chaque appréciation de la plateforme qu’une personne pourrait raisonnablement vouloir contester plus tard. Cela comprend notamment :",
      ], bullets: [
        "Structuration : transformation du besoin en spécification, en distinguant ce que le modèle a déduit de ce que le client a exprimé.",
        "Décomposition : découpage en tâches et explication de la forme du graphe de dépendances.",
        "Matching et classement : scores des offres par facteur et choix du gagnant de chaque tâche.",
        "Validation : contrôles exécutés, résultats obtenus et éventuel recours à une évaluation humaine.",
      ] },
      { heading: "La structure d’une ligne", paragraphs: [
        "Chaque ligne contient le type de décision, l’entité concernée, les entrées utilisées, la sortie produite et une justification. Si un modèle de langage intervient, nous enregistrons son nom et la version de l’invite afin de relier la décision au comportement qui l’a produite. Voici un schéma simplifié :",
      ] },
      { heading: "Décisions déterministes et probabilistes au même endroit", paragraphs: [
        "Certaines décisions sont déterministes, comme le classement des offres, et d’autres probabilistes, comme la lecture d’un besoin par un modèle de langage. La table contient les deux, distinguées par la présence d’une valeur dans la colonne model. Pour les premières, les entrées et la version du code suffisent à une reproduction exacte. Pour les secondes, cette reproduction n’est pas garantie : on examine alors la justification et la sortie enregistrées.",
        "Les réunir compte pour le client qui cherche à comprendre le déroulement de sa mission. Il veut consulter toute la chaîne causale en une requête, de la lecture de son besoin jusqu’à l’agent payé, sans se soucier de cette distinction interne.",
      ] },
      { heading: "Ce que cela rend possible", paragraphs: [
        "La traçabilité modifie le fonctionnement même du produit. Le tableau de bord peut expliquer au client le raisonnement derrière sa mission en langage courant. Le support répond à « pourquoi cela s’est-il passé ? » à partir des lignes du journal. Lors d’un changement d’invite ou de pondération, nous pouvons mesurer les effets sur des décisions réelles.",
        "Cette visibilité nous impose aussi une discipline. Quand chaque décision est enregistrée et consultable, on la conçoit de manière à pouvoir la défendre. La table encadre notre comportement autant qu’elle offre une fenêtre au client.",
      ] },
      { heading: "L’ajout seul est un choix délibéré", paragraphs: [
        "Les décisions ne sont jamais modifiées ni supprimées. Une correction ajoute une nouvelle décision qui remplace l’ancienne, laquelle reste visible. Le journal est ainsi une trace fiable plutôt qu’un récit réinscriptible. Une piste d’audit modifiable discrètement ne serait pas digne de confiance ; celle-ci ne peut pas être réécrite.",
      ] },
    ],
  },
  "from-brief-to-shipped-work-lifecycle": {
    title: "Du besoin en langage naturel au travail livré : le cycle TaskMatch",
    excerpt: "Une demande, six étapes et un résultat validé. Découvrez le parcours complet d’une mission sur TaskMatch et la garantie apportée par chaque étape.",
    readingTime: "9 min de lecture", tag: "Produit",
    body: [
      { paragraphs: [
        "Une mission TaskMatch traverse six étapes bien définies, chacune apportant une garantie particulière. La valeur de la plateforme tient au parcours complet, lisible de bout en bout, d’une simple phrase à un travail livré et validé. Voici ce parcours.",
      ] },
      { heading: "1. Recueil du besoin", paragraphs: [
        "Le client commence par écrire ce dont il a besoin en langage naturel, comme il l’expliquerait à un collègue. Sans formulaire ni taxonomie rigide à cette étape : elle reste volontairement la moins structurée, car imposer trop tôt une structure ferait perdre les nuances de la demande.",
      ] },
      { heading: "2. Structuration en spécification", paragraphs: [
        "L’orchestrateur transforme le besoin en objectif explicite, livrables, contraintes et critères de réussite. Le modèle de langage est utile ici, car il sait passer du langage naturel à une structure. Le client examine la spécification et corrige les malentendus tant qu’ils sont peu coûteux. Cette étape garantit une compréhension partagée.",
      ] },
      { heading: "3. Décomposition en tâches", paragraphs: [
        "La spécification est décomposée en tâches délimitées ayant chacune objectif, livrables et validation, reliées par un graphe explicite de dépendances. Chacune peut être menée entièrement par un agent et vérifiée séparément. La garantie est que chaque unité peut recevoir des offres et être contrôlée indépendamment.",
      ] },
      { heading: "4. Matching et offres", paragraphs: [
        "Chaque tâche ouverte est proposée aux agents dont les profils correspondent. Ils soumettent un prix, un niveau de confiance et un délai. La plateforme classe les offres par un score pondéré déterministe sur le prix, la confiance, le taux de réussite historique et le délai. L’offre au meilleur score gagne et son agent est attribué. Cette étape garantit une attribution explicable, dont le classement peut être reproduit et justifié.",
      ], bullets: [
        "Les agents sont des exécutants HTTP externes avec un profil de capacités et un historique.",
        "Le classement ne dépend pas de l’ordre d’arrivée ; la fiabilité pèse davantage que le prix brut.",
        "Le choix retenu et ses scores par facteur sont enregistrés dans mcp_decisions.",
      ] },
      { heading: "5. Exécution et soumission", paragraphs: [
        "L’agent attribué réalise le travail et soumet son résultat sur la tâche. Comme la validation était définie dès le départ, il connaît exactement le niveau attendu. Cette étape garantit que le travail est produit selon une définition du résultat fixée avant le début de l’exécution.",
      ] },
      { heading: "6. Validation et paiement", paragraphs: [
        "La soumission passe les contrôles automatiques et toute évaluation humaine requise. La mission a été financée avant l’exécution ; les transferts admissibles aux développeurs suivent l’acceptation de la livraison complète par le client. Un échec nécessite des tentatives limitées ou une intervention opérationnelle. Au lancement, une mission impossible à livrer peut être annulée pour remboursement intégral via le parcours de paiement ; ni livraison partielle ni remboursement partiel ne sont proposés.",
      ] },
      { heading: "Pourquoi toute la chaîne compte", paragraphs: [
        "Chacune de ces étapes existe ailleurs : des outils recueillent les besoins, des places de marché associent des exécutants et des systèmes valident les résultats. La rareté réside dans la chaîne continue et vérifiable, de la première phrase au paiement libéré, avec une décision enregistrée à chaque articulation. Cette chaîne constitue le produit. Elle permet au client de confier une demande avec ses mots, de recevoir un travail validé et de voir à tout moment où en est sa mission et pourquoi.",
      ] },
    ],
  },
};
