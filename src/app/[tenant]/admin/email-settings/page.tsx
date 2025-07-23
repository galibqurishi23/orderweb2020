'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Mail, Send, Settings, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useParams } from 'next/navigation';

interface EmailSettings {
  id?: number;
  tenant_id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  is_ssl: boolean;
  is_active: boolean;
  last_test_success?: string;
  failure_count: number;
}

export default function EmailSettingsPage() {
  const params = useParams();
  const tenantId = params.tenant as string;

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    tenant_id: tenantId,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    reply_to: '',
    is_ssl: true,
    is_active: true,
    failure_count: 0
  });

  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingSettings, setHasExistingSettings] = useState(false);

  useEffect(() => {
    loadEmailSettings();
  }, [tenantId]);

  const loadEmailSettings = async () => {
    try {
      const response = await fetch(`/api/${tenantId}/email-settings`);
      const data = await response.json();
      
      if (data.success) {
        setEmailSettings(data.data);
        setHasExistingSettings(true);
      } else {
        // No existing settings found, keep default values
        setHasExistingSettings(false);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      setMessage({ type: 'error', text: 'Failed to load email settings' });
    }
  };

  const saveEmailSettings = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const method = hasExistingSettings ? 'PUT' : 'POST';
      const response = await fetch(`/api/${tenantId}/email-settings`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Email settings saved successfully!' });
        setHasExistingSettings(true);
        // Reload settings to get updated data
        await loadEmailSettings();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save email settings' });
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      setMessage({ type: 'error', text: 'Failed to save email settings' });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setTestMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setTestLoading(true);
    setTestMessage(null);

    try {
      const response = await fetch(`/api/${tenantId}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail,
          smtp_settings: hasExistingSettings ? null : emailSettings
        })
      });

      const data = await response.json();

      if (data.success) {
        setTestMessage({ 
          type: 'success', 
          text: `Test email sent successfully to ${testEmail}! ${data.usedFallback ? '(Used system fallback)' : ''}` 
        });
      } else {
        setTestMessage({ type: 'error', text: data.message || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setTestMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!hasExistingSettings) return 'secondary';
    if (emailSettings.failure_count > 0) return 'destructive';
    if (emailSettings.is_active) return 'default';
    return 'secondary';
  };

  const getStatusText = () => {
    if (!hasExistingSettings) return 'Not Configured';
    if (emailSettings.failure_count > 0) return `${emailSettings.failure_count} Failures`;
    if (emailSettings.is_active) return 'Active';
    return 'Inactive';
  };

  const getStatusIcon = () => {
    if (!hasExistingSettings) return <Settings className="w-4 h-4" />;
    if (emailSettings.failure_count > 0) return <XCircle className="w-4 h-4" />;
    if (emailSettings.is_active) return <CheckCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Email Settings</h1>
            <p className="text-muted-foreground">Configure SMTP settings for order notifications and customer emails</p>
          </div>
          <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        {emailSettings.last_test_success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Last successful test: {new Date(emailSettings.last_test_success).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="smtp" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            SMTP Configuration
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Test Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                SMTP Server Configuration
              </CardTitle>
              <CardDescription>
                Configure your email server settings to send order confirmations and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host *</Label>
                  <Input
                    id="smtp_host"
                    placeholder="mail.yourdomain.com"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port *</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    placeholder="587"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Username *</Label>
                  <Input
                    id="smtp_username"
                    placeholder="your@email.com"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={emailSettings.smtp_password === '***hidden***' ? 'Password is set' : 'Enter password'}
                      value={emailSettings.smtp_password}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email *</Label>
                  <Input
                    id="from_email"
                    type="email"
                    placeholder="noreply@yourrestaurant.com"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name *</Label>
                  <Input
                    id="from_name"
                    placeholder="Your Restaurant Name"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply_to">Reply-To Email (Optional)</Label>
                <Input
                  id="reply_to"
                  type="email"
                  placeholder="contact@yourrestaurant.com"
                  value={emailSettings.reply_to || ''}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, reply_to: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_ssl"
                    checked={emailSettings.is_ssl}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, is_ssl: checked }))}
                  />
                  <Label htmlFor="is_ssl">Use SSL/TLS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={emailSettings.is_active}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Enable Email Sending</Label>
                </div>
              </div>

              {message && (
                <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={saveEmailSettings} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Test Email Configuration
              </CardTitle>
              <CardDescription>
                Send a test email to verify your SMTP settings are working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test_email">Test Email Address</Label>
                <Input
                  id="test_email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              {testMessage && (
                <Alert className={testMessage.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  <AlertDescription className={testMessage.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                    {testMessage.text}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={sendTestEmail} 
                disabled={testLoading || !testEmail}
                className="w-full"
              >
                {testLoading ? 'Sending Test Email...' : 'Send Test Email'}
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>ℹ️ This will send a test email to verify your SMTP configuration.</p>
                {!hasExistingSettings && (
                  <p className="mt-2 text-amber-600">⚠️ Settings not saved yet. Test will use current form values.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
