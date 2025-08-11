'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, ShoppingCart, Star, Heart, Filter, Grid, List, Plus, Minus, Eye, Package, Gift, CreditCard, Loader2, CheckCircle, Truck, Mail, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface ShopCategory {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    is_active: boolean;
}

interface ShopItem {
    id: string;
    category_id: string;
    category_name: string;
    name: string;
    description: string;
    short_description: string;
    price: number;
    image_url?: string;
    type: 'physical' | 'digital' | 'gift_card';
    is_featured: boolean;
    is_active: boolean;
    stock_quantity: number;
    track_inventory: boolean;
}

interface CartItem extends ShopItem {
    quantity: number;
}

interface TenantInfo {
    name: string;
    description?: string;
    logo_url?: string;
    address?: string;
    phone?: string;
    email?: string;
}

interface ShopSettings {
    tenant_id: string;
    cover_image_url?: string;
    display_name?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    text_color?: string;
    background_color?: string;
    card_background?: string;
    border_color?: string;
    color_theme?: string;
}

interface GiftCardSettings {
    tenant_id: string;
    fixed_amounts?: number[];
    allow_custom_amount: boolean;
    min_custom_amount: number;
    max_custom_amount: number;
    terms_and_conditions?: string;
}

export default function ShopPage() {
    const params = useParams();
    const tenant = params.tenant as string;
    const { toast } = useToast();

    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
    const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
    const [giftCardSettings, setGiftCardSettings] = useState<GiftCardSettings | null>(null);
    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [items, setItems] = useState<ShopItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Gift card states
    const [giftCardDialogOpen, setGiftCardDialogOpen] = useState(false);
    const [giftCardAmount, setGiftCardAmount] = useState<string>('');
    const [selectedGiftCardAmount, setSelectedGiftCardAmount] = useState<number | null>(null);
    
    // Gift card balance checker states
    const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
    const [balanceCheckCode, setBalanceCheckCode] = useState('');
    const [balanceResult, setBalanceResult] = useState<{ balance: number; code: string } | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    
    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('featured');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Dialog states
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [itemDetailOpen, setItemDetailOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    
    // Payment states
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [stripePromise, setStripePromise] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [orderType, setOrderType] = useState<'email' | 'collection' | 'delivery'>('email');
    const [deliveryType, setDeliveryType] = useState<'normal' | 'express'>('normal');
    const [deliveryFees, setDeliveryFees] = useState({ normal: 5.00, express: 9.00 });
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postcode: ''
    });

    // Load initial data
    useEffect(() => {
        fetchData();
    }, [tenant]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch tenant info
            const tenantResponse = await fetch(`/api/tenant/${tenant}/info`);
            if (tenantResponse.ok) {
                const tenantData = await tenantResponse.json();
                setTenantInfo(tenantData);
            }

            // Fetch shop settings
            const settingsResponse = await fetch(`/api/tenant/${tenant}/shop/settings`);
            if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                setShopSettings(settingsData);
            }

            // Fetch gift card settings
            const giftCardResponse = await fetch(`/api/tenant/${tenant}/gift-cards/settings`);
            if (giftCardResponse.ok) {
                const giftCardData = await giftCardResponse.json();
                setGiftCardSettings(giftCardData);
            }

            // Fetch categories
            const categoriesResponse = await fetch(`/api/tenant/${tenant}/shop/categories`);
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                setCategories(categoriesData.filter((cat: ShopCategory) => cat.is_active));
            }

            // Fetch items
            const itemsResponse = await fetch(`/api/tenant/${tenant}/shop/items`);
            if (itemsResponse.ok) {
                const itemsData = await itemsResponse.json();
                setItems(itemsData.filter((item: ShopItem) => item.is_active));
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast({
                title: "Error",
                description: "Failed to load shop data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Cart functions
    const addToCart = (item: ShopItem) => {
        if (item.track_inventory && item.stock_quantity <= 0) {
            toast({
                title: "Out of Stock",
                description: "This item is currently out of stock",
                variant: "destructive"
            });
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });

        toast({
            title: "Added to Cart",
            description: `${item.name} has been added to your cart`,
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };

    const updateCartQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCart(prevCart =>
            prevCart.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Filter and sort functions
    const getFilteredItems = () => {
        let filtered = items.filter(item => {
            // Search filter
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !item.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            
            // Category filter
            if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
                return false;
            }
            
            // Price filter
            if (priceRange !== 'all') {
                const price = item.price;
                switch (priceRange) {
                    case 'under-10':
                        if (price >= 10) return false;
                        break;
                    case '10-25':
                        if (price < 10 || price >= 25) return false;
                        break;
                    case '25-50':
                        if (price < 25 || price >= 50) return false;
                        break;
                    case 'over-50':
                        if (price < 50) return false;
                        break;
                }
            }
            
            return true;
        });

        // Sort items
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'featured':
                filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
                break;
        }

        return filtered;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        {/* Logo and name */}
                        <div className="flex items-center space-x-4">
                            {tenantInfo?.logo_url && (
                                <img 
                                    src={tenantInfo.logo_url} 
                                    alt={tenantInfo.name} 
                                    className="h-12 w-12 rounded-lg" 
                                />
                            )}
                            <h1 className="text-3xl font-bold text-gray-900">
                                {shopSettings?.display_name || tenantInfo?.name || 'Shop'}
                            </h1>
                        </div>
                        
                        {/* Cart button */}
                        <Button 
                            variant="outline" 
                            onClick={() => setCartOpen(true)}
                            className="relative"
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Cart
                            {getCartItemCount() > 0 && (
                                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                                    {getCartItemCount()}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Search and filters */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="featured">Featured</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="price-low">Price: Low to High</SelectItem>
                                <SelectItem value="price-high">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Products grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getFilteredItems().map((item) => (
                        <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative">
                                {item.image_url ? (
                                    <img 
                                        src={item.image_url} 
                                        alt={item.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Package className="w-16 h-16 text-white" />
                                    </div>
                                )}

                                {item.is_featured && (
                                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                                        Featured
                                    </Badge>
                                )}
                                
                                <Badge className="absolute top-2 right-2 bg-white/90 text-gray-700">
                                    {item.type === 'gift_card' ? 'Gift Card' : 
                                     item.type === 'digital' ? 'Digital' : 'Physical'}
                                </Badge>
                            </div>
                            
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                    {item.short_description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-gray-900">
                                        £{Number(item.price).toFixed(2)}
                                    </span>
                                    
                                    <Button 
                                        size="sm"
                                        onClick={() => addToCart(item)}
                                        disabled={item.track_inventory && item.stock_quantity <= 0}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                
                                {item.track_inventory && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        {item.stock_quantity > 0 ? 
                                            `${item.stock_quantity} in stock` : 
                                            'Out of stock'
                                        }
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {getFilteredItems().length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No products found</p>
                    </div>
                )}
            </div>

            {/* Cart Dialog */}
            <Dialog open={cartOpen} onOpenChange={setCartOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Shopping Cart</DialogTitle>
                        <DialogDescription>
                            {getCartItemCount()} items in your cart
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {cart.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Your cart is empty</p>
                        ) : (
                            <>
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-sm text-gray-500">£{item.price.toFixed(2)} each</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-500"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                                
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-semibold">Total:</span>
                                        <span className="text-lg font-bold">£{getCartTotal().toFixed(2)}</span>
                                    </div>
                                    
                                    <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Checkout
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
