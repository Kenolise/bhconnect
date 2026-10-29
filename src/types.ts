export type Category = 'Book' | 'Sermon' | 'Study Guide' | 'Article' | 'Podcast';

export const CATEGORIES: Category[] = ['Book', 'Sermon', 'Study Guide', 'Article', 'Podcast'];

export type ChristianTopic =
  | 'Apologetics'
  | 'Biography & Christian History'
  | 'Christian Fiction'
  | 'Christian Living'
  | 'Eschatology'
  | 'Faith'
  | 'Finances'
  | 'Healing'
  | 'Holy Spirit'
  | 'In Christ'
  | 'Kids/Youth'
  | 'Marriage/Relationships'
  | 'Ministry'
  | 'Parenting/Family'
  | 'Personal Development / Spiritual Growth'
  | 'Prayer'
  | 'Uncategorized';

export const CHRISTIAN_TOPICS: ChristianTopic[] = [
  'Apologetics',
  'Biography & Christian History',
  'Christian Fiction',
  'Christian Living',
  'Eschatology',
  'Faith',
  'Finances',
  'Healing',
  'Holy Spirit',
  'In Christ',
  'Kids/Youth',
  'Marriage/Relationships',
  'Ministry',
  'Parenting/Family',
  'Personal Development / Spiritual Growth',
  'Prayer',
  'Uncategorized',
];

export interface Resource {
  id: string;
  title: string;
  author: string | null;
  category: string;
  description: string | null;
  url: string | null;
  cover_color: string;
  isbn: string | null;
  christian_topic: ChristianTopic;
  total_copies: number;
  available_copies: number;
  publisher: string | null;
  publish_year: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type ResourceInput = Omit<Resource, 'id' | 'created_at' | 'updated_at'>;

export type RequestStatus = 'pending' | 'ready' | 'borrowed' | 'returned' | 'rejected' | 'expired';

export type TabId = 'library' | 'mybooks' | 'members' | 'comms' | 'pastoral' | 'requests';
