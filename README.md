# QUIZZZ - 12 Coups de Midi Style

Un jeu de culture générale multi-joueurs en temps réel.

## Installation

1. Installez les dépendances :
```bash
npm install pusher pusher-js uuid lucide-react
npm install -D @types/uuid
```

2. Configurez votre compte Pusher (Gratuit) :
- Créez un compte sur [pusher.com](https://pusher.com)
- Créez une "Channels App"
- Copiez les credentials dans le fichier `.env.local`

3. Lancez le projet :
```bash
npm run dev
```

## Fonctionnalités

- **Système de salle** : Créez ou rejoignez une partie avec un code à 6 chiffres.
- **Phase A (Coup d'envoi)** : Questions rapides, 2 points.
- **Phase B (Coup par coup)** : Choix de catégorie, 1 point.
- **Phase C (Lettre du match)** : Toutes les réponses doivent commencer par la lettre choisie.
- **Buzzer temps réel** : Premier arrivé, premier servi !
- **Interface Hôte** : Contrôle total sur les phases et validation des réponses.

## Déploiement sur Vercel

1. Poussez le code sur GitHub.
2. Connectez votre repo à Vercel.
3. Ajoutez les variables d'environnement définies dans `.env.local` dans les paramètres Vercel.
4. **Note importante** : Pour une persistance de session fiable sur Vercel (Serverless), remplacez le `Map` dans `lib/game-state.ts` par une base de données Redis (ex: Upstash).

## Stack Technique

- Next.js 14 (App Router)
- TailwindCSS
- Pusher (Temps réel)
- Open Trivia Database API
- TypeScript
