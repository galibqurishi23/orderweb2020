'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Eye, Save, Palette, Mail, Image, Globe, MessageSquare } from 'lucide-react';
import { useParams } from 'next/navigation';

interface EmailBranding {
  id?: number;
  tenant_id: string;
  selected_customer_template: 'A' | 'B';
  restaurant_logo_url?: string;
  social_media_facebook?: string;
  social_media_instagram?: string;
  social_media_twitter?: string;
  custom_footer_text?: string;
  is_active: boolean;
}

export default function EmailTemplatesPage() {
  const params = useParams();
  const tenantId = params.tenant as string;

  const [branding, setBranding] = useState<EmailBranding>({
    tenant_id: tenantId,
    selected_customer_template: 'A',
    restaurant_logo_url: '',
    social_media_facebook: '',
    social_media_instagram: '',
    social_media_twitter: '',
    custom_footer_text: '',
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'A' | 'B'>('A');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadEmailBranding();
  }, [tenantId]);

  const loadEmailBranding = async () => {
    try {
      const response = await fetch(`/api/${tenantId}/email-branding`);
      const data = await response.json();
      
      if (data.success) {
        setBranding(data.data);
        setPreviewMode(data.data.selected_customer_template);
      }
    } catch (error) {
      console.error('Error loading email branding:', error);
      setMessage({ type: 'error', text: 'Failed to load email branding settings' });
    }
  };

  const saveBranding = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantId}/email-branding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Email template settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save template settings' });
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      setMessage({ type: 'error', text: 'Failed to save template settings' });
    } finally {
      setLoading(false);
    }
  };

  const sendPreviewEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${tenantId}/send-preview-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: previewMode,
          branding: branding,
          testEmail: 'test@example.com' // You can make this configurable
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Preview email sent successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to send preview email' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send preview email' });
    } finally {
      setLoading(false);
    }
  };

  const templateDescriptions = {
    A: {
      name: 'Professional & Clean',
      description: 'Modern, corporate design with clean lines and professional color scheme',
      features: ['Clean typography', 'Professional color palette', 'Structured layout', 'Business-focused design']
    },
    B: {
      name: 'Warm & Friendly',
      description: 'Colorful, welcoming design with emojis and vibrant styling',
      features: ['Colorful design', 'Friendly emojis', 'Warm colors', 'Customer-focused approach']
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Templates</h1>
        <p className="text-muted-foreground">Customize your customer email templates and branding</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Template Selection
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding & Social
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview & Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Choose Your Email Template Style
              </CardTitle>
              <CardDescription>
                Select the template style that best represents your restaurant's personality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={branding.selected_customer_template}
                onValueChange={(value: 'A' | 'B') => {
                  setBranding(prev => ({ ...prev, selected_customer_template: value }));
                  setPreviewMode(value);
                }}
                className="space-y-6"
              >
                {Object.entries(templateDescriptions).map(([key, template]) => (
                  <div key={key} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label htmlFor={key} className="text-lg font-semibold cursor-pointer">
                          Template {key}: {template.name}
                        </Label>
                        {branding.selected_customer_template === key && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {template.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewMode(key as 'A' | 'B')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Restaurant Branding
                </CardTitle>
                <CardDescription>
                  Add your restaurant logo and customize the footer text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">Restaurant Logo</Label>
                  
                  {/* URL Input Option */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Option 1: Image URL</Label>
                    <Input
                      id="logo_url"
                      placeholder="https://yourdomain.com/logo.png"
                      value={branding.restaurant_logo_url || ''}
                      onChange={(e) => setBranding(prev => ({ ...prev, restaurant_logo_url: e.target.value }))}
                    />
                  </div>

                  {/* File Upload Option */}
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Option 2: Upload Image</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploading(true);
                            try {
                              const formData = new FormData();
                              formData.append('logo', file);
                              
                              const response = await fetch(`/api/${tenantId}/upload-logo`, {
                                method: 'POST',
                                body: formData,
                              });
                              
                              const result = await response.json();
                              
                              if (result.success) {
                                setBranding(prev => ({ ...prev, restaurant_logo_url: result.data.url }));
                                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                              } else {
                                setMessage({ type: 'error', text: `Upload failed: ${result.error}` });
                              }
                            } catch (error) {
                              console.error('Upload error:', error);
                              setMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' });
                            } finally {
                              setIsUploading(false);
                              // Clear the file input
                              e.target.value = '';
                            }
                          }
                        }}
                        className="flex-1"
                      />
                      {isUploading && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Upload className="h-4 w-4 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, PNG, GIF, WebP. Maximum file size: 5MB.
                    </p>
                  </div>

                  {/* Logo Preview */}
                  {branding.restaurant_logo_url && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm font-normal">Preview:</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBranding(prev => ({ ...prev, restaurant_logo_url: '' }))}
                          className="text-xs"
                        >
                          Remove Logo
                        </Button>
                      </div>
                      <div className="p-2 border rounded-md bg-gray-50">
                        <img 
                          src={branding.restaurant_logo_url} 
                          alt="Restaurant Logo Preview" 
                          className="max-w-[200px] max-h-[80px] object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Upload an image file or provide a publicly accessible image URL. Optimal dimensions: 200x80px or similar aspect ratio.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Custom Footer Text</Label>
                  <Textarea
                    id="footer_text"
                    placeholder="Thank you for choosing our restaurant! Visit us again soon."
                    value={branding.custom_footer_text || ''}
                    onChange={(e) => setBranding(prev => ({ ...prev, custom_footer_text: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Add your social media profiles to email templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook Page URL</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/yourrestaurant"
                    value={branding.social_media_facebook || ''}
                    onChange={(e) => setBranding(prev => ({ ...prev, social_media_facebook: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Profile URL</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/yourrestaurant"
                    value={branding.social_media_instagram || ''}
                    onChange={(e) => setBranding(prev => ({ ...prev, social_media_instagram: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter Profile URL</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/yourrestaurant"
                    value={branding.social_media_twitter || ''}
                    onChange={(e) => setBranding(prev => ({ ...prev, social_media_twitter: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={saveBranding} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Template Settings'}
          </Button>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Template Preview
              </CardTitle>
              <CardDescription>
                Preview how your emails will look to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Preview Template:</Label>
                  <RadioGroup
                    value={previewMode}
                    onValueChange={(value: 'A' | 'B') => setPreviewMode(value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A" id="preview-a" />
                      <Label htmlFor="preview-a">Template A (Professional)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="B" id="preview-b" />
                      <Label htmlFor="preview-b">Template B (Friendly)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Template {previewMode}: {templateDescriptions[previewMode].name}</h3>
                  
                  {/* Sample Preview Content */}
                  <div className="bg-white border rounded p-4 max-w-md mx-auto" style={{
                    fontFamily: previewMode === 'B' ? 'Comic Sans MS, cursive' : 'Segoe UI, sans-serif'
                  }}>
                    <div className={`text-center p-4 text-white rounded-t ${
                      previewMode === 'A' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gradient-to-r from-orange-400 to-red-500'
                    }`}>
                      {branding.restaurant_logo_url && (
                        <img 
                          src={branding.restaurant_logo_url} 
                          alt="Restaurant Logo" 
                          className="h-10 mx-auto mb-2 filter brightness-0 invert"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <h2 className="text-lg font-bold">Your Restaurant Name</h2>
                      <p>{previewMode === 'A' ? 'Order Confirmation' : '🎊 Order Confirmed! 🎊'}</p>
                    </div>
                    
                    <div className="p-4">
                      <p className="mb-2">
                        {previewMode === 'A' ? 'Thank you for your order!' : 'Hooray! Your delicious order is confirmed! 🥳'}
                      </p>
                      <div className="text-sm text-gray-600">
                        <p>Order #: 12345</p>
                        <p>Items: Sample Menu Item x2</p>
                        <p>Total: £25.99</p>
                      </div>
                    </div>

                    {/* Social Media Preview */}
                    {(branding.social_media_facebook || branding.social_media_instagram || branding.social_media_twitter) && (
                      <div className="px-4 py-2 text-center text-sm">
                        <p className="mb-1">{previewMode === 'A' ? 'Follow us:' : '🌟 Stay connected! 🌟'}</p>
                        <div className="space-x-2">
                          {branding.social_media_facebook && <span className="text-blue-600">Facebook</span>}
                          {branding.social_media_instagram && <span className="text-pink-600">Instagram</span>}
                          {branding.social_media_twitter && <span className="text-blue-400">Twitter</span>}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-800 text-white text-center p-3 rounded-b text-sm">
                      <p className="font-semibold">Your Restaurant Name</p>
                      {branding.custom_footer_text && (
                        <p className="text-xs mt-1 text-gray-300">{branding.custom_footer_text}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={sendPreviewEmail} disabled={loading}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                  <Button variant="outline" onClick={() => window.open('#', '_blank')}>
                    <Eye className="w-4 h-4 mr-2" />
                    Full Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
