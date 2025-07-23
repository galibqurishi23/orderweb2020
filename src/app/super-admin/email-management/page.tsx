'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, Settings, TestTube, Users, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function EmailManagementPage() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      });

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast({
          title: "Success",
          description: "Test email sent successfully! Check your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send test email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvoiceEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/email/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: "Test Restaurant",
          restaurant_email: testEmail,
          invoice_id: "INV-2024-001",
          amount: "£79.99",
          plan_name: "Online Order + POS",
          billing_period: "Monthly",
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          invoice_url: `${window.location.origin}/super-admin/billing`
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Invoice email sent successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invoice email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: "Test Restaurant",
          admin_email: testEmail,
          admin_name: "Restaurant Owner",
          plan_name: "Online Order",
          trial_days: 3,
          admin_panel_url: `${window.location.origin}/admin`
        })
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Welcome email sent successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send welcome email",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send welcome email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Email Management</h1>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="testing">
            <TestTube className="h-4 w-4 mr-2" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Users className="h-4 w-4 mr-2" />
            Bulk Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Current email configuration for super admin and system emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Current Configuration:</strong>
                  <ul className="mt-2 space-y-1">
                    <li>• SMTP Host: smtp.hostinger.com</li>
                    <li>• Port: 465 (SSL/TLS Enabled)</li>
                    <li>• Username: noreply@ordertest.co.uk</li>
                    <li>• From Email: noreply@ordertest.co.uk</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Host</Label>
                  <Input value="smtp.hostinger.com" disabled />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input value="465" disabled />
                </div>
                <div>
                  <Label>Security</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">SSL/TLS Enabled</Badge>
                  </div>
                </div>
                <div>
                  <Label>From Email</Label>
                  <Input value="noreply@ordertest.co.uk" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>Email Testing</CardTitle>
              <CardDescription>
                Test the email configuration and send sample emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={handleTestEmail}
                  disabled={isLoading || !testEmail}
                  className="w-full"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </Button>

                <Button
                  onClick={handleSendInvoiceEmail}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Test Invoice Email
                </Button>

                <Button
                  onClick={handleSendWelcomeEmail}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Test Welcome Email
                </Button>
              </div>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage email templates for different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Super Admin Invoice</h4>
                  <p className="text-sm text-gray-600 mb-3">Sent when an invoice is generated for a restaurant</p>
                  <Badge variant="secondary">super_admin_invoice_generated</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">License Expiry</h4>
                  <p className="text-sm text-gray-600 mb-3">Reminder email for expiring restaurant licenses</p>
                  <Badge variant="secondary">restaurant_license_expiry</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Order Confirmation</h4>
                  <p className="text-sm text-gray-600 mb-3">Sent to customers when they place an order</p>
                  <Badge variant="secondary">order_confirmation</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Welcome Restaurant</h4>
                  <p className="text-sm text-gray-600 mb-3">Welcome email for new restaurant registrations</p>
                  <Badge variant="secondary">welcome_restaurant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Email</CardTitle>
              <CardDescription>
                Send bulk emails to multiple recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Bulk email functionality is available through the API endpoint <code>/api/email/bulk</code>.
                  This feature supports sending multiple emails with rate limiting to prevent spam.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
