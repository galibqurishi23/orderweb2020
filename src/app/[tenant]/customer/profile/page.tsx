'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Bell, Shield, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  loyaltyTier: string;
  totalPoints: number;
  totalOrders: number;
  memberSince: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
    orderUpdates: boolean;
    dietaryRestrictions: string;
    favoriteItems: string[];
  };
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    fetchProfile();
  }, [params.tenant]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/profile', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else if (response.status === 401) {
        router.push(`/${params.tenant}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: string, value: any) => {
    if (!profile) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile({
        ...profile,
        [parent]: {
          ...(profile[parent as keyof CustomerProfile] as any),
          [child]: value
        }
      });
    } else {
      setProfile({
        ...profile,
        [field]: value
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <Card className="h-64 bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
            <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
            <Button onClick={() => router.push(`/${params.tenant}/customer/dashboard`)}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${params.tenant}/customer/dashboard`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(profile.loyaltyTier)}`}>
                      {profile.loyaltyTier.toUpperCase()} MEMBER
                    </span>
                    <span className="text-sm text-gray-500">
                      Member since {new Date(profile.memberSince).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{profile.totalPoints}</div>
                <div className="text-sm text-gray-600">Loyalty Points</div>
                <div className="text-sm text-gray-600 mt-1">{profile.totalOrders} orders placed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('personal')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'personal'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preferences'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => updateProfile('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => updateProfile('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  placeholder="Tell us about any dietary restrictions or allergies..."
                  value={profile.preferences.dietaryRestrictions}
                  onChange={(e) => updateProfile('preferences.dietaryRestrictions', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Communication Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive general notifications via email</div>
                  </div>
                  <Switch
                    checked={profile.preferences.emailNotifications}
                    onCheckedChange={(checked) => updateProfile('preferences.emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-sm text-gray-600">Receive notifications via text message</div>
                  </div>
                  <Switch
                    checked={profile.preferences.smsNotifications}
                    onCheckedChange={(checked) => updateProfile('preferences.smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Promotional Emails</div>
                    <div className="text-sm text-gray-600">Receive special offers and promotions</div>
                  </div>
                  <Switch
                    checked={profile.preferences.promotionalEmails}
                    onCheckedChange={(checked) => updateProfile('preferences.promotionalEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order Updates</div>
                    <div className="text-sm text-gray-600">Receive notifications about order status</div>
                  </div>
                  <Switch
                    checked={profile.preferences.orderUpdates}
                    onCheckedChange={(checked) => updateProfile('preferences.orderUpdates', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Account Secured</div>
                      <div className="text-sm text-green-600">Your account is protected with secure authentication</div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Password</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${params.tenant}/customer/settings/change-password`)}
                  >
                    Change Password
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Login Sessions</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your active login sessions across devices
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/${params.tenant}/customer/settings/sessions`)}
                  >
                    Manage Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
