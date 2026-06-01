export type AnnouncementCategory =
  | 'Mosquée'
  | 'Cours'
  | 'Solidarité'
  | 'Famille'
  | 'Prières mortuaires';

export type Announcement = {
  id: string;
  title: string;
  category: AnnouncementCategory;
  date: string;
  location: string;
  summary: string;
  isImportant?: boolean;
};

export const announcements: Announcement[] = [
  {
    id: 'jumua-info',
    title: 'Organisation de la prière du vendredi',
    category: 'Mosquée',
    date: 'Vendredi, 13h20',
    location: 'Tours centre',
    summary:
      'Rappel des horaires, accès et consignes pour fluidifier l’arrivée des fidèles.',
    isImportant: true,
  },
  {
    id: 'tajwid-course',
    title: 'Cours de tajwid débutants',
    category: 'Cours',
    date: 'Samedi, 18h00',
    location: 'Saint-Pierre-des-Corps',
    summary:
      'Session hebdomadaire pour adultes avec reprise des bases de lecture et articulation.',
  },
  {
    id: 'food-drive',
    title: 'Collecte alimentaire',
    category: 'Solidarité',
    date: 'Dimanche, 10h00-12h00',
    location: 'Joue-les-Tours',
    summary:
      'Collecte de produits secs, couches et produits d’hygiène pour les familles accompagnées.',
  },
  {
    id: 'youth-meetup',
    title: 'Rencontre jeunes',
    category: 'Famille',
    date: 'Mercredi, 19h30',
    location: 'Tours nord',
    summary:
      'Temps d’échange, rappel court et activité conviviale pour les 15-25 ans.',
  },
  {
    id: 'janaza-prayer',
    title: 'Prière mortuaire',
    category: 'Prières mortuaires',
    date: 'Aujourd’hui, après Dhuhr',
    location: 'Tours',
    summary:
      'Annonce dédiée aux prières funéraires, avec lieu, horaire et informations utiles pour la communauté.',
    isImportant: true,
  },
];
