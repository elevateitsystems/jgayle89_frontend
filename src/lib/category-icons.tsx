import {
  Briefcase,
  Camera,
  Cpu,
  Hammer,
  HeartPulse,
  Home,
  Mountain,
  Scissors,
  Store,
  Truck,
  Utensils,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  utensils: Utensils,
  hammer: Hammer,
  truck: Truck,
  briefcase: Briefcase,
  cpu: Cpu,
  "heart-pulse": HeartPulse,
  home: Home,
  mountain: Mountain,
  camera: Camera,
  scissors: Scissors,
};

export const categoryIconKeys = Object.keys(map);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Store;
  return <Icon className={className} aria-hidden />;
}
