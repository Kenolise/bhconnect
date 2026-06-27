import { Library, Users, Mic, MessageSquare, HeartHandshake, ClipboardList, Sparkles } from 'lucide-react';
import type { TabId } from './types';

export interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Library;
  comingSoon?: boolean;
  adminOnly?: boolean;
  description: string;
}

export const TABS: TabDef[] = [
  {
    id: 'library',
    label: 'Library',
    icon: Library,
    description: '',
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    comingSoon: true,
    description: 'A directory of our church family — find contact info, small groups, and connect with fellow members at Believers House.',
  },
  {
    id: 'sermons',
    label: 'Sermons',
    icon: Mic,
    comingSoon: true,
    description: 'Watch and listen to past messages, follow along with sermon series, and catch up on anything you missed.',
  },
  {
    id: 'comms',
    label: 'Comms',
    icon: MessageSquare,
    comingSoon: true,
    description: 'Church announcements, event reminders, newsletters, and the weekly bulletin — all in one organised feed.',
  },
  {
    id: 'pastoral',
    label: 'Pastoral',
    icon: HeartHandshake,
    comingSoon: true,
    description: 'Submit prayer requests, schedule pastoral care conversations, and access confidential support from our pastoral team.',
  },
  {
    id: 'requests',
    label: 'Requests',
    icon: ClipboardList,
    adminOnly: true,
    description: '',
  },
];

export { Sparkles };
