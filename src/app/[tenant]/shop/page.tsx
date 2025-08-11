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
import { Search, ShoppingCart, Star, Heart, Filter, Grid, List, Plus, Minus, Eye, Package, Gift, CreditCard, Loader2, CheckCircle, Truck, Mail, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface ShopCategory {
    id: string;
    name: string;
    description: string;
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
    type: 'physical' | 'digital' | 'gift_card';
    is_featured: boolean;
    is_active: boolean;
    stock_quantity: number;
    track_inventory: boolean;
    image_url?: string;
    gallery_images?: string[];
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

    // Enhanced posh styling utility functions with shadows and elegance
    const getButtonStyle = (): React.CSSProperties => {
        if (!shopSettings) return {};
        const primaryColor = shopSettings.primary_color || '#3b82f6';
        const textColor = shopSettings.card_background || '#ffffff';
        
        return { 
            backgroundColor: primaryColor,
            color: textColor,
            boxShadow: `0 4px 14px 0 ${primaryColor}33, 0 2px 4px 0 ${primaryColor}1a`,
            border: `1px solid ${primaryColor}`,
            backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '8px',
            position: 'relative' as const,
            overflow: 'hidden'
        };
    };

    const getButtonHoverStyle = (): React.CSSProperties => {
        if (!shopSettings) return {};
        const primaryColor = shopSettings.primary_color || '#3b82f6';
        const textColor = shopSettings.card_background || '#ffffff';
        
        return {
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: `0 8px 25px 0 ${primaryColor}40, 0 4px 10px 0 ${primaryColor}25, 0 0 0 1px ${primaryColor}`,
            backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 100%)`,
            filter: 'brightness(1.05) saturate(1.1)'
        };
    };

    const getButtonOutlineStyle = (): React.CSSProperties => {
        if (!shopSettings) return {};
        const primaryColor = shopSettings.primary_color || '#3b82f6';
        
        return { 
            borderColor: primaryColor,
            color: primaryColor,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: `0 2px 8px 0 ${primaryColor}20, 0 1px 3px 0 ${primaryColor}15`,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            borderWidth: '1.5px',
            borderRadius: '8px',
            position: 'relative' as const,
            overflow: 'hidden'
        };
    };

    const getButtonOutlineHoverStyle = (): React.CSSProperties => {
        if (!shopSettings) return {};
        const primaryColor = shopSettings.primary_color || '#3b82f6';
        const textColor = shopSettings.card_background || '#ffffff';
        
        return {
            transform: 'translateY(-1px) scale(1.02)',
            backgroundColor: primaryColor,
            color: textColor,
            boxShadow: `0 6px 20px 0 ${primaryColor}35, 0 3px 8px 0 ${primaryColor}20`,
            borderColor: primaryColor,
            filter: 'brightness(1.05)'
        };
    };

    const getBorderStyle = (): React.CSSProperties => {
        if (!shopSettings) return {};
        const borderColor = shopSettings.border_color || '#e5e7eb';
        
        return { 
            borderColor: borderColor,
            boxShadow: `0 1px 3px 0 ${borderColor}40, 0 1px 2px 0 ${borderColor}25`,
            borderRadius: '8px'
        };
    };

    const getBackgroundStyle = () => {
        if (!shopSettings) return {};
        const backgroundColor = shopSettings.background_color || '#f8fafc';
        
        return { 
            backgroundColor: backgroundColor,
            backgroundImage: `radial-gradient(circle at 50% 50%, ${backgroundColor}00 0%, ${backgroundColor}08 100%)`
        };
    };

    const getCardStyle = () => {
        if (!shopSettings) return {};
        const borderColor = shopSettings.border_color || '#e5e7eb';
        const cardBackground = shopSettings.card_background || '#ffffff';
        
        return { 
            backgroundColor: cardBackground,
            borderColor: borderColor,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`
        };
    };

    useEffect(() => {
        fetchData();
    }, [tenant]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tenantRes, categoriesRes, itemsRes, shopSettingsRes, giftCardSettingsRes] = await Promise.all([
                fetch(`/api/tenant/${tenant}/info`),
                fetch(`/api/tenant/${tenant}/shop/categories`),
                fetch(`/api/tenant/${tenant}/shop/items`),
                fetch(`/api/tenant/${tenant}/admin/shop/settings`),
                fetch(`/api/tenant/${tenant}/gift-cards/settings`)
            ]);

            if (tenantRes.ok) {
                const tenantData = await tenantRes.json();
                setTenantInfo(tenantData);
            }

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData.filter((cat: ShopCategory) => cat.is_active));
            }

            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setItems(itemsData.filter((item: ShopItem) => item.is_active));
            }

            if (shopSettingsRes.ok) {
                const shopSettingsData = await shopSettingsRes.json();
                setShopSettings(shopSettingsData);
            }

            if (giftCardSettingsRes.ok) {
                const giftCardSettingsData = await giftCardSettingsRes.json();
                setGiftCardSettings(giftCardSettingsData);
            }
        } catch (error) {
            console.error('Error fetching shop data:', error);
            toast({
                title: "Error",
                description: "Failed to load shop data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const checkGiftCardBalance = async () => {
        if (!balanceCheckCode.trim()) {
            toast({
                title: "Error",
                description: "Please enter a gift card code",
                variant: "destructive"
            });
            return;
        }

        setBalanceLoading(true);
        try {
            const response = await fetch(`/api/${tenant}/gift-cards/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    code: balanceCheckCode.trim() 
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setBalanceResult(data);
                
                if (data.balance <= 0) {
                    toast({
                        title: "Gift Card Used",
                        description: "This gift card has been fully used and will be removed from our system.",
                        variant: "destructive"
                    });
                }
            } else {
                const error = await response.json();
                toast({
                    title: "Gift Card Not Found",
                    description: error.error || "Invalid gift card code",
                    variant: "destructive"
                });
                setBalanceResult(null);
            }
        } catch (error) {
            console.error('Balance check error:', error);
            toast({
                title: "Error",
                description: "Failed to check gift card balance",
                variant: "destructive"
            });
            setBalanceResult(null);
        }
        setBalanceLoading(false);
    };

    const getTotalPrice = () => {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        let deliveryFee = 0;
        
        if (orderType === 'delivery') {
            deliveryFee = deliveryType === 'express' ? (deliveryFees.express || 9.00) : (deliveryFees.normal || 5.00);
        }
        
        return Number((subtotal + deliveryFee).toFixed(2));
    };

    const getDeliveryFee = () => {
        if (orderType === 'delivery') {
            return deliveryType === 'express' ? (deliveryFees.express || 9.00) : (deliveryFees.normal || 5.00);
        }
        return 0;
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Cart functions
    const addToCart = (item: ShopItem) => {
        // Check if item tracking inventory and is out of stock
        if (item.track_inventory && item.stock_quantity <= 0) {
            toast({
                title: "Out of Stock",
                description: `${item.name} is currently out of stock`,
                variant: "destructive"
            });
            return;
        }

        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                // Check if adding one more would exceed stock
                if (item.track_inventory && existingItem.quantity >= item.stock_quantity) {
                    toast({
                        title: "Stock Limit Reached",
                        description: `Only ${item.stock_quantity} of ${item.name} available`,
                        variant: "destructive"
                    });
                    return prevCart; // Return unchanged cart
                }
                
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            } else {
                return [...prevCart, { ...item, quantity: 1 }];
            }
        });
        
        toast({
            title: "Added to cart",
            description: `${item.name} has been added to your cart`,
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
        toast({
            title: "Removed from cart",
            description: "Item has been removed from your cart",
        });
    };

    const updateCartQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        // Find the cart item and original item data
        const cartItem = cart.find(item => item.id === itemId);
        if (!cartItem) return;

        // Find the original item data to check stock
        const originalItem = items.find(item => item.id === itemId);
        if (!originalItem) {
            // For gift cards or items not in the items list, allow any quantity
            setCart(prevCart => 
                prevCart.map(item =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );
            return;
        }

        // Check stock limits only if increasing quantity and tracking inventory
        if (newQuantity > cartItem.quantity && originalItem.track_inventory && newQuantity > originalItem.stock_quantity) {
            toast({
                title: "Stock Limit Reached",
                description: `Only ${originalItem.stock_quantity} of ${originalItem.name} available`,
                variant: "destructive"
            });
            return;
        }

        setCart(prevCart => 
            prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const addGiftCardToCart = (amount: number) => {
        const giftCardItem: CartItem = {
            id: `gift-card-${Date.now()}`,
            category_id: 'gift-card',
            category_name: 'Gift Cards',
            name: 'Digital Gift Card',
            description: `Digital gift card worth £${amount.toFixed(2)}`,
            short_description: `£${amount.toFixed(2)} Gift Card`,
            price: amount,
            type: 'gift_card',
            is_featured: false,
            is_active: true,
            stock_quantity: 1,
            track_inventory: false,
            quantity: 1
        };

        setCart(prevCart => [...prevCart, giftCardItem]);
        setGiftCardDialogOpen(false);
        setGiftCardAmount('');
        setSelectedGiftCardAmount(null);
        
        toast({
            title: "Gift card added to cart",
            description: `£${amount.toFixed(2)} gift card has been added to your cart`,
        });
    };

    const proceedToCheckout = async () => {
        if (cart.length === 0) {
            toast({
                title: "Empty Cart",
                description: "Please add items to your cart before checkout",
                variant: "destructive"
            });
            return;
        }

        try {
            // Initialize Stripe and get delivery fees
            const configResponse = await fetch(`/api/tenant/${tenant}/payments/stripe`);
            if (!configResponse.ok) {
                throw new Error('Failed to load payment configuration');
            }
            const config = await configResponse.json();
            
            if (!config.enabled) {
                toast({
                    title: "Payment Unavailable",
                    description: "Payment processing is currently disabled",
                    variant: "destructive"
                });
                return;
            }

            // Update delivery fees from config
            if (config.deliveryFees) {
                setDeliveryFees({
                    normal: parseFloat(config.deliveryFees.normal) || 5.00,
                    express: parseFloat(config.deliveryFees.express) || 9.00
                });
            }
            
            const stripe = loadStripe(config.publishableKey);
            setStripePromise(stripe);
            
            // Open checkout dialog
            setCheckoutOpen(true);
        } catch (error) {
            console.error('Error initializing checkout:', error);
            toast({
                title: "Checkout Error",
                description: "Unable to initialize checkout. Please try again.",
                variant: "destructive"
            });
        }
    };

    const createPaymentIntent = async () => {
        try {
            const subtotal = getSubtotal();
            const deliveryFee = getDeliveryFee();
            const total = subtotal + deliveryFee;
            const orderId = `shop_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const response = await fetch(`/api/tenant/${tenant}/payments/stripe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_payment_intent',
                    amount: subtotal,
                    currency: 'gbp',
                    orderId: orderId,
                    customerEmail: customerInfo.email,
                    customerName: customerInfo.name,
                    description: `Shop Order - ${cart.length} items`,
                    orderType: orderType,
                    deliveryType: orderType === 'delivery' ? deliveryType : undefined,
                    cartItems: cart,
                    metadata: {
                        orderType: orderType,
                        deliveryType: orderType === 'delivery' ? deliveryType : undefined,
                        source: 'shop',
                        customerPhone: customerInfo.phone,
                        ...(orderType === 'delivery' && {
                            address: customerInfo.address,
                            city: customerInfo.city,
                            postcode: customerInfo.postcode
                        })
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
            return data.clientSecret;
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    };

    const handleCustomerInfoChange = (field: string, value: string) => {
        setCustomerInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateCustomerInfo = () => {
        const { name, email, phone, address, city, postcode } = customerInfo;
        
        if (!name.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter your name",
                variant: "destructive"
            });
            return false;
        }
        
        if (!email.trim() || !email.includes('@')) {
            toast({
                title: "Invalid Email",
                description: "Please enter a valid email address",
                variant: "destructive"
            });
            return false;
        }
        
        // Phone is optional for email orders
        if (orderType !== 'email' && !phone.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter your phone number",
                variant: "destructive"
            });
            return false;
        }
        
        if (orderType === 'delivery') {
            if (!address.trim()) {
                toast({
                    title: "Missing Information",
                    description: "Please enter your delivery address",
                    variant: "destructive"
                });
                return false;
            }
            
            if (!city.trim()) {
                toast({
                    title: "Missing Information",
                    description: "Please enter your city",
                    variant: "destructive"
                });
                return false;
            }
            
            if (!postcode.trim()) {
                toast({
                    title: "Missing Information",
                    description: "Please enter your postcode",
                    variant: "destructive"
                });
                return false;
            }
        }
        
        return true;
    };

    // Payment functions
    const initializeStripe = async () => {
        try {
            const response = await fetch(`/api/tenant/${tenant}/payments/stripe`);
            const data = await response.json();
            
            if (data.enabled && data.configured) {
                const stripe = await loadStripe(data.publishableKey);
                setStripePromise(stripe);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            return false;
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast({
                title: "Cart is empty",
                description: "Please add items to your cart before checkout",
                variant: "destructive"
            });
            return;
        }

        setCartOpen(false);
        setCheckoutOpen(true);
    };

    const openItemDetails = (item: ShopItem) => {
        setSelectedItem(item);
        setItemDetailOpen(true);
    };

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

    // Image Gallery Component for displaying multiple images
    const ImageGallery = ({ images, className = "" }: { images?: string[] | null, className?: string }) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        
        // Ensure images is an array and filter out any invalid entries
        const validImages = Array.isArray(images) ? images.filter(img => img && typeof img === 'string') : [];
        
        if (!validImages || validImages.length === 0) {
            // Fallback to gradient placeholder when no images
            return (
                <div 
                    className={`w-full h-full flex items-center justify-center relative overflow-hidden ${className}`}
                    style={{
                        background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`,
                    }}
                >
                    <Package className="w-12 h-12 text-white z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-sm"></div>
                </div>
            );
        }

        return (
            <div className={`w-full h-full relative overflow-hidden ${className}`}>
                {/* Main Image */}
                <img 
                    src={validImages[currentIndex]} 
                    alt="Product Image"
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
                
                {/* Navigation Arrows (only show if multiple images) */}
                {validImages.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrentIndex(prev => prev === 0 ? validImages.length - 1 : prev - 1)}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white/95 text-gray-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentIndex(prev => prev === validImages.length - 1 ? 0 : prev + 1)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm hover:bg-white/95 text-gray-700 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                )}

                {/* Image Dots Indicator (only show if multiple images) */}
                {validImages.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {validImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                    index === currentIndex 
                                        ? 'bg-white shadow-lg scale-125' 
                                        : 'bg-white/60 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Image Counter (only show if multiple images) */}
                {validImages.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                        {currentIndex + 1} / {validImages.length}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={getBackgroundStyle()}>
            {/* Cover Image */}
            {shopSettings?.cover_image_url && (
                <div className="w-full h-64 bg-gray-200 mb-6">
                    <img 
                        src={shopSettings.cover_image_url} 
                        alt="Shop Cover" 
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Header */}
            <div className="bg-transparent backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between py-8 sm:py-10 space-y-6 sm:space-y-0">
                        {/* Logo Section - Clean borderless design */}
                        <div className="flex items-center space-x-5 order-2 sm:order-1 min-w-0 sm:min-w-[200px]">
                            {tenantInfo?.logo_url && (
                                <div className="relative">
                                    <img 
                                        src={tenantInfo.logo_url} 
                                        alt={tenantInfo.name} 
                                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl transition-transform duration-300 hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                                </div>
                            )}
                        </div>
                        
                        {/* Shop Name - Clean typography without borders */}
                        <div className="text-center order-1 sm:order-2 flex-1 px-4 sm:px-8">
                            <h1 
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3"
                                style={{
                                    color: shopSettings?.text_color || '#1f2937',
                                    background: `linear-gradient(135deg, ${shopSettings?.text_color || '#1f2937'} 0%, ${shopSettings?.primary_color || '#3b82f6'} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {shopSettings?.display_name || tenantInfo?.name || 'Shop'}
                            </h1>
                            <div className="flex items-center justify-center space-x-3">
                                <div 
                                    className="h-px w-12 opacity-60"
                                    style={{
                                        background: `linear-gradient(to right, transparent, ${shopSettings?.primary_color || '#9ca3af'}, transparent)`
                                    }}
                                ></div>
                                <p 
                                    className="text-base sm:text-lg font-medium tracking-wide"
                                    style={{ color: shopSettings?.text_color || '#4b5563' }}
                                >
                                    The Premium Online Store
                                </p>
                                <div 
                                    className="h-px w-12 opacity-60"
                                    style={{
                                        background: `linear-gradient(to right, transparent, ${shopSettings?.primary_color || '#9ca3af'}, transparent)`
                                    }}
                                ></div>
                            </div>
                        </div>
                        
                        {/* Cart Button - Smart modern design */}
                        <div className="order-3 sm:order-3 min-w-0 sm:min-w-[200px] flex justify-end">
                            <Button 
                                variant="outline" 
                                onClick={() => setCartOpen(true)}
                                className="relative transition-all duration-500 group px-10 py-5 font-bold tracking-wide rounded-2xl backdrop-blur-md shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                                style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
                                    backdropFilter: 'blur(20px)',
                                    border: `2px solid ${shopSettings?.primary_color || '#3b82f6'}40`,
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 2px 8px ${shopSettings?.primary_color || '#3b82f6'}25`,
                                    color: shopSettings?.primary_color || '#3b82f6'
                                }}
                                onMouseEnter={(e) => {
                                    const primaryColor = shopSettings?.primary_color || '#3b82f6';
                                    Object.assign(e.currentTarget.style, {
                                        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
                                        backdropFilter: 'blur(25px)',
                                        boxShadow: `0 16px 40px rgba(0,0,0,0.15), 0 8px 16px ${primaryColor}40`,
                                        transform: 'translateY(-4px) scale(1.05)',
                                        border: `2px solid ${primaryColor}66`
                                    });
                                }}
                                onMouseLeave={(e) => {
                                    const primaryColor = shopSettings?.primary_color || '#3b82f6';
                                    Object.assign(e.currentTarget.style, {
                                        background: `linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)`,
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 2px 8px ${primaryColor}25`,
                                        transform: 'translateY(0px) scale(1)',
                                        border: `2px solid ${primaryColor}40`
                                    });
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <ShoppingCart className="h-6 w-6 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12" />
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm"></div>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="hidden sm:inline font-bold text-lg tracking-tight">Cart</span>
                                        <span className="sm:hidden font-bold text-lg tracking-tight">({cart.length})</span>
                                        {cart.length > 0 && (
                                            <span className="hidden sm:inline text-xs opacity-70 font-medium">
                                                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {cart.length > 0 && (
                                    <div className="absolute -top-2 -right-2">
                                        <div className="relative">
                                            <Badge 
                                                className="h-7 w-7 rounded-full p-0 flex items-center justify-center font-bold text-xs border-0 animate-pulse"
                                                style={{
                                                    background: `linear-gradient(135deg, ${shopSettings?.primary_color || '#3b82f6'} 0%, ${shopSettings?.secondary_color || '#1e40af'} 100%)`,
                                                    color: 'white',
                                                    boxShadow: `0 4px 15px ${shopSettings?.primary_color || '#3b82f6'}66, 0 0 20px ${shopSettings?.secondary_color || '#1e40af'}4d`
                                                }}
                                            >
                                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                            </Badge>
                                            <div 
                                                className="absolute -inset-1 rounded-full opacity-30 blur-sm animate-pulse"
                                                style={{
                                                    background: `linear-gradient(135deg, ${shopSettings?.primary_color || '#3b82f6'} 0%, ${shopSettings?.secondary_color || '#1e40af'} 100%)`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gift Cards Section - Premium Professional Design */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
                {giftCardSettings && (
                    <div className="mb-12">
                        {/* Section Header with Elegant Typography */}
                        <div className="text-center mb-10">
                            <h2 
                                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight"
                                style={{
                                    color: shopSettings?.text_color || '#1f2937',
                                    background: `linear-gradient(135deg, ${shopSettings?.text_color || '#1f2937'} 0%, ${shopSettings?.primary_color || '#3b82f6'} 100%)`,
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Gift Cards
                            </h2>
                            <p 
                                className="text-lg font-medium max-w-2xl mx-auto leading-relaxed"
                                style={{ color: shopSettings?.text_color || '#4b5563' }}
                            >
                                Share the joy of exceptional dining with our premium gift cards
                            </p>
                        </div>

                        {/* Main Gift Card Container */}
                        <div className="relative">
                            <Card 
                                className="overflow-hidden backdrop-blur-xl border-0 shadow-2xl"
                                style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 32px 64px rgba(0,0,0,0.1), 0 16px 32px rgba(63, 75, 248, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                                    borderRadius: '24px'
                                }}
                            >
                                <div className="p-8 sm:p-10 lg:p-12">
                                    {/* Primary Action Section */}
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-8 lg:space-y-0 lg:space-x-12">
                                        {/* Gift Card Info */}
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-start space-x-6">
                                                <div 
                                                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative overflow-hidden"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${shopSettings?.primary_color || '#3b82f6'} 0%, ${shopSettings?.secondary_color || '#1e40af'} 100%)`,
                                                        boxShadow: `0 20px 40px ${shopSettings?.primary_color || '#3b82f6'}40, 0 8px 16px ${shopSettings?.secondary_color || '#1e40af'}33`
                                                    }}
                                                >
                                                    <CreditCard className="w-10 h-10 text-white z-10" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                                    <div 
                                                        className="absolute -inset-1 rounded-3xl opacity-30 blur-sm"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${shopSettings?.primary_color || '#3b82f6'} 0%, ${shopSettings?.secondary_color || '#1e40af'} 100%)`
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                                        Premium Gift Experience
                                                    </h3>
                                                    <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                                        The perfect gift for food lovers and special occasions
                                                    </p>
                                                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                                                        <span className="text-sm font-semibold text-gray-700">
                                                            Amount range: £{giftCardSettings.min_custom_amount} - £{giftCardSettings.max_custom_amount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Purchase Button */}
                                        <div className="flex-shrink-0">
                                            <Button 
                                                onClick={() => setGiftCardDialogOpen(true)}
                                                className="relative group px-8 py-6 font-bold text-lg tracking-wide transition-all duration-500 border-0 rounded-2xl shadow-2xl"
                                                style={{
                                                    background: `linear-gradient(135deg, ${shopSettings?.primary_color || '#3b82f6'} 0%, ${shopSettings?.secondary_color || '#1e40af'} 100%)`,
                                                    color: 'white',
                                                    boxShadow: `0 20px 40px ${shopSettings?.primary_color || '#3b82f6'}4d, 0 8px 16px ${shopSettings?.secondary_color || '#1e40af'}33`
                                                }}
                                                onMouseEnter={(e) => {
                                                    const primaryColor = shopSettings?.primary_color || '#3b82f6';
                                                    const secondaryColor = shopSettings?.secondary_color || '#1e40af';
                                                    Object.assign(e.currentTarget.style, {
                                                        transform: 'translateY(-4px) scale(1.05)',
                                                        boxShadow: `0 32px 64px ${primaryColor}66, 0 16px 32px ${secondaryColor}4d`
                                                    });
                                                }}
                                                onMouseLeave={(e) => {
                                                    const primaryColor = shopSettings?.primary_color || '#3b82f6';
                                                    const secondaryColor = shopSettings?.secondary_color || '#1e40af';
                                                    Object.assign(e.currentTarget.style, {
                                                        transform: 'translateY(0px) scale(1)',
                                                        boxShadow: `0 20px 40px ${primaryColor}4d, 0 8px 16px ${secondaryColor}33`
                                                    });
                                                }}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Gift className="w-5 h-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
                                                    <span>Purchase Gift Card</span>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl"></div>
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Elegant Divider */}
                                    <div className="my-10">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gradient-to-r from-transparent via-gray-200 to-transparent opacity-60"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <div className="bg-white px-6 py-2 rounded-full border border-gray-200/50">
                                                    <span className="text-sm font-medium text-gray-500 tracking-wide">OR</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Balance Checker Section */}
                                    <div className="bg-gradient-to-br from-gray-50/80 to-blue-50/40 rounded-2xl p-6 sm:p-8 border border-gray-200/50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-6 sm:space-y-0 sm:space-x-8">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                                        <CreditCard className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-gray-900">Check Gift Card Balance</h4>
                                                </div>
                                                <p className="text-gray-600 leading-relaxed">
                                                    Enter your gift card code to check remaining balance and transaction history
                                                </p>
                                            </div>
                                            <Button 
                                                variant="outline"
                                                onClick={() => setBalanceDialogOpen(true)}
                                                className="group px-6 py-4 font-semibold text-base transition-all duration-300 rounded-xl border-2 shadow-lg"
                                                style={{
                                                    borderColor: 'rgb(63, 75, 248)',
                                                    color: 'rgb(63, 75, 248)',
                                                    background: 'rgba(255,255,255,0.9)',
                                                    backdropFilter: 'blur(12px)',
                                                    boxShadow: '0 8px 25px rgba(63, 75, 248, 0.15)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    Object.assign(e.currentTarget.style, {
                                                        background: 'rgb(63, 75, 248)',
                                                        color: 'white',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 16px 40px rgba(63, 75, 248, 0.25)'
                                                    });
                                                }}
                                                onMouseLeave={(e) => {
                                                    Object.assign(e.currentTarget.style, {
                                                        borderColor: 'rgb(63, 75, 248)',
                                                        color: 'rgb(63, 75, 248)',
                                                        background: 'rgba(255,255,255,0.9)',
                                                        transform: 'translateY(0px)',
                                                        boxShadow: '0 8px 25px rgba(63, 75, 248, 0.15)'
                                                    });
                                                }}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <CreditCard className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                                                    <span>Check Balance</span>
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            
                            {/* Floating Background Elements */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Products Section - Premium Professional Design */}
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
                {/* Section Header with Elegant Typography */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent tracking-tight">
                        {selectedCategory === 'all' ? 'Our Premium Products' : 
                         categories.find(c => c.id === selectedCategory)?.name || 'Products'}
                    </h2>
                    <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
                        Discover our carefully curated selection of exceptional items
                    </p>
                    <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                        <span className="text-sm font-semibold text-gray-700">
                            {getFilteredItems().length} items available
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {getFilteredItems().map((item) => (
                            <Card 
                                key={item.id} 
                                className="overflow-hidden backdrop-blur-xl border-0 shadow-2xl"
                                style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 25px 50px rgba(0,0,0,0.1), 0 12px 25px rgba(63, 75, 248, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                                    borderRadius: '20px'
                                }}
                            >
                                <div className="w-full h-48 sm:h-56 relative overflow-hidden rounded-t-[20px]">
                                    <ImageGallery 
                                        images={item.gallery_images}
                                        className="rounded-t-[20px]"
                                    />
                                </div>

                                <div className="absolute top-4 right-4">
                                    <Badge 
                                        className="bg-white/90 backdrop-blur-sm text-gray-700 shadow-xl border-0 font-semibold"
                                        style={{
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        {item.type === 'gift_card' ? (
                                            <><Gift className="w-3 h-3 mr-1" />Gift Card</>
                                        ) : item.type === 'digital' ? (
                                            <>📱 Digital</>
                                        ) : (
                                            <>📦 Physical</>
                                        )}
                                    </Badge>
                                </div>

                                <CardContent className="p-6 sm:p-8">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 mb-2 tracking-tight leading-tight">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                                {item.short_description}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="space-y-1">
                                                <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                                    £{Number(item.price).toFixed(2)}
                                                </span>
                                                {item.track_inventory && (
                                                    <p className="text-xs text-gray-500">
                                                        {item.stock_quantity > 0 ? 
                                                            `${item.stock_quantity} in stock` : 
                                                            'Out of stock'
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <Button 
                                                size="sm"
                                                onClick={() => addToCart(item)}
                                                disabled={item.track_inventory && item.stock_quantity <= 0}
                                                className="group relative px-6 py-3 font-bold text-sm tracking-wide transition-all duration-500 border-0 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105"
                                                style={{
                                                    background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`,
                                                    color: 'white',
                                                    boxShadow: '0 8px 25px rgba(63, 75, 248, 0.3), 0 4px 12px rgba(139, 92, 246, 0.2)'
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                                Add to Cart
                                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                </div>
            </div>

            {/* Item Detail Dialog - Premium Design */}
            <Dialog open={itemDetailOpen} onOpenChange={setItemDetailOpen}>
                <DialogContent 
                    className="max-w-4xl border-0 shadow-3xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 16px 32px rgba(63, 75, 248, 0.1)',
                        borderRadius: '24px'
                    }}
                >
                    {selectedItem && (
                        <>
                            <DialogHeader className="text-center pb-6">
                                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent tracking-tight">
                                    {selectedItem.name}
                                </DialogTitle>
                                <DialogDescription className="text-lg text-gray-600 font-medium">
                                    Premium Product Details
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Product Image */}
                                <div className="relative">
                                    <div className="w-full h-80 rounded-2xl overflow-hidden shadow-2xl"
                                         style={{
                                             boxShadow: '0 25px 50px rgba(63, 75, 248, 0.25), 0 12px 25px rgba(139, 92, 246, 0.2)'
                                         }}
                                    >
                                        <ImageGallery 
                                            images={selectedItem.gallery_images && selectedItem.gallery_images.length > 0 ? selectedItem.gallery_images : []}
                                            className="rounded-2xl"
                                        />
                                    </div>
                                    
                                    {/* Floating Background Elements */}
                                    <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                                    <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
                                </div>
                                
                                {/* Product Details */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Badges */}
                                        <div className="flex items-center space-x-3">
                                            {selectedItem.is_featured && (
                                                <Badge 
                                                    className="text-white border-none shadow-lg font-bold px-4 py-2"
                                                    style={{
                                                        background: `linear-gradient(135deg, rgb(255, 165, 0) 0%, rgb(255, 140, 0) 100%)`,
                                                        boxShadow: '0 8px 25px rgba(255, 165, 0, 0.4)'
                                                    }}
                                                >
                                                    ⭐ Featured
                                                </Badge>
                                            )}
                                            <Badge 
                                                className="bg-white/90 backdrop-blur-sm text-gray-700 shadow-xl border-0 font-semibold px-4 py-2"
                                                style={{
                                                    boxShadow: '0 8px 25px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {selectedItem.type === 'gift_card' ? (
                                                    <><Gift className="w-3 h-3 mr-1" />Gift Card</>
                                                ) : selectedItem.type === 'digital' ? (
                                                    <>📱 Digital</>
                                                ) : (
                                                    <>📦 Physical</>
                                                )}
                                            </Badge>
                                        </div>
                                        
                                        {/* Price */}
                                        <div className="space-y-2">
                                            <p className="text-4xl font-bold text-gray-900 tracking-tight">
                                                £{Number(selectedItem.price).toFixed(2)}
                                            </p>
                                            {selectedItem.track_inventory && (
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50">
                                                    <span className="text-sm font-semibold text-green-700">
                                                        {selectedItem.stock_quantity > 0 ? 
                                                            `${selectedItem.stock_quantity} in stock` : 
                                                            'Out of stock'
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Description */}
                                        <div className="space-y-3">
                                            <h4 className="text-lg font-semibold text-gray-900">Description</h4>
                                            <p className="text-gray-600 leading-relaxed text-base">
                                                {selectedItem.description || selectedItem.short_description}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Add to Cart Button */}
                                    <div className="pt-4">
                                        <Button 
                                            className="w-full group relative px-8 py-6 font-bold text-lg tracking-wide transition-all duration-500 border-0 rounded-2xl shadow-2xl transform hover:scale-105"
                                            onClick={() => {
                                                addToCart(selectedItem);
                                                setItemDetailOpen(false);
                                            }}
                                            disabled={selectedItem.track_inventory && selectedItem.stock_quantity <= 0}
                                            style={{
                                                background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`,
                                                color: 'white',
                                                boxShadow: '0 20px 40px rgba(63, 75, 248, 0.3), 0 8px 16px rgba(139, 92, 246, 0.2)'
                                            }}
                                        >
                                            <Plus className="h-5 w-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                                            Add to Cart
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Gift Card Purchase Dialog */}
            <Dialog open={giftCardDialogOpen} onOpenChange={setGiftCardDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Gift className="w-5 h-5 text-purple-500" />
                            <span>Purchase Gift Card</span>
                        </DialogTitle>
                        <DialogDescription>
                            Choose an amount for your digital gift card
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* Preset Amounts */}
                        {giftCardSettings?.fixed_amounts && giftCardSettings.fixed_amounts.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-3">Popular Amounts</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {giftCardSettings.fixed_amounts.map((amount: number) => (
                                        <Button
                                            key={amount}
                                            variant={selectedGiftCardAmount === amount ? "default" : "outline"}
                                            onClick={() => {
                                                setSelectedGiftCardAmount(amount);
                                                setGiftCardAmount(amount.toString());
                                            }}
                                            className="h-12 text-lg font-semibold"
                                        >
                                            £{amount}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Custom Amount */}
                        {giftCardSettings?.allow_custom_amount && (
                            <div>
                                <h4 className="font-medium mb-3">Custom Amount</h4>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                                        <Input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={giftCardAmount}
                                            onChange={(e) => {
                                                setGiftCardAmount(e.target.value);
                                                setSelectedGiftCardAmount(null);
                                            }}
                                            className="pl-8 text-lg h-12"
                                            min={giftCardSettings?.min_custom_amount || 5}
                                            max={giftCardSettings?.max_custom_amount || 500}
                                            step="0.01"
                                        />
                                    </div>
                                    {giftCardSettings && (
                                        <p className="text-xs text-gray-500">
                                            Minimum: £{giftCardSettings.min_custom_amount} • Maximum: £{giftCardSettings.max_custom_amount}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Terms */}
                        {giftCardSettings?.terms_and_conditions && (
                            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                                <p className="font-medium mb-1">Terms & Conditions:</p>
                                <p>{giftCardSettings.terms_and_conditions}</p>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setGiftCardDialogOpen(false);
                                    setGiftCardAmount('');
                                    setSelectedGiftCardAmount(null);
                                }}
                                className="flex-1 transition-all duration-300 shadow-lg group"
                                style={getButtonOutlineStyle()}
                                onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style, getButtonOutlineHoverStyle());
                                }}
                                onMouseLeave={(e) => {
                                    Object.assign(e.currentTarget.style, getButtonOutlineStyle());
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => {
                                    const amount = selectedGiftCardAmount || parseFloat(giftCardAmount);
                                    if (amount && amount >= (giftCardSettings?.min_custom_amount || 5) && 
                                        amount <= (giftCardSettings?.max_custom_amount || 500)) {
                                        addGiftCardToCart(amount);
                                    } else {
                                        toast({
                                            title: "Invalid Amount",
                                            description: `Please enter an amount between £${giftCardSettings?.min_custom_amount || 5} and £${giftCardSettings?.max_custom_amount || 500}`,
                                            variant: "destructive"
                                        });
                                    }
                                }}
                                disabled={!giftCardAmount && !selectedGiftCardAmount}
                                className="flex-1 transition-all duration-300 shadow-lg group"
                                style={getButtonStyle()}
                                onMouseEnter={(e) => {
                                    if (!e.currentTarget.disabled) {
                                        Object.assign(e.currentTarget.style, getButtonHoverStyle());
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!e.currentTarget.disabled) {
                                        Object.assign(e.currentTarget.style, getButtonStyle());
                                    }
                                }}
                            >
                                <ShoppingCart className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gift Card Balance Check Dialog - Premium Design */}
            <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
                <DialogContent 
                    className="max-w-lg border-0 shadow-3xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.15), 0 16px 32px rgba(63, 75, 248, 0.1)',
                        borderRadius: '24px'
                    }}
                >
                    <DialogHeader className="text-center pb-6">
                        <DialogTitle className="flex items-center justify-center space-x-3 text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent tracking-tight">
                            <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`,
                                    boxShadow: '0 8px 25px rgba(63, 75, 248, 0.3)'
                                }}
                            >
                                <CreditCard className="w-5 h-5 text-white" />
                            </div>
                            <span>Check Gift Card Balance</span>
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-600 font-medium">
                            Enter your gift card code to check the remaining balance
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Gift Card Code
                            </label>
                            <Input
                                placeholder="Enter gift card code"
                                value={balanceCheckCode}
                                onChange={(e) => setBalanceCheckCode(e.target.value.toUpperCase())}
                                className="text-center text-lg font-mono tracking-wider border-2 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-14 shadow-lg"
                                style={{
                                    borderColor: 'rgb(63, 75, 248)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                        </div>
                        
                        {balanceResult && (
                            <div 
                                className="p-6 rounded-2xl shadow-xl relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, rgba(63, 75, 248, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`,
                                    border: '2px solid rgba(63, 75, 248, 0.2)',
                                    boxShadow: '0 20px 40px rgba(63, 75, 248, 0.1)'
                                }}
                            >
                                <div className="text-center relative z-10">
                                    <p className="text-sm text-gray-600 mb-2 font-medium">Current Balance</p>
                                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-green-600 bg-clip-text text-transparent mb-3">
                                        £{balanceResult.balance.toFixed(2)}
                                    </p>
                                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg">
                                        <p className="text-sm text-gray-600 font-mono">
                                            Code: <span className="font-bold">{balanceResult.code}</span>
                                        </p>
                                    </div>
                                    {balanceResult.balance <= 0 && (
                                        <p className="text-sm text-red-600 mt-3 font-semibold bg-red-50 px-4 py-2 rounded-xl">
                                            This gift card has been fully used and will be removed from the system.
                                        </p>
                                    )}
                                </div>
                                <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
                            </div>
                        )}
                        
                        <div className="flex space-x-4 pt-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setBalanceDialogOpen(false);
                                    setBalanceCheckCode('');
                                    setBalanceResult(null);
                                }}
                                className="flex-1 group px-6 py-4 font-semibold text-base transition-all duration-500 rounded-xl border-2 shadow-lg"
                                style={{
                                    borderColor: 'rgb(63, 75, 248)',
                                    color: 'rgb(63, 75, 248)',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 8px 25px rgba(63, 75, 248, 0.15)'
                                }}
                            >
                                Close
                            </Button>
                            <Button 
                                onClick={checkGiftCardBalance}
                                disabled={!balanceCheckCode.trim() || balanceLoading}
                                className="flex-1 group px-6 py-4 font-bold text-base tracking-wide transition-all duration-500 border-0 rounded-xl shadow-xl transform hover:scale-105"
                                style={{
                                    background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`,
                                    color: 'white',
                                    boxShadow: '0 12px 30px rgba(63, 75, 248, 0.3), 0 6px 15px rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                {balanceLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                        Checking...
                                    </div>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Check Balance
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Shopping Cart Dialog */}
            <Dialog open={cartOpen} onOpenChange={setCartOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Shopping Cart</DialogTitle>
                        <DialogDescription>
                            {cart.length === 0 ? 'Your cart is empty' : `${cart.length} items in your cart`}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {cart.length === 0 ? (
                        <div className="text-center py-8">
                            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-500 mb-4">Your cart is empty</p>
                            <Button 
                                className="mt-4 hover:scale-105 hover:shadow-lg transition-all duration-300 font-semibold"
                                onClick={() => setCartOpen(false)}
                                style={getButtonStyle()}
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center space-x-4 border-b pb-4">
                                    {item.type === 'gift_card' ? (
                                        <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={getButtonStyle()}>
                                            <Gift className="w-8 h-8" />
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-16 h-16 rounded-lg flex items-center justify-center"
                                            style={{
                                                background: `linear-gradient(135deg, rgb(63, 75, 248) 0%, rgb(139, 92, 246) 100%)`
                                            }}
                                        >
                                            <Package className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.name}</h4>
                                        <p className="text-sm text-gray-600">£{Number(item.price).toFixed(2)} each</p>
                                        {item.type === 'gift_card' && (
                                            <Badge variant="secondary" className="mt-1">
                                                Digital Gift Card
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {item.type !== 'gift_card' ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                    className="transition-all duration-300 shadow-md group"
                                                    style={getButtonOutlineStyle()}
                                                    onMouseEnter={(e) => {
                                                        Object.assign(e.currentTarget.style, getButtonOutlineHoverStyle());
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        Object.assign(e.currentTarget.style, getButtonOutlineStyle());
                                                    }}
                                                >
                                                    <Minus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                                </Button>
                                                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                    className="transition-all duration-300 shadow-md group"
                                                    style={getButtonOutlineStyle()}
                                                    onMouseEnter={(e) => {
                                                        Object.assign(e.currentTarget.style, getButtonOutlineHoverStyle());
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        Object.assign(e.currentTarget.style, getButtonOutlineStyle());
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="w-20 text-center text-sm text-gray-500 font-medium">Qty: 1</span>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">£{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300 shadow-sm group"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(239, 68, 68, 0.25)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-lg font-medium">Total:</span>
                                    <span className="text-2xl font-bold">£{getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 transition-all duration-300 shadow-lg group"
                                        onClick={() => setCartOpen(false)}
                                        style={getButtonOutlineStyle()}
                                        onMouseEnter={(e) => {
                                            Object.assign(e.currentTarget.style, getButtonOutlineHoverStyle());
                                        }}
                                        onMouseLeave={(e) => {
                                            Object.assign(e.currentTarget.style, getButtonOutlineStyle());
                                        }}
                                    >
                                        Continue Shopping
                                    </Button>
                                    <Button 
                                        className="flex-1 transition-all duration-300 shadow-lg font-semibold group" 
                                        style={getButtonStyle()}
                                        onClick={proceedToCheckout}
                                        onMouseEnter={(e) => {
                                            Object.assign(e.currentTarget.style, getButtonHoverStyle());
                                        }}
                                        onMouseLeave={(e) => {
                                            Object.assign(e.currentTarget.style, getButtonStyle());
                                        }}
                                    >
                                        Checkout
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Checkout Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Checkout</DialogTitle>
                        <DialogDescription>
                            Complete your order - Total: £{getTotalPrice().toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Summary */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Order Summary</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                            {item.type === 'gift_card' && (
                                                <Badge variant="secondary" className="mt-1">
                                                    Digital Gift Card
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">£{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span>Subtotal:</span>
                                    <span>£{getSubtotal().toFixed(2)}</span>
                                </div>
                                {orderType === 'delivery' && (
                                    <div className="flex justify-between items-center text-sm text-gray-600">
                                        <span>Delivery ({deliveryType}):</span>
                                        <span>£{getDeliveryFee().toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <span>£{getTotalPrice().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information & Payment */}
                        <div className="space-y-6">
                            {/* Order Type Selection */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">Order Type</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <Button
                                        variant={orderType === 'email' ? 'default' : 'outline'}
                                        onClick={() => setOrderType('email')}
                                        className="flex items-center justify-center p-4 h-auto"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Email (Free)
                                    </Button>
                                    <Button
                                        variant={orderType === 'collection' ? 'default' : 'outline'}
                                        onClick={() => setOrderType('collection')}
                                        className="flex items-center justify-center p-4 h-auto"
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Collection (Free)
                                    </Button>
                                    <Button
                                        variant={orderType === 'delivery' ? 'default' : 'outline'}
                                        onClick={() => setOrderType('delivery')}
                                        className="flex items-center justify-center p-4 h-auto"
                                    >
                                        <Truck className="w-4 h-4 mr-2" />
                                        Delivery
                                    </Button>
                                </div>
                                
                                {/* Delivery Type Selection */}
                                {orderType === 'delivery' && (
                                    <div className="mt-4 space-y-3">
                                        <h4 className="font-medium text-gray-700">Delivery Options</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant={deliveryType === 'normal' ? 'default' : 'outline'}
                                                onClick={() => setDeliveryType('normal')}
                                                className="flex flex-col items-center justify-center p-4 h-auto"
                                            >
                                                <Truck className="w-4 h-4 mb-1" />
                                                <span className="text-sm font-medium">Normal</span>
                                                <span className="text-xs text-gray-600">£{deliveryFees.normal.toFixed(2)}</span>
                                            </Button>
                                            <Button
                                                variant={deliveryType === 'express' ? 'default' : 'outline'}
                                                onClick={() => setDeliveryType('express')}
                                                className="flex flex-col items-center justify-center p-4 h-auto"
                                            >
                                                <Clock className="w-4 h-4 mb-1" />
                                                <span className="text-sm font-medium">Express</span>
                                                <span className="text-xs text-gray-600">£{deliveryFees.express.toFixed(2)}</span>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Customer Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Customer Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input
                                        placeholder="Full Name *"
                                        value={customerInfo.name}
                                        onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Email Address *"
                                        type="email"
                                        value={customerInfo.email}
                                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                                    />
                                    <Input
                                        placeholder={orderType === 'email' ? "Phone Number (Optional)" : "Phone Number *"}
                                        type="tel"
                                        value={customerInfo.phone}
                                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                                    />
                                </div>

                                {/* Delivery Address Fields */}
                                {orderType === 'delivery' && (
                                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-900">Delivery Address</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Input
                                                placeholder="Street Address *"
                                                value={customerInfo.address}
                                                onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    placeholder="City *"
                                                    value={customerInfo.city}
                                                    onChange={(e) => handleCustomerInfoChange('city', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Postcode *"
                                                    value={customerInfo.postcode}
                                                    onChange={(e) => handleCustomerInfoChange('postcode', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Section */}
                            {stripePromise && clientSecret && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Payment</h3>
                                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                                        <CheckoutForm 
                                            onSuccess={() => {
                                                setPaymentSuccess(true);
                                                setCart([]);
                                                setCheckoutOpen(false);
                                                toast({
                                                    title: "Order Successful!",
                                                    description: "Your order has been placed successfully. You will receive a confirmation email shortly.",
                                                });
                                            }}
                                            onError={(error: string) => {
                                                toast({
                                                    title: "Payment Failed",
                                                    description: error,
                                                    variant: "destructive"
                                                });
                                            }}
                                            customerInfo={customerInfo}
                                            orderType={orderType}
                                            deliveryType={deliveryType}
                                            total={getTotalPrice()}
                                            subtotal={getSubtotal()}
                                            deliveryFee={getDeliveryFee()}
                                            cart={cart}
                                            tenant={tenant}
                                        />
                                    </Elements>
                                </div>
                            )}

                            {/* Initialize Payment Button */}
                            {!clientSecret && (
                                <Button
                                    onClick={async () => {
                                        if (!validateCustomerInfo()) return;
                                        
                                        setPaymentLoading(true);
                                        try {
                                            await createPaymentIntent();
                                        } catch (error) {
                                            toast({
                                                title: "Payment Error",
                                                description: "Failed to initialize payment. Please try again.",
                                                variant: "destructive"
                                            });
                                        } finally {
                                            setPaymentLoading(false);
                                        }
                                    }}
                                    disabled={paymentLoading}
                                    className="w-full"
                                    style={getButtonStyle()}
                                >
                                    {paymentLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Preparing Payment...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Continue to Payment
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Stripe Checkout Form Component
function CheckoutForm({ 
    onSuccess, 
    onError, 
    customerInfo, 
    orderType,
    deliveryType,
    total,
    subtotal,
    deliveryFee,
    cart,
    tenant
}: { 
    onSuccess: () => void;
    onError: (error: string) => void;
    customerInfo: any;
    orderType: string;
    deliveryType?: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    cart: CartItem[];
    tenant: string;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                    receipt_email: customerInfo.email,
                },
                redirect: 'if_required'
            });

            if (error) {
                onError(error.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Confirm payment with backend
                try {
                    const confirmResponse = await fetch(`/api/tenant/${tenant}/payments/stripe`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            action: 'confirm_payment',
                            paymentIntentId: paymentIntent.id
                        })
                    });

                    if (confirmResponse.ok) {
                        const confirmData = await confirmResponse.json();
                        console.log('Payment confirmed:', confirmData);
                        onSuccess();
                    } else {
                        const errorData = await confirmResponse.json();
                        console.error('Payment confirmation failed:', errorData);
                        throw new Error(errorData.error || 'Failed to confirm payment');
                    }
                } catch (confirmError) {
                    console.error('Error confirming payment:', confirmError);
                    // Payment succeeded but confirmation failed
                    onError('Payment successful but confirmation failed. Please contact support with payment ID: ' + paymentIntent.id);
                }
            }
        } catch (error) {
            onError('An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg">
                <PaymentElement />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Order Type:</span>
                    <span className="capitalize">
                        {orderType}
                        {orderType === 'delivery' && deliveryType && ` (${deliveryType})`}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-medium">Customer:</span>
                    <span>{customerInfo.name}</span>
                </div>
                <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between items-center">
                        <span>Subtotal:</span>
                        <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Delivery Fee:</span>
                            <span>£{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>£{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Pay £{total.toFixed(2)}
                    </>
                )}
            </Button>
        </form>
    );
}
