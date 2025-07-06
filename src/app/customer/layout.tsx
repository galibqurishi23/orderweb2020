'use client';

import * as React from 'react';
import Link from 'next/link';
import { User, LogIn, LogOut } from 'lucide-react';
import { DineDeskLogo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function LoginDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { login } = useData();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      setIsOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="login">
          <DialogHeader>
            <DialogTitle>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Access your account or create a new one.
            </DialogDescription>
          </DialogHeader>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input id="email-login" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="me@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <Input id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Log In</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <div className="space-y-4 py-4">
              <p className="text-center text-sm text-muted-foreground">
                Sign-up functionality is coming soon! Please use the demo login credentials for now.
              </p>
              <div className="text-xs text-center p-2 bg-muted rounded-md">
                <p>Email: <b>alice.j@example.com</b></p>
                <p>Password: <b>password123</b></p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { isAuthenticated, currentUser, logout, restaurantSettings } = useData();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm transition-all duration-300',
        isScrolled ? 'border-b shadow-sm' : ''
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between p-4">
        <Link href="/customer" className="flex items-center gap-2">
          {restaurantSettings.logo ? (
            <img src={restaurantSettings.logo} alt={restaurantSettings.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <DineDeskLogo className="h-8 w-8 text-primary" />
          )}
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {restaurantSettings.name}
          </h1>
        </Link>
        <div>
          {isAuthenticated && currentUser ? (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <span>Hi, {currentUser.name.split(' ')[0]}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/customer/account">Profile & Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginDialog>
                <Button variant="ghost">
                    <LogIn className="mr-2 h-4 w-4"/>
                    Login / Sign Up
                </Button>
            </LoginDialog>
          )}
        </div>
      </div>
    </header>
  );
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {children}
    </div>
  );
}
