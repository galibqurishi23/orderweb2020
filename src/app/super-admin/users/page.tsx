'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Loader2,
  Calendar,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { SuperAdminUser } from '@/lib/types';

export default function UserManagement() {
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'super_admin' as 'super_admin' | 'support'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/super-admin/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the list
        setShowCreateDialog(false);
        
        // Show success message
        setSuccessMessage(
          `✅ Super admin user "${formData.name}" created successfully! ` +
          `They can now log in with email: ${formData.email}`
        );
        
        // Clear success message after 8 seconds
        setTimeout(() => setSuccessMessage(null), 8000);
        
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'super_admin'
        });
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const updateUserStatus = async (userId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the list
        setSuccessMessage(`User ${active ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(result.error || 'Failed to update user status');
      }
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers(); // Refresh the list
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(null), 5000);
        setError(null); // Clear any previous errors
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'support': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Users</h1>
          <p className="text-muted-foreground">
            Manage super admin users who can access this platform (Maximum 3 users)
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={users.length >= 3}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Super Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Super Admin User</DialogTitle>
              <DialogDescription>
                Add a new user who can manage the entire platform. Maximum 3 users allowed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value: 'super_admin' | 'support') => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                      <SelectItem value="support">Support (Limited Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Secure password"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use a strong password for security. Share credentials securely with the new user.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && !showCreateDialog && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Limit Warning */}
      {users.length >= 3 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Maximum limit reached: You have {users.length} out of 3 allowed super admin users.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No super admin users</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Create super admin users to manage this platform.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First User
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <Badge className={getStatusColor(user.active)}>
                    {user.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription>
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <Badge className={getRoleColor(user.role)}>
                      {user.role === 'super_admin' ? 'Super Admin' : 'Support'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span>Delete Super Admin User</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              Are you sure you want to delete <strong>{user.name}</strong>?
                            </p>
                            <div className="bg-red-50 p-3 rounded-md border border-red-200">
                              <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
                              <p className="text-red-700 text-sm mt-1">
                                This user will permanently lose access to the super admin panel.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="flex space-x-2">
                    {user.active ? (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => updateUserStatus(user.id, false)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => updateUserStatus(user.id, true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Count Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.active).length}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{3 - users.length}</div>
              <div className="text-sm text-muted-foreground">Available Slots</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
