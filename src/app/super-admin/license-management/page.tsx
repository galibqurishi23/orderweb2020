'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Key,
  Plus,
  Download,
  Copy,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit,
  UserPlus,
  Building,
  StickyNote
} from 'lucide-react';

interface LicenseKey {
  id: string;
  keyCode: string;
  durationDays: number;
  status: 'unused' | 'active' | 'expired' | 'revoked';
  assignedTenantId?: string;
  assignedTenantName?: string;
  assignedTenantEmail?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  slug: string;
}

export default function LicenseManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [statistics, setStatistics] = useState<any>({});

  // Form states
  const [durationDays, setDurationDays] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [assignedTenantId, setAssignedTenantId] = useState<string>('unassigned');
  const [notes, setNotes] = useState<string>('');
  const [generatedKeys, setGeneratedKeys] = useState<LicenseKey[]>([]);
  
  // Dialog states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedKeyForAssign, setSelectedKeyForAssign] = useState<LicenseKey | null>(null);
  const [assignTenantId, setAssignTenantId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  useEffect(() => {
    loadLicenseKeys();
    loadTenants();
  }, []);

  const loadLicenseKeys = async () => {
    try {
      const response = await fetch('/api/super-admin/license-keys');
      if (response.ok) {
        const data = await response.json();
        setLicenseKeys(data.keys || []);
        setStatistics(data.statistics || {});
      }
    } catch (error) {
      console.error('Failed to load license keys:', error);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/super-admin/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const handleGenerateKeys = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/super-admin/license-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationDays,
          quantity,
          assignedTenantId: assignedTenantId && assignedTenantId !== 'unassigned' ? assignedTenantId : undefined,
          notes: notes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKeys(data.keys);
        await loadLicenseKeys();
        toast({
          title: 'Success',
          description: data.message,
        });

        // Reset form
        setDurationDays(30);
        setQuantity(1);
        setAssignedTenantId('unassigned');
        setNotes('');
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate license keys',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'License key copied to clipboard',
    });
  };

  const handleDeleteKey = async (keyId: string) => {
    setDeletingKeyId(keyId);
    try {
      const response = await fetch(`/api/super-admin/license-keys?keyId=${keyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadLicenseKeys(); // Refresh the list
        toast({
          title: 'Success',
          description: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete license key',
      });
    } finally {
      setDeletingKeyId(null);
    }
  };

  const handleAssignKey = async () => {
    if (!selectedKeyForAssign || !assignTenantId) return;

    setIsAssigning(true);
    try {
      const response = await fetch('/api/tenant/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: selectedKeyForAssign.keyCode,
          tenantId: assignTenantId
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadLicenseKeys(); // Refresh the list
        setShowAssignDialog(false);
        setSelectedKeyForAssign(null);
        setAssignTenantId('');
        toast({
          title: 'Success',
          description: `License key assigned successfully`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign license key',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const exportKeys = () => {
    const keysText = generatedKeys.map(key => 
      `${key.keyCode} (${key.durationDays} days)`
    ).join('\\n');
    
    const blob = new Blob([keysText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-keys-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      unused: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
      revoked: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.unused;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (days: number) => {
    if (days === 30) return '30 Days (1 Month)';
    if (days === 182) return '182 Days (6 Months)';
    if (days === 365) return '365 Days (1 Year)';
    if (days === 7) return '7 Days (1 Week)';
    if (days === 14) return '14 Days (2 Weeks)';
    if (days === 90) return '90 Days (3 Months)';
    if (days === 270) return '270 Days (9 Months)';
    
    // Calculate months and weeks for better display
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${days} Days (${months} Month${months > 1 ? 's' : ''})`;
      } else {
        return `${days} Days (≈${months}.${Math.round((remainingDays / 30) * 10)} Months)`;
      }
    } else if (days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) {
        return `${days} Days (${weeks} Week${weeks > 1 ? 's' : ''})`;
      } else {
        return `${days} Days (${weeks} Week${weeks > 1 ? 's' : ''} + ${remainingDays} Day${remainingDays > 1 ? 's' : ''})`;
      }
    }
    
    return `${days} Day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">License Key Management</h1>
        <p className="text-gray-600">Generate and manage OrderWeb license keys</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unused Keys</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics?.unused?.count || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Keys</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics?.active?.count || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired Keys</p>
                <p className="text-2xl font-bold text-red-600">
                  {statistics?.expired?.count || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold text-purple-600">
                  {licenseKeys.length}
                </p>
              </div>
              <Key className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Keys</TabsTrigger>
          <TabsTrigger value="manage">Manage Keys</TabsTrigger>
        </TabsList>

        {/* Generate Keys Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate License Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (Days)</Label>
                  <Select
                    value={customDuration ? 'custom' : durationDays.toString()}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setCustomDuration(true);
                        setDurationDays(30); // Default for custom
                      } else {
                        setCustomDuration(false);
                        setDurationDays(parseInt(value));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days (1 Week)</SelectItem>
                      <SelectItem value="14">14 Days (2 Weeks)</SelectItem>
                      <SelectItem value="30">30 Days (1 Month)</SelectItem>
                      <SelectItem value="90">90 Days (3 Months)</SelectItem>
                      <SelectItem value="182">182 Days (6 Months)</SelectItem>
                      <SelectItem value="270">270 Days (9 Months)</SelectItem>
                      <SelectItem value="365">365 Days (1 Year)</SelectItem>
                      <SelectItem value="custom">Custom Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {customDuration && (
                  <div className="space-y-2">
                    <Label>Custom Days (1-365)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="365"
                      value={durationDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setDurationDays(Math.min(Math.max(value, 1), 365));
                      }}
                      placeholder="Enter number of days (1-365)"
                      className="text-center"
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Preview: {formatDuration(durationDays)}</p>
                      {durationDays > 365 && (
                        <p className="text-red-500">⚠️ Maximum 365 days allowed</p>
                      )}
                      {durationDays < 1 && (
                        <p className="text-red-500">⚠️ Minimum 1 day required</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Optional Assignment */}
              <div className="space-y-2">
                <Label>Assign to Restaurant (Optional)</Label>
                <Select
                  value={assignedTenantId}
                  onValueChange={setAssignedTenantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add notes about these keys..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateKeys}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate {quantity} License Key{quantity > 1 ? 's' : ''}
                  </>
                )}
              </Button>

              {/* Generated Keys Display */}
              {generatedKeys.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center justify-between">
                      <span>Generated Keys</span>
                      <Button onClick={exportKeys} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-3 bg-white rounded border"
                        >
                          <div>
                            <code className="text-lg font-mono font-bold text-blue-600">
                              {key.keyCode}
                            </code>
                            <p className="text-sm text-gray-600">
                              {formatDuration(key.durationDays)}
                            </p>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(key.keyCode)}
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Keys Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                All License Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {licenseKeys.map((key) => (
                  <div
                    key={key.id}
                    className="border rounded-xl p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-gray-50 to-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Key Code and Status */}
                        <div className="flex items-center gap-3">
                          <code className="text-xl font-mono font-bold bg-blue-100 text-blue-900 px-3 py-1 rounded-lg">
                            {key.keyCode}
                          </code>
                          {getStatusBadge(key.status)}
                          <Button
                            onClick={() => copyToClipboard(key.keyCode)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Key Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-700">Duration</p>
                              <p className="text-gray-600">{formatDuration(key.durationDays)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-700">Assignment</p>
                              <p className="text-gray-600">
                                {key.assignedTenantName ? (
                                  <span className="text-green-600 font-medium">{key.assignedTenantName}</span>
                                ) : (
                                  <span className="text-gray-400">Unassigned</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-700">Created</p>
                              <p className="text-gray-600">{new Date(key.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {key.notes && (
                          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <StickyNote className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-800 text-sm">Notes</p>
                              <p className="text-yellow-700 text-sm">{key.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Assignment Email */}
                        {key.assignedTenantEmail && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Restaurant Email:</span> {key.assignedTenantEmail}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        {/* Assign Button - Only for unused keys */}
                        {key.status === 'unused' && (
                          <Dialog open={showAssignDialog && selectedKeyForAssign?.id === key.id} onOpenChange={(open) => {
                            setShowAssignDialog(open);
                            if (!open) {
                              setSelectedKeyForAssign(null);
                              setAssignTenantId('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedKeyForAssign(key);
                                  setShowAssignDialog(true);
                                }}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Assign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign License Key</DialogTitle>
                                <DialogDescription>
                                  Assign license key <code className="bg-gray-100 px-2 py-1 rounded">{key.keyCode}</code> to a restaurant
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Select Restaurant</Label>
                                  <Select value={assignTenantId} onValueChange={setAssignTenantId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a restaurant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenants.map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                          <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4" />
                                            <div>
                                              <p className="font-medium">{tenant.name}</p>
                                              <p className="text-sm text-gray-500">{tenant.email}</p>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => {
                                  setShowAssignDialog(false);
                                  setSelectedKeyForAssign(null);
                                  setAssignTenantId('');
                                }}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAssignKey}
                                  disabled={isAssigning || !assignTenantId}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {isAssigning ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Assigning...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Assign Key
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        {/* Delete Button - Only for unused keys */}
                        {key.status === 'unused' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingKeyId === key.id}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                {deletingKeyId === key.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  Delete License Key
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete license key <code className="bg-gray-100 px-2 py-1 rounded font-mono">{key.keyCode}</code>?
                                  <br />
                                  <br />
                                  <span className="text-red-600 font-medium">This action cannot be undone.</span> Only unused license keys can be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteKey(key.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Key
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Status Info for Active/Expired keys */}
                        {key.status !== 'unused' && (
                          <div className="text-xs text-gray-500 text-center">
                            {key.status === 'active' && 'Currently Active'}
                            {key.status === 'expired' && 'Key Expired'}
                            {key.status === 'revoked' && 'Key Revoked'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {licenseKeys.length === 0 && (
                  <div className="text-center py-12">
                    <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No License Keys Found</h3>
                    <p className="text-gray-500 mb-6">Generate some license keys to get started with managing your restaurant licenses.</p>
                    <Button onClick={() => setActiveTab('generate')} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Your First Keys
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
