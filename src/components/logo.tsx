import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image src="/icon.png" alt="Cognify Logo" width={24} height={24} className="size-6" />
      <span className="text-xl font-bold">Cognify</span>
    </div>
  );
}
