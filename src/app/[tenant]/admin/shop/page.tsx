'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
    Palette, 
    Image, 
    Save, 
    RefreshCw, 
    Eye,
    Gift,
    Upload,
    Package,
    ShoppingBag,
    Plus,
    Edit,
    Trash2,
    Search,
    CreditCard,
    Users,
    TrendingUp,
    Settings,
    X,
    GripVertical,
    ImagePlus
} from 'lucide-react';

interface ShopSettings {
    tenant_id: string;
    cover_image_url?: string;
    display_name?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    text_color: string;
    background_color: string;
    card_background: string;
    border_color: string;
    color_theme: string;
}

interface GiftCardSettings {
    tenant_id: string;
    fixed_amounts?: number[];
    allow_custom_amount: boolean;
    min_custom_amount: number;
    max_custom_amount: number;
    terms_and_conditions?: string;
}

interface ShopItem {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    short_description: string;
    price: number;
    image_url?: string;
    gallery_images?: string[];
    type: 'physical' | 'digital' | 'gift_card';
    stock_quantity: number;
    track_inventory: boolean;
    is_active: boolean;
    created_at: string;
}

interface GiftCard {
    id: string;
    card_number: string;
    card_type: 'digital' | 'physical';
    amount: number;
    remaining_balance: number;
    status: 'active' | 'redeemed' | 'expired' | 'cancelled';
    customer_name?: string;
    customer_email?: string;
    created_at: string;
    expires_at?: string;
}

interface GiftCardOrder {
    id: string;
    tenant_id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    card_type: 'digital' | 'physical';
    order_amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
    delivery_status: 'pending' | 'sent' | 'delivered';
    created_at: string;
}

interface ShopOrder {
    id: string;
    tenant_id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    items: any[];
    total_amount: number;
    payment_status: 'pending' | 'completed' | 'failed';
    order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
}

interface PaymentSettings {
    tenant_id: string;
    stripe_connect_account_id?: string;
}

interface DeliverySettings {
    tenant_id: string;
    delivery_normal_fee: number;
    delivery_express_fee: number;
}

