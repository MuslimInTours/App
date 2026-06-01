# Muslim'in

Base d'application mobile Expo / React Native pour Muslim'in, une app locale qui
centralise les informations de la communaute musulmane de Tours et alentours.

## Lancer l'application

```bash
npm install
npm start
```

Le script `npm start` lance Expo en mode reseau local (`--lan`), ce qui permet
d'ouvrir l'application sur un telephone avec Expo Go.

Si Expo affiche une erreur de cache ou si l'application reste bloquee :

```bash
npm run start:clear
```

Pour un simulateur local uniquement :

```bash
npm run start:localhost
```

## Modules deja poses

- Accueil
- Fil d'informations locales
- Horaires de prieres et qiblah
- Base de lecture Quran
- Annuaire local
- Cache local pour les annonces et les horaires Mawaqit
- Administration des annonces via Supabase
- Gestion admin des annonces existantes
- Formulaire admin dedie aux prieres mortuaires
- Envoi push admin via Supabase Edge Function
- Mosquées dynamiques depuis Supabase
- Rappels locaux pour les horaires de prière
- Preparation des notifications push Expo
- Deploiement web GitHub Pages via GitHub Actions
- Mises a jour Expo OTA via EAS Update
- Configuration backend via Supabase ou `EXPO_PUBLIC_MUSLIMIN_API_URL`

## Backend

Pour brancher un backend, copier `.env.example` vers `.env`, renseigner Supabase,
puis executer le schema `docs/supabase-schema.sql` dans le SQL editor Supabase.
Le contrat HTTP alternatif reste documente dans `docs/backend-contract.md`.

Sans backend, l'app continue d'utiliser les donnees locales et les caches disponibles.

## Builds de test

La configuration EAS est prete dans `eas.json`.

```bash
npx eas init
npx eas build --profile preview --platform ios
```

Une fois le Project ID EAS ajoute automatiquement, les notifications pourront enregistrer
un token Expo sur mobile.

Les etapes completes de mise en service sont dans `docs/priority-1-setup.md`.
Le lien GitHub, Web et Expo est documente dans `docs/deployment-github-expo.md`.
