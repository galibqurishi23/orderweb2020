"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Mail, Settings, TestTube, Palette, Upload, Facebook, Twitter, Instagram, Globe } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useTenantData } from "@/context/TenantDataContext";

interface EmailTemplateCustomization {
  logo: string;
  footerMessage: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    website: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export default function EmailSettings() {
  const { tenantSlug } = useTenant();
  const { restaurantSettings } = useTenantData();
  
  const [templateCustomization, setTemplateCustomization] = useState<EmailTemplateCustomization>({
    logo: "",
    footerMessage: "Thank you for choosing us!",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      website: ""
    },
    colors: {
      primary: "#3B82F6",
      secondary: "#F1F5F9", 
      text: "#1F2937",
      background: "#FFFFFF"
    },
    fonts: {
      heading: "Arial",
      body: "Arial"
    }
  });

  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load existing template customization
  useEffect(() => {
    if (tenantSlug) {
      loadTemplateCustomization();
    }
  }, [tenantSlug]);

  const loadTemplateCustomization = async () => {
    try {
      const response = await fetch(`/api/${tenantSlug}/email/template-customization`);
      if (response.ok) {
        const data = await response.json();
        if (data.customization) {
          setTemplateCustomization(data.customization);
        }
      }
    } catch (error) {
      console.error("Failed to load template customization:", error);
    }
  };