export default function ShopAdminPage() {
    const params = useParams();
    const tenant = params?.tenant as string;
    const { toast } = useToast();
    
    const [shopSettings, setShopSettings] = useState<ShopSettings>({
        tenant_id: tenant,
        primary_color: '#3b82f6',
        secondary_color: '#1e40af',
        accent_color: '#60a5fa',
        text_color: '#1f2937',
        background_color: '#f8fafc',
        card_background: '#ffffff',
        border_color: '#e5e7eb',
        color_theme: 'blue'
    });

    const [giftCardSettings, setGiftCardSettings] = useState<GiftCardSettings>({
        tenant_id: tenant,
        fixed_amounts: [10, 25, 50, 100],
        allow_custom_amount: true,
        min_custom_amount: 5,
        max_custom_amount: 500,
        terms_and_conditions: 'Gift cards are valid for 12 months from purchase date. No refunds or exchanges.'
    });

    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
        tenant_id: tenant,
        stripe_connect_account_id: ''
    });

    const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
        tenant_id: tenant,
        delivery_normal_fee: 5.00,
        delivery_express_fee: 9.00
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Item image upload states
    const [itemImageFile, setItemImageFile] = useState<File | null>(null);
    const [itemPreviewImage, setItemPreviewImage] = useState<string | null>(null);
    
    // Gallery images states
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    // State for items and orders
    const [items, setItems] = useState<ShopItem[]>([]);
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [giftCardOrders, setGiftCardOrders] = useState<GiftCardOrder[]>([]);
    const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
    
    // Dialog states
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    
    // Form states
    const [itemForm, setItemForm] = useState({
        name: '',
        description: '',
        short_description: '',
        price: 0,
        image_url: '',
        gallery_images: [] as string[],
        type: 'physical' as 'physical' | 'digital' | 'gift_card',
        stock_quantity: 0,
        track_inventory: true,
        is_active: true
    });
    
    const [redeemForm, setRedeemForm] = useState({
        card_number: '',
        amount: 0,
        description: ''
    });

    useEffect(() => {
        fetchSettings();
    }, [tenant]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [shopRes, giftCardRes, itemsRes, giftCardsRes, giftCardOrdersRes, tenantRes] = await Promise.all([
                fetch(`/api/tenant/${tenant}/admin/shop/settings`),
                fetch(`/api/tenant/${tenant}/gift-cards/settings`),
                fetch(`/api/tenant/${tenant}/admin/shop/items`),
                fetch(`/api/tenant/${tenant}/admin/gift-cards`),
                fetch(`/api/tenant/${tenant}/admin/gift-cards/orders`),
                fetch(`/api/tenant/${tenant}`) // Get tenant data for payment/delivery settings
            ]);

            if (shopRes.ok) {
                const shopData = await shopRes.json();
                setShopSettings(prev => ({ ...prev, ...shopData }));
            }

            if (giftCardRes.ok) {
                const giftCardData = await giftCardRes.json();
                setGiftCardSettings(prev => ({ ...prev, ...giftCardData }));
            }

            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setItems(itemsData);
            }

            if (giftCardsRes.ok) {
                const giftCardsData = await giftCardsRes.json();
                setGiftCards(giftCardsData);
            }

            if (giftCardOrdersRes.ok) {
                const ordersData = await giftCardOrdersRes.json();
                setGiftCardOrders(ordersData);
            }

            // Load payment and delivery settings from tenant data
            if (tenantRes.ok) {
                const tenantData = await tenantRes.json();
                
                // Update payment settings
                setPaymentSettings(prev => ({
                    ...prev,
                    stripe_connect_account_id: tenantData.stripe_connect_account_id || ''
                }));

                // Update delivery settings
                setDeliverySettings(prev => ({
                    ...prev,
                    delivery_normal_fee: parseFloat(tenantData.delivery_normal_fee) || 5.00,
                    delivery_express_fee: parseFloat(tenantData.delivery_express_fee) || 9.00
                }));
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: "Error",
                description: "Failed to load settings",
                variant: "destructive"
            });
        }
        setLoading(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleItemImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setItemImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setItemPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveShopSettings = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            
            formData.append('display_name', shopSettings.display_name || '');
            formData.append('primary_color', shopSettings.primary_color);
            formData.append('secondary_color', shopSettings.secondary_color);
            formData.append('accent_color', shopSettings.accent_color);
            formData.append('text_color', shopSettings.text_color);
            formData.append('background_color', shopSettings.background_color);
            formData.append('card_background', shopSettings.card_background);
            formData.append('border_color', shopSettings.border_color);
            formData.append('color_theme', shopSettings.color_theme);

            if (coverImageFile) {
                formData.append('cover_image', coverImageFile);
            }

            const response = await fetch(`/api/tenant/${tenant}/admin/shop/settings`, {
                method: 'PUT',
                body: formData
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Shop settings saved successfully"
                });
                await fetchSettings();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to save settings (${response.status})`);
            }
        } catch (error) {
            console.error('Error saving shop settings:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save shop settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const saveGiftCardSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/tenant/${tenant}/gift-cards/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(giftCardSettings)
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Gift card settings saved successfully"
                });
            } else {
                throw new Error('Failed to save gift card settings');
            }
        } catch (error) {
            console.error('Error saving gift card settings:', error);
            toast({
                title: "Error",
                description: "Failed to save gift card settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const savePaymentSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/tenant/${tenant}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stripe_connect_account_id: paymentSettings.stripe_connect_account_id
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Payment settings saved successfully"
                });
            } else {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(errorData.error || 'Failed to save payment settings');
            }
        } catch (error) {
            console.error('Error saving payment settings:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save payment settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const saveDeliverySettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/tenant/${tenant}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    delivery_normal_fee: deliverySettings.delivery_normal_fee,
                    delivery_express_fee: deliverySettings.delivery_express_fee
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Delivery settings saved successfully"
                });
            } else {
                const errorData = await response.json();
                console.error('Delivery API Error:', errorData);
                throw new Error(errorData.error || 'Failed to save delivery settings');
            }
        } catch (error) {
            console.error('Error saving delivery settings:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save delivery settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const saveItem = async () => {
        try {
            setUploadingGallery(true);
            
            const url = selectedItem 
                ? `/api/tenant/${tenant}/admin/shop/items/${selectedItem.id}`
                : `/api/tenant/${tenant}/admin/shop/items`;
            
            const method = selectedItem ? 'PUT' : 'POST';
            
            let itemData;
            
            if (selectedItem) {
                // For updates, use existing data
                itemData = { id: selectedItem.id, ...itemForm };
            } else {
                // For new items, use default category based on tenant
                const defaultCategoryId = tenant === 'kitchen' 
                    ? '27524af6-751a-11f0-84aa-3eddfe710d88' // Restaurant Merch for kitchen
                    : '3ccca37a-7521-11f0-84aa-3eddfe710d88'; // Electronics for others
                
                itemData = { 
                    ...itemForm, 
                    category_id: defaultCategoryId
                };
            }

            // Include gallery images in the data (only non-data URLs)
            const validGalleryImages = Array.isArray(itemForm.gallery_images) 
                ? itemForm.gallery_images.filter((url: string) => typeof url === 'string' && !url.startsWith('data:'))
                : [];
            itemData.gallery_images = validGalleryImages;

            // Use FormData if we have images to upload (either single image or gallery)
            let response;
            if (itemImageFile || galleryFiles.length > 0) {
                const formData = new FormData();
                
                // Add all item data as form fields
                Object.entries(itemData).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        if (key === 'gallery_images') {
                            formData.append(key, JSON.stringify(value));
                        } else {
                            formData.append(key, value.toString());
                        }
                    }
                });
                
                // Add the single image file if present
                if (itemImageFile) {
                    formData.append('image', itemImageFile);
                }
                
                // Add gallery images
                galleryFiles.forEach((file, index) => {
                    formData.append(`gallery_image_${index}`, file);
                });
                
                response = await fetch(url, {
                    method,
                    body: formData
                });
            } else {
                // No image upload, use JSON
                response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(itemData)
                });
            }

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Item ${selectedItem ? 'updated' : 'created'} successfully`
                });
                setItemDialogOpen(false);
                setItemImageFile(null);
                setItemPreviewImage(null);
                setGalleryFiles([]);
                // Reset form to clear preview images
                setItemForm(prev => ({ ...prev, gallery_images: [] }));
                fetchSettings();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to ${selectedItem ? 'update' : 'create'} item`);
            }
        } catch (error) {
            console.error('Error saving item:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : `Failed to ${selectedItem ? 'update' : 'create'} item`,
                variant: "destructive"
            });
        } finally {
            setUploadingGallery(false);
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/shop/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Item deleted successfully"
                });
                fetchSettings();
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete item",
                variant: "destructive"
            });
        }
    };

    const deleteAllItems = async () => {
        if (!confirm('Are you sure you want to delete ALL items? This action cannot be undone.')) return;
        
        try {
            let deletedCount = 0;
            
            for (const item of items) {
                const response = await fetch(`/api/tenant/${tenant}/admin/shop/items/${item.id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    deletedCount++;
                } else {
                    console.error(`Failed to delete item ${item.name}`);
                }
            }
            
            toast({
                title: "Success",
                description: `Successfully deleted ${deletedCount} items`
            });
            
            fetchSettings();
        } catch (error) {
            console.error('Error deleting all items:', error);
            toast({
                title: "Error",
                description: "Failed to delete some items",
                variant: "destructive"
            });
        }
    };

    const redeemGiftCard = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/gift-cards/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(redeemForm)
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Gift card redeemed successfully"
                });
                setRedeemDialogOpen(false);
                setRedeemForm({ card_number: '', amount: 0, description: '' });
                fetchSettings();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to redeem gift card');
            }
        } catch (error) {
            console.error('Error redeeming gift card:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to redeem gift card",
                variant: "destructive"
            });
        }
    };

    const openShopPreview = () => {
        window.open(`/${tenant}/shop`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                        <span>Shop & Gift Cards Management</span>
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your online shop, items, variants, and gift card settings</p>
                </div>
                <div className="flex space-x-3">
                    <Button 
                        variant="outline"
                        onClick={openShopPreview}
                        className="flex items-center space-x-2"
                    >
                        <Eye className="h-4 w-4" />
                        <span>Preview Shop</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="appearance" className="flex items-center space-x-2">
                        <Palette className="h-4 w-4" />
                        <span>Appearance</span>
                    </TabsTrigger>
                    <TabsTrigger value="items" className="flex items-center space-x-2">
                        <Package className="h-4 w-4" />
                        <span>Items & Variants</span>
                    </TabsTrigger>
                    <TabsTrigger value="gift-cards" className="flex items-center space-x-2">
                        <Gift className="h-4 w-4" />
                        <span>Gift Cards</span>
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Payment</span>
                    </TabsTrigger>
                    <TabsTrigger value="delivery" className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Delivery</span>
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4" />
                        <span>Orders</span>
                    </TabsTrigger>
                </TabsList>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Palette className="h-5 w-5 text-blue-600" />
                                <span>Shop Appearance</span>
                            </CardTitle>
                            <CardDescription>
                                Customize the look and feel of your shop
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Cover Image */}
                            <div className="space-y-3">
                                <Label>Cover Image</Label>
                                <div className="flex items-center space-x-4">
                                    {(previewImage || shopSettings.cover_image_url) && (
                                        <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={previewImage || shopSettings.cover_image_url}
                                                alt="Cover preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                                <Label htmlFor="display_name">Shop Display Name</Label>
                                <Input
                                    id="display_name"
                                    value={shopSettings.display_name || ''}
                                    onChange={(e) => setShopSettings(prev => ({ ...prev, display_name: e.target.value }))}
                                    placeholder="Enter shop display name"
                                />
                            </div>

                            {/* Color Scheme */}
                            <div className="space-y-4">
                                <Label>Color Scheme</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="primary_color">Primary Color</Label>
                                        <Input
                                            id="primary_color"
                                            type="color"
                                            value={shopSettings.primary_color || '#000000'}
                                            onChange={(e) => setShopSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="secondary_color">Secondary Color</Label>
                                        <Input
                                            id="secondary_color"
                                            type="color"
                                            value={shopSettings.secondary_color || '#000000'}
                                            onChange={(e) => setShopSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="accent_color">Accent Color</Label>
                                        <Input
                                            id="accent_color"
                                            type="color"
                                            value={shopSettings.accent_color || '#000000'}
                                            onChange={(e) => setShopSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="text_color">Text Color</Label>
                                        <Input
                                            id="text_color"
                                            type="color"
                                            value={shopSettings.text_color || '#000000'}
                                            onChange={(e) => setShopSettings(prev => ({ ...prev, text_color: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={saveShopSettings} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Appearance Settings
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Items & Addons Tab */}
                <TabsContent value="items" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-xl font-semibold">Shop Items & Addons</h2>
                            <p className="text-gray-600">Manage your products and addon options</p>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={() => {
                                setSelectedItem(null);
                                setItemForm({
                                    name: '',
                                    description: '',
                                    short_description: '',
                                    price: 0,
                                    image_url: '',
                                    gallery_images: [],
                                    type: 'physical',
                                    stock_quantity: 0,
                                    track_inventory: true,
                                    is_active: true
                                });
                                setGalleryFiles([]);
                                setItemImageFile(null);
                                setItemPreviewImage(null);
                                setItemDialogOpen(true);
                            }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                            {items.length > 0 && (
                                <Button 
                                    variant="destructive" 
                                    onClick={deleteAllItems}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete All Items
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {items.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                                    <p className="text-gray-500 mb-4">Get started by adding your first shop item</p>
                                    <Button onClick={() => {
                                        setSelectedItem(null);
                                        setItemForm({
                                            name: '',
                                            description: '',
                                            short_description: '',
                                            price: 0,
                                            image_url: '',
                                            gallery_images: [],
                                            type: 'physical',
                                            stock_quantity: 0,
                                            track_inventory: true,
                                            is_active: true
                                        });
                                        setGalleryFiles([]);
                                        setItemImageFile(null);
                                        setItemPreviewImage(null);
                                        setItemDialogOpen(true);
                                    }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Item
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{item.type}</Badge>
                                                </TableCell>
                                                <TableCell>£{Number(item.price || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {item.track_inventory ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`text-sm ${item.stock_quantity <= 0 ? 'text-red-600' : item.stock_quantity <= 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                                {item.stock_quantity || 0}
                                                            </span>
                                                            {item.stock_quantity <= 0 && (
                                                                <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                                            )}
                                                            {item.stock_quantity > 0 && item.stock_quantity <= 5 && (
                                                                <Badge variant="outline" className="text-xs text-yellow-600">Low Stock</Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Not tracked</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={item.is_active ? "default" : "secondary"}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setItemForm({
                                                                    name: item.name || '',
                                                                    description: item.description || '',
                                                                    short_description: item.short_description || '',
                                                                    price: Number(item.price || 0),
                                                                    image_url: item.image_url || '',
                                                                    gallery_images: item.gallery_images || [],
                                                                    type: item.type,
                                                                    stock_quantity: Number(item.stock_quantity || 0),
                                                                    track_inventory: item.track_inventory !== false,
                                                                    is_active: item.is_active
                                                                });
                                                                // Populate gallery images for editing
                                                                setGalleryFiles([]);
                                                                setItemImageFile(null);
                                                                setItemPreviewImage(null);
                                                                setItemDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => deleteItem(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gift Cards Tab */}
                <TabsContent value="gift-cards" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-xl font-semibold">Gift Cards Management</h2>
                            <p className="text-gray-600">Manage gift card settings and redemptions</p>
                        </div>
                        <Button onClick={() => setRedeemDialogOpen(true)}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Redeem Gift Card
                        </Button>
                    </div>

                    {/* Gift Card Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Gift Card Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Fixed Amounts</Label>
                                    <Input
                                        value={giftCardSettings.fixed_amounts?.join(', ') || ''}
                                        onChange={(e) => {
                                            const amounts = e.target.value.split(',').map(a => parseFloat(a.trim())).filter(a => !isNaN(a));
                                            setGiftCardSettings(prev => ({ ...prev, fixed_amounts: amounts }));
                                        }}
                                        placeholder="10, 25, 50, 100"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={giftCardSettings.allow_custom_amount}
                                        onCheckedChange={(checked) => setGiftCardSettings(prev => ({ ...prev, allow_custom_amount: checked }))}
                                    />
                                    <Label>Allow Custom Amount</Label>
                                </div>

                                {giftCardSettings.allow_custom_amount && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Min Custom Amount</Label>
                                            <Input
                                                type="number"
                                                value={giftCardSettings.min_custom_amount || ''}
                                                onChange={(e) => setGiftCardSettings(prev => ({ ...prev, min_custom_amount: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max Custom Amount</Label>
                                            <Input
                                                type="number"
                                                value={giftCardSettings.max_custom_amount || ''}
                                                onChange={(e) => setGiftCardSettings(prev => ({ ...prev, max_custom_amount: parseFloat(e.target.value) }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Terms and Conditions</Label>
                                    <Textarea
                                        value={giftCardSettings.terms_and_conditions || ''}
                                        onChange={(e) => setGiftCardSettings(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <Button onClick={saveGiftCardSettings} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Gift Card Settings
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Active Gift Cards */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Gift Cards</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {giftCards.length === 0 ? (
                                <div className="text-center py-8">
                                    <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No gift cards issued yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Card Number</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {giftCards.map((card) => (
                                            <TableRow key={card.id}>
                                                <TableCell className="font-mono">{card.card_number}</TableCell>
                                                <TableCell>£{Number(card.amount || 0).toFixed(2)}</TableCell>
                                                <TableCell>£{Number(card.remaining_balance || 0).toFixed(2)}</TableCell>
                                                <TableCell>{card.customer_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                        {card.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(card.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Order Management</h2>
                        <p className="text-gray-600">View and manage all shop and gift card orders</p>
                    </div>

                    {/* Gift Card Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Gift Card Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {giftCardOrders.length === 0 ? (
                                <div className="text-center py-8">
                                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No gift card orders yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Payment Status</TableHead>
                                            <TableHead>Delivery Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {giftCardOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono">{order.order_number}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{order.customer_name}</div>
                                                        <div className="text-sm text-gray-500">{order.customer_email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>£{Number(order.order_amount || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{order.card_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                                                        {order.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={order.delivery_status === 'delivered' ? 'default' : 'secondary'}>
                                                        {order.delivery_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shop Orders */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shop Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {shopOrders.length === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-500">No shop orders yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Payment Status</TableHead>
                                            <TableHead>Order Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shopOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono">{order.order_number}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{order.customer_name}</div>
                                                        <div className="text-sm text-gray-500">{order.customer_email}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{order.items.length} items</TableCell>
                                                <TableCell>£{Number(order.total_amount || 0).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                                                        {order.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={order.order_status === 'completed' ? 'default' : 'secondary'}>
                                                        {order.order_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Settings Tab */}
                <TabsContent value="payment" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-xl font-semibold">Payment Settings</h2>
                            <p className="text-gray-600">Configure Stripe Connect for payment processing</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                <span>Stripe Connect Account</span>
                            </CardTitle>
                            <CardDescription>
                                Connect your Stripe account to receive payments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="stripe_connect_account_id">Stripe Connect Account ID</Label>
                                    <Input
                                        id="stripe_connect_account_id"
                                        value={paymentSettings.stripe_connect_account_id || ''}
                                        onChange={(e) => setPaymentSettings(prev => ({ 
                                            ...prev, 
                                            stripe_connect_account_id: e.target.value 
                                        }))}
                                        placeholder="acct_1234567890abcdef"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Enter your Stripe Connect account ID. This is required to receive payments.
                                    </p>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-start space-x-3">
                                        <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-blue-900 mb-1">Setup Instructions</h4>
                                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                                <li>Create a Stripe Connect account at stripe.com</li>
                                                <li>Complete your account verification</li>
                                                <li>Get your Connect Account ID from your Stripe dashboard</li>
                                                <li>Paste the Account ID in the field above</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={savePaymentSettings} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Payment Settings
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Delivery Settings Tab */}
                <TabsContent value="delivery" className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-xl font-semibold">Delivery Settings</h2>
                            <p className="text-gray-600">Configure delivery fees and options</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                <span>Delivery Options & Pricing</span>
                            </CardTitle>
                            <CardDescription>
                                Set up your delivery fees for different service levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Delivery Options</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                                            <div>
                                                <div className="font-medium text-green-800">Collection</div>
                                                <div className="text-sm text-green-600">Customer pickup</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Free</Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
                                            <div>
                                                <div className="font-medium text-blue-800">Email Delivery</div>
                                                <div className="text-sm text-blue-600">Digital items only</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Free</Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="delivery_normal_fee">Normal Delivery</Label>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">£</span>
                                                <Input
                                                    id="delivery_normal_fee"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={deliverySettings.delivery_normal_fee}
                                                    onChange={(e) => setDeliverySettings(prev => ({ 
                                                        ...prev, 
                                                        delivery_normal_fee: parseFloat(e.target.value) || 0 
                                                    }))}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Standard delivery fee</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="delivery_express_fee">Express Delivery</Label>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm text-gray-500">£</span>
                                                <Input
                                                    id="delivery_express_fee"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={deliverySettings.delivery_express_fee}
                                                    onChange={(e) => setDeliverySettings(prev => ({ 
                                                        ...prev, 
                                                        delivery_express_fee: parseFloat(e.target.value) || 0 
                                                    }))}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Priority delivery fee</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Delivery Information</h3>
                                    
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="flex items-start space-x-3">
                                            <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-yellow-900 mb-2">Delivery Options</h4>
                                                <ul className="text-sm text-yellow-800 space-y-1">
                                                    <li><strong>Collection:</strong> Free pickup from your location</li>
                                                    <li><strong>Email:</strong> Free for digital products (gift cards, etc.)</li>
                                                    <li><strong>Normal:</strong> Standard delivery service</li>
                                                    <li><strong>Express:</strong> Priority/faster delivery</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <h4 className="font-medium text-gray-900 mb-2">Current Settings Preview</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Collection:</span>
                                                <span className="font-medium text-green-600">Free</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Email Delivery:</span>
                                                <span className="font-medium text-blue-600">Free</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Normal Delivery:</span>
                                                <span className="font-medium">£{deliverySettings.delivery_normal_fee.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Express Delivery:</span>
                                                <span className="font-medium">£{deliverySettings.delivery_express_fee.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={saveDeliverySettings} disabled={saving} className="w-full">
                                {saving ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Delivery Settings
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Item Dialog */}
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                        <DialogDescription>
                            {selectedItem ? 'Update the item details' : 'Create a new shop item'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Item name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={itemForm.type}
                                    onValueChange={(value: 'physical' | 'digital' | 'gift_card') => 
                                        setItemForm(prev => ({ ...prev, type: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="physical">Physical</SelectItem>
                                        <SelectItem value="digital">Digital</SelectItem>
                                        <SelectItem value="gift_card">Gift Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Short Description</Label>
                            <Input
                                value={itemForm.short_description}
                                onChange={(e) => setItemForm(prev => ({ ...prev, short_description: e.target.value }))}
                                placeholder="Brief description"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={itemForm.description}
                                onChange={(e) => {
                                    console.log('Description changed:', e.target.value);
                                    setItemForm(prev => ({ ...prev, description: e.target.value }));
                                }}
                                placeholder="Detailed description"
                                rows={3}
                                className="min-h-[80px]"
                            />
                            <p className="text-xs text-gray-500">
                                Enter a detailed description of your item
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={itemForm.price}
                                        onChange={(e) => setItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div></div> {/* Empty space to keep price in left column */}
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Gallery Images (Max 5 images)</Label>
                                <div className="space-y-4">
                                    {/* Current Images Display */}
                                    {Array.isArray(itemForm.gallery_images) && itemForm.gallery_images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3">
                                            {itemForm.gallery_images.map((imageUrl, index) => (
                                                <div key={index} className="relative group">
                                                    <div className="relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                                        <img
                                                            src={imageUrl}
                                                            alt={`Gallery image ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {/* Image Controls Overlay */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                                                            {/* Move Left */}
                                                            {index > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                                    onClick={() => {
                                                                        if (Array.isArray(itemForm.gallery_images)) {
                                                                            const newImages = [...itemForm.gallery_images];
                                                                            [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
                                                                            setItemForm(prev => ({ ...prev, gallery_images: newImages }));
                                                                        }
                                                                    }}
                                                                >
                                                                    ←
                                                                </Button>
                                                            )}
                                                            {/* Delete */}
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                                                                onClick={() => {
                                                                    if (Array.isArray(itemForm.gallery_images)) {
                                                                        const newImages = itemForm.gallery_images.filter((_, i) => i !== index);
                                                                        setItemForm(prev => ({ ...prev, gallery_images: newImages }));
                                                                    }
                                                                }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            {/* Move Right */}
                                                            {Array.isArray(itemForm.gallery_images) && index < itemForm.gallery_images.length - 1 && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                                                    onClick={() => {
                                                                        if (Array.isArray(itemForm.gallery_images)) {
                                                                            const newImages = [...itemForm.gallery_images];
                                                                            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                                                                            setItemForm(prev => ({ ...prev, gallery_images: newImages }));
                                                                        }
                                                                    }}
                                                                >
                                                                    →
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {/* Image Number Badge */}
                                                        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Images */}
                                    {Array.isArray(itemForm.gallery_images) && itemForm.gallery_images.length < 5 && (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                id="gallery-upload"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    const remainingSlots = 5 - (Array.isArray(itemForm.gallery_images) ? itemForm.gallery_images.length : 0);
                                                    const filesToProcess = files.slice(0, remainingSlots);
                                                    
                                                    if (files.length > remainingSlots) {
                                                        toast({
                                                            title: "Too many images",
                                                            description: `You can only add ${remainingSlots} more image(s). Maximum 5 images allowed.`,
                                                            variant: "destructive"
                                                        });
                                                    }

                                                    // Create preview URLs for new images
                                                    filesToProcess.forEach(file => {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            const imageUrl = event.target?.result as string;
                                                            // Add preview URL temporarily for display
                                                            setItemForm(prev => ({ 
                                                                ...prev, 
                                                                gallery_images: [...(Array.isArray(prev.gallery_images) ? prev.gallery_images : []), imageUrl] 
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    });

                                                    // Store files for upload
                                                    setGalleryFiles(prev => [...prev, ...filesToProcess]);
                                                    
                                                    // Clear input
                                                    e.target.value = '';
                                                }}
                                            />
                                            <label htmlFor="gallery-upload" className="cursor-pointer">
                                                <div className="flex flex-col items-center space-y-2">
                                                    <ImagePlus className="h-8 w-8 text-gray-400" />
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium text-blue-600 hover:text-blue-500">
                                                            Click to add images
                                                        </span>{" "}
                                                        or drag and drop
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG up to 10MB each. Add {5 - (Array.isArray(itemForm.gallery_images) ? itemForm.gallery_images.length : 0)} more image(s).
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {Array.isArray(itemForm.gallery_images) && itemForm.gallery_images.length >= 5 && (
                                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm text-green-700 font-medium">
                                                ✅ Maximum images reached (5/5)
                                            </p>
                                            <p className="text-xs text-green-600 mt-1">
                                                Delete an image to add a new one
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        💡 <strong>Tip:</strong> First image will be the main product image. Use hover controls to reorder, or delete images.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Stock Quantity</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={itemForm.stock_quantity}
                                    onChange={(e) => setItemForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500">
                                    Current stock quantity for this item
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Inventory Tracking</Label>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        checked={itemForm.track_inventory}
                                        onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, track_inventory: checked }))}
                                    />
                                    <Label className="text-sm">Track inventory for this item</Label>
                                </div>
                                <p className="text-xs text-gray-500">
                                    When enabled, customers cannot order when stock is 0
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={itemForm.is_active}
                                    onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_active: checked }))}
                                />
                                <Label>Active</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveItem} disabled={uploadingGallery}>
                            {uploadingGallery ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    {galleryFiles.length > 0 ? 'Uploading Images...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    {selectedItem ? 'Update' : 'Create'} Item
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Gift Card Redeem Dialog */}
            <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Redeem Gift Card</DialogTitle>
                        <DialogDescription>
                            Process a gift card redemption
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input
                                value={redeemForm.card_number}
                                onChange={(e) => setRedeemForm(prev => ({ ...prev, card_number: e.target.value }))}
                                placeholder="Enter gift card number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Amount to Redeem</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={redeemForm.amount}
                                onChange={(e) => setRedeemForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description (Optional)</Label>
                            <Input
                                value={redeemForm.description}
                                onChange={(e) => setRedeemForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Redemption description"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRedeemDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={redeemGiftCard}>
                            Redeem Gift Card
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
