export interface Owner {
  name: string;
  type: string;
  rating: number;
  rt: string;
}

export type ListingCat = 'rent' | 'buy' | 'sublet' | 'room' | 'student' | 'office';
export type Intent = ListingCat;
export type BedFilter = 'any' | '1' | '2' | '3' | '4';
export type SortOption = 'relevance' | 'low' | 'high' | 'new';
export type AuthMode = 'signin' | 'signup';
export type Screen =
  | 'home'
  | 'auth'
  | 'search'
  | 'detail'
  | 'saved'
  | 'messages'
  | 'list'
  | 'insights'
  | 'account'
  | 'notifs'
  | 'publicProfile'
  | 'savedSearches'
  | 'writeReview';

export interface Listing {
  id: number;
  cat: ListingCat;
  title: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  size: number;
  floor: string;
  furnishing: 'Unfurnished' | 'Semi-furnished' | 'Furnished';
  pref: string;
  adv: number;
  service: number;
  verified: boolean;
  owner: Owner;
  ownerId?: number | null;
  ownerUserId?: number | null;
  cover: string;
  shots: string[];
  shotCats?: string[] | null;
  amen: string[];
  mapX: string;
  mapY: string;
  desc: string;
  sale?: boolean;
  coverUrl: string;
  shotUrls: string[];
  propertyType?: string | null;
  availableFrom?: string | null;
  landmark?: string | null;
  facing?: string | null;
  balconies?: number | null;
  totalFloors?: string | null;
  videos?: string[] | null;
  meta?: Record<string, unknown> | null;
}
