import { Library, Users, MessageSquare, HeartHandshake, ClipboardList, BookMarked, Sparkles } from 'lucide-react';
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
    id: 'mybooks',
    label: 'My Books',
    icon: BookMarked,
    description: '',
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    adminOnly: true,
    description: '',
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
