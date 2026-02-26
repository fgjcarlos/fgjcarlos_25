export interface SocialLink {
  type: string;
  icon: string;
  src: string;
  title: string;
  description: string;
}

export interface LinksConfig {
  links: SocialLink[];
}

export interface BioSegment {
  text: string;
  emphasis?: boolean;
}

export interface ProfileConfig {
  name: string;
  brand: string;
  title: string;
  photoAlt: string;
  bio: BioSegment[];
}
