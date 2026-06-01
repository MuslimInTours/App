export type CommunityPlace = {
  id: string;
  name: string;
  type: 'Mosquée' | 'Association' | 'Commerce';
  area: string;
  details: string;
};

export const communityPlaces: CommunityPlace[] = [
  {
    id: 'mosquee-centre',
    name: 'Mosquée de Tours centre',
    type: 'Mosquée',
    area: 'Tours',
    details: 'Prières quotidiennes, joumoua, cours ponctuels.',
  },
  {
    id: 'association-solidarite',
    name: 'Collectif solidarité locale',
    type: 'Association',
    area: 'Tours métropole',
    details: 'Distribution, entraide, accompagnement de familles.',
  },
  {
    id: 'epicerie-halal',
    name: 'Epicerie halal',
    type: 'Commerce',
    area: 'Joue-les-Tours',
    details: 'Adresse à compléter, horaires et contact.',
  },
];
