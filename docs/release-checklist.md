# Checklist sortie testeurs

## 1. Etat automatique

Lancer :

```bash
npm run release:check
```

La sortie doit afficher `OK` partout avant de partager largement l'app.

## 2. Supabase

Actions obligatoires :

1. Se connecter a la CLI Supabase :

```bash
npm run supabase:login
```

2. Lier le projet distant avec le Project Ref visible dans l'URL Supabase.
Pour le projet actuel, le ref est `stokotegvjpvntuvryzb` :

```bash
npm run supabase:link -- --project-ref stokotegvjpvntuvryzb
```

3. Appliquer les migrations :

```bash
npm run supabase:db:push
```

4. Verifier que `feedback_submissions` passe en OK :

```bash
npm run release:check
```

Alternative dashboard : ouvrir Supabase > SQL Editor et executer
`supabase/migrations/20260601033000_feedback_submissions.sql`.

## 3. Formulaires et emails

Configurer Resend dans Supabase :

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set FEEDBACK_EMAIL_TO=contact.muslimin.tours@gmail.com
npx supabase secrets set FEEDBACK_EMAIL_FROM="Muslim'in <onboarding@resend.dev>"
npm run supabase:deploy:feedback
```

Tests a faire :

- `Infos locales > Proposer une info` cree une proposition dans `Administration > Propositions`.
- `Services > Contacter l'equipe` envoie un email sans ouvrir l'app Mail.
- La photo facultative arrive en piece jointe quand elle est fournie.

## 4. Admin

Verifier avec un vrai compte admin Supabase :

- connexion admin ;
- creation, modification, masquage et suppression d'une annonce ;
- acceptation directe d'une proposition ;
- refus d'une proposition ;
- acceptation avec modifications.

## 5. Notifications

Deployer la fonction push :

```bash
npm run supabase:deploy:push
```

Verifier sur une build mobile EAS installee :

- autorisation notification ;
- token present dans `device_tokens` ;
- envoi depuis l'icone cloche admin ;
- reception sur l'appareil.

## 6. Web et mises a jour

Verifier GitHub avant partage :

- variables de repo `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
  `EXPO_PUBLIC_MUSLIMIN_API_URL` ;
- secret `EXPO_TOKEN` si les updates EAS via GitHub Actions sont actifs ;
- GitHub Pages active sur la branche `main`.

Commandes locales :

```bash
npx tsc --noEmit
npm run web:export:pages
```
