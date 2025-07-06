'use client';

import React from 'react';
import { Network, Server, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const POSIntegrationCard = ({ name, description }: { name: string; description: string; }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="flex items-center gap-3 text-lg">
                    <Server className="w-5 h-5 text-primary" />
                    {name}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
        </CardHeader>
        <CardFooter>
            <Button disabled>
                <Settings className="w-4 h-4 mr-2" />
                Configure
            </Button>
        </CardFooter>
    </Card>
);

export default function ConnectPosPage() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-4">
                        <Network className="w-8 h-8" />
                        <span className="text-2xl font-bold">Connect POS</span>
                    </CardTitle>
                    <CardDescription>
                        Integrate your Point-of-Sale system to sync menus, orders, and inventory automatically. This feature is currently in development.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <POSIntegrationCard 
                            name="Square POS"
                            description="Sync your Square account to manage orders and your item library."
                        />
                         <POSIntegrationCard 
                            name="Toast POS"
                            description="A leading platform for restaurants. Sync menus, orders, and more."
                        />
                         <POSIntegrationCard 
                            name="Clover POS"
                            description="Connect with Clover to streamline your order management process."
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
