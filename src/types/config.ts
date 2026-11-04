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
  /**
   * Optional. When true, the segment starts a new paragraph of the biography.
   * Absent (the default) keeps every segment in the same paragraph.
   */
  paragraphBreakBefore?: boolean;
}

export interface ProfileConfig {
  name: string;
  brand: string;
  title: string;
  photoAlt: string;
  bio: BioSegment[];
}
