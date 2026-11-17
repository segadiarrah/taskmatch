# Human Execution Layer — conception de la première livraison

L'instruction utilisateur autorise l'exécution autonome sans attente de validation.
L'audit précède les modifications de code. Choix : extension additive de la
marketplace ; une reconstruction séparée doublerait le ledger et une simple
extension de JSON sans autorisation laisserait les budgets sans protection.

Principal : référence stable à un compte existant ; organization garde son propriétaire
responsable. Délégation : agent existant, catégories, plafond total en centimes EUR,
expiration et révocation. Jeton limité au domaine Human Tasks, jamais accepté comme
session générale. Budget réservé sous verrou, idempotence liée au principal et à
la clé ; réservation conservatrice jamais libérée automatiquement après incident.

Human Worker : profil lié au compte et au profil executor Agent existant, sans
nouveau compte ni changement de rôle. Consentement, pays, langue, zone, compétences,
disponibilité, tarif et statut de vérification ; onboarding paiement facultatif à
l'inscription. Éligibilité vérifiée avant claim et transfert, sans auto-certification.

Task porte le contrat immuable tm.human-task.v1 et un statut de revue séparé. La
création réutilise Job et Task, parent_task dans le même job. Les missions physiques
et réglementées restent en revue explicite ; aucune affirmation de légalité ne
remplace cette revue. Toutes les catégories nécessitent une décision d'un autre
utilisateur administrateur avant publication. Contrat : preuves, autorisations,
objectif, durée, langue, zone et plafond TTC comprenant frais. EUR en centimes.

Les jobs Human Tasks non financés peuvent contenir plusieurs interventions ; devis
unique réutilisant Quote/TaskQuote et frais existants de 10 %. Pas de mutation d'un
job financé ni d'ajout silencieux à un devis IA : ces cas exigent un avenant futur.
Le budget est un plafond total facturable. Aucun worker n'est affecté automatiquement
au compte interne Sega. Claim atomique, livrable structuré et relecture existants.
Résultats et événements sont accessibles par polling autorisé, pagination bornée.

Frontend : deux entrées communes à tous les rôles, demande d'intervention et espace
travailleur. Formulaires lisibles, navigation mobile, chargement/erreur/vide,
aucun besoin de saisir agent_id ou assignment_id pour le travailleur. Réemploi du
design clair et de son accent existant et traductions EN/FR/ES/ZH.

Vérification : PostgreSQL isolé, contrats exportés, contrôle négatif permissions,
plafond concurrent et replay, révocation, publication non autorisée, financement,
claim concurrent, preuves et anti auto-validation ; tests SDK et Playwright,
typecheck/lint/build. Déploiement progressif seulement après contrôles passants.
MCP/A2A et webhooks sortants restent explicitement hors de ce premier lot.
