export type Category = 'Book' | 'Sermon' | 'Study Guide' | 'Article' | 'Podcast';

export const CATEGORIES: Category[] = ['Book', 'Sermon', 'Study Guide', 'Article', 'Podcast'];

export type ChristianTopic =
  | 'Prayer & Devotional'
  | 'Marriage & Family'
  | 'Christian Living'
  | 'Theology & Apologetics'
  | 'Leadership & Ministry'
  | 'Prophecy & Spiritual Gifts'
  | 'Evangelism & Missions'
  | 'Youth & Children'
  | 'Grief & Healing'
  | 'Finance & Stewardship'
  | 'Bible Study'
  | 'Worship'
  | 'Uncategorized';

export const CHRISTIAN_TOPICS: ChristianTopic[] = [
  'Prayer & Devotional',
  'Marriage & Family',
  'Christian Living',
  'Theology & Apologetics',
  'Leadership & Ministry',
  'Prophecy & Spiritual Gifts',
  'Evangelism & Missions',
  'Youth & Children',
  'Grief & Healing',
  'Finance & Stewardship',
  'Bible Study',
  'Worship',
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

export type TabId = 'library' | 'members' | 'sermons' | 'comms' | 'pastoral';
