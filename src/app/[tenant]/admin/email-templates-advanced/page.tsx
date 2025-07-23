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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Upload, Eye, Save, Palette, Mail, Image, Globe, MessageSquare, Type, Layout, Brush, Sparkles } from 'lucide-react';
import { useParams } from 'next/navigation';

interface EmailBranding {
  id?: number;
  tenant_id: string;
  selected_customer_template: 'A' | 'B';
  restaurant_logo_url?: string;
  restaurant_name?: string;
  restaurant_tagline?: string;
  social_media_facebook?: string;
  social_media_instagram?: string;
  social_media_twitter?: string;
  custom_footer_text?: string;
  is_active: boolean;
  // Color Customization
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  header_background_color?: string;
  footer_background_color?: string;
  button_color?: string;
  button_text_color?: string;
  border_color?: string;
  // Template A Specific Colors
  template_a_header_color?: string;
  template_a_accent_color?: string;
  template_a_button_color?: string;
  // Template B Specific Colors
  template_b_header_color?: string;
  template_b_accent_color?: string;
  template_b_button_color?: string;
  // Typography & Layout
  font_family?: 'Arial' | 'Helvetica' | 'Georgia' | 'Times' | 'Verdana' | 'Tahoma';
  font_size?: 'small' | 'medium' | 'large';
  border_radius?: 'none' | 'small' | 'medium' | 'large';
  email_width?: number;
  logo_position?: 'left' | 'center' | 'right';
  logo_size?: 'small' | 'medium' | 'large';
  header_style?: 'minimal' | 'gradient' | 'shadow' | 'border';
  button_style?: 'flat' | 'rounded' | 'pill' | 'outline';
  template_layout?: 'classic' | 'modern' | 'minimal' | 'vibrant';
  custom_css?: string;
}

interface EmailPreset {
  id: number;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  header_background_color: string;
  footer_background_color: string;
  button_color: string;
  button_text_color: string;
  border_color: string;
  font_family: string;
  font_size: string;
  border_radius: string;
  logo_position: string;
  logo_size: string;
  header_style: string;
  button_style: string;
  template_layout: string;
}

