import { ArtPiece, ObservationLog } from './types';

export const ART_PIECES: ArtPiece[] = [
  {
    id: '1',
    type: 'photography',
    title: '',
    imageSrc: 'https://unsplash.com/photos/NgcE6ffyFxI/download?w=1200',
    mood: '',
    description: ''
  },
  {
    id: '2',
    type: 'photography',
    title: '',
    imageSrc: 'https://unsplash.com/photos/fdFLxY8UDUA/download?w=1200',
    mood: '',
    description: ''
  },
  {
    id: '3',
    type: 'photography',
    title: '',
    imageSrc: 'https://unsplash.com/photos/KCQLoE42ZIw/download?w=1200',
    mood: '',
    description: ''
  },
  {
    id: '4',
    type: 'photography',
    title: '',
    imageSrc: 'https://unsplash.com/photos/VZaZA-1q0yg/download?w=1200',
    mood: '',
    description: ''
  },
  {
    id: '5',
    type: 'photography',
    title: '',
    imageSrc: 'https://unsplash.com/photos/Y0DTcx1pGpc/download?w=1200',
    mood: '',
    description: ''
  }
];

export const OBSERVATION_LOGS: ObservationLog[] = [
  {
    id: 'log-001',
    date: '2023-10-14',
    time: '06:45 AM',
    weather: 'Overcast, 12°C',
    notes: 'Observed the alpha male (Broken-Wing) asserting dominance over a fledgling near the old oak. The fledgling offered a shiny bottle cap as tribute. Accepted.',
    tags: ['Social', 'Alpha', 'Tribute']
  },
  {
    id: 'log-002',
    date: '2023-10-16',
    time: '05:30 PM',
    weather: 'Rain, Heavy Wind',
    notes: 'The murder has moved to the lower eaves of the library to avoid the gale. Unusually quiet today. No vocalizations recorded for over an hour.',
    tags: ['Weather', 'Roosting']
  },
  {
    id: 'log-003',
    date: '2023-10-20',
    time: '07:15 AM',
    weather: 'Clear, 8°C',
    notes: 'Attempted to introduce unsalted peanuts. Immediate success. They are caching them in the rain gutters. Intelligence confirmed: one crow used a twig to retrieve a fallen nut.',
    tags: ['Tool Use', 'Feeding']
  },
  {
    id: 'log-004',
    date: '2023-11-02',
    time: '04:50 PM',
    weather: 'Foggy',
    notes: 'Witnessed a "funeral" behavior. A deceased sparrow was surrounded by five crows in silence. Lasted approx 2 minutes before they dispersed.',
    tags: ['Ritual', 'Observation']
  }
];