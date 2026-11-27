# TaskMatch — parcours simples et exécution complète

Autorisation : l'utilisateur demande de compléter les fonctions restantes, de tout
faire fonctionner et de simplifier les pages publiques, sans nommer le prestataire
de paiement dans la communication publique. Exécution autonome déjà autorisée.

## Expérience produit

Trois entrées cohérentes : Confier une mission, Trouver une mission, Connecter un
agent. Les pages publiques utilisent les bénéfices et les étapes concrètes : besoin,
prix, exécution, validation, rémunération. Aucun nom de prestataire de paiement dans
les textes publics, documents marketing, démos, métadonnées ou erreurs exposées.
Conserver l'exactitude des obligations légales : les flux hébergés ou documents du
prestataire lui-même peuvent naturellement afficher son identité.
Navigation réduite, CTA aboutissant au bon parcours après inscription/connexion,
choix de profil sans compte supplémentaire, formulaires progressifs, quatre langues,
mobile, erreurs/vide/chargement explicites. Retirer faux témoignages et promesses
techniques non vérifiées. Réutiliser les composants et le style existants.

## Fonctions agents

MCP Streamable HTTP versionné et A2A JSON-RPC déclarent seulement les capacités
implémentées. Ils adaptent le contrat neutre et la même identité scoped : créer,
consulter, résultat, événements et financement sous mandat. Zéro élévation de droits.
Webhooks sortants : événements durables, snapshot immuable, livraison at-least-once,
signature HMAC horodatée, clé de déduplication et tentatives bornées. Endpoint HTTPS
public contrôlé contre SSRF/DNS rebinding et redirections ; aucune fuite de secrets
ou de données d'autres mandats. Pas de webhook envoyé sans configuration explicite.

## Paiement sous autorisation

Le principal configure une fois son moyen de paiement via un écran hébergé et
consent explicitement aux paiements ultérieurs dans ses mandats. Vérifier preuve de
configuration côté prestataire, propriétaire, mode et customer/payment_method.
Le jeton d'un agent ne peut ni configurer un moyen de paiement ni augmenter un
plafond. Après revue et devis, il peut financer uniquement son propre job dans le
montant déjà réservé. Opération durable et idempotente, même ledger et preuves de
paiement que les paiements interactifs. En cas d'authentification bancaire requise,
revenir à un état d'intervention sans prétendre le financement acquis. Ne jamais
considérer une autorisation commerciale comme un paiement reçu. Aucun débit réel
pendant les tests ni inscription de moyen de paiement sans consentement du principal.

## Missions composées et modifications

Les dépendances forment un graphe acyclique dans un job. Une tâche n'est réservable
qu'après approbation des prérequis. Le cycle historique est conservé. Les ajouts à
une mission financée sont des avenants explicitement liés et financés séparément ;
aucune mutation d'une allocation ou d'un devis historique. Les interfaces permettent
la présence physique et la zone d'intervention avec autorisations et preuves.

## Livraison

Migrations additives 006 paiement, 007 protocoles/webhooks, 008 dépendances si utile.
Tests PostgreSQL isolés, tests protocolaires, tests négatifs permissions/paiements,
tests des parcours navigateur et recherche de noms prestataire sur les surfaces
publiques. Revue indépendante avant bascule avec candidat et sauvegardes ; rapport
précis sur les contrôles exécutés et les seules conditions dépendant réellement du
client (moyen de paiement, qualifications, accès externe).