export default function EmailTemplatesPage() {
  const params = useParams();
  const tenantId = params.tenant as string;

  const [branding, setBranding] = useState<EmailBranding>({
    tenant_id: tenantId,
    selected_customer_template: 'A',
    restaurant_logo_url: '',
    restaurant_name: '',
    restaurant_tagline: '',
    social_media_facebook: '',
    social_media_instagram: '',
    social_media_twitter: '',
    custom_footer_text: '',
    is_active: true,
    // Default colors
    primary_color: '#1e40af',
    secondary_color: '#3b82f6',
    accent_color: '#60a5fa',
    text_color: '#1f2937',
    background_color: '#ffffff',
    header_background_color: '#f8fafc',
    footer_background_color: '#f1f5f9',
    button_color: '#1e40af',
    button_text_color: '#ffffff',
    border_color: '#e2e8f0',
    // Template A specific colors
    template_a_header_color: '#1e40af',
    template_a_accent_color: '#60a5fa',
    template_a_button_color: '#1e40af',
    // Template B specific colors
    template_b_header_color: '#7c3aed',
    template_b_accent_color: '#a855f7',
    template_b_button_color: '#7c3aed',
    // Default typography & layout
    font_family: 'Arial',
    font_size: 'medium',
    border_radius: 'small',
    email_width: 600,
    logo_position: 'center',
    logo_size: 'medium',
    header_style: 'minimal',
    button_style: 'rounded',
    template_layout: 'modern'
  });

  const [presets, setPresets] = useState<EmailPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'A' | 'B'>('A');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadEmailBranding();
    loadPresets();
  }, [tenantId]);

  const loadEmailBranding = async () => {
    try {
      const response = await fetch(`/api/${tenantId}/email-branding`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setBranding({ ...branding, ...data.data });
      }
    } catch (error) {
      console.error('Error loading email branding:', error);
    }
  };

  const loadPresets = async () => {
    try {
      const response = await fetch('/api/email-template-presets');
      const data = await response.json();
      
      if (data.success) {
        setPresets(data.data);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantId}/email-branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Email branding settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving settings' });
    }

    setLoading(false);
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/${tenantId}/upload-logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setBranding(prev => ({
          ...prev,
          restaurant_logo_url: data.logoUrl
        }));
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload logo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading logo' });
    }
    setIsUploading(false);
  };

  const applyPreset = (preset: EmailPreset) => {
    setBranding(prev => ({
      ...prev,
      primary_color: preset.primary_color,
      secondary_color: preset.secondary_color,
      accent_color: preset.accent_color,
      text_color: preset.text_color,
      background_color: preset.background_color,
      header_background_color: preset.header_background_color,
      footer_background_color: preset.footer_background_color,
      button_color: preset.button_color,
      button_text_color: preset.button_text_color,
      border_color: preset.border_color,
      font_family: preset.font_family as any,
      font_size: preset.font_size as any,
      border_radius: preset.border_radius as any,
      logo_position: preset.logo_position as any,
      logo_size: preset.logo_size as any,
      header_style: preset.header_style as any,
      button_style: preset.button_style as any,
      template_layout: preset.template_layout as any
    }));
    setMessage({ type: 'success', text: `Applied ${preset.name} preset successfully!` });
  };

  const ColorPicker = ({ label, value, onChange }: { label: string; value?: string; onChange: (color: string) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 rounded border cursor-pointer"
        />
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Email Template Customization</h1>
          <p className="text-gray-600 mt-2">Create stunning, professional email templates with complete visual control</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(previewMode === 'A' ? 'B' : 'A')}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Template {previewMode === 'A' ? 'B' : 'A'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => {
              const newTemplate = branding.selected_customer_template === 'A' ? 'B' : 'A';
              setBranding(prev => ({ ...prev, selected_customer_template: newTemplate }));
              setPreviewMode(newTemplate);
            }}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Switch & Preview
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customization Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Presets
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Basic Email Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the fundamental aspects of your email templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Restaurant Branding */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Restaurant Branding</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Restaurant Name</Label>
                        <Input
                          type="text"
                          placeholder="Your Restaurant Name"
                          value={branding.restaurant_name || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, restaurant_name: e.target.value }))}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">This will appear in your email headers</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Restaurant Tagline (Optional)</Label>
                        <Input
                          type="text"
                          placeholder="Delicious food, delivered fresh"
                          value={branding.restaurant_tagline || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, restaurant_tagline: e.target.value }))}
                          className="italic"
                        />
                        <p className="text-xs text-gray-500">A short description of your restaurant</p>
                      </div>
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Email Template Style</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Template A - Classic */}
                      <div 
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          branding.selected_customer_template === 'A' 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setBranding(prev => ({ ...prev, selected_customer_template: 'A' }))}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            branding.selected_customer_template === 'A' 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {branding.selected_customer_template === 'A' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">Classic Template</div>
                            <div className="text-sm text-gray-600 mb-3">Traditional layout with structured header and footer sections</div>
                            {/* Mini Preview */}
                            <div className="bg-white border rounded-lg p-3 text-xs">
                              <div className="bg-gray-100 h-4 rounded mb-2"></div>
                              <div className="space-y-1">
                                <div className="bg-gray-200 h-2 rounded w-3/4"></div>
                                <div className="bg-gray-200 h-2 rounded w-1/2"></div>
                              </div>
                              <div className="bg-blue-100 h-3 rounded mt-2 w-1/3"></div>
                              <div className="bg-gray-100 h-3 rounded mt-2"></div>
                            </div>
                          </div>
                        </div>
                        {branding.selected_customer_template === 'A' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Selected
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Template B - Modern */}
                      <div 
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          branding.selected_customer_template === 'B' 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setBranding(prev => ({ ...prev, selected_customer_template: 'B' }))}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            branding.selected_customer_template === 'B' 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {branding.selected_customer_template === 'B' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">Modern Template</div>
                            <div className="text-sm text-gray-600 mb-3">Clean, minimalist design with spacious layout</div>
                            {/* Mini Preview */}
                            <div className="bg-white border rounded-lg p-3 text-xs">
                              <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-3 rounded mb-3"></div>
                              <div className="space-y-2">
                                <div className="bg-gray-100 h-2 rounded w-full"></div>
                                <div className="bg-gray-100 h-2 rounded w-2/3"></div>
                              </div>
                              <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded mt-3 w-2/5"></div>
                              <div className="bg-gray-50 h-2 rounded mt-2"></div>
                            </div>
                          </div>
                        </div>
                        {branding.selected_customer_template === 'B' && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Selected
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Template Features Comparison */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Template Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-blue-600 mb-2">Classic Template (A)</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Traditional business layout</li>
                            <li>• Structured header with logo</li>
                            <li>• Clear content sections</li>
                            <li>• Professional footer</li>
                            <li>• Best for formal communications</li>
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium text-blue-600 mb-2">Modern Template (B)</div>
                          <ul className="space-y-1 text-gray-600">
                            <li>• Contemporary design</li>
                            <li>• Spacious, clean layout</li>
                            <li>• Gradient elements</li>
                            <li>• Minimalist footer</li>
                            <li>• Best for modern brands</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Restaurant Logo</Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Logo URL</Label>
                          <Input
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value={branding.restaurant_logo_url || ''}
                            onChange={(e) => setBranding(prev => ({ ...prev, restaurant_logo_url: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Upload Logo File</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload(file);
                              }}
                              disabled={isUploading}
                              className="flex-1"
                            />
                            {isUploading && <div className="text-sm text-gray-500">Uploading...</div>}
                          </div>
                        </div>
                      </div>
                      {branding.restaurant_logo_url && (
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Logo Preview</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBranding(prev => ({ ...prev, restaurant_logo_url: '' }))}
                            >
                              Remove
                            </Button>
                          </div>
                          <img
                            src={branding.restaurant_logo_url}
                            alt="Restaurant logo"
                            className="max-h-20 max-w-40 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Social Media Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Facebook URL</Label>
                        <Input
                          type="url"
                          placeholder="https://facebook.com/yourpage"
                          value={branding.social_media_facebook || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, social_media_facebook: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Instagram URL</Label>
                        <Input
                          type="url"
                          placeholder="https://instagram.com/yourpage"
                          value={branding.social_media_instagram || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, social_media_instagram: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter URL</Label>
                        <Input
                          type="url"
                          placeholder="https://twitter.com/yourpage"
                          value={branding.social_media_twitter || ''}
                          onChange={(e) => setBranding(prev => ({ ...prev, social_media_twitter: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Footer */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Custom Footer Text</Label>
                    <Textarea
                      placeholder="Add custom footer text for your emails..."
                      value={branding.custom_footer_text || ''}
                      onChange={(e) => setBranding(prev => ({ ...prev, custom_footer_text: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Color Customization */}
            <TabsContent value="colors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Color Scheme
                  </CardTitle>
                  <CardDescription>
                    Customize the color palette for your email templates with template-specific options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Specific Colors */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      Template-Specific Colors
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Template A Colors */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          Classic Template (A) Colors
                        </h4>
                        <div className="space-y-3">
                          <ColorPicker
                            label="Header Color"
                            value={branding.template_a_header_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_a_header_color: color }))}
                          />
                          <ColorPicker
                            label="Accent Color"
                            value={branding.template_a_accent_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_a_accent_color: color }))}
                          />
                          <ColorPicker
                            label="Button Color"
                            value={branding.template_a_button_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_a_button_color: color }))}
                          />
                        </div>
                      </div>

                      {/* Template B Colors */}
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          Modern Template (B) Colors
                        </h4>
                        <div className="space-y-3">
                          <ColorPicker
                            label="Header Color"
                            value={branding.template_b_header_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_b_header_color: color }))}
                          />
                          <ColorPicker
                            label="Accent Color"
                            value={branding.template_b_accent_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_b_accent_color: color }))}
                          />
                          <ColorPicker
                            label="Button Color"
                            value={branding.template_b_button_color}
                            onChange={(color) => setBranding(prev => ({ ...prev, template_b_button_color: color }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Smart Feature:</strong> Each template has its own color scheme! Colors automatically switch when you change templates, giving you complete design control.
                      </p>
                    </div>
                  </div>

                  {/* Global Colors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand Colors */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Global Brand Colors</h4>
                      <ColorPicker
                        label="Primary Color"
                        value={branding.primary_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, primary_color: color }))}
                      />
                      <ColorPicker
                        label="Secondary Color"
                        value={branding.secondary_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, secondary_color: color }))}
                      />
                      <ColorPicker
                        label="Accent Color"
                        value={branding.accent_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, accent_color: color }))}
                      />
                    </div>

                    {/* Text & Background */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Text & Background</h4>
                      <ColorPicker
                        label="Text Color"
                        value={branding.text_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, text_color: color }))}
                      />
                      <ColorPicker
                        label="Background Color"
                        value={branding.background_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, background_color: color }))}
                      />
                      <ColorPicker
                        label="Border Color"
                        value={branding.border_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, border_color: color }))}
                      />
                    </div>

                    {/* Header & Footer */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Header & Footer</h4>
                      <ColorPicker
                        label="Header Background"
                        value={branding.header_background_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, header_background_color: color }))}
                      />
                      <ColorPicker
                        label="Footer Background"
                        value={branding.footer_background_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, footer_background_color: color }))}
                      />
                    </div>

                    {/* Buttons */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Button Colors</h4>
                      <ColorPicker
                        label="Button Background"
                        value={branding.button_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, button_color: color }))}
                      />
                      <ColorPicker
                        label="Button Text"
                        value={branding.button_text_color}
                        onChange={(color) => setBranding(prev => ({ ...prev, button_text_color: color }))}
                      />
                    </div>
                  </div>

                  {/* Quick Color Sync */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Color Actions</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentTemplate = branding.selected_customer_template;
                          if (currentTemplate === 'A') {
                            setBranding(prev => ({
                              ...prev,
                              template_a_header_color: branding.primary_color,
                              template_a_accent_color: branding.accent_color,
                              template_a_button_color: branding.button_color
                            }));
                          } else {
                            setBranding(prev => ({
                              ...prev,
                              template_b_header_color: branding.primary_color,
                              template_b_accent_color: branding.accent_color,
                              template_b_button_color: branding.button_color
                            }));
                          }
                          setMessage({ type: 'success', text: `Synced global colors to Template ${currentTemplate}!` });
                        }}
                      >
                        Sync Global Colors to Current Template
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBranding(prev => ({
                            ...prev,
                            template_a_header_color: branding.primary_color,
                            template_a_accent_color: branding.accent_color,
                            template_a_button_color: branding.button_color,
                            template_b_header_color: branding.secondary_color,
                            template_b_accent_color: branding.accent_color,
                            template_b_button_color: branding.secondary_color
                          }));
                          setMessage({ type: 'success', text: 'Applied global colors to both templates!' });
                        }}
                      >
                        Apply to Both Templates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography */}
            <TabsContent value="typography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Typography Settings
                  </CardTitle>
                  <CardDescription>
                    Configure fonts and text styling for your emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Font Family</Label>
                        <Select
                          value={branding.font_family}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, font_family: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Times">Times New Roman</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                            <SelectItem value="Tahoma">Tahoma</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Font Size</Label>
                        <Select
                          value={branding.font_size}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, font_size: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (14px)</SelectItem>
                            <SelectItem value="medium">Medium (16px)</SelectItem>
                            <SelectItem value="large">Large (18px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Layout & Styling
                  </CardTitle>
                  <CardDescription>
                    Configure the visual layout and styling options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Template Layout</Label>
                        <Select
                          value={branding.template_layout}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, template_layout: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Border Radius</Label>
                        <Select
                          value={branding.border_radius}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, border_radius: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (0px)</SelectItem>
                            <SelectItem value="small">Small (4px)</SelectItem>
                            <SelectItem value="medium">Medium (8px)</SelectItem>
                            <SelectItem value="large">Large (16px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Email Width</Label>
                        <div className="space-y-2">
                          <Slider
                            value={[branding.email_width || 600]}
                            onValueChange={([value]) => setBranding(prev => ({ ...prev, email_width: value }))}
                            min={400}
                            max={800}
                            step={50}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-600 text-center">
                            {branding.email_width || 600}px
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Logo Position</Label>
                        <Select
                          value={branding.logo_position}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, logo_position: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Logo Size</Label>
                        <Select
                          value={branding.logo_size}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, logo_size: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (100px)</SelectItem>
                            <SelectItem value="medium">Medium (150px)</SelectItem>
                            <SelectItem value="large">Large (200px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Button Style</Label>
                        <Select
                          value={branding.button_style}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, button_style: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="rounded">Rounded</SelectItem>
                            <SelectItem value="pill">Pill</SelectItem>
                            <SelectItem value="outline">Outline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Header Style</Label>
                        <Select
                          value={branding.header_style}
                          onValueChange={(value: any) => setBranding(prev => ({ ...prev, header_style: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="shadow">Shadow</SelectItem>
                            <SelectItem value="border">Border</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Custom CSS */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Custom CSS (Advanced)</Label>
                    <Textarea
                      placeholder="Add custom CSS for advanced styling..."
                      value={branding.custom_css || ''}
                      onChange={(e) => setBranding(prev => ({ ...prev, custom_css: e.target.value }))}
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Add custom CSS to further customize your email templates. Use with caution as this may affect email compatibility.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Presets */}
            <TabsContent value="presets" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Design Presets
                  </CardTitle>
                  <CardDescription>
                    Choose from pre-designed color schemes and layouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{preset.name}</h4>
                            <p className="text-sm text-gray-600">{preset.description}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            Apply
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: preset.primary_color }}
                            title="Primary Color"
                          />
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: preset.secondary_color }}
                            title="Secondary Color"
                          />
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: preset.accent_color }}
                            title="Accent Color"
                          />
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: preset.button_color }}
                            title="Button Color"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </span>
                <Badge variant="secondary">Template {previewMode}</Badge>
              </CardTitle>
              <CardDescription>
                See how your email will look with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden bg-white">
                <div 
                  className="email-preview p-4 space-y-4"
                  style={{
                    fontFamily: branding.font_family,
                    fontSize: branding.font_size === 'small' ? '14px' : branding.font_size === 'large' ? '18px' : '16px',
                    color: branding.text_color,
                    backgroundColor: branding.background_color,
                    maxWidth: `${branding.email_width}px`,
                    margin: '0 auto'
                  }}
                >
                  {/* Header - Different styles for Template A vs B */}
                  <div 
                    className={`p-4 rounded ${previewMode === 'A' ? 'border-b-2' : ''}`}
                    style={{
                      backgroundColor: branding.header_background_color,
                      textAlign: branding.logo_position as any,
                      borderRadius: branding.border_radius === 'none' ? '0' : 
                                   branding.border_radius === 'small' ? '4px' :
                                   branding.border_radius === 'medium' ? '8px' : '16px',
                      ...(branding.header_style === 'gradient' && {
                        background: previewMode === 'B' 
                          ? `linear-gradient(135deg, ${branding.template_b_header_color}, ${branding.template_b_accent_color})` 
                          : `linear-gradient(135deg, ${branding.template_a_header_color}, ${branding.template_a_accent_color})`
                      }),
                      ...(branding.header_style === 'shadow' && {
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }),
                      ...(branding.header_style === 'border' && {
                        border: `2px solid ${previewMode === 'A' ? branding.template_a_accent_color : branding.template_b_accent_color}`
                      }),
                      ...(previewMode === 'A' && {
                        borderBottomColor: branding.template_a_accent_color
                      }),
                      ...(previewMode === 'B' && {
                        padding: '24px 16px',
                        background: branding.header_style === 'gradient' 
                          ? `linear-gradient(135deg, ${branding.template_b_header_color}, ${branding.template_b_accent_color})`
                          : branding.template_b_header_color
                      })
                    }}
                  >
                    {branding.restaurant_logo_url && (
                      <img
                        src={branding.restaurant_logo_url}
                        alt="Logo"
                        style={{
                          height: branding.logo_size === 'small' ? '60px' : 
                                 branding.logo_size === 'large' ? '100px' : '80px',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          marginBottom: previewMode === 'B' ? '12px' : '8px'
                        }}
                      />
                    )}
                    
                    {/* Restaurant Name */}
                    {branding.restaurant_name && (
                      <h1 style={{ 
                        color: previewMode === 'A' ? branding.template_a_header_color : branding.template_b_header_color,
                        margin: previewMode === 'B' ? '8px 0 4px 0' : '4px 0',
                        fontSize: previewMode === 'B' ? '28px' : '24px',
                        fontWeight: previewMode === 'B' ? '700' : '800',
                        letterSpacing: previewMode === 'B' ? '-0.5px' : '0'
                      }}>
                        {branding.restaurant_name}
                      </h1>
                    )}
                    
                    {/* Restaurant Tagline */}
                    {branding.restaurant_tagline && (
                      <p style={{ 
                        color: branding.text_color, 
                        opacity: 0.8,
                        margin: '4px 0 8px 0',
                        fontSize: previewMode === 'B' ? '14px' : '13px',
                        fontStyle: 'italic'
                      }}>
                        {branding.restaurant_tagline}
                      </p>
                    )}
                    
                    <h2 style={{ 
                      color: branding.text_color, 
                      margin: previewMode === 'B' ? '12px 0' : '8px 0',
                      fontSize: previewMode === 'B' ? '20px' : '18px',
                      fontWeight: previewMode === 'B' ? '300' : '600'
                    }}>
                      {previewMode === 'A' ? 'Order Confirmation' : 'Thank you for your order!'}
                    </h2>
                    {previewMode === 'B' && (
                      <p style={{ 
                        color: branding.text_color, 
                        opacity: 0.8,
                        margin: '0',
                        fontSize: '14px'
                      }}>
                        Your order has been received and is being prepared with care
                      </p>
                    )}
                  </div>

                  {/* Content - Different layouts for Template A vs B */}
                  <div className={previewMode === 'A' ? 'space-y-3' : 'space-y-4'} style={{
                    padding: previewMode === 'B' ? '8px 0' : '0'
                  }}>
                    {previewMode === 'A' && (
                      <p>Thank you for your order! Here are the details:</p>
                    )}
                    
                    <div 
                      className={`p-${previewMode === 'B' ? '4' : '3'} rounded border`}
                      style={{
                        borderColor: branding.border_color,
                        backgroundColor: previewMode === 'B' ? branding.header_background_color : branding.background_color,
                        borderRadius: previewMode === 'B' ? '12px' : '8px',
                        boxShadow: previewMode === 'B' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: previewMode === 'B' ? '12px' : '8px'
                      }}>
                        <strong style={{ fontSize: previewMode === 'B' ? '16px' : '14px' }}>Order #12345</strong>
                        {previewMode === 'B' && (
                          <span style={{ 
                            background: branding.template_b_accent_color, 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            Processing
                          </span>
                        )}
                      </div>
                      <div style={{ lineHeight: previewMode === 'B' ? '1.6' : '1.4' }}>
                        2x Margherita Pizza<br />
                        1x Caesar Salad<br />
                        <div style={{ 
                          marginTop: previewMode === 'B' ? '12px' : '8px',
                          paddingTop: previewMode === 'B' ? '12px' : '8px',
                          borderTop: `1px solid ${branding.border_color}`
                        }}>
                          <strong style={{ fontSize: previewMode === 'B' ? '18px' : '16px' }}>Total: $24.99</strong>
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    <div style={{ 
                      textAlign: 'center', 
                      margin: previewMode === 'B' ? '32px 0' : '20px 0' 
                    }}>
                      <button
                        style={{
                          backgroundColor: previewMode === 'A' ? branding.template_a_button_color : branding.template_b_button_color,
                          color: branding.button_text_color,
                          padding: previewMode === 'B' ? '16px 32px' : '12px 24px',
                          border: branding.button_style === 'outline' ? `2px solid ${previewMode === 'A' ? branding.template_a_button_color : branding.template_b_button_color}` : 'none',
                          borderRadius: branding.button_style === 'pill' ? '25px' :
                                       branding.button_style === 'rounded' ? (previewMode === 'B' ? '12px' : '8px') : '4px',
                          cursor: 'pointer',
                          fontSize: previewMode === 'B' ? '16px' : '14px',
                          fontWeight: '600',
                          boxShadow: previewMode === 'B' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                          transition: 'all 0.2s ease',
                          ...(branding.button_style === 'outline' && {
                            backgroundColor: 'transparent',
                            color: previewMode === 'A' ? branding.template_a_button_color : branding.template_b_button_color
                          })
                        }}
                      >
                        {previewMode === 'A' ? 'Track Your Order' : 'View Order Status'}
                      </button>
                    </div>

                    {previewMode === 'B' && (
                      <div style={{ 
                        textAlign: 'center',
                        padding: '16px',
                        backgroundColor: branding.template_b_accent_color + '20',
                        borderRadius: '8px',
                        border: `1px solid ${branding.template_b_accent_color}40`
                      }}>
                        <p style={{ 
                          margin: '0',
                          fontSize: '14px',
                          color: branding.text_color,
                          fontWeight: '500'
                        }}>
                          🚚 Estimated delivery: 25-35 minutes
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer - Different styles for Template A vs B */}
                  <div 
                    className={`p-4 rounded text-center ${previewMode === 'A' ? 'border-t-2' : ''}`}
                    style={{
                      backgroundColor: branding.footer_background_color,
                      borderRadius: branding.border_radius === 'none' ? '0' : 
                                   branding.border_radius === 'small' ? '4px' :
                                   branding.border_radius === 'medium' ? '8px' : '16px',
                      ...(previewMode === 'A' && {
                        borderTopColor: branding.border_color
                      }),
                      ...(previewMode === 'B' && {
                        marginTop: '24px',
                        background: `linear-gradient(135deg, ${branding.footer_background_color}, ${branding.header_background_color})`
                      })
                    }}
                  >
                    {branding.custom_footer_text && (
                      <p style={{ 
                        fontSize: previewMode === 'B' ? '13px' : '12px', 
                        margin: '0 0 8px 0',
                        lineHeight: previewMode === 'B' ? '1.5' : '1.3'
                      }}>
                        {branding.custom_footer_text}
                      </p>
                    )}
                    
                    {(branding.social_media_facebook || branding.social_media_instagram || branding.social_media_twitter) && (
                      <div className={`flex justify-center gap-${previewMode === 'B' ? '4' : '3'} mt-2`}>
                        {branding.social_media_facebook && (
                          <a 
                            href={branding.social_media_facebook} 
                            style={{ 
                              color: branding.text_color,
                              textDecoration: 'none',
                              fontSize: previewMode === 'B' ? '14px' : '12px',
                              padding: previewMode === 'B' ? '8px 12px' : '4px 8px',
                              backgroundColor: previewMode === 'B' ? branding.template_b_accent_color + '20' : 'transparent',
                              borderRadius: previewMode === 'B' ? '6px' : '0'
                            }}
                          >
                            Facebook
                          </a>
                        )}
                        {branding.social_media_instagram && (
                          <a 
                            href={branding.social_media_instagram} 
                            style={{ 
                              color: branding.text_color,
                              textDecoration: 'none',
                              fontSize: previewMode === 'B' ? '14px' : '12px',
                              padding: previewMode === 'B' ? '8px 12px' : '4px 8px',
                              backgroundColor: previewMode === 'B' ? branding.template_b_accent_color + '20' : 'transparent',
                              borderRadius: previewMode === 'B' ? '6px' : '0'
                            }}
                          >
                            Instagram
                          </a>
                        )}
                        {branding.social_media_twitter && (
                          <a 
                            href={branding.social_media_twitter} 
                            style={{ 
                              color: branding.text_color,
                              textDecoration: 'none',
                              fontSize: previewMode === 'B' ? '14px' : '12px',
                              padding: previewMode === 'B' ? '8px 12px' : '4px 8px',
                              backgroundColor: previewMode === 'B' ? branding.template_b_accent_color + '20' : 'transparent',
                              borderRadius: previewMode === 'B' ? '6px' : '0'
                            }}
                          >
                            Twitter
                          </a>
                        )}
                      </div>
                    )}

                    {previewMode === 'B' && (
                      <div style={{ 
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: `1px solid ${branding.border_color}`,
                        fontSize: '11px',
                        color: branding.text_color,
                        opacity: 0.7
                      }}>
                        This email was sent with ❤️ from our kitchen to your table
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
