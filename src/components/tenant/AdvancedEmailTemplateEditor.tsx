"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Save, 
  Plus, 
  Trash2, 
  Upload,
  Palette,
  Image,
  Facebook,
  Twitter,
  Instagram,
  Globe,
  Phone,
  Mail
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";

interface EmailTemplate {
  id?: number;
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  customization: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    logoUrl: string;
    logoWidth: number;
    logoHeight: number;
    socialLinks: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      website?: string;
    };
    footerText: string;
    showSocialIcons: boolean;
    headerStyle: 'modern' | 'classic' | 'minimal';
    buttonStyle: 'rounded' | 'square' | 'pill';
  };
}

const defaultCustomization = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  logoUrl: '',
  logoWidth: 200,
  logoHeight: 80,
  socialLinks: {},
  footerText: 'Thank you for choosing us!',
  showSocialIcons: true,
  headerStyle: 'modern' as const,
  buttonStyle: 'rounded' as const,
};

const templateTypes = [
  { value: 'order_confirmation', label: 'Order Confirmation' },
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'feedback', label: 'Feedback Request' },
];

const availableVariables = {
  order_confirmation: ['customerName', 'orderNumber', 'orderItems', 'orderTotal', 'deliveryTime', 'restaurantName'],
  welcome: ['customerName', 'restaurantName'],
  receipt: ['customerName', 'orderNumber', 'orderItems', 'orderTotal', 'paymentMethod'],
  newsletter: ['customerName', 'restaurantName', 'newsContent'],
  promotion: ['customerName', 'restaurantName', 'discountCode', 'validUntil'],
  reminder: ['customerName', 'restaurantName', 'reminderContent'],
  feedback: ['customerName', 'restaurantName', 'orderNumber'],
};

