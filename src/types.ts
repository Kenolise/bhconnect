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
  | 'Prayer';

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

export interface BorrowRequest {
  id: string;
  book_id: string;
  requester_email: string;
  requester_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type TabId = 'library' | 'members' | 'sermons' | 'comms' | 'pastoral' | 'requests';
