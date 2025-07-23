'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Settings, Palette, TrendingUp } from 'lucide-react';

// Import existing page components
import EmailSettingsPage from '../email-settings/page';
import EmailTemplatesPage from '../email-templates-advanced/page';
import EmailAnalyticsPage from '../email-analytics/page';

export default function EmailManagementPage() {
  const [activeTab, setActiveTab] = useState('smtp');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Email Management</CardTitle>
              <CardDescription>
                Complete email system configuration, template customization, and analytics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Unified Email Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger 
            value="smtp" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Settings className="w-4 h-4" />
            SMTP Settings
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Palette className="w-4 h-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6 mt-6">
          <EmailSettingsPage />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6 mt-6">
          <EmailTemplatesPage />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <EmailAnalyticsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
