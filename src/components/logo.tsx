import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <GraduationCap className="size-6 text-primary" />
      <span className="text-xl font-bold">Cognify</span>
    </div>
  );
}
