'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheeseIcon } from '@/components/icons/CheeseIcon';
import { Loader2, Lock, Mail, User, UserCheck } from 'lucide-react';
import Image from 'next/image';
import type { UserRole } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(signInEmail, signInPassword);

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signUp(signUpEmail, signUpPassword, fullName, role);

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      // Show success message or redirect
      alert('Account created successfully! Please check your email to verify your account.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8 animate-in fade-in duration-700">
          {settings.login_logo_url ? (
            <div className="h-24 w-24 mb-6 relative transform hover:scale-105 transition-transform duration-300">
              <Image
                src={settings.login_logo_url}
                alt={settings.logo_alt || 'Logo'}
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
          ) : (
            <CheeseIcon className="h-24 w-24 text-primary mb-6 animate-pulse" />
          )}
          <h1 className="font-headline text-3xl font-bold text-center animate-in slide-in-from-bottom-4 duration-500 delay-200">
            {settings.business_name || 'Ms. Cheesy POS'}
          </h1>
          <p className="text-muted-foreground text-center mt-2 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            Point of Sale System
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full animate-in slide-in-from-bottom-8 duration-500 delay-400">
          <TabsList className="grid w-full grid-cols-2 transition-all duration-200">
            <TabsTrigger value="signin" className="transition-all duration-200 data-[state=active]:scale-105">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="transition-all duration-200 data-[state=active]:scale-105">Sign Up</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4 animate-in shake duration-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="signin" className="animate-in fade-in slide-in-from-right-4 duration-300">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 animate-in spin-in-180 duration-500" />
                  Sign In
                </CardTitle>
                <CardDescription>
                  Sign in to access the POS system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="animate-in slide-in-from-left-4 duration-300 delay-100">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                    />
                  </div>
                  <div className="animate-in slide-in-from-left-4 duration-300 delay-200">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-4 delay-300" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="animate-in fade-in slide-in-from-left-4 duration-300">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 animate-in spin-in-180 duration-500" />
                  Create Account
                </CardTitle>
                <CardDescription>
                  Create a new staff account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="animate-in slide-in-from-right-4 duration-300 delay-100">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                      className="transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                    />
                  </div>
                  <div className="animate-in slide-in-from-right-4 duration-300 delay-200">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter email address"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                    />
                  </div>
                  <div className="animate-in slide-in-from-right-4 duration-300 delay-300">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      className="transition-all duration-200 focus:scale-[1.02] hover:border-primary/50"
                    />
                  </div>
                  <div className="animate-in slide-in-from-right-4 duration-300 delay-[400ms]">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                      <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-4 delay-[500ms]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Demo Accounts:<br />
            Admin: admin@mscheesy.com / password<br />
            Cashier: cashier@mscheesy.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
