'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DineDeskLogo } from '@/components/icons/logo';
import { Shield, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock authentication
    setTimeout(() => {
      if (email === 'admin@dinedesk.com' && password === 'password') {
        toast({
          title: 'Login Successful',
          description: 'Welcome back, Admin!',
        });
        router.push('/admin/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password.',
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-4 left-4">
            <Link href="/" passHref>
              <Button variant="outline">Back to Home</Button>
            </Link>
        </div>
        <div className="mb-8 flex items-center gap-2 text-center">
            <DineDeskLogo className="h-12 w-12 text-primary" />
            <h1 className="font-headline text-5xl font-bold text-foreground">
            DineDesk Admin
            </h1>
        </div>
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Administrator Login</CardTitle>
            <CardDescription>
                Enter your credentials to access the admin panel.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="admin@dinedesk.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
                </div>
                 <Button type="submit" className="w-full font-headline" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                    <LogIn className="ml-2 h-4 w-4" />
                </Button>
            </form>
            </CardContent>
             <CardFooter className="flex justify-center p-6 pt-4 text-xs text-muted-foreground">
                <p>Use email <b>admin@dinedesk.com</b> and password <b>password</b>.</p>
            </CardFooter>
        </Card>
    </div>
  );
}
