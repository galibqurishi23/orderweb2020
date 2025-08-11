'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Gift, CreditCard, Plus, Settings, Eye, PoundSterling, Users, TrendingUp, Search, RefreshCw, ExternalLink, ImageIcon, Package, ShoppingBag, Tag as TagIcon, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GiftCard {
    id: string;
    card_number: string;
    card_type: 'digital' | 'physical';
    amount: number;
    remaining_balance: number;
    status: 'active' | 'redeemed' | 'expired' | 'cancelled';
    expiry_date: string;
    created_at: string;
}

interface GiftCardOrder {
    id: string;
    gift_card_id: string;
    card_number: string;
    customer_name: string;
    customer_email: string;
    recipient_name: string;
    recipient_email: string;
    recipient_address: string;
    order_amount: number;
    payment_status: string;
    delivery_status: string;
    order_date: string;
    card_type: string;
}

interface GiftCardSettings {
    fixed_amounts: string[];
    allow_custom_amount: boolean;
    min_custom_amount: number;
    max_custom_amount: number;
    default_expiry_months: number;
    auto_cleanup_expired: boolean;
    auto_cleanup_zero_balance: boolean;
    digital_card_template: string;
    physical_card_instructions: string;
    terms_and_conditions: string;
    display_name?: string;
    cover_image_url?: string;
}

