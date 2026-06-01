# Backend contract

L'app peut fonctionner sans backend grâce aux données locales, mais elle tentera de lire
Supabase en priorité si les variables sont définies. Elle garde aussi la compatibilité
avec un backend HTTP simple via `EXPO_PUBLIC_MUSLIMIN_API_URL`.

## Configuration Expo

Créer un fichier `.env` à la racine :

```bash
EXPO_PUBLIC_MUSLIMIN_API_URL=https://votre-domaine.fr/api
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

Puis relancer Expo.

## Supabase

Le fichier `docs/supabase-schema.sql` contient les tables et les règles RLS de départ :

- `announcements` pour les infos locales et prières mortuaires.
- `admins` pour limiter l'écriture aux comptes autorisés.
- `device_tokens` pour préparer les notifications push.
- `feedback_submissions` pour archiver les formulaires "Proposer une info".
- `mosques` pour gérer les mosquées visibles et celles reliées à Mawaqit.
- `local_events` pour les prochaines données dynamiques.

Après avoir créé le projet Supabase :

1. Coller `docs/supabase-schema.sql` dans le SQL editor Supabase.
2. Créer un utilisateur admin dans Auth.
3. Ajouter son `user_id` dans la table `admins`.
4. Copier l'URL et la clé anon dans `.env`.

L'app lira alors les annonces Supabase dans `Infos locales`, et l'écran `Plus > Administration`
permettra de publier de nouvelles annonces.

## GET /announcements

Ce endpoint est facultatif si Supabase est utilisé. Il reste utile pour brancher un autre backend.

Retour attendu, soit directement un tableau, soit un objet `{ "announcements": [...] }`.

```json
{
  "announcements": [
    {
      "id": "janaza-2026-05-27-1",
      "title": "Prière mortuaire",
      "category": "Prières mortuaires",
      "date": "Aujourd'hui, après Dhuhr",
      "location": "Mosquée de Bouzignac",
      "summary": "Informations vérifiées à afficher à la communauté.",
      "isImportant": true
    }
  ]
}
```

Catégories acceptées :

- `Mosquée`
- `Cours`
- `Solidarité`
- `Famille`
- `Prières mortuaires`

## Comportement hors-ligne

Quand `/announcements` répond correctement, l'app sauvegarde les annonces en cache local.
Si le backend devient indisponible ensuite, l'app réaffiche automatiquement la dernière version
connue avant de revenir aux données locales provisoires si aucun cache n'existe.

## Administration

Le panneau admin permet maintenant :

- créer, modifier, masquer et supprimer une annonce ;
- valider les propositions d'information reçues : accepter directement, refuser, ou modifier avant publication ;
- publier rapidement une prière mortuaire ;
- créer, modifier et supprimer une mosquée ;
- envoyer une notification push pour une annonce via la fonction Edge `send-push`.
- recevoir les propositions d'information via la fonction Edge `send-feedback`.

## Mosquées dynamiques

Quand Supabase est configuré, l'app lit aussi la table `mosques`. Les mosquées locales
du code restent disponibles en secours, et les données Supabase les remplacent si l'ID est identique.

Une mosquée avec `mawaqit_url` apparait dans le carrousel des horaires. Sans `mawaqit_url`,
elle apparait seulement dans la liste des lieux localisés.

## Fonction Edge send-push

La fonction `supabase/functions/send-push/index.ts` lit une annonce et les tokens actifs,
puis appelle l'API Expo Push. Elle exige une session Supabase valide et vérifie que
l'utilisateur existe dans `public.admins`.

Déploiement :

```bash
npx supabase functions deploy send-push
```

## Fonction Edge send-feedback

La fonction `supabase/functions/send-feedback/index.ts` reçoit le formulaire "Proposer",
vérifie que l'adresse mail est valide, puis envoie automatiquement le message à la boîte
configurée avec Resend. L'app n'ouvre plus l'application Mail de l'utilisateur.

Le formulaire "Proposer une info" peut aussi transmettre une photo facultative. L'app
compresse l'image et l'envoie à la fonction en base64 ; la fonction la joint au mail
via Resend sans ajouter de colonne dédiée dans `feedback_submissions`.

Les propositions d'information sont aussi lues dans `Administration > Propositions`.
Un statut `new` est à traiter, `reviewed` correspond à une proposition acceptée, et
`archived` à une proposition refusée. L'acceptation crée une ligne publiée dans
`announcements`, donc l'information apparaît ensuite dans `Infos locales`.

Secrets Supabase à configurer :

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set FEEDBACK_EMAIL_TO=contact.muslimin.tours@gmail.com
npx supabase secrets set FEEDBACK_EMAIL_FROM="Muslim'in <onboarding@resend.dev>"
npx supabase functions deploy send-feedback
```
