# Pilotage commercial de TaskMatch

ChatGPT et Claude peuvent utiliser un client HTTP côté serveur. Les outils MCP Human Tasks gèrent les interventions mandatées. Les métriques et les communications commerciales disposent de leurs propres routes HTTP sous `/api/v1`. La liste des routes, les modèles et les codes HTTP figurent dans le schéma OpenAPI de l’application.

## Créer et retirer un accès

L’administrateur authentifié appelle `POST /admin/growth/credentials` avec un libellé qui identifie le responsable et l’usage, une durée de 1 à 90 jours et un seul scope. Par exemple, le corps `{"label":"Claude - mesure du lancement","days":7,"scope":"growth:read"}` accorde la lecture des indicateurs. La réponse affiche le jeton une seule fois. Le stocker dans le coffre de secrets du client. Le client l’envoie dans l’en-tête HTTP `Authorization: Bearer …`. Le dépôt conserve uniquement son empreinte. Le jeton commercial ne donne accès ni au backoffice ni aux comptes des clients.

`GET /admin/growth/credentials` liste les identifiants, libellés, scopes, expirations et révocations. `DELETE /admin/growth/credentials/{id}` retire immédiatement l’accès pour les prochains appels. L’émission et la révocation laissent une trace d’audit. Prévoir un identifiant distinct par automatisation. Aucun accès permanent n’est livré avec le code.

| Permission | Opérations |
|---|---|
| `growth:read` | `GET /growth/summary`, `GET /growth/funnel`, `GET /growth/status` |
| `campaigns:read` | `GET /growth/campaigns`, inscriptions agrégées par libellé avec un groupe sans attribution |
| `communications:send` | `POST /communications/messages`, `GET /communications/messages/{id}` pour les messages de la même autorisation |

Les rapports de synthèse et de campagne acceptent `days=7` et `output=csv` ou `output=json`. Le tableau de conversion utilise les visiteurs qui ont accepté la mesure. Les comptes administrateurs, les tests, la démonstration, les comptes seedés et les origines historiques indéterminées sont exclus des inscriptions commerciales. Une cohorte vide ou trop récente n’a pas de taux de rétention observable. Les captures de paiement, remboursements, volumes et frais devisés sont des agrégats distincts.

## Messagerie individuelle

Un administrateur renseigne la permission de contacter la personne au moyen de `POST /admin/communications/recipients` et conserve son justificatif en privé. Le client commercial reçoit seulement l’identifiant du destinataire approuvé. Il soumet `recipient_id`, `campaign`, `subject` et `text`. Une répétition de la même demande retourne le message enregistré. Le délai par destinataire est de 24 heures et le plafond partagé est de 20 messages sur 24 heures. Une révocation, une opposition ou un rejet définitif intervenu avant la remise empêche un nouvel envoi. L’opérateur enregistre les désinscriptions et rebonds asynchrones avec `POST /admin/communications/recipients/{id}/suppress`, en choisissant `opt_out` ou `bounced`.

L’envoi externe requiert une identité du domaine TaskMatch explicitement activée et authentifiée par le fournisseur. Le relais historique éventuellement autorisé pour des avis internes est limité à la boîte de Sega. Une acceptation du relais est distincte de la réception dans la boîte. Les réponses vont à l’opérateur. La lecture automatisée de la boîte, le rapprochement automatique des réponses et l’import des rebonds différés demandent une autorisation et une connexion fournisseurs supplémentaires.
