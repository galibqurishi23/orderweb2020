'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useParams, useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Bell, Shield, Save, ArrowLeft, Lock, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('main');
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/customer/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setSaving(true);
      
      console.log('🗑️ Initiating account deletion...');

      const response = await fetch('/api/customer/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('🗑️ Delete account response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log('🗑️ Delete account result:', result);

      if (response.ok) {
        toast({
          title: "✅ Account Deleted Successfully",
          description: "Your account has been permanently deleted. You will be redirected to the main page.",
          duration: 4000
        });
        
        // Close dialog
        setShowDeleteDialog(false);
        
        // Show a final confirmation message
        setTimeout(() => {
          toast({
            title: "👋 Goodbye!",
            description: "Thank you for using our service. Your account has been completely removed.",
            duration: 3000
          });
        }, 1000);
        
        // Redirect to main page after a short delay
        setTimeout(() => {
          console.log('🗑️ Redirecting to main page...');
          router.push(`/${params.tenant}`);
        }, 3000);
        
      } else {
        // Handle specific error cases
        let errorTitle = "❌ Account Deletion Failed";
        let errorDescription = result.error || "Failed to delete account";
        
        if (response.status === 401) {
          errorTitle = "🔒 Authentication Required";
          errorDescription = "Please log in again and try deleting your account.";
        } else if (response.status === 400) {
          errorTitle = "⚠️ Invalid Request";
          errorDescription = result.error || "Something went wrong with the request.";
        } else if (response.status === 404) {
          errorTitle = "👤 Account Not Found";
          errorDescription = "Your account could not be found. You may already be logged out.";
        } else if (response.status === 500) {
          errorTitle = "🚨 Server Error";
          errorDescription = "A server error occurred. Please try again later or contact support.";
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
          duration: 6000
        });
      }
    } catch (error) {
      console.error('🗑️ Error deleting account:', error);
      
      toast({
        title: "🚨 Network Error",
        description: "Failed to delete account due to a network error. Please check your connection and try again.",
        variant: "destructive",
        duration: 6000
      });
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile-First Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/${params.tenant}/customer/dashboard`)}
                className="text-gray-700 hover:bg-white/60 hover:text-primary transition-all duration-200 rounded-xl p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Back to Menu</h1>
                <p className="text-xs text-gray-600 hidden sm:block">My Account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs sm:text-sm text-primary font-medium">Kitchen Restaurant</div>
              <Button
                variant="outline"
                size="sm"
                onClick={saveProfile}
                disabled={saving}
                className="bg-white/60 border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200 rounded-xl text-xs sm:text-sm"
              >
                {saving ? 'Saving...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Welcome Section */}
        <div className="text-center space-y-2 py-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome back, {profile.firstName} {profile.lastName}!
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your orders, profile, and loyalty rewards
          </p>
        </div>

        {/* Loyalty Status Card */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium opacity-90">Loyalty Status</span>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">{profile.loyaltyTier}</h3>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: '10%' }}></div>
              </div>
              <p className="text-sm opacity-90">10%</p>
            </div>
          </div>
        </div>

        {/* Points Balance Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">🎁</span>
              </div>
              <span className="text-gray-700 font-medium">Points Balance</span>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">💎</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-blue-600">{profile.totalPoints}</span>
            </div>
            <p className="text-sm text-gray-600">Worth £{(profile.totalPoints * 0.01).toFixed(2)}</p>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">N</span>
              </div>
              <span className="text-gray-700 font-medium">Total Orders</span>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-green-600">{profile.totalOrders}</span>
            </div>
            <p className="text-sm text-gray-600">Orders completed</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button
            onClick={() => setActiveTab('personal')}
            className="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40 rounded-2xl p-6 h-auto flex flex-col items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
            variant="outline"
          >
            <User className="h-8 w-8 text-blue-500" />
            <div className="text-center">
              <div className="font-semibold text-sm">Edit Profile</div>
              <div className="text-xs text-gray-500">Personal Info</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setActiveTab('security')}
            className="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40 rounded-2xl p-6 h-auto flex flex-col items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
            variant="outline"
          >
            <Lock className="h-8 w-8 text-green-500" />
            <div className="text-center">
              <div className="font-semibold text-sm">Security</div>
              <div className="text-xs text-gray-500">Password</div>
            </div>
          </Button>
        </div>

        {/* Advanced Settings */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={() => setActiveTab('danger')}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl p-4 flex items-center justify-center gap-3 transition-all duration-200"
            variant="outline"
          >
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="text-center">
              <div className="font-semibold text-sm">Delete Account</div>
              <div className="text-xs text-red-500">Danger Zone</div>
            </div>
          </Button>
        </div>

        {/* Profile Tabs - Hidden by default, shown when editing */}
        {activeTab !== 'main' && (
          <>
            {/* Back to Main Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setActiveTab('main')}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-white/90 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </div>

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white/90 rounded-b-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => updateProfile('firstName', e.target.value)}
                    className="bg-white/80 border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => updateProfile('lastName', e.target.value)}
                    className="bg-white/80 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile('email', e.target.value)}
                      className="pl-10 bg-white/80 border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => updateProfile('phone', e.target.value)}
                      className="pl-10 bg-white/80 border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="text-gray-700 font-medium">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                  className="bg-white/80 border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="dietaryRestrictions" className="text-gray-700 font-medium">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  placeholder="Tell us about any dietary restrictions or allergies..."
                  value={profile.preferences.dietaryRestrictions}
                  onChange={(e) => updateProfile('preferences.dietaryRestrictions', e.target.value)}
                  className="bg-white/80 border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg font-medium"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Lock className="h-5 w-5 text-green-600" />
                Security & Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white/90 rounded-b-2xl">
              <div>
                <Label htmlFor="currentPassword" className="text-gray-700 font-medium">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="pr-10 bg-white/80 border-gray-200 rounded-xl"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-gray-700 font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="pr-10 bg-white/80 border-gray-200 rounded-xl"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="pr-10 bg-white/80 border-gray-200 rounded-xl"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={changePassword}
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg font-medium"
                >
                  {saving ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'danger' && (
          <Card className="border-2 border-red-300 shadow-xl rounded-2xl bg-white/90">
            <CardHeader className="bg-gradient-to-r from-red-100 to-red-200 rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-red-800">
                <div className="p-2 bg-red-500 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Danger Zone</h3>
                  <p className="text-sm font-normal text-red-700 mt-1">
                    Irreversible account deletion settings
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 bg-white p-8 rounded-b-2xl">
              <div className="p-8 bg-gradient-to-br from-red-50 via-red-100 to-red-200 border-2 border-red-300 rounded-2xl shadow-inner">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <AlertTriangle className="h-8 w-8 text-white animate-bounce" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="font-black text-red-900 text-2xl mb-3">
                        Permanently Delete Account
                      </h4>
                      <p className="text-red-800 mb-6 leading-relaxed text-lg">
                        Once you delete your account, <strong>there is no going back</strong>. This action will permanently 
                        remove all your data from our systems and cannot be undone under any circumstances.
                      </p>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-red-200 shadow-lg">
                      <h5 className="font-bold text-red-900 mb-4 flex items-center gap-3 text-lg">
                        <Trash2 className="h-5 w-5" />
                        What will be permanently deleted:
                      </h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Personal profile information</span>
                          </div>
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Complete order history</span>
                          </div>
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">All loyalty points & rewards</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Saved addresses & preferences</span>
                          </div>
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Payment methods & settings</span>
                          </div>
                          <div className="flex items-center gap-3 text-red-700">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Account recovery options</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 rounded-xl p-5 shadow-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="text-amber-900 font-bold text-lg mb-2">Your Current Account Value:</p>
                          <div className="flex flex-wrap gap-4 text-amber-800">
                            <div className="bg-amber-200 px-4 py-2 rounded-lg font-bold">
                              🏆 {profile.totalPoints} loyalty points
                            </div>
                            <div className="bg-amber-200 px-4 py-2 rounded-lg font-bold">
                              📦 {profile.totalOrders} orders placed
                            </div>
                            <div className="bg-amber-200 px-4 py-2 rounded-lg font-bold">
                              💎 {profile.loyaltyTier.toUpperCase()} member
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-red-300">
                      <p className="text-red-800 text-center text-lg font-semibold mb-6">
                        ⚠️ This action is <span className="underline font-black">IRREVERSIBLE</span> ⚠️
                      </p>
                      
                      <div className="flex justify-center">
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={saving}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-4 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border-0 text-base relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center gap-3">
                            <Trash2 className="h-6 w-6 animate-pulse" />
                            <span>I Understand, Delete My Account</span>
                            <div className="w-2 h-2 bg-red-300 rounded-full animate-ping"></div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-lg border-2 border-red-200 shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="flex items-center gap-3 text-red-600 text-xl font-bold">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
              </div>
              Delete Account Confirmation
            </DialogTitle>
            <div className="text-gray-700 leading-relaxed">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="font-medium text-red-800 mb-2">⚠️ This action cannot be undone!</div>
                <div className="text-red-700">
                  This will permanently delete your account and all associated data from our systems.
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Enhanced Warning Box */}
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500 rounded-full flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-sm mb-3">What will be permanently deleted:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>Your personal profile information</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>Complete order history and preferences</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>All loyalty points and rewards ({profile?.totalPoints || 0} points)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>Saved addresses and payment methods</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span>Account recovery options (cannot be restored)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 pt-4">
            <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                }}
                disabled={saving}
                className="flex-1 border-gray-300 hover:bg-gray-50 py-3 font-medium"
              >
                Cancel & Keep Account
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAccount}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-3 font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    <span>Delete My Account Forever</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
