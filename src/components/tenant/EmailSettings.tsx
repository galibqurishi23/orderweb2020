"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Mail, Settings, TestTube, Palette, Upload, Facebook, Twitter, Instagram, Globe, Server, Eye, EyeOff, Music } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useAdmin } from "@/context/AdminContext";

interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  enabled: boolean;
  isConfigured: boolean;
}

interface EmailTemplateCustomization {
  logo: string;
  logoLink: string;
  logoPosition: 'left' | 'center' | 'right';
  footerMessage: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    tiktok: string;
    website: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export default function EmailSettings() {
  const { tenantSlug } = useTenant();
  const { tenantData } = useAdmin();
  
  // SMTP Settings State
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    host: "",
    port: 587,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    secure: false,
    enabled: false,
    isConfigured: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [smtpLoading, setSMTPLoading] = useState(false);
  const [smtpTesting, setSMTPTesting] = useState(false);
  
  // Template Customization State
  const [templateCustomization, setTemplateCustomization] = useState<EmailTemplateCustomization>({
    logo: "",
    logoLink: "",
    logoPosition: "center",
    footerMessage: "Thank you for choosing us!",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      tiktok: "",
      website: ""
    },
    colors: {
      primary: "#1f2937",
      secondary: "#f8fafc", 
      text: "#374151",
      background: "#ffffff",
      accent: "#6366f1"
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
      loadSMTPSettings();
    }
  }, [tenantSlug]);

