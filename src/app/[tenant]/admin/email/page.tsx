'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Settings, Eye, Edit, Save, X, AlertCircle, CheckCircle, Clock, XCircle, Palette, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { professionalEmailTemplates, getTemplatePreview } from '@/lib/professional-email-templates-v2';
import TemplateCustomization from '@/components/TemplateCustomization';

interface EmailTemplate {
  id: string;
  template_type: 'order_confirmation' | 'order_complete' | 'restaurant_notification';
  name?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string;
  active: boolean;
}

interface EmailLog {
  id: string;
  order_id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  error_message: string;
  created_at: string;
}

interface SMTPSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export default function EmailManagementPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [smtpSettings, setSmtpSettings] = useState<SMTPSettings>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from: ''
  });
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [customizingTemplate, setCustomizingTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplates, setActiveTemplates] = useState<{
    templateStatus: {
      order_confirmation?: { id: string; name: string; };
      order_complete?: { id: string; name: string; };
      restaurant_notification?: { id: string; name: string; };
    };
    smtpStatus: {
      configured: boolean;
      host?: string;
      port?: number;
      secure?: boolean;
      from?: string;
    };
  }>({
    templateStatus: {},
    smtpStatus: { configured: false }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailData();
    fetchActiveTemplates();
  }, []);

  const fetchActiveTemplates = async () => {
    try {
      const response = await fetch('/api/tenant/email/active-templates');
      if (response.ok) {
        const data = await response.json();
        setActiveTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching active templates:', error);
    }
  };

  const fetchEmailData = async () => {
    try {
      const [templatesRes, logsRes, smtpRes] = await Promise.all([
        fetch('/api/tenant/email/templates'),
        fetch('/api/tenant/email/logs'),
        fetch('/api/tenant/email/smtp-settings')
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEmailLogs(logsData);
      }

      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setSmtpSettings(smtpData);
      }
    } catch (error) {
      console.error('Error fetching email data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMTPSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/tenant/email/smtp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpSettings)
      });

      if (response.ok) {
        toast({
          title: 'SMTP Settings Saved',
          description: 'Email configuration has been updated successfully.',
        });
      } else {
        throw new Error('Failed to save SMTP settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save SMTP settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomizeTemplate = (template: any) => {
    setCustomizingTemplate(template);
  };

  const handleSaveCustomTemplate = async (customTemplate: any) => {
    // This will be handled by the TemplateCustomization component
    setCustomizingTemplate(null);
    // Refresh templates after saving
    await fetchEmailData();
  };

  const handleCancelCustomization = () => {
    setCustomizingTemplate(null);
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    setSaving(true);
    try {
      const response = await fetch('/api/tenant/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        await fetchEmailData();
        setEditingTemplate(null);
        toast({
          title: 'Template Saved',
          description: 'Email template has been updated successfully.',
        });
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/tenant/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: smtpSettings.user })
      });

      if (response.ok) {
        toast({
          title: 'Test Email Sent',
          description: 'Check your inbox for the test email.',
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Could not send test email. Please check your SMTP settings.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'order_confirmation':
        return 'Order Confirmation';
      case 'order_complete':
        return 'Order Complete';
      case 'restaurant_notification':
        return 'Restaurant Notification';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Management</h1>
        <p className="text-gray-600">Configure email templates and SMTP settings</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="settings">SMTP Settings</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Active Templates Summary */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Currently Active Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {templates.filter(t => t.active).map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                      <div>
                        <p className="font-medium">{getTemplateTypeLabel(template.template_type)}</p>
                        <p className="text-sm text-gray-600">{template.subject}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))}
                {templates.filter(t => t.active).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No active templates found. Choose from professional templates below.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Professional Email Templates
              </CardTitle>
              <p className="text-sm text-gray-600">
                Choose from our professionally designed email templates. These templates come with demo data and are ready to use.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {professionalEmailTemplates.map((template) => {
                  // Check if this template type is currently active
                  const isActive = templates.some(t => t.active && t.template_type === template.template_type);
                  
                  return (
                    <Card key={template.id} className={`border-2 transition-colors ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{template.template_type.replace('_', ' ')}</Badge>
                            {isActive && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">{template.subject}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{template.name} - Preview</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded">
                                <p className="font-medium mb-2">Subject: {template.subject}</p>
                                <p className="text-sm text-gray-600">Template Type: {template.template_type.replace('_', ' ')}</p>
                              </div>
                              <div className="border rounded p-4">
                                <h4 className="font-medium mb-2">HTML Preview:</h4>
                                <iframe
                                  srcDoc={template.html_content}
                                  className="w-full h-96 border rounded"
                                  title={`${template.name} Preview`}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          className="w-full" 
                          onClick={() => handleCustomizeTemplate(template)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Customize This Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Template Features:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Responsive design that works on all devices</li>
                  <li>• Professional HTML layouts with fallback text versions</li>
                  <li>• Variable substitution (order details, customer info, etc.)</li>
                  <li>• Demo data included for testing</li>
                  <li>• Customizable colors and branding</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {editingTemplate && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edit Template: {getTemplateTypeLabel(editingTemplate.template_type)}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      subject: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="content">HTML Content</Label>
                  <Textarea
                    id="content"
                    value={editingTemplate.html_content}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      html_content: e.target.value
                    })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={editingTemplate.active}
                    onCheckedChange={(checked) => setEditingTemplate({
                      ...editingTemplate,
                      active: checked
                    })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveTemplate(editingTemplate)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Template'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Cancel
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Available variables: {`{{customer_name}}, {{order_id}}, {{total}}, {{restaurant_name}}, {{restaurant_address}}, {{restaurant_phone}}`}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input
                    id="host"
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({
                      ...smtpSettings,
                      host: e.target.value
                    })}
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={smtpSettings.port}
                    onChange={(e) => setSmtpSettings({
                      ...smtpSettings,
                      port: parseInt(e.target.value) || 587
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="user">Username</Label>
                  <Input
                    id="user"
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings({
                      ...smtpSettings,
                      user: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={smtpSettings.password}
                    onChange={(e) => setSmtpSettings({
                      ...smtpSettings,
                      password: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="from">From Email</Label>
                  <Input
                    id="from"
                    value={smtpSettings.from}
                    onChange={(e) => setSmtpSettings({
                      ...smtpSettings,
                      from: e.target.value
                    })}
                    placeholder="noreply@restaurant.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="secure"
                    checked={smtpSettings.secure}
                    onCheckedChange={(checked) => setSmtpSettings({
                      ...smtpSettings,
                      secure: checked
                    })}
                  />
                  <Label htmlFor="secure">Use SSL/TLS</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSMTPSettings}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={!smtpSettings.host || !smtpSettings.user}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No email logs found
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="font-medium">{log.subject}</p>
                          <p className="text-sm text-gray-500">
                            To: {log.recipient_email} • {new Date(log.created_at).toLocaleDateString()}
                          </p>
                          {log.error_message && (
                            <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {getTemplateTypeLabel(log.email_type)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Customization Modal */}
      {customizingTemplate && (
        <TemplateCustomization
          template={customizingTemplate}
          onSave={handleSaveCustomTemplate}
          onCancel={handleCancelCustomization}
          isOpen={true}
        />
      )}
    </div>
  );
}
