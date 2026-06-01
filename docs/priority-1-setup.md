# Mise en service - priorites 1 et 2

Ce fichier liste les actions externes a faire pour transformer le prototype local en app testable
par plusieurs personnes.

## 1. Supabase

Verifier l'etat actuel :

```bash
npm run release:check
```

1. Creer un projet Supabase.
2. Ouvrir le SQL editor.
3. Executer `docs/supabase-schema.sql`.
4. Creer un compte admin dans `Authentication > Users`.
5. Copier le `user_id` du compte admin.
6. Ajouter une ligne dans `public.admins` avec ce `user_id`.
7. Copier `Project URL` et `anon public key` dans `.env`.

```bash
cp .env.example .env
```

Connexion et liaison du projet :

```bash
npm run supabase:login
npm run supabase:link -- --project-ref VOTRE_PROJECT_REF
npm run supabase:db:push
npm run supabase:deploy:functions
```

## 2. Test admin

1. Relancer Expo apres modification du `.env`.
2. Ouvrir `Plus`.
3. Ouvrir `Administration`.
4. Se connecter avec le compte admin Supabase.
5. Publier une annonce test.
6. Modifier, masquer puis republier l'annonce depuis la liste admin.
7. Verifier qu'elle apparait dans `Infos locales`.

## 3. Notifications

Les notifications demandent un Project ID EAS et une app mobile installee.

```bash
npm run eas:login
npm run eas:init
npm run build:ios:preview
```

Une fois le build installe sur iPhone, activer les notifications dans `Parametres`.
L'app enregistrera le token dans `public.device_tokens`.

## 4. Build partageable

Pour partager une version iPhone de test :

```bash
npm run build:ios:preview
```

Pour Android :

```bash
npm run build:android:preview
```

Le lien genere par EAS permet d'installer l'app de test sur les appareils autorises.

## 5. Mosquées dynamiques

La table `public.mosques` est maintenant lue par l'app quand Supabase est configure.
Elle permet d'ajouter ou masquer une mosquee sans publier une nouvelle version.

Champs importants :

- `id` : identifiant stable, par exemple `mosquee-exemple-tours`.
- `name` : nom affiche.
- `city` : zone affichee dans l'app.
- `address` : adresse affichee et utilisee pour l'annuaire.
- `latitude` / `longitude` : position Maps.
- `mawaqit_url` : a remplir uniquement si les horaires Mawaqit existent.
- `is_visible` : `true` pour afficher, `false` pour masquer.

Si `mawaqit_url` est rempli, la mosquee apparaitra aussi dans le carrousel des horaires.

## 6. Rappels de prière

Dans `Prières > Horaires`, le bouton `Activer les rappels` programme des notifications
locales pour les horaires du jour de la mosquee affichee. Pour que les tokens push soient
enregistres dans Supabase, il faut une build EAS installee sur telephone.

## 7. Notifications push admin

La fonction Supabase Edge `send-push` envoie une annonce aux appareils enregistres
dans `public.device_tokens`.

Installer la CLI Supabase si necessaire, puis lier le projet :

Deployer la fonction avec `npm run supabase:deploy:push`.

Ensuite, dans `Plus > Administration`, l'icone cloche sur une annonce appelle cette fonction.
Le compte connecte doit etre present dans la table `admins`.

## 8. Formulaire proposer une info

Le formulaire enregistre la demande dans `public.feedback_submissions` et appelle la fonction
Supabase Edge `send-feedback`. Il faut configurer une boite de reception et une cle Resend :

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set FEEDBACK_EMAIL_TO=contact.muslimin.tours@gmail.com
npx supabase secrets set FEEDBACK_EMAIL_FROM="Muslim'in <onboarding@resend.dev>"
npm run supabase:deploy:feedback
```

Si la table existe deja avec des anciennes lignes sans contact, renseigner leur contact ou les
archiver avant de rendre la colonne obligatoire.

## 9. Admin mosquées

Dans `Plus > Administration`, le bloc `Ajouter une mosquée` permet maintenant de créer,
modifier ou supprimer les mosquées Supabase.

Pour afficher une mosquee uniquement dans l'annuaire, laisser l'URL Mawaqit vide.
Pour afficher aussi ses horaires, renseigner `mawaqit_url`.