interface ShopCategory {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    image_url?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ShopItem {
    id: string;
    tenant_id: string;
    category_id: string;
    name: string;
    description?: string;
    short_description?: string;
    price: number;
    compare_price?: number;
    sku?: string;
    type: 'physical' | 'digital' | 'gift_card';
    stock_quantity: number;
    track_inventory: boolean;
    weight?: number;
    dimensions?: string;
    image_url?: string;
    gallery_images?: string[];
    is_featured: boolean;
    is_active: boolean;
    sort_order: number;
    tags?: string[];
    meta_title?: string;
    meta_description?: string;
    created_at: string;
    updated_at: string;
    category_name?: string;
}

export default function AdminGiftCardsPage() {
    const params = useParams();
    const tenant = params.tenant as string;
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
    const [orders, setOrders] = useState<GiftCardOrder[]>([]);
    const [settings, setSettings] = useState<GiftCardSettings | null>(null);
    const [stats, setStats] = useState<any>({});

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Shop state
    const [shopCategories, setShopCategories] = useState<ShopCategory[]>([]);
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Form states
    const [createCardOpen, setCreateCardOpen] = useState(false);
    const [redeemCardOpen, setRedeemCardOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    // Shop form states
    const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [editItemOpen, setEditItemOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

    // Create card form
    const [cardType, setCardType] = useState<'digital' | 'physical'>('digital');
    const [cardAmount, setCardAmount] = useState<string>('');
    const [expiryMonths, setExpiryMonths] = useState<string>('12');

    // Redeem form
    const [redeemCardNumber, setRedeemCardNumber] = useState('');
    const [redeemAmount, setRedeemAmount] = useState('');
    const [redeemDescription, setRedeemDescription] = useState('');

    // Shop form data
    const [categoryFormData, setCategoryFormData] = useState({
        name: '',
        description: '',
        image_url: ''
    });
    
    const [itemFormData, setItemFormData] = useState({
        category_id: '',
        name: '',
        description: '',
        short_description: '',
        price: '',
        compare_price: '',
        sku: '',
        type: 'physical' as 'physical' | 'digital' | 'gift_card',
        stock_quantity: '',
        track_inventory: true,
        image_url: '',
        is_featured: false,
        is_active: true
    });

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, [tenant]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cardsRes, ordersRes, settingsRes, statsRes, categoriesRes, itemsRes] = await Promise.all([
                fetch(`/api/tenant/${tenant}/admin/gift-cards`),
                fetch(`/api/tenant/${tenant}/admin/gift-cards/orders`),
                fetch(`/api/tenant/${tenant}/gift-cards/settings`),
                fetch(`/api/tenant/${tenant}/admin/gift-cards/stats`),
                fetch(`/api/tenant/${tenant}/admin/shop/categories`),
                fetch(`/api/tenant/${tenant}/admin/shop/items`)
            ]);

            if (cardsRes.ok) {
                const cardsData = await cardsRes.json();
                setGiftCards(cardsData);
            }

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                console.log('Loaded settings:', settingsData);
                setSettings(settingsData);
            } else {
                console.error('Failed to load settings:', settingsRes.status, settingsRes.statusText);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setShopCategories(categoriesData);
            }

            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setShopItems(itemsData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "Failed to load gift card data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Shop management functions
    const createCategory = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/shop/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryFormData)
            });

            if (response.ok) {
                toast({
                    title: "Category Created",
                    description: "Shop category has been created successfully"
                });
                setCreateCategoryOpen(false);
                setCategoryFormData({ name: '', description: '', image_url: '' });
                fetchData();
            } else {
                throw new Error('Failed to create category');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create category",
                variant: "destructive"
            });
        }
    };

    const createShopItem = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/shop/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...itemFormData,
                    price: parseFloat(itemFormData.price),
                    compare_price: itemFormData.compare_price ? parseFloat(itemFormData.compare_price) : undefined,
                    stock_quantity: parseInt(itemFormData.stock_quantity) || 0
                })
            });

            if (response.ok) {
                toast({
                    title: "Item Created",
                    description: "Shop item has been created successfully"
                });
                setCreateItemOpen(false);
                resetItemForm();
                fetchData();
            } else {
                throw new Error('Failed to create item');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create item",
                variant: "destructive"
            });
        }
    };

    const updateShopItem = async () => {
        if (!editingItem) return;
        
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/shop/items`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingItem.id,
                    ...itemFormData,
                    price: parseFloat(itemFormData.price),
                    compare_price: itemFormData.compare_price ? parseFloat(itemFormData.compare_price) : undefined,
                    stock_quantity: parseInt(itemFormData.stock_quantity) || 0
                })
            });

            if (response.ok) {
                toast({
                    title: "Item Updated",
                    description: "Shop item has been updated successfully"
                });
                setEditItemOpen(false);
                setEditingItem(null);
                resetItemForm();
                fetchData();
            } else {
                throw new Error('Failed to update item');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update item",
                variant: "destructive"
            });
        }
    };

    const deleteShopItem = async (itemId: string) => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/shop/items?id=${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast({
                    title: "Item Deleted",
                    description: "Shop item has been deleted successfully"
                });
                fetchData();
            } else {
                throw new Error('Failed to delete item');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete item",
                variant: "destructive"
            });
        }
    };

    const resetItemForm = () => {
        setItemFormData({
            category_id: '',
            name: '',
            description: '',
            short_description: '',
            price: '',
            compare_price: '',
            sku: '',
            type: 'physical',
            stock_quantity: '',
            track_inventory: true,
            image_url: '',
            is_featured: false,
            is_active: true
        });
    };

    const openEditItem = (item: ShopItem) => {
        setEditingItem(item);
        setItemFormData({
            category_id: item.category_id,
            name: item.name,
            description: item.description || '',
            short_description: item.short_description || '',
            price: item.price.toString(),
            compare_price: item.compare_price?.toString() || '',
            sku: item.sku || '',
            type: item.type,
            stock_quantity: item.stock_quantity.toString(),
            track_inventory: item.track_inventory,
            image_url: item.image_url || '',
            is_featured: item.is_featured,
            is_active: item.is_active
        });
        setEditItemOpen(true);
    };

    const saveDisplayName = async () => {
        try {
            console.log('Saving display name:', settings?.display_name);
            const response = await fetch(`/api/tenant/${tenant}/gift-cards/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: settings?.display_name
                })
            });

            console.log('Save response status:', response.status);
            const responseData = await response.json();
            console.log('Save response data:', responseData);

            if (response.ok) {
                setSettings(responseData);
                toast({
                    title: "Name Updated",
                    description: "Restaurant display name has been saved"
                });
                // Refresh the data to ensure UI is updated
                fetchData();
            } else {
                throw new Error(responseData.error || 'Failed to save display name');
            }
        } catch (error) {
            console.error('Save display name error:', error);
            toast({
                title: "Error", 
                description: error instanceof Error ? error.message : "Failed to save display name",
                variant: "destructive"
            });
        }
    };

    const saveCoverImage = async () => {
        try {
            if (!settings?.cover_image_url) {
                toast({
                    title: "No Image",
                    description: "Please select an image first",
                    variant: "destructive"
                });
                return;
            }

            console.log('Saving cover image. Image data length:', settings.cover_image_url.length);
            const response = await fetch(`/api/tenant/${tenant}/gift-cards/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cover_image_url: settings.cover_image_url
                })
            });

            console.log('Save image response status:', response.status);
            const responseText = await response.text();
            console.log('Save image response text:', responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response as JSON:', parseError);
                throw new Error(`Server returned invalid JSON: ${responseText}`);
            }

            if (response.ok) {
                setSettings(responseData);
                toast({
                    title: "Image Updated",
                    description: "Cover image has been saved successfully"
                });
                // Refresh the data to ensure UI is updated
                fetchData();
            } else {
                console.error('Server error response:', responseData);
                throw new Error(responseData.error || responseData.details || 'Failed to save cover image');
            }
        } catch (error) {
            console.error('Save cover image error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save cover image", 
                variant: "destructive"
            });
        }
    };

    const handleCreateCard = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/gift-cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_type: cardType,
                    amount: parseFloat(cardAmount),
                    expiry_months: parseInt(expiryMonths)
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Gift card created successfully"
                });
                setCreateCardOpen(false);
                setCardAmount('');
                fetchData();
            } else {
                throw new Error('Failed to create gift card');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create gift card",
                variant: "destructive"
            });
        }
    };

    const handleRedeemCard = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/gift-cards/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_number: redeemCardNumber,
                    amount: parseFloat(redeemAmount),
                    description: redeemDescription
                })
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Gift card redeemed successfully"
                });
                setRedeemCardOpen(false);
                setRedeemCardNumber('');
                setRedeemAmount('');
                setRedeemDescription('');
                fetchData();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to redeem gift card');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to redeem gift card",
                variant: "destructive"
            });
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, updates: any) => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/admin/gift-cards/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Order status updated"
                });
                fetchData();
            } else {
                throw new Error('Failed to update order');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update order status",
                variant: "destructive"
            });
        }
    };

    const filteredCards = giftCards.filter(card => {
        const matchesSearch = card.card_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredOrders = orders.filter((order) => {
        return order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               order.card_number.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
                    <p className="text-muted-foreground">Manage gift cards, orders, and settings</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" asChild>
                        <a href={`/${tenant}/shop`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Visit Shop
                        </a>
                    </Button>
                    
                    <Dialog open={createCardOpen} onOpenChange={setCreateCardOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Gift Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Gift Card</DialogTitle>
                                <DialogDescription>
                                    Create a gift card for manual distribution or testing.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="card-type">Card Type</Label>
                                    <Select value={cardType} onValueChange={(value: 'digital' | 'physical') => setCardType(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="digital">Digital</SelectItem>
                                            <SelectItem value="physical">Physical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (£)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={cardAmount}
                                        onChange={(e) => setCardAmount(e.target.value)}
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry (months)</Label>
                                    <Input
                                        id="expiry"
                                        type="number"
                                        value={expiryMonths}
                                        onChange={(e) => setExpiryMonths(e.target.value)}
                                        placeholder="12"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateCard} disabled={!cardAmount}>
                                    Create Gift Card
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={redeemCardOpen} onOpenChange={setRedeemCardOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Redeem Card
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Redeem Gift Card</DialogTitle>
                                <DialogDescription>
                                    Process an in-store or manual gift card redemption.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="redeem-card-number">Gift Card Number</Label>
                                    <Input
                                        id="redeem-card-number"
                                        value={redeemCardNumber}
                                        onChange={(e) => setRedeemCardNumber(e.target.value)}
                                        placeholder="Enter gift card number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="redeem-amount">Redeem Amount (£)</Label>
                                    <Input
                                        id="redeem-amount"
                                        type="number"
                                        value={redeemAmount}
                                        onChange={(e) => setRedeemAmount(e.target.value)}
                                        placeholder="Enter amount to redeem"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="redeem-description">Description</Label>
                                    <Input
                                        id="redeem-description"
                                        value={redeemDescription}
                                        onChange={(e) => setRedeemDescription(e.target.value)}
                                        placeholder="In-store purchase, order #123, etc."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleRedeemCard} disabled={!redeemCardNumber || !redeemAmount}>
                                    Redeem Gift Card
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        <PoundSterling className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{stats.total_value || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Outstanding balance
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_cards || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Currently active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_orders || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            All time orders
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{stats.total_revenue || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Gift card sales
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search cards, orders, customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="redeemed">Redeemed</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="shop">Shop Items</TabsTrigger>
                    <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Landing Page Settings */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Settings className="h-5 w-5" />
                                    <span>Restaurant Display Name</span>
                                </CardTitle>
                                <CardDescription>
                                    Set the restaurant name that appears on the gift card landing page
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Enter restaurant name"
                                        value={settings?.display_name || ''}
                                        onChange={(e) => setSettings(prev => prev ? ({
                                            ...prev,
                                            display_name: e.target.value
                                        }) : null)}
                                    />
                                    <Button 
                                        onClick={saveDisplayName}
                                        size="sm"
                                    >
                                        Save Name
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <ImageIcon className="h-5 w-5" />
                                    <span>Cover Picture</span>
                                </CardTitle>
                                <CardDescription>
                                    Upload a cover image for the gift card landing page
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                        {settings?.cover_image_url ? (
                                            <div className="space-y-2">
                                                <img 
                                                    src={settings.cover_image_url} 
                                                    alt="Cover" 
                                                    className="w-full h-24 object-cover rounded-lg mx-auto"
                                                />
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setSettings(prev => prev ? ({
                                                        ...prev,
                                                        cover_image_url: ''
                                                    }) : null)}
                                                >
                                                    Remove Image
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                                <p className="text-sm text-gray-500">
                                                    Click to upload cover image
                                                </p>
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            // Check file size (max 2MB)
                                                            if (file.size > 2 * 1024 * 1024) {
                                                                toast({
                                                                    title: "File too large",
                                                                    description: "Please select an image under 2MB",
                                                                    variant: "destructive"
                                                                });
                                                                return;
                                                            }
                                                            
                                                            // Check file type
                                                            if (!file.type.startsWith('image/')) {
                                                                toast({
                                                                    title: "Invalid file type",
                                                                    description: "Please select a valid image file",
                                                                    variant: "destructive"
                                                                });
                                                                return;
                                                            }
                                                            
                                                            try {
                                                                const reader = new FileReader();
                                                                reader.onload = (e) => {
                                                                    const base64 = e.target?.result as string;
                                                                    console.log('File loaded successfully. Base64 length:', base64.length);
                                                                    setSettings(prev => prev ? ({
                                                                        ...prev,
                                                                        cover_image_url: base64
                                                                    }) : null);
                                                                    
                                                                    toast({
                                                                        title: "Image loaded",
                                                                        description: "Image ready to save. Click 'Save Cover Image' to apply."
                                                                    });
                                                                };
                                                                reader.onerror = (error) => {
                                                                    console.error('FileReader error:', error);
                                                                    toast({
                                                                        title: "Upload failed",
                                                                        description: "Failed to read the selected file",
                                                                        variant: "destructive"
                                                                    });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            } catch (error) {
                                                                console.error('File processing error:', error);
                                                                toast({
                                                                    title: "Upload failed",
                                                                    description: "Failed to process image",
                                                                    variant: "destructive"
                                                                });
                                                            }
                                                        }
                                                    }}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <Button 
                                        onClick={saveCoverImage}
                                        size="sm"
                                        className="w-full"
                                        disabled={!settings?.cover_image_url}
                                    >
                                        Save Cover Image
                                    </Button>
                                    {settings?.cover_image_url && (
                                        <p className="text-xs text-muted-foreground">
                                            Image ready to save (Size: {Math.round(settings.cover_image_url.length / 1024)}KB)
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {orders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{order.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">£{order.order_amount}</p>
                                            </div>
                                            <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                                                {order.payment_status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Gift Cards</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {giftCards.slice(0, 5).map((card) => (
                                        <div key={card.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{card.card_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    £{card.remaining_balance} remaining
                                                </p>
                                            </div>
                                            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                {card.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="shop">Shop Items</TabsTrigger>
                    <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {orders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{order.customer_name}</p>
                                                <p className="text-sm text-muted-foreground">£{order.order_amount}</p>
                                            </div>
                                            <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                                                {order.payment_status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Gift Cards</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {giftCards.slice(0, 5).map((card) => (
                                        <div key={card.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{card.card_number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    £{card.remaining_balance} remaining
                                                </p>
                                            </div>
                                            <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                {card.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="shop" className="space-y-4">
                    {/* Shop Categories Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center space-x-2">
                                        <TagIcon className="h-5 w-5" />
                                        <span>Categories</span>
                                    </CardTitle>
                                    <CardDescription>Manage shop categories</CardDescription>
                                </div>
                                <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Category
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Category</DialogTitle>
                                            <DialogDescription>Add a new shop category</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="category-name">Name</Label>
                                                <Input
                                                    id="category-name"
                                                    value={categoryFormData.name}
                                                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                                                    placeholder="Category name"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="category-description">Description</Label>
                                                <Textarea
                                                    id="category-description"
                                                    value={categoryFormData.description}
                                                    onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                                                    placeholder="Category description"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="category-image">Image URL</Label>
                                                <Input
                                                    id="category-image"
                                                    value={categoryFormData.image_url}
                                                    onChange={(e) => setCategoryFormData({...categoryFormData, image_url: e.target.value})}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setCreateCategoryOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={createCategory}>Create</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {shopCategories.map((category) => (
                                    <Card key={category.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">{category.name}</h4>
                                                <p className="text-sm text-gray-600">{category.description}</p>
                                            </div>
                                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Items Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Package className="h-5 w-5" />
                                        <span>Shop Items</span>
                                    </CardTitle>
                                    <CardDescription>Manage shop products and items</CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {shopCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Dialog open={createItemOpen} onOpenChange={setCreateItemOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Item
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Create Shop Item</DialogTitle>
                                                <DialogDescription>Add a new item to your shop</DialogDescription>
                                            </DialogHeader>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="item-name">Name</Label>
                                                    <Input
                                                        id="item-name"
                                                        value={itemFormData.name}
                                                        onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                                                        placeholder="Item name"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="item-category">Category</Label>
                                                    <Select 
                                                        value={itemFormData.category_id} 
                                                        onValueChange={(value) => setItemFormData({...itemFormData, category_id: value})}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {shopCategories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="item-price">Price (£)</Label>
                                                    <Input
                                                        id="item-price"
                                                        type="number"
                                                        step="0.01"
                                                        value={itemFormData.price}
                                                        onChange={(e) => setItemFormData({...itemFormData, price: e.target.value})}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="item-type">Type</Label>
                                                    <Select 
                                                        value={itemFormData.type} 
                                                        onValueChange={(value: 'physical' | 'digital' | 'gift_card') => setItemFormData({...itemFormData, type: value})}
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
                                                <div className="col-span-2">
                                                    <Label htmlFor="item-short-description">Short Description</Label>
                                                    <Input
                                                        id="item-short-description"
                                                        value={itemFormData.short_description}
                                                        onChange={(e) => setItemFormData({...itemFormData, short_description: e.target.value})}
                                                        placeholder="Brief description for listings"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label htmlFor="item-description">Description</Label>
                                                    <Textarea
                                                        id="item-description"
                                                        value={itemFormData.description}
                                                        onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                                                        placeholder="Detailed description"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="item-image">Image URL</Label>
                                                    <Input
                                                        id="item-image"
                                                        value={itemFormData.image_url}
                                                        onChange={(e) => setItemFormData({...itemFormData, image_url: e.target.value})}
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="item-stock">Stock Quantity</Label>
                                                    <Input
                                                        id="item-stock"
                                                        type="number"
                                                        value={itemFormData.stock_quantity}
                                                        onChange={(e) => setItemFormData({...itemFormData, stock_quantity: e.target.value})}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={itemFormData.is_featured}
                                                        onCheckedChange={(checked) => setItemFormData({...itemFormData, is_featured: checked})}
                                                    />
                                                    <Label>Featured Item</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={itemFormData.is_active}
                                                        onCheckedChange={(checked) => setItemFormData({...itemFormData, is_active: checked})}
                                                    />
                                                    <Label>Active</Label>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setCreateItemOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={createShopItem}>Create Item</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopItems
                                        .filter(item => selectedCategory === 'all' || item.category_id === selectedCategory)
                                        .map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                        <ImageIcon className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category_name}</TableCell>
                                            <TableCell>£{item.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.type}</Badge>
                                            </TableCell>
                                            <TableCell>{item.track_inventory ? item.stock_quantity : 'Unlimited'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {item.is_featured && <Badge variant="outline">Featured</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => openEditItem(item)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => deleteShopItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Edit Item Dialog */}
                    <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Shop Item</DialogTitle>
                                <DialogDescription>Update item details</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="edit-item-name">Name</Label>
                                    <Input
                                        id="edit-item-name"
                                        value={itemFormData.name}
                                        onChange={(e) => setItemFormData({...itemFormData, name: e.target.value})}
                                        placeholder="Item name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-item-category">Category</Label>
                                    <Select 
                                        value={itemFormData.category_id} 
                                        onValueChange={(value) => setItemFormData({...itemFormData, category_id: value})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shopCategories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="edit-item-price">Price (£)</Label>
                                    <Input
                                        id="edit-item-price"
                                        type="number"
                                        step="0.01"
                                        value={itemFormData.price}
                                        onChange={(e) => setItemFormData({...itemFormData, price: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-item-type">Type</Label>
                                    <Select 
                                        value={itemFormData.type} 
                                        onValueChange={(value: 'physical' | 'digital' | 'gift_card') => setItemFormData({...itemFormData, type: value})}
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
                                <div className="col-span-2">
                                    <Label htmlFor="edit-item-short-description">Short Description</Label>
                                    <Input
                                        id="edit-item-short-description"
                                        value={itemFormData.short_description}
                                        onChange={(e) => setItemFormData({...itemFormData, short_description: e.target.value})}
                                        placeholder="Brief description for listings"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label htmlFor="edit-item-description">Description</Label>
                                    <Textarea
                                        id="edit-item-description"
                                        value={itemFormData.description}
                                        onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                                        placeholder="Detailed description"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-item-image">Image URL</Label>
                                    <Input
                                        id="edit-item-image"
                                        value={itemFormData.image_url}
                                        onChange={(e) => setItemFormData({...itemFormData, image_url: e.target.value})}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-item-stock">Stock Quantity</Label>
                                    <Input
                                        id="edit-item-stock"
                                        type="number"
                                        value={itemFormData.stock_quantity}
                                        onChange={(e) => setItemFormData({...itemFormData, stock_quantity: e.target.value})}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={itemFormData.is_featured}
                                        onCheckedChange={(checked) => setItemFormData({...itemFormData, is_featured: checked})}
                                    />
                                    <Label>Featured Item</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={itemFormData.is_active}
                                        onCheckedChange={(checked) => setItemFormData({...itemFormData, is_active: checked})}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditItemOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={updateShopItem}>Update Item</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="gift-cards" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Gift Cards</CardTitle>
                                    <CardDescription>
                                        Manage digital gift cards and vouchers
                                    </CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="used">Used</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="birthday">Birthday</SelectItem>
                                            <SelectItem value="anniversary">Anniversary</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Gift Card
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCards.map((card) => (
                                        <TableRow key={card.id}>
                                            <TableCell className="font-medium">{card.card_number}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{card.card_type}</Badge>
                                            </TableCell>
                                            <TableCell>£{card.amount}</TableCell>
                                            <TableCell>£{card.remaining_balance}</TableCell>
                                            <TableCell>
                                                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                    {card.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'No expiry'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gift Cards</CardTitle>
                            <CardDescription>
                                Manage all gift cards and their balances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCards.map((card) => (
                                        <TableRow key={card.id}>
                                            <TableCell className="font-medium">{card.card_number}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{card.card_type}</Badge>
                                            </TableCell>
                                            <TableCell>£{card.amount}</TableCell>
                                            <TableCell>£{card.remaining_balance}</TableCell>
                                            <TableCell>
                                                <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                                    {card.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'No expiry'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gift Card Orders</CardTitle>
                            <CardDescription>
                                View and manage gift card orders and delivery status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Card Number</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Delivery</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                {new Date(order.order_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{order.customer_name}</p>
                                                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{order.card_number}</TableCell>
                                            <TableCell>£{order.order_amount}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
                                                    {order.payment_status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={order.delivery_status}
                                                    onValueChange={(value) => handleUpdateOrderStatus(order.id, { delivery_status: value })}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="sent">Sent</SelectItem>
                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    {settings && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gift Card Settings</CardTitle>
                                <CardDescription>
                                    Configure gift card options and templates
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label className="text-base font-medium">Fixed Amounts</Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Set quick-select amounts for customers
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {settings.fixed_amounts?.map((amount, index) => (
                                            <Badge key={index} variant="outline">£{amount}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Allow Custom Amount</Label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Switch checked={settings.allow_custom_amount} />
                                            <span className="text-sm">{settings.allow_custom_amount ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Default Expiry</Label>
                                        <p className="text-sm text-muted-foreground">{settings.default_expiry_months} months</p>
                                    </div>
                                </div>

                                <div>
                                    <Label>Terms & Conditions</Label>
                                    <p className="text-sm text-muted-foreground mt-1">{settings.terms_and_conditions}</p>
                                </div>

                                <Button>
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    Edit Settings
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
