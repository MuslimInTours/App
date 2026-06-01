export type MawaqitMosque = {
  address: string;
  area: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  id: string;
  mawaqitId?: number;
  name: string;
  source: 'mawaqit' | 'directory';
  url?: string;
};

export const mawaqitMosques: MawaqitMosque[] = [
  {
    address: '18 Rue Lobin, 37000 Tours',
    area: 'Tours',
    coordinates: {
      latitude: 47.395163,
      longitude: 0.7004038,
    },
    id: 'al-fath-tours',
    mawaqitId: 5998,
    name: 'Mosquée Al-Fath',
    source: 'mawaqit',
    url: 'https://mawaqit.net/fr/m-tours',
  },
  {
    address: '2 Rue Paul Sabatier, 37300 Joué-lès-Tours',
    area: 'Joué-lès-Tours',
    coordinates: {
      latitude: 47.347526592957,
      longitude: 0.65807940386564,
    },
    id: 'as-salam-joue',
    mawaqitId: 3496,
    name: 'Mosquée AS-SALAM',
    source: 'mawaqit',
    url: 'https://mawaqit.net/fr/mosquee-joue',
  },
  {
    address: '71 Rue de la Rabaterie, 37700 Saint-Pierre-des-Corps',
    area: 'Saint-Pierre-des-Corps',
    coordinates: {
      latitude: 47.3919835,
      longitude: 0.7258686,
    },
    id: 'al-kawthar-saint-pierre',
    mawaqitId: 3354,
    name: 'Mosquée AL-KAWTHAR',
    source: 'mawaqit',
    url: 'https://mawaqit.net/fr/msp',
  },
  {
    address: "Place Guido d'Arezzo, 37000 Tours",
    area: 'Tours',
    coordinates: {
      latitude: 47.375776224536,
      longitude: 0.7108031650297,
    },
    id: 'bouzignac-tours',
    mawaqitId: 12741,
    name: 'Mosquée de Bouzignac',
    source: 'mawaqit',
    url: 'https://mawaqit.net/fr/mosquee-de-bouzignac-tours-37000-france-1',
  },
  {
    address: '66 Rue Henri Martin, 37000 Tours',
    area: 'Tours',
    coordinates: {
      latitude: 47.3750511,
      longitude: 0.691311,
    },
    id: 'culturelle-turque-tours',
    name: 'Association Culturelle Turque de Tours',
    source: 'directory',
  },
  {
    address: 'Adresse à confirmer, 37000 Tours',
    area: 'Tours',
    coordinates: {
      latitude: 47.3768243,
      longitude: 0.672998,
    },
    id: 'grande-mosquee-tours',
    name: 'Grande Mosquée de Tours',
    source: 'directory',
  },
  {
    address: 'Allée de la Belle-Fille, 37000 Tours',
    area: 'Tours',
    coordinates: {
      latitude: 47.3795102,
      longitude: 0.6958124,
    },
    id: 'belle-fille-tours',
    mawaqitId: 12779,
    name: 'Mosquée du Sanitas مسجد الصحابة',
    source: 'mawaqit',
    url: 'https://mawaqit.net/fr/tcs-tours-37000-france',
  },
  {
    address: 'Rue du Chemin Vert, 37300 Joué-lès-Tours',
    area: 'Joué-lès-Tours',
    coordinates: {
      latitude: 47.3566961,
      longitude: 0.6926404,
    },
    id: 'chemin-vert-joue',
    name: 'Salle de prière Chemin Vert',
    source: 'directory',
  },
  {
    address: '150 bis Avenue Léonard de Vinci, 37400 Amboise',
    area: 'Amboise',
    coordinates: {
      latitude: 47.402976,
      longitude: 1.01052,
    },
    id: 'amboise',
    name: "Mosquée d'Amboise",
    source: 'directory',
  },
  {
    address: '15 Rue Gambetta, 37110 Château-Renault',
    area: 'Château-Renault',
    coordinates: {
      latitude: 47.5963247,
      longitude: 0.9133448,
    },
    id: 'chateau-renault',
    name: 'Mosquée de Château-Renault',
    source: 'directory',
  },
];

export const defaultMawaqitMosque = mawaqitMosques[0];

export const prayerTimeMosques = mawaqitMosques.filter((mosque) => mosque.source === 'mawaqit');
