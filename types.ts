export type ProjectType = 'illustration' | 'photography';

export interface ArtPiece {
  id: string;
  type: ProjectType;
  title: string;
  imageSrc: string;
  location?: string;
  mood: string;
  description: string;
}

export interface ObservationLog {
  id: string;
  date: string;
  time: string;
  weather: string;
  notes: string;
  tags: string[];
}

export type ViewState = 'NEST' | 'GALLERY' | 'CONTACT';

export interface WireDef {
  id: number;
  y: number; // Normalized height (-1 to 1)
  curvature: number;
}