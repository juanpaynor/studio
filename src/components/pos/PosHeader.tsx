import Link from 'next/link';
import { CheeseIcon } from '@/components/icons/CheeseIcon';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ChefHat, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import Image from 'next/image';

export default function PosHeader() {
  const { profile, signOut } = useAuth();
  const { settings } = useSettings();

  const handleSignOut = async () => {
    // Immediately redirect to login for faster UX
    window.location.href = '/login';
    // Sign out in background
    await signOut();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        {settings.logo_url ? (
          <div className="h-8 w-8 relative">
            <Image
              src={settings.logo_url}
              alt={settings.logo_alt || 'Logo'}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <CheeseIcon className="h-8 w-8 text-primary" />
        )}
        <span className="font-headline text-xl font-bold tracking-tight">
          {settings.business_name || 'Ms. Cheesy'}
        </span>
      </Link>
      
      <div className="flex items-center gap-2">
        {profile?.role === 'kitchen' || profile?.role === 'admin' ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/kitchen" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Kitchen
            </Link>
          </Button>
        ) : null}
        
        {profile?.role === 'admin' && (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/sales" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                <AvatarFallback>
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {profile?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profile?.role === 'admin' && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/sales" className="flex items-center w-full">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
