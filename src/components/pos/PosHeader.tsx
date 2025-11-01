import Link from 'next/link';
import { CheeseIcon } from '@/components/icons/CheeseIcon';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function PosHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <CheeseIcon className="h-8 w-8 text-primary" />
        <span className="font-headline text-xl font-bold tracking-tight">
          Ms. Cheesy
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/sales">
            <User className="h-5 w-5" />
            <span className="sr-only">Admin</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
