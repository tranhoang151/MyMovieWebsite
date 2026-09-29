import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({ label, value, icon: Icon, color = 'text-netflix-red' }: StatsCardProps) {
  return (
    <div className="bg-netflix-card p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-netflix-text-secondary text-sm">{label}</span>
        <Icon className={color} size={24} />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