  const handleSaveCustomization = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantSlug}/email/template-customization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customization: templateCustomization }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Template customization saved successfully!" });
      } else {
        throw new Error(data.error || "Failed to save customization");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage({ type: "error", text: `Failed to save customization: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantSlug}/email/test-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: testEmail,
          customization: templateCustomization 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "Test email sent successfully!" 
        });
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send test email.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsTesting(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await fetch(`/api/${tenantSlug}/upload/logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setTemplateCustomization(prev => ({
          ...prev,
          logo: data.logoUrl
        }));
        setMessage({ type: "success", text: "Logo uploaded successfully!" });
      } else {
        throw new Error(data.error || "Failed to upload logo");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload logo";
      setMessage({ type: "error", text: errorMessage });
    }
  };

  // Get timing from order timing settings
  const getCollectionTime = () => {
    return restaurantSettings?.collectionTimeSettings?.collectionTimeMinutes || 30;
  };

  const getDeliveryTime = () => {
    return restaurantSettings?.deliveryTimeSettings?.deliveryTimeMinutes || 45;
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const collectionTime = getCollectionTime();
    const deliveryTime = getDeliveryTime();

    return `
      <div style="font-family: ${templateCustomization.fonts.body}, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${templateCustomization.colors.background}; color: ${templateCustomization.colors.text};">
        ${templateCustomization.logo ? `
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="${templateCustomization.logo}" alt="Logo" style="max-height: 80px; width: auto;" />
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: ${templateCustomization.colors.secondary}; border-radius: 8px;">
          <h1 style="font-family: ${templateCustomization.fonts.heading}, Arial, sans-serif; color: ${templateCustomization.colors.primary}; margin: 0;">Order Confirmation</h1>
          <p style="font-size: 18px; color: ${templateCustomization.colors.text}; margin: 10px 0 0 0;">Order #TIK-1234</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="font-family: ${templateCustomization.fonts.heading}, Arial, sans-serif; color: ${templateCustomization.colors.primary};">Dear Customer,</h2>
          <p>Thank you for your order! We have received your order and it is being processed.</p>
        </div>
        
        <div style="background: ${templateCustomization.colors.secondary}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: ${templateCustomization.colors.primary}; margin-top: 0;">Order Details:</h3>
          <div style="border-bottom: 1px solid #ddd; padding: 8px 0;">
            <span style="font-weight: bold;">Sample Item</span>
            <span style="float: right;">x1 - £9.91</span>
          </div>
          <div style="text-align: right; margin-top: 15px; padding-top: 15px; border-top: 2px solid ${templateCustomization.colors.primary};">
            <strong style="font-size: 18px; color: ${templateCustomization.colors.primary};">Total: £9.91</strong>
          </div>
        </div>
        
        <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${templateCustomization.colors.primary};">
          <h3 style="color: ${templateCustomization.colors.primary}; margin-top: 0;">Order Timing:</h3>
          <p><strong>Collection:</strong> Ready in ${collectionTime} minutes</p>
          <p><strong>Delivery:</strong> Ready in ${deliveryTime} minutes</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: ${templateCustomization.colors.secondary}; border-radius: 8px;">
          ${templateCustomization.footerMessage ? `<p style="margin-bottom: 20px;">${templateCustomization.footerMessage}</p>` : ''}
          
          ${Object.values(templateCustomization.socialLinks).some(link => link) ? `
            <div style="margin-bottom: 20px;">
              <p style="margin-bottom: 10px;">Follow us:</p>
              <div style="display: inline-block;">
                ${templateCustomization.socialLinks.facebook ? `<a href="${templateCustomization.socialLinks.facebook}" style="margin: 0 10px; color: ${templateCustomization.colors.primary};">Facebook</a>` : ''}
                ${templateCustomization.socialLinks.twitter ? `<a href="${templateCustomization.socialLinks.twitter}" style="margin: 0 10px; color: ${templateCustomization.colors.primary};">Twitter</a>` : ''}
                ${templateCustomization.socialLinks.instagram ? `<a href="${templateCustomization.socialLinks.instagram}" style="margin: 0 10px; color: ${templateCustomization.colors.primary};">Instagram</a>` : ''}
                ${templateCustomization.socialLinks.website ? `<a href="${templateCustomization.socialLinks.website}" style="margin: 0 10px; color: ${templateCustomization.colors.primary};">Website</a>` : ''}
              </div>
            </div>
          ` : ''}
          
          <p style="color: #666; font-size: 12px; margin: 0;">This order was placed at ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Template Settings</h1>
        <p className="text-sm text-gray-600 ml-4">Customize your customer confirmation email template</p>
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

      <Tabs defaultValue="customize" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customize" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Customize Template
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Logo
                </CardTitle>
                <CardDescription>
                  Upload your restaurant logo for the email header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templateCustomization.logo && (
                  <div className="text-center">
                    <img 
                      src={templateCustomization.logo} 
                      alt="Current logo" 
                      className="max-h-20 mx-auto rounded"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Colors
                </CardTitle>
                <CardDescription>
                  Customize the color scheme of your email template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={templateCustomization.colors.primary}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={templateCustomization.colors.primary}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={templateCustomization.colors.secondary}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, secondary: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={templateCustomization.colors.secondary}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, secondary: e.target.value }
                        }))}
                        placeholder="#F1F5F9"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Message */}
            <Card>
              <CardHeader>
                <CardTitle>Footer Message</CardTitle>
                <CardDescription>
                  Add a custom message to the bottom of your emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={templateCustomization.footerMessage}
                  onChange={(e) => setTemplateCustomization(prev => ({
                    ...prev,
                    footerMessage: e.target.value
                  }))}
                  placeholder="Thank you for choosing us!"
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>
                  Add links to your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={templateCustomization.socialLinks.facebook}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                    }))}
                    placeholder="https://facebook.com/yourrestaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Label>
                  <Input
                    id="twitter"
                    value={templateCustomization.socialLinks.twitter}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                    placeholder="https://twitter.com/yourrestaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={templateCustomization.socialLinks.instagram}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                    placeholder="https://instagram.com/yourrestaurant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={templateCustomization.socialLinks.website}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, website: e.target.value }
                    }))}
                    placeholder="https://yourrestaurant.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Timing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timing Display</CardTitle>
              <CardDescription>
                The template will automatically show collection and delivery times from your Order Timing settings.
                Current settings: Collection in {getCollectionTime()} minutes, Delivery in {getDeliveryTime()} minutes.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveCustomization} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Template Preview</CardTitle>
              <CardDescription>
                This is how your customer confirmation emails will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send a test email with your current template customization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button onClick={handleTestEmail} disabled={isTesting || !testEmail}>
                {isTesting ? "Sending..." : "Send Test Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