  const loadTemplateCustomization = async () => {
    try {
      const response = await fetch(`/api/${tenantSlug}/email/template-customization`);
      if (response.ok) {
        const data = await response.json();
        if (data.customization) {
          // Merge with default values to ensure all fields are defined
          setTemplateCustomization(prev => ({
            ...prev,
            ...data.customization,
            // Ensure logoLink is always a string
            logoLink: data.customization.logoLink || "",
            // Ensure other critical fields are strings
            logo: data.customization.logo || "",
            footerMessage: data.customization.footerMessage || "Thank you for choosing us!",
            socialLinks: {
              facebook: data.customization.socialLinks?.facebook || "",
              twitter: data.customization.socialLinks?.twitter || "",
              instagram: data.customization.socialLinks?.instagram || "",
              tiktok: data.customization.socialLinks?.tiktok || "",
              website: data.customization.socialLinks?.website || ""
            },
            colors: {
              primary: data.customization.colors?.primary || "#1f2937",
              secondary: data.customization.colors?.secondary || "#f8fafc",
              text: data.customization.colors?.text || "#374151",
              background: data.customization.colors?.background || "#ffffff",
              accent: data.customization.colors?.accent || "#6366f1"
            },
            fonts: {
              heading: data.customization.fonts?.heading || "Arial",
              body: data.customization.fonts?.body || "Arial"
            }
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load template customization:", error);
    }
  };

  // SMTP Settings Functions
  const loadSMTPSettings = async () => {
    try {
      const response = await fetch(`/api/${tenantSlug}/email/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.emailSettings) {
          setSMTPSettings({
            host: data.emailSettings.smtpHost || "",
            port: data.emailSettings.smtpPort || 587,
            username: data.emailSettings.smtpUser || "",
            password: "", // Don't load password for security
            fromEmail: data.emailSettings.smtpFrom || "",
            fromName: data.emailSettings.name || "",
            secure: data.emailSettings.smtpSecure || false,
            enabled: data.emailSettings.emailEnabled || false,
            isConfigured: data.emailSettings.isConfigured || false
          });
        }
      }
    } catch (error) {
      console.error("Failed to load SMTP settings:", error);
    }
  };

  const handleSaveSMTPSettings = async () => {
    setSMTPLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantSlug}/email/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          smtpSettings: {
            host: smtpSettings.host,
            port: smtpSettings.port,
            username: smtpSettings.username,
            password: smtpSettings.password,
            fromEmail: smtpSettings.fromEmail,
            fromName: smtpSettings.fromName,
            secure: smtpSettings.secure
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "SMTP settings saved successfully!" 
        });
        // Reload settings to get updated status
        loadSMTPSettings();
      } else {
        throw new Error(data.error || "Failed to save SMTP settings");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save SMTP settings.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSMTPLoading(false);
    }
  };

  const handleTestSMTPConnection = async () => {
    setSMTPTesting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantSlug}/email/test-smtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          smtpSettings: {
            host: smtpSettings.host,
            port: smtpSettings.port,
            username: smtpSettings.username,
            password: smtpSettings.password,
            fromEmail: smtpSettings.fromEmail,
            fromName: smtpSettings.fromName,
            secure: smtpSettings.secure
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "SMTP connection test successful!" 
        });
      } else {
        throw new Error(data.error || "SMTP connection test failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "SMTP connection test failed.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSMTPTesting(false);
    }
  };

  const handleClearSMTPSettings = async () => {
    if (!confirm("Are you sure you want to clear all SMTP settings? This will disable email functionality.")) {
      return;
    }

    setSMTPLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantSlug}/email/settings`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "SMTP settings cleared successfully!" 
        });
        // Reset form
        setSMTPSettings({
          host: "",
          port: 587,
          username: "",
          password: "",
          fromEmail: "",
          fromName: "",
          secure: false,
          enabled: false,
          isConfigured: false
        });
      } else {
        throw new Error(data.error || "Failed to clear SMTP settings");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear SMTP settings.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSMTPLoading(false);
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
        setMessage({ type: "success", text: data.message || "Template customization saved successfully!" });
      } else {
        throw new Error(data.error || data.details || "Failed to save customization");
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
    // Validate file type - PNG and JPG only
    if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
      setMessage({ type: "error", text: "Only PNG and JPG files are allowed for logo upload." });
      return;
    }

    // Validate file size (optional - limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo file size must be less than 5MB." });
      return;
    }

    // Create image to validate dimensions
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    try {
      await new Promise((resolve, reject) => {
        img.onload = () => {
          // Check dimensions
          if (img.width > 300 || img.height > 400) {
            reject(new Error(`Logo dimensions must be maximum 300px wide × 400px tall. Your image is ${img.width}px × ${img.height}px.`));
            return;
          }
          resolve(true);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });

      const formData = new FormData();
      formData.append('logo', file);

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
    } finally {
      // Clean up object URL
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    }
  };

  // Get timing from order timing settings
  const getCollectionTime = () => {
    return tenantData?.settings?.collectionTimeSettings?.collectionTimeMinutes || 30;
  };

  const getDeliveryTime = () => {
    return tenantData?.settings?.deliveryTimeSettings?.deliveryTimeMinutes || 45;
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const collectionTime = getCollectionTime();
    const deliveryTime = getDeliveryTime();
    const restaurantName = tenantData?.name || 'Restaurant Name';
    const restaurantAddress = tenantData?.address || '';
    const restaurantPhone = tenantData?.phone || '';
    
    // Prioritize logoLink over uploaded logo
    const logoUrl = templateCustomization.logoLink || templateCustomization.logo;

    return `
      <div style="font-family: ${templateCustomization.fonts.body}, 'Arial', 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${templateCustomization.colors.primary} 0%, ${templateCustomization.colors.accent} 100%); padding: 30px; text-align: center; position: relative;">
          ${logoUrl ? `
          <div style="display: flex; justify-content: ${templateCustomization.logoPosition === 'left' ? 'flex-start' : templateCustomization.logoPosition === 'right' ? 'flex-end' : 'center'}; align-items: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${restaurantName}" style="height: auto; width: auto; max-height: 400px; max-width: 300px; object-fit: contain; display: block;">
          </div>
          ` : ''}
          
          <h1 style="font-family: ${templateCustomization.fonts.heading}, 'Arial', sans-serif; font-size: 24px; font-weight: 700; color: white; margin: 0 0 8px;">
            Order Confirmation
          </h1>
          
          <p style="font-size: 16px; color: rgba(255, 255, 255, 0.9); font-weight: 400; margin: 0 0 12px;">
            Thank you for your order, John!
          </p>
          
          <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 15px; font-weight: 500; font-size: 13px; color: white;">
            Collection Order
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 25px;">
          <!-- Order Summary -->
          <div style="background: #f8fafc; border-radius: 6px; padding: 20px; margin-bottom: 20px; border-left: 3px solid ${templateCustomization.colors.primary};">
            <h2 style="font-family: ${templateCustomization.fonts.heading}, 'Arial', sans-serif; font-size: 16px; font-weight: 700; color: ${templateCustomization.colors.primary}; margin: 0 0 15px;">
              Order Summary
            </h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <div style="display: flex; flex-direction: column;">
                <span style="font-size: 11px; font-weight: 600; color: ${templateCustomization.colors.accent}; text-transform: uppercase; letter-spacing: 0.5px;">Order #TIK-1234</span>
                <span style="font-size: 13px; color: ${templateCustomization.colors.text}; margin-top: 2px;">Collection • Ready in 30-45 min</span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; font-weight: 600; color: ${templateCustomization.colors.accent}; text-transform: uppercase; letter-spacing: 0.5px;">Status</span>
                <div style="font-size: 13px; font-weight: 600; color: #059669; margin-top: 2px;">✓ Confirmed</div>
              </div>
            </div>
          </div>
          
          <!-- Order Items -->
          <div style="margin-bottom: 20px;">
            <h3 style="font-family: ${templateCustomization.fonts.heading}, 'Arial', sans-serif; font-size: 16px; font-weight: 700; color: ${templateCustomization.colors.primary}; margin: 0 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
              Order Items
            </h3>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                  <div style="font-size: 15px; font-weight: 600; color: ${templateCustomization.colors.text}; margin-bottom: 4px;">Chicken Tikka Masala</div>
                  <div style="font-size: 12px; color: ${templateCustomization.colors.text}; opacity: 0.7;">Qty: 2 × £12.99</div>
                </div>
                <div style="font-size: 15px; font-weight: 700; color: ${templateCustomization.colors.primary};">
                  £25.98
                </div>
              </div>
            </div>
          </div>
          
          <!-- Total Section -->
          <div style="background: ${templateCustomization.colors.primary}; color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px;">
              <span>Subtotal</span>
              <span>£25.98</span>
            </div>
            
            {/* Tax removed - application is tax-free */}
            
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.3); padding-top: 12px; margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 700;">
                <span>Total Amount</span>
                <span>£25.98</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 14px; color: ${templateCustomization.colors.text}; margin: 0 0 15px; font-weight: 500;">
            ${templateCustomization.footerMessage || 'Thank you for choosing us!'}
          </p>
          
          ${(templateCustomization.socialLinks.facebook || templateCustomization.socialLinks.twitter || templateCustomization.socialLinks.instagram || templateCustomization.socialLinks.website) ? `
          <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 15px;">
            ${templateCustomization.socialLinks.facebook ? `<a href="${templateCustomization.socialLinks.facebook}" style="color: #333333; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #ffffff; border: 2px solid #333333; border-radius: 10px; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s ease;"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${templateCustomization.socialLinks.twitter ? `<a href="${templateCustomization.socialLinks.twitter}" style="color: #333333; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #ffffff; border: 2px solid #333333; border-radius: 10px; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s ease;"><i class="fab fa-twitter"></i></a>` : ''}
            ${templateCustomization.socialLinks.instagram ? `<a href="${templateCustomization.socialLinks.instagram}" style="color: #333333; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #ffffff; border: 2px solid #333333; border-radius: 10px; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s ease;"><i class="fab fa-instagram"></i></a>` : ''}
            ${templateCustomization.socialLinks.website ? `<a href="${templateCustomization.socialLinks.website}" style="color: #333333; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #ffffff; border: 2px solid #333333; border-radius: 10px; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: all 0.3s ease;"><i class="fas fa-globe"></i></a>` : ''}
          </div>
          ` : ''}
          
          <div style="font-size: 12px; color: ${templateCustomization.colors.text}; opacity: 0.8; line-height: 1.5;">
            <p style="margin: 0 0 3px; font-weight: 600; font-size: 13px;">${restaurantName}</p>
            ${restaurantAddress ? `<p style="margin: 0 0 3px;">${restaurantAddress}</p>` : ''}
            ${restaurantPhone ? `<p style="margin: 0 0 3px;">${restaurantPhone}</p>` : ''}
            <p style="margin-top: 10px; font-size: 10px; opacity: 0.6;">
              Please bring this confirmation when collecting your order.
            </p>
          </div>
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

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            SMTP Settings
          </TabsTrigger>
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

        {/* SMTP Settings Tab */}
        <TabsContent value="smtp" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMTP Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  SMTP Configuration
                </CardTitle>
                <CardDescription>
                  Configure your email server settings to enable email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input
                      id="smtp-host"
                      value={smtpSettings.host}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={smtpSettings.port}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-username">Username</Label>
                    <Input
                      id="smtp-username"
                      value={smtpSettings.username}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="smtp-password"
                        type={showPassword ? "text" : "password"}
                        value={smtpSettings.password}
                        onChange={(e) => setSMTPSettings(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="App password or email password"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-email">From Email</Label>
                    <Input
                      id="smtp-from-email"
                      type="email"
                      value={smtpSettings.fromEmail}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                      placeholder="noreply@yourrestaurant.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-from-name">From Name</Label>
                    <Input
                      id="smtp-from-name"
                      value={smtpSettings.fromName}
                      onChange={(e) => setSMTPSettings(prev => ({ ...prev, fromName: e.target.value }))}
                      placeholder="Your Restaurant Name"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={smtpSettings.secure}
                    onChange={(e) => setSMTPSettings(prev => ({ ...prev, secure: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="smtp-secure">Use SSL/TLS (Port 465)</Label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveSMTPSettings} 
                    disabled={smtpLoading || !smtpSettings.host || !smtpSettings.username}
                    className="flex-1"
                  >
                    {smtpLoading ? "Saving..." : "Save SMTP Settings"}
                  </Button>
                  <Button 
                    onClick={handleTestSMTPConnection} 
                    disabled={smtpTesting || !smtpSettings.host || !smtpSettings.username}
                    variant="outline"
                  >
                    {smtpTesting ? "Testing..." : "Test Connection"}
                  </Button>
                </div>

                {smtpSettings.isConfigured && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleClearSMTPSettings} 
                      variant="destructive"
                      size="sm"
                    >
                      Clear Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMTP Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  SMTP Status
                </CardTitle>
                <CardDescription>
                  Current email configuration status and common settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Configuration Status:</span>
                    <span className={`text-sm px-2 py-1 rounded ${smtpSettings.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {smtpSettings.isConfigured ? 'Configured' : 'Not Configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Enabled:</span>
                    <span className={`text-sm px-2 py-1 rounded ${smtpSettings.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {smtpSettings.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {smtpSettings.host && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SMTP Host:</span>
                      <span className="text-sm text-gray-600">{smtpSettings.host}</span>
                    </div>
                  )}
                  {smtpSettings.port && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Port:</span>
                      <span className="text-sm text-gray-600">{smtpSettings.port} {smtpSettings.secure ? '(SSL)' : '(STARTTLS)'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Common SMTP Settings:</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div><strong>Gmail:</strong> smtp.gmail.com:587 (STARTTLS) or :465 (SSL)</div>
                    <div><strong>Outlook:</strong> smtp-mail.outlook.com:587 (STARTTLS)</div>
                    <div><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (STARTTLS)</div>
                    <div><strong>SendGrid:</strong> smtp.sendgrid.net:587 (STARTTLS)</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Security Note:</h4>
                  <p className="text-xs text-gray-600">
                    For Gmail, use an App Password instead of your regular password. 
                    Enable 2-factor authentication and generate an app-specific password.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                  Upload your restaurant logo or provide a direct link to the logo image (PNG or JPG, max 300×400px)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(templateCustomization.logoLink || templateCustomization.logo) && (
                  <div className="text-center">
                    <img 
                      src={templateCustomization.logoLink || templateCustomization.logo} 
                      alt="Current logo" 
                      className="max-h-20 mx-auto rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {templateCustomization.logoLink ? 'Logo from URL' : 'Uploaded logo'}
                    </p>
                  </div>
                )}
                
                {/* Logo Link Input */}
                <div className="space-y-2">
                  <Label htmlFor="logo-link">Logo URL (Direct Link)</Label>
                  <Input
                    id="logo-link"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={templateCustomization.logoLink || ""}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      logoLink: e.target.value,
                      logo: e.target.value // Update logo with the link
                    }))}
                  />
                  <p className="text-xs text-gray-500">
                    Provide a direct URL to your logo image
                  </p>
                </div>

                <div className="text-center text-sm text-gray-500">
                  OR
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Upload Logo File</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Clear logo link when uploading a file
                        setTemplateCustomization(prev => ({
                          ...prev,
                          logoLink: ""
                        }));
                        handleLogoUpload(file);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    PNG or JPG only • Maximum 300px wide × 400px tall • Max 5MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo-position">Logo Position</Label>
                  <select
                    id="logo-position"
                    value={templateCustomization.logoPosition}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      logoPosition: e.target.value as 'left' | 'center' | 'right'
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
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
                    <Label htmlFor="primary-color">Primary Color (Header & Branding)</Label>
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
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color (Background Sections)</Label>
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
                        placeholder="#f8fafc"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color (Main Content)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text-color"
                        type="color"
                        value={templateCustomization.colors.text}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={templateCustomization.colors.text}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        placeholder="#374151"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color (Status & Highlights)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accent-color"
                        type="color"
                        value={templateCustomization.colors.accent}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value }
                        }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={templateCustomization.colors.accent}
                        onChange={(e) => setTemplateCustomization(prev => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value }
                        }))}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 border rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-600 mb-2">Color Preview:</p>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded border" style={{backgroundColor: templateCustomization.colors.primary}}></div>
                    <span>Primary</span>
                    <div className="w-4 h-4 rounded border" style={{backgroundColor: templateCustomization.colors.secondary}}></div>
                    <span>Secondary</span>
                    <div className="w-4 h-4 rounded border" style={{backgroundColor: templateCustomization.colors.text}}></div>
                    <span>Text</span>
                    <div className="w-4 h-4 rounded border" style={{backgroundColor: templateCustomization.colors.accent}}></div>
                    <span>Accent</span>
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
                  <Label htmlFor="tiktok" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    value={templateCustomization.socialLinks.tiktok}
                    onChange={(e) => setTemplateCustomization(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, tiktok: e.target.value }
                    }))}
                    placeholder="https://tiktok.com/@yourrestaurant"
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