export default function AdvancedEmailTemplateEditor() {
  const { tenantSlug } = useTenant();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      loadTemplates();
    }
  }, [tenantSlug]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/${tenantSlug}/email/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const createNewTemplate = () => {
    const newTemplate: EmailTemplate = {
      name: "New Template",
      type: "order_confirmation",
      subject: "{{restaurantName}} - New Message",
      htmlContent: generateDefaultHtmlContent(),
      textContent: "Default text content...",
      variables: availableVariables.order_confirmation,
      isActive: true,
      customization: { ...defaultCustomization }
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const generateDefaultHtmlContent = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: {{textColor}}; background-color: {{backgroundColor}}; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); padding: 30px; text-align: center;">
            {{#if logoUrl}}
            <img src="{{logoUrl}}" alt="{{restaurantName}}" style="max-width: {{logoWidth}}px; max-height: {{logoHeight}}px; margin-bottom: 20px;">
            {{/if}}
            <h1 style="color: white; margin: 0; font-size: 28px;">{{restaurantName}}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
            <h2 style="color: {{primaryColor}}; margin-top: 0;">Hello {{customerName}}!</h2>
            <p>Your content goes here...</p>
            
            {{#if showButton}}
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="background: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: {{buttonStyle === 'rounded' ? '8px' : buttonStyle === 'pill' ? '25px' : '0px'}}; display: inline-block;">Action Button</a>
            </div>
            {{/if}}
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            {{#if showSocialIcons}}
            <div style="margin-bottom: 20px;">
                {{#if socialLinks.facebook}}
                <a href="{{socialLinks.facebook}}" style="margin: 0 10px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" alt="Facebook" style="width: 24px; height: 24px;">
                </a>
                {{/if}}
                {{#if socialLinks.twitter}}
                <a href="{{socialLinks.twitter}}" style="margin: 0 10px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/124/124021.png" alt="Twitter" style="width: 24px; height: 24px;">
                </a>
                {{/if}}
                {{#if socialLinks.instagram}}
                <a href="{{socialLinks.instagram}}" style="margin: 0 10px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/124/124024.png" alt="Instagram" style="width: 24px; height: 24px;">
                </a>
                {{/if}}
                {{#if socialLinks.website}}
                <a href="{{socialLinks.website}}" style="margin: 0 10px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Website" style="width: 24px; height: 24px;">
                </a>
                {{/if}}
            </div>
            {{/if}}
            <p style="color: #666; font-size: 14px; margin: 0;">{{footerText}}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate || !tenantSlug) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const url = selectedTemplate.id 
        ? `/api/${tenantSlug}/email/templates` 
        : `/api/${tenantSlug}/email/templates`;
      
      const method = selectedTemplate.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ template: selectedTemplate }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Template saved successfully!" });
        setIsEditing(false);
        loadTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to save template" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTemplate) return;

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('tenant', tenantSlug || '');

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate({
          ...selectedTemplate,
          customization: {
            ...selectedTemplate.customization,
            logoUrl: data.logoUrl
          }
        });
        setMessage({ type: "success", text: "Logo uploaded successfully!" });
      } else {
        throw new Error("Failed to upload logo");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload logo" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    const processedHtml = selectedTemplate.htmlContent
      .replace(/{{primaryColor}}/g, selectedTemplate.customization.primaryColor)
      .replace(/{{secondaryColor}}/g, selectedTemplate.customization.secondaryColor)
      .replace(/{{backgroundColor}}/g, selectedTemplate.customization.backgroundColor)
      .replace(/{{textColor}}/g, selectedTemplate.customization.textColor)
      .replace(/{{logoUrl}}/g, selectedTemplate.customization.logoUrl)
      .replace(/{{logoWidth}}/g, selectedTemplate.customization.logoWidth.toString())
      .replace(/{{logoHeight}}/g, selectedTemplate.customization.logoHeight.toString())
      .replace(/{{footerText}}/g, selectedTemplate.customization.footerText)
      .replace(/{{restaurantName}}/g, 'Sample Restaurant')
      .replace(/{{customerName}}/g, 'John Doe');

    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        {previewMode === 'html' ? (
          <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{selectedTemplate.textContent}</pre>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Advanced Email Template Editor</h1>
        <Button onClick={createNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {message && (
        <Alert className={message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Manage your email templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                    selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.type}</p>
                    </div>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Editor */}
        {selectedTemplate && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isEditing ? 'Edit Template' : 'View Template'}</CardTitle>
                <div className="space-x-2">
                  {!isEditing && (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                  {isEditing && (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveTemplate} disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="social">Social & Branding</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          name: e.target.value
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Template Type</Label>
                      <Select
                        value={selectedTemplate.type}
                        onValueChange={(value) => setSelectedTemplate({
                          ...selectedTemplate,
                          type: value,
                          variables: availableVariables[value as keyof typeof availableVariables] || []
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={selectedTemplate.subject}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        subject: e.target.value
                      })}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="htmlContent">HTML Content</Label>
                    <Textarea
                      id="htmlContent"
                      value={selectedTemplate.htmlContent}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        htmlContent: e.target.value
                      })}
                      disabled={!isEditing}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="textContent">Plain Text Content</Label>
                    <Textarea
                      id="textContent"
                      value={selectedTemplate.textContent}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        textContent: e.target.value
                      })}
                      disabled={!isEditing}
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedTemplate.isActive}
                      onCheckedChange={(checked) => setSelectedTemplate({
                        ...selectedTemplate,
                        isActive: checked
                      })}
                      disabled={!isEditing}
                    />
                    <Label>Template Active</Label>
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={selectedTemplate.customization.primaryColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              primaryColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          className="w-20"
                        />
                        <Input
                          value={selectedTemplate.customization.primaryColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              primaryColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          placeholder="#667eea"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={selectedTemplate.customization.secondaryColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              secondaryColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          className="w-20"
                        />
                        <Input
                          value={selectedTemplate.customization.secondaryColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              secondaryColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          placeholder="#764ba2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={selectedTemplate.customization.backgroundColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              backgroundColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          className="w-20"
                        />
                        <Input
                          value={selectedTemplate.customization.backgroundColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              backgroundColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="textColor"
                          type="color"
                          value={selectedTemplate.customization.textColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              textColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          className="w-20"
                        />
                        <Input
                          value={selectedTemplate.customization.textColor}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              textColor: e.target.value
                            }
                          })}
                          disabled={!isEditing}
                          placeholder="#333333"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="headerStyle">Header Style</Label>
                      <Select
                        value={selectedTemplate.customization.headerStyle}
                        onValueChange={(value: 'modern' | 'classic' | 'minimal') => setSelectedTemplate({
                          ...selectedTemplate,
                          customization: {
                            ...selectedTemplate.customization,
                            headerStyle: value
                          }
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="buttonStyle">Button Style</Label>
                      <Select
                        value={selectedTemplate.customization.buttonStyle}
                        onValueChange={(value: 'rounded' | 'square' | 'pill') => setSelectedTemplate({
                          ...selectedTemplate,
                          customization: {
                            ...selectedTemplate.customization,
                            buttonStyle: value
                          }
                        })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rounded">Rounded</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="pill">Pill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Social & Branding Tab */}
                <TabsContent value="social" className="space-y-4">
                  <div>
                    <Label htmlFor="logoUpload">Logo Upload</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={!isEditing || uploadingLogo}
                        className="flex-1"
                      />
                      {uploadingLogo && <span className="text-sm text-gray-500">Uploading...</span>}
                    </div>
                    {selectedTemplate.customization.logoUrl && (
                      <div className="mt-2">
                        <img 
                          src={selectedTemplate.customization.logoUrl} 
                          alt="Logo" 
                          className="max-w-32 max-h-16 border rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="logoWidth">Logo Width (px)</Label>
                      <Input
                        id="logoWidth"
                        type="number"
                        value={selectedTemplate.customization.logoWidth}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          customization: {
                            ...selectedTemplate.customization,
                            logoWidth: parseInt(e.target.value) || 200
                          }
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="logoHeight">Logo Height (px)</Label>
                      <Input
                        id="logoHeight"
                        type="number"
                        value={selectedTemplate.customization.logoHeight}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          customization: {
                            ...selectedTemplate.customization,
                            logoHeight: parseInt(e.target.value) || 80
                          }
                        })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Social Media Links
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center space-x-3">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <Input
                          placeholder="Facebook URL"
                          value={selectedTemplate.customization.socialLinks.facebook || ''}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              socialLinks: {
                                ...selectedTemplate.customization.socialLinks,
                                facebook: e.target.value
                              }
                            }
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        <Input
                          placeholder="Twitter URL"
                          value={selectedTemplate.customization.socialLinks.twitter || ''}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              socialLinks: {
                                ...selectedTemplate.customization.socialLinks,
                                twitter: e.target.value
                              }
                            }
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        <Input
                          placeholder="Instagram URL"
                          value={selectedTemplate.customization.socialLinks.instagram || ''}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              socialLinks: {
                                ...selectedTemplate.customization.socialLinks,
                                instagram: e.target.value
                              }
                            }
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-600" />
                        <Input
                          placeholder="Website URL"
                          value={selectedTemplate.customization.socialLinks.website || ''}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            customization: {
                              ...selectedTemplate.customization,
                              socialLinks: {
                                ...selectedTemplate.customization.socialLinks,
                                website: e.target.value
                              }
                            }
                          })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Textarea
                      id="footerText"
                      value={selectedTemplate.customization.footerText}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        customization: {
                          ...selectedTemplate.customization,
                          footerText: e.target.value
                        }
                      })}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedTemplate.customization.showSocialIcons}
                      onCheckedChange={(checked) => setSelectedTemplate({
                        ...selectedTemplate,
                        customization: {
                          ...selectedTemplate.customization,
                          showSocialIcons: checked
                        }
                      })}
                      disabled={!isEditing}
                    />
                    <Label>Show Social Media Icons</Label>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Email Preview</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant={previewMode === 'html' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('html')}
                      >
                        HTML
                      </Button>
                      <Button
                        variant={previewMode === 'text' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('text')}
                      >
                        Text
                      </Button>
                    </div>
                  </div>
                  {renderPreview()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
