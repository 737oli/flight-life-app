import { CalendarEvent } from '@/types';



interface EventDetailModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function EventDetailModal({ visible, event, onClose }: EventDetailModalProps) {};