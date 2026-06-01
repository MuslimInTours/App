# Déploiement GitHub, Web et Expo

Objectif : garder une seule source de vérité dans GitHub. Chaque push sur `main`
peut mettre à jour le site web GitHub Pages et publier une mise à jour Expo.

## 1. Créer le dépôt GitHub

Créer un dépôt GitHub, par exemple `muslimin`, puis connecter ce dossier :

```bash
git remote add origin https://github.com/VOTRE_COMPTE/muslimin.git
git add .
git commit -m "Initial app deployment setup"
git push -u origin main
```

`gh` n'est pas installé sur cette machine, donc la création du dépôt se fait depuis
github.com ou après installation de GitHub CLI.

## 2. Variables GitHub

Dans `Settings > Secrets and variables > Actions > Variables`, ajouter :

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_MUSLIMIN_API_URL
```

Ces valeurs sont intégrées au bundle web et mobile. La clé anon Supabase est publique
par nature, mais les règles RLS Supabase doivent rester strictes.

Dans `Settings > Secrets and variables > Actions > Secrets`, ajouter :

```text
EXPO_TOKEN
```

Créer ce token depuis Expo avec un compte qui a accès au projet `muslimin`.
Sans `EXPO_TOKEN`, le site web se déploie quand même, mais la mise à jour Expo est ignorée.

## 3. Activer GitHub Pages

Dans `Settings > Pages`, choisir :

```text
Source: GitHub Actions
```

Le workflow `.github/workflows/deploy-web.yml` fait ensuite :

1. installe les dépendances ;
2. vérifie TypeScript ;
3. exporte Expo Web dans `dist` ;
4. ajoute `.nojekyll` et des chemins compatibles GitHub Pages ;
5. publie le site.

## 4. Synchronisation Expo

`expo-updates` est installé et `app.json` pointe vers le projet EAS :

```text
https://u.expo.dev/dfeb1f84-6ec8-41aa-9093-5f61013074c2
```

Les builds EAS utilisent les canaux :

- `development` pour les builds dev ;
- `preview` pour les tests internes ;
- `production` pour la version finale.

À chaque push sur `main`, `.github/workflows/eas-update.yml` publie sur le canal
`preview`. Une publication production peut être lancée manuellement dans GitHub Actions
avec `workflow_dispatch` et le canal `production`.

Après l'ajout de `expo-updates`, refaire au moins un build preview pour que les testeurs
installent une app capable de recevoir les mises à jour OTA :

```bash
npm run build:ios:preview
npm run build:android:preview
```

Ensuite, les changements JavaScript et assets compatibles peuvent arriver par :

```bash
npm run eas:update:preview -- --message "Description courte"
```

Les changements natifs, permissions, plugins Expo, icônes natives ou dépendances natives
demandent encore un nouveau build EAS.

## 5. Accès par quelques personnes

GitHub Pages publie une URL web facile à partager. Cette URL n'est pas une vraie zone
privée : si le dépôt ou Pages est public, toute personne avec le lien peut ouvrir le site.
Pour un accès strictement limité, utiliser plutôt un hébergement avec protection par mot de
passe ou Cloudflare Access. Pour des tests mobiles privés, utiliser les builds EAS internes.
