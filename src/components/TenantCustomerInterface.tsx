'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTenantData } from '@/context/TenantDataContext';
import { useTenant } from '@/context/TenantContext';
import type { OrderItem, MenuItem as MenuItemType, Category, OpeningHoursPerDay, Order, Voucher } from '@/lib/types';
import { SelectedAddon, AddonGroup } from '@/lib/addon-types';
import { calculateSelectedAddonPrice } from '@/lib/addon-utils';
import AddonSelection from '@/components/SimpleAddonSelection';
import * as AddonService from '@/lib/addon-service';
import {
  MinusCircle,
  PlusCircle,
  Trash2,
  Utensils,
  X,
  Plus,
  Calendar as CalendarIcon,
  ShoppingBasket,
  Search,
  User,
  LogIn,
  CheckCircle,
  LogOut,
  Home,
  Menu as MenuIcon,
  Heart,
  ChevronUp,
  ChevronDown,
  Clock,
  Truck,
  Store,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getIconComponent } from '@/lib/custom-icons-service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as TenantVoucherService from '@/lib/tenant-voucher-service';
import * as TenantZoneService from '@/lib/tenant-zone-service';
import { getRestaurantStatus } from '@/lib/opening-hours-utils';

// Optimized MenuNav component with performance improvements
const MenuNav = React.memo(function MenuNav({ menuData }: { menuData: { category: Category }[] }) {
    const [activeCategory, setActiveCategory] = React.useState<string | null>(
        menuData.length > 0 ? menuData[0].category.id : null
    );
    
    // Memoized scroll handler for better performance
    const handleScroll = React.useCallback(() => {
        let currentCategory = '';
        for (const { category } of menuData) {
            const element = document.getElementById(`cat-${category.id}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                // Offset to account for sticky nav bar
                if (rect.top <= 80) { 
                    currentCategory = category.id;
                }
            }
        }
        if (currentCategory) {
            setActiveCategory(currentCategory);
        }
    }, [menuData]);

    // Optimized scroll event listener with throttling
    React.useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        const throttledScroll = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 16); // ~60fps for smooth performance
        };

        window.addEventListener('scroll', throttledScroll, { passive: true });
        // Initial check in case a category is already in view
        handleScroll(); 

        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [handleScroll]);
    
    return (
        <nav className="sticky top-0 z-50 w-full bg-white/98 backdrop-blur-xl shadow-sm border-b border-gray-100/50">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-start overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {menuData.map(({ category }) => (
                            <a 
                                key={category.id}
                                href={`#cat-${category.id}`}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                                    activeCategory === category.id 
                                        ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg scale-105' 
                                        : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 hover:text-gray-900 hover:scale-105'
                                }`}
                            >
                                {category.name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
});

function MenuItemDialog({
  item,
  isOpen,
  onClose,
  onAddToCart,
  currencySymbol
}: {
  item: MenuItemType;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItemType, quantity: number, instructions: string, selectedAddons?: SelectedAddon[]) => void;
  currencySymbol: string;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [instructions, setInstructions] = React.useState('');
  const [selectedAddons, setSelectedAddons] = React.useState<SelectedAddon[]>([]);
  const [addonPrice, setAddonPrice] = React.useState(0);
  const [itemAddonGroups, setItemAddonGroups] = React.useState<AddonGroup[]>([]);
  const [loadingAddons, setLoadingAddons] = React.useState(false);
  const { tenantData } = useTenant();

  const loadItemAddons = React.useCallback(async () => {
    if (!tenantData?.id || !item.id) return;
    
    try {
      setLoadingAddons(true);
      const addonGroups = await AddonService.getMenuItemAddonGroups(tenantData.id, item.id);
      setItemAddonGroups(addonGroups);
    } catch (error) {
      console.error('Error loading item addons:', error);
      setItemAddonGroups([]);
    } finally {
      setLoadingAddons(false);
    }
  }, [tenantData?.id, item.id]);

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setInstructions('');
      setSelectedAddons([]);
      setAddonPrice(0);
      loadItemAddons();
    }
  }, [isOpen, loadItemAddons]);

  const handleAddonSelectionChange = React.useCallback((addons: SelectedAddon[], totalAddonPrice: number) => {
    setSelectedAddons(addons);
    setAddonPrice(totalAddonPrice);
  }, []);
  
  const totalPrice = (item.price + addonPrice) * quantity;

  const handleConfirm = () => {
    onAddToCart(item, quantity, instructions, selectedAddons);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          {item.image && !item.image.includes('placehold.co') && (
            <div className="relative h-48 -mx-6 -mt-6 mb-4">
              <img src={item.image!} alt={item.name} className="w-full h-full rounded-t-lg object-cover" />
            </div>
          )}
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {item.characteristics && item.characteristics.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></span>
                        Dietary Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {item.characteristics.map(charId => {
                            const IconComponent = getIconComponent(charId, Utensils);
                            
                            return (
                                <div key={charId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                    <IconComponent />
                                    <span className="text-sm font-medium text-gray-700">{charId}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {item.nutrition &&
              // Only show if at least one nutrition value is present and not zero/empty
              (item.nutrition.calories || item.nutrition.protein || item.nutrition.carbs || item.nutrition.fat) ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-muted-foreground">Nutrition Facts (per 100g)</h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm p-3 border rounded-md">
                    <div className="flex justify-between"><span>Calories</span><span className="font-medium">{item.nutrition.calories} kcal</span></div>
                    <div className="flex justify-between"><span>Protein</span><span className="font-medium">{item.nutrition.protein}g</span></div>
                    <div className="flex justify-between"><span>Carbohydrates</span><span className="font-medium">{item.nutrition.carbs}g</span></div>
                    <div className="flex justify-between"><span>Fat</span><span className="font-medium">{item.nutrition.fat}g</span></div>
                  </div>
                </div>
              ) : null
            }

            {/* Addon Selection */}
            {loadingAddons ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading options...</p>
              </div>
            ) : itemAddonGroups.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
                  Customize Your Order
                </h4>
                <AddonSelection
                  menuItem={item}
                  addonGroups={itemAddonGroups}
                  onSelectionChange={handleAddonSelectionChange}
                  currencySymbol={currencySymbol}
                />
              </div>
            ) : null}

          <div className="space-y-2">
            <Label htmlFor="special-instructions" className="font-semibold text-muted-foreground">Special Instructions</Label>
            <Textarea 
              id="special-instructions" 
              placeholder="e.g. no onions, extra spicy" 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="p-3"
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-4 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
                <Label className="font-semibold text-muted-foreground">Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))}><MinusCircle className="h-5 w-5"/></Button>
                  <span className="font-bold text-lg w-10 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => q+1)}><PlusCircle className="h-5 w-5"/></Button>
                </div>
            </div>
            
            {/* Price Breakdown */}
            {addonPrice > 0 && (
              <div className="w-full space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Base price:</span>
                  <span>{currencySymbol}{item.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-ons:</span>
                  <span>{currencySymbol}{addonPrice.toFixed(2)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-medium text-foreground">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{(item.price + addonPrice).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button onClick={handleConfirm} className="w-full font-headline text-lg h-12 bg-green-600 hover:bg-green-700">
              Add to Order - {currencySymbol}{totalPrice.toFixed(2)}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Optimized MenuItem component with React.memo for performance
const MenuItem = React.memo(function MenuItem({
  item,
  onAddToCart,
  currencySymbol
}: {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType, quantity: number, instructions: string, selectedAddons?: SelectedAddon[]) => void;
  currencySymbol: string;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Memoized calculations for better performance
  const hasImage = React.useMemo(() => 
    item.image && item.image.length > 0 && !item.image.includes('placehold.co'), 
    [item.image]
  );

  const isBasePriceZero = React.useMemo(() => item.price === 0, [item.price]);
  
  const displayPrice = React.useMemo(() => item.price, [item.price]);
  const pricePrefix = '';

  // Memoized handlers to prevent unnecessary re-renders
  const handleQuickAdd = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the dialog
    onAddToCart(item, 1, '', []);
  }, [item, onAddToCart]);

  const handleOpenDialog = React.useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  return (
    <>
      <div 
        className="flex items-start justify-between p-4 rounded-xl border transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group bg-background"
        onClick={handleOpenDialog}
      >
        {/* Content Area - Left Side */}
        <div className="flex-1 pr-4">
          <h4 className="font-bold text-base sm:text-lg leading-tight text-gray-900 mb-2">{item.name}</h4>
          {item.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
          
          {/* Set Menu Items Display */}
          {item.isSetMenu && item.setMenuItems && item.setMenuItems.length > 0 && (
            <div className="mb-3 p-2 bg-primary/8 rounded-lg border border-primary/15">
              <p className="text-xs font-bold text-primary mb-1">Set includes:</p>
              <div className="text-xs text-gray-700">
                {item.setMenuItems.map((setItem, index) => (
                  <span key={setItem.id}>
                    {setItem.quantity > 1 ? `${setItem.quantity}x ` : ''}{setItem.name}
                    {index < item.setMenuItems!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Price and Characteristics Row */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              {pricePrefix}{currencySymbol}{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
            </p>
            
            {/* Characteristics Icons */}
            {item.characteristics && item.characteristics.length > 0 && (
              <div className="flex gap-1">
                <TooltipProvider>
                  {item.characteristics.slice(0, 3).map(charId => {
                    const IconComponent = getIconComponent(charId, Utensils);
                    return (
                      <Tooltip key={charId}>
                        <TooltipTrigger>
                          <div className="transition-transform hover:scale-110">
                            <IconComponent className="h-3 w-3 text-gray-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{charId}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {item.characteristics.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{item.characteristics.length - 3}</div>
                  )}
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>

        {/* Image and Smart Add Button - Right Side */}
        <div className="relative flex-shrink-0">
          {hasImage ? (
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow border border-gray-200">
              <img
                src={item.image!}
                alt={item.name}
                className="w-full h-full object-cover border border-gray-200"
              />
              {/* Smart Plus Button */}
              <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
                <Button
                  size="icon"
                  onClick={handleQuickAdd}
                  className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border-2 border-white"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <Plus className="h-6 w-6 text-white" />
                </Button>
              </div>
            </div>
          ) : (
            /* Only show the plus button when no image */
            <Button
              size="icon"
              onClick={handleQuickAdd}
              className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border-2 border-white"
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="h-6 w-6 text-white" />
            </Button>
          )}
        </div>
      </div>
      
      <MenuItemDialog 
        item={item} 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onAddToCart={onAddToCart}
        currencySymbol={currencySymbol}
      />
    </>
  );
});

const MenuSection = React.memo(function MenuSection({
  menuData,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  currencySymbol
}: {
  menuData: {
      category: Category;
      items: MenuItemType[];
      subCategories: { category: Category; items: MenuItemType[] }[]
  }[];
  onAddToCart: (item: MenuItemType, quantity: number, instructions: string, selectedAddons?: SelectedAddon[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currencySymbol: string;
}) {

  const accordionDefaultValue = searchQuery ? menuData.map(d => d.category.name) : (menuData.length > 0 ? [menuData[0].category.name] : []);
  
  return (
    <div className="space-y-4">
      {/* Menu Categories */}
      <Accordion type="multiple" defaultValue={accordionDefaultValue} className="w-full space-y-3">
        {menuData.map(({ category, items, subCategories }) => (
          <Card key={category.id} className="border border-gray-200 shadow-sm overflow-hidden">
            <AccordionItem
              value={category.name}
              id={`cat-${category.id}`}
              className="border-none"
            >
              <AccordionTrigger className="font-headline text-lg sm:text-xl scroll-mt-40 bg-gradient-to-r from-primary/8 to-primary/4 hover:from-primary/12 hover:to-primary/8 text-foreground px-4 py-3 font-semibold hover:no-underline transition-all duration-200 [&[data-state=open]]:bg-primary/15 rounded-lg">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  {category.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-4 bg-background">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                      currencySymbol={currencySymbol}
                    />
                  ))}
                </div>
                 {subCategories.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {subCategories.map(({ category: subCat, items: subItems }) => (
                       <div key={subCat.id}>
                         <h4 className="font-semibold text-sm sm:text-base text-muted-foreground pl-3 border-l-2 border-primary mb-3">{subCat.name}</h4>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 pl-3">
                           {subItems.map((item) => (
                              <MenuItem
                                key={item.id}
                                item={item}
                                onAddToCart={onAddToCart}
                                currencySymbol={currencySymbol}
                              />
                           ))}
                         </div>
                       </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Card>
        ))}
      </Accordion>
        
        {/* No results message */}
        {menuData.length === 0 && searchQuery && (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                  <div className="text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="font-semibold text-lg">No items found for "{searchQuery}"</p>
                      <p className="text-sm mt-1">Try a different search term or browse our categories.</p>
                  </div>
              </CardContent>
            </Card>
        )}
      </div>
  );
});

const OrderSummary = React.memo(function OrderSummary({
  order,
  updateQuantity,
  removeFromOrder,
  clearOrder,
  currencySymbol,
  router,
  hideCartItems = false
}: {
  order: OrderItem[];
  updateQuantity: (orderItemId: string, quantity: number) => void;
  removeFromOrder: (orderItemId: string) => void;
  clearOrder: () => void;
  currencySymbol: string;
  router: any;
  hideCartItems?: boolean;
}) {
  const { toast } = useToast();
  const { restaurantSettings, currentUser, createOrder } = useTenantData();
  const { tenantData } = useTenant();
  
  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = order.reduce(
    (acc, item) => {
      const itemPrice = item.price;
      const addonPrice = calculateSelectedAddonPrice(item.selectedAddons);
      return acc + (itemPrice + addonPrice) * item.quantity;
    },
    0
  );
  // No tax calculation - application is tax-free
  
  const availableOrderTypes = React.useMemo(() => [
        restaurantSettings?.orderTypeSettings?.deliveryEnabled && 'delivery',
        restaurantSettings?.orderTypeSettings?.collectionEnabled && 'collection',
        restaurantSettings?.orderTypeSettings?.advanceOrderEnabled && 'advance',
    ].filter(Boolean) as ('delivery' | 'collection' | 'advance')[], [restaurantSettings]);

  // Check if any card payment systems are enabled
  const isCardPaymentEnabled = React.useMemo(() => {
    const paymentSettings = restaurantSettings?.paymentSettings;
    return !!(
      paymentSettings?.stripe?.enabled ||
      paymentSettings?.globalPayments?.enabled ||
      paymentSettings?.worldpay?.enabled
    );
  }, [restaurantSettings?.paymentSettings]);

  // Determine available payment methods
  const availablePaymentMethods = React.useMemo(() => {
    const methods: ('cash' | 'card')[] = [];
    
    // Always include cash if enabled
    if (restaurantSettings?.paymentSettings?.cash?.enabled) {
      methods.push('cash');
    }
    
    // Include card only if at least one card payment system is enabled
    if (isCardPaymentEnabled) {
      methods.push('card');
    }
    
    return methods;
  }, [restaurantSettings?.paymentSettings?.cash?.enabled, isCardPaymentEnabled]);

  const defaultOrderType = availableOrderTypes.length > 0 ? availableOrderTypes[0] : 'delivery';
  const defaultPaymentMethod = availablePaymentMethods.length > 0 ? availablePaymentMethods[0] : 'cash';
  
  const [selectedOrderType, setSelectedOrderType] = React.useState<'delivery' | 'collection' | 'advance'>(defaultOrderType);
  const [advanceFulfillmentType, setAdvanceFulfillmentType] = React.useState<'delivery' | 'collection'>('delivery');
  
  const [advanceDate, setAdvanceDate] = React.useState<Date | undefined>();
  const [advanceTime, setAdvanceTime] = React.useState('');
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  
  const [postcode, setPostcode] = React.useState(currentUser?.addresses?.find(a => a.isDefault)?.postcode || '');
  const [deliveryFee, setDeliveryFee] = React.useState(0);
  const [deliveryError, setDeliveryError] = React.useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card'>(defaultPaymentMethod);
  const [voucherInput, setVoucherInput] = React.useState('');
  const [voucherError, setVoucherError] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<Voucher | null>(null);
  const [orderNote, setOrderNote] = React.useState(''); // Overall order note/special instructions
  
  // Loyalty Points Redemption State
  const [customerAuth, setCustomerAuth] = React.useState<{authenticated: boolean, customer: any} | null>(null);
  const [loyaltyData, setLoyaltyData] = React.useState<{pointsBalance: number} | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = React.useState('');
  const [pointsDiscount, setPointsDiscount] = React.useState(0);
  const [pointsError, setPointsError] = React.useState('');
  const [showPointsSection, setShowPointsSection] = React.useState(false);
  
  // Update selected payment method when available methods change
  React.useEffect(() => {
    if (!availablePaymentMethods.includes(selectedPaymentMethod)) {
      setSelectedPaymentMethod(defaultPaymentMethod);
    }
  }, [availablePaymentMethods, selectedPaymentMethod, defaultPaymentMethod]);

  // Calculate delivery fee based on postcode and order value
  React.useEffect(() => {
    const calculateDeliveryFee = async () => {
      if (selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) {
        if (!postcode.trim() || !tenantData?.id) {
          setDeliveryFee(0);
          setDeliveryError('');
          return;
        }
        
        try {
          const result = await TenantZoneService.calculateDeliveryFee(tenantData.id, postcode, subtotal);
          if (result.error) {
            setDeliveryError(result.error);
            setDeliveryFee(0);
          } else {
            setDeliveryError('');
            setDeliveryFee(result.fee);
          }
        } catch (error) {
          console.error('Error calculating delivery fee:', error);
          setDeliveryError('Unable to calculate delivery fee');
          setDeliveryFee(0);
        }
      } else {
        setDeliveryFee(0);
        setDeliveryError('');
      }
    };
    
    calculateDeliveryFee();
  }, [selectedOrderType, advanceFulfillmentType, postcode, subtotal, tenantData?.id]);

  // Check customer authentication for loyalty points
  React.useEffect(() => {
    const checkCustomerAuth = async () => {
      try {
        const response = await fetch('/api/customer/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();
        setCustomerAuth(data);
        
        if (data.authenticated) {
          // Fetch loyalty data
          const loyaltyResponse = await fetch('/api/customer/loyalty', {
            credentials: 'include'
          });
          const loyaltyResult = await loyaltyResponse.json();
          if (loyaltyResult.success) {
            setLoyaltyData(loyaltyResult.loyalty);
            setShowPointsSection(true);
          }
        }
      } catch (error) {
        console.error('Error checking customer auth:', error);
        setCustomerAuth({ authenticated: false, customer: null });
      }
    };
    
    checkCustomerAuth();
  }, []);

  // Generate time slots for advance orders with smart same-day logic
  React.useEffect(() => {
    if (selectedOrderType === 'advance' && advanceDate) {
      const slots: string[] = [];
      const now = new Date();
      const selectedDate = new Date(advanceDate);
      
      // Normalize dates for comparison (remove time component)
      const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateNormalized = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      const isToday = todayNormalized.getTime() === selectedDateNormalized.getTime();
      
      // Get settings with proper defaults
      const minHoursNotice = restaurantSettings?.advanceOrderSettings?.minHoursNotice || 4;
      const timeSlotInterval = restaurantSettings?.advanceOrderSettings?.timeSlotInterval || 15;
      
      let startHour = 0;
      let startMinute = 0;
      
      if (isToday) {
        // For same day, start from current time + minimum notice
        const earliestTime = new Date(now.getTime() + (minHoursNotice * 60 * 60 * 1000));
        startHour = earliestTime.getHours();
        startMinute = Math.ceil(earliestTime.getMinutes() / timeSlotInterval) * timeSlotInterval;
        
        // If minutes overflow to next hour
        if (startMinute >= 60) {
          startHour += 1;
          startMinute = 0;
        }
        
        // If we've passed business hours for today, no slots available
        if (startHour >= 24) {
          setTimeSlots([]);
          return;
        }
      }
      
      // Generate slots for the day (business hours can be customized here)
      const businessStartHour = 9; // 9 AM
      const businessEndHour = 22; // 10 PM
      
      const actualStartHour = isToday ? Math.max(startHour, businessStartHour) : businessStartHour;
      const actualStartMinute = isToday && startHour === actualStartHour ? startMinute : 0;
      
      for (let hour = actualStartHour; hour < businessEndHour; hour++) {
        const minuteStart = (hour === actualStartHour) ? actualStartMinute : 0;
        
        for (let minute = minuteStart; minute < 60; minute += timeSlotInterval) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }
      
      // If it's today and no slots available, clear selections
      if (isToday && slots.length === 0) {
        setAdvanceDate(undefined);
        setAdvanceTime('');
        // Could show a toast message here about selecting a future date
        return;
      }
      
      setTimeSlots(slots);
      
      // Auto-select first available slot if none selected
      if (slots.length > 0 && !advanceTime) {
        // Don't auto-select, let user choose
        // setAdvanceTime(slots[0]);
      }
    } else {
      setTimeSlots([]);
    }
  }, [selectedOrderType, advanceDate, restaurantSettings?.advanceOrderSettings]);

  const [voucherDiscount, setVoucherDiscount] = React.useState(0);

  // Calculate voucher discount when applied voucher changes
  React.useEffect(() => {
    const calculateDiscount = async () => {
      if (appliedVoucher) {
        const discount = await TenantVoucherService.calculateVoucherDiscount(appliedVoucher, subtotal);
        setVoucherDiscount(discount);
      } else {
        setVoucherDiscount(0);
      }
    };
    calculateDiscount();
  }, [appliedVoucher, subtotal]);

  // Calculate final total without tax (application is tax-free)
  const finalTotal = subtotal + deliveryFee - voucherDiscount - pointsDiscount;

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    if (!tenantData?.id) {
      setVoucherError('Unable to validate voucher');
      return;
    }

    try {
      const result = await TenantVoucherService.validateTenantVoucher(tenantData.id, voucherInput, subtotal);
      
      if (result.valid && result.voucher) {
        setAppliedVoucher(result.voucher);
        setVoucherError('');
        const discount = await TenantVoucherService.calculateVoucherDiscount(result.voucher, subtotal);
        toast({
          title: 'Voucher Applied!',
          description: `You saved ${currencySymbol}${discount.toFixed(2)}`,
        });
      } else {
        setVoucherError(result.error || 'Invalid voucher code');
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      setVoucherError('Unable to validate voucher. Please try again.');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    toast({
      title: 'Voucher Removed',
      description: 'The voucher discount has been removed from your order.',
    });
  };

  // Handle points redemption validation
  const handleApplyPoints = async () => {
    const points = parseInt(pointsToRedeem);
    
    if (!points || points <= 0) {
      setPointsError('Please enter a valid number of points');
      return;
    }

    try {
      const response = await fetch('/api/customer/redeem-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pointsToRedeem: points,
          orderTotal: subtotal + deliveryFee - voucherDiscount
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPointsDiscount(parseFloat(result.redemption.discountAmount));
        setPointsError('');
        toast({
          title: 'Points Applied!',
          description: `You saved £${result.redemption.discountAmount} using ${points} points`,
        });
      } else {
        setPointsError(result.error || 'Unable to apply points');
      }
    } catch (error) {
      console.error('Error applying points:', error);
      setPointsError('Unable to apply points. Please try again.');
    }
  };

  const handleRemovePoints = () => {
    setPointsDiscount(0);
    setPointsToRedeem('');
    setPointsError('');
    toast({
      title: 'Points Removed',
      description: 'The points discount has been removed from your order.',
    });
  };

  // Process card payment using Global Payments
  const processCardPayment = async (formData: FormData, amount: number, customerName: string) => {
    try {
      console.log('Processing card payment with tenant data:', tenantData);
      
      if (!tenantData?.slug) {
        throw new Error('Tenant information not available. Please reload the page.');
      }

      // Determine which payment gateway to use based on settings
      const paymentSettings = restaurantSettings?.paymentSettings;
      let paymentGateway = null;
      let apiEndpoint = null;

      if (paymentSettings?.stripe?.enabled) {
        paymentGateway = 'stripe';
        apiEndpoint = `/api/tenant/${tenantData.slug}/payments/stripe`;
      } else if (paymentSettings?.globalPayments?.enabled) {
        paymentGateway = 'globalPayments';
        apiEndpoint = `/api/tenant/${tenantData.slug}/payments/global-payments`;
      } else if (paymentSettings?.worldpay?.enabled) {
        paymentGateway = 'worldpay';
        apiEndpoint = `/api/tenant/${tenantData.slug}/payments/worldpay`;
      } else {
        throw new Error('No payment gateway is enabled. Please contact the restaurant.');
      }

      console.log('Using payment gateway:', paymentGateway);
      
      const cardNumber = formData.get('cardNumber') as string;
      const expiryDate = formData.get('expiryDate') as string;
      const cvv = formData.get('cvv') as string;
      const cardholderName = formData.get('cardholderName') as string || customerName;

      console.log('Card payment data:', {
        cardNumber: cardNumber ? '****' + cardNumber.slice(-4) : 'missing',
        expiryDate,
        cvv: cvv ? '***' : 'missing',
        cardholderName,
        customerName,
        gateway: paymentGateway
      });

      if (!cardNumber || !expiryDate || !cvv) {
        throw new Error('Please fill in all card details');
      }

      if (!cardholderName || cardholderName.trim().length === 0) {
        throw new Error('Please enter the cardholder name');
      }

      // Parse expiry date (MM/YY format)
      const [expMonth, expYear] = expiryDate.split('/');
      if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
        throw new Error('Invalid expiry date format. Use MM/YY');
      }

      // Get billing address for card payment
      const billingAddress = selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery') ? {
        line_1: formData.get('address') as string,
        city: formData.get('city') as string,
        postal_code: formData.get('postcode') as string,
        country: 'GB'
      } : undefined;

      // Create payment request based on gateway
      let paymentRequest;
      const orderReference = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (paymentGateway === 'stripe') {
        paymentRequest = {
          action: 'create_payment_intent',
          amount: amount, // Send amount in pounds, API will convert to cents
          currency: 'gbp',
          orderId: orderReference, // Required field for Stripe API
          customerName: cardholderName,
          description: `Online Order - ${tenantData?.name || 'Restaurant'}`,
          metadata: {
            order_reference: orderReference,
            customer_name: customerName,
            payment_gateway: 'stripe'
          },
          payment_method_data: {
            type: 'card',
            card: {
              number: cardNumber.replace(/\s/g, ''),
              exp_month: parseInt(expMonth),
              exp_year: parseInt(expYear.length === 2 ? `20${expYear}` : expYear),
              cvc: cvv
            },
            billing_details: {
              name: cardholderName,
              address: billingAddress ? {
                line1: billingAddress.line_1,
                city: billingAddress.city,
                postal_code: billingAddress.postal_code,
                country: billingAddress.country
              } : undefined
            }
          }
        };
      } else if (paymentGateway === 'worldpay') {
        // Worldpay format
        paymentRequest = {
          action: 'process_payment',
          amount: amount,
          orderId: orderReference,
          paymentMethod: {
            card: {
              number: cardNumber.replace(/\s/g, ''),
              exp_month: expMonth,
              exp_year: expYear.length === 2 ? `20${expYear}` : expYear,
              cvc: cvv
            },
            billing_details: {
              name: cardholderName,
              address: billingAddress ? {
                line1: billingAddress.line_1,
                city: billingAddress.city,
                postal_code: billingAddress.postal_code,
                country: billingAddress.country
              } : undefined
            }
          }
        };
      } else {
        // Global Payments format
        paymentRequest = {
          action: 'process_payment',
          amount: amount,
          orderId: orderReference,
          paymentMethod: {
            card: {
              number: cardNumber.replace(/\s/g, ''),
              exp_month: expMonth,
              exp_year: expYear.length === 2 ? `20${expYear}` : expYear,
              cvc: cvv
            },
            billing_details: {
              name: cardholderName,
              address: billingAddress ? {
                line1: billingAddress.line_1,
                city: billingAddress.city,
                postal_code: billingAddress.postal_code,
                country: billingAddress.country
              } : undefined
            }
          }
        };
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment processing failed');
      }

      return result;
    } catch (error) {
      console.error('Card payment processing error:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async (formData: FormData) => {
    try {
      // Validate that the selected order type is still available
      if (!availableOrderTypes.includes(selectedOrderType)) {
        toast({
          title: 'Order Type Unavailable',
          description: `Sorry, ${selectedOrderType} orders are currently disabled.`,
          variant: 'destructive',
        });
        return;
      }

      // Check if restaurant is open (except for advance orders)
      if (selectedOrderType !== 'advance' && restaurantSettings?.openingHours) {
        const restaurantStatus = getRestaurantStatus(restaurantSettings.openingHours);
        if (!restaurantStatus.isOpen) {
          toast({
            title: 'Restaurant Closed',
            description: `Sorry, we're currently closed. ${restaurantStatus.message}`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate required fields
      const customerName = formData.get('customerName') as string;
      const customerPhone = formData.get('customerPhone') as string;
      const customerEmail = formData.get('customerEmail') as string;

      if (!customerName || !customerPhone || !customerEmail) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      // Validate delivery/collection specific fields
      if (selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) {
        const address = formData.get('address') as string;
        const city = formData.get('city') as string;
        const postcode = formData.get('postcode') as string;

        if (!address || !city || !postcode) {
          toast({
            title: 'Missing Address',
            description: 'Please fill in all address fields for delivery orders.',
            variant: 'destructive',
          });
          return;
        }

        // Check for delivery errors
        if (deliveryError) {
          toast({
            title: 'Delivery Issue',
            description: deliveryError,
            variant: 'destructive',
          });
          return;
        }
      }

      // Validate advance order fields
      if (selectedOrderType === 'advance') {
        if (!advanceDate || !advanceTime) {
          toast({
            title: 'Missing Schedule',
            description: 'Please select date and time for advance order.',
            variant: 'destructive',
          });
          return;
        }
        
        // Validate minimum notice for same-day orders
        const selectedDateTime = new Date(`${advanceDate.toISOString().split('T')[0]}T${advanceTime}:00`);
        const now = new Date();
        const minHoursNotice = restaurantSettings?.advanceOrderSettings?.minHoursNotice || 4;
        const minDateTime = new Date(now.getTime() + (minHoursNotice * 60 * 60 * 1000));
        
        if (selectedDateTime < minDateTime) {
          toast({
            title: 'Invalid Advance Order Time',
            description: `Same-day orders require at least ${minHoursNotice} hours notice. Please select a later time or a future date.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Process card payment if payment method is 'card'
      let paymentResult = null;
      if (selectedPaymentMethod === 'card') {
        try {
          paymentResult = await processCardPayment(formData, finalTotal, customerName);
          if (!paymentResult.success) {
            toast({
              title: 'Payment Failed',
              description: paymentResult.error || 'Payment could not be processed. Please try again.',
              variant: 'destructive',
            });
            return;
          }
        } catch (error) {
          console.error('Payment processing error:', error);
          toast({
            title: 'Payment Error',
            description: 'There was an error processing your payment. Please try again.',
            variant: 'destructive',
          });
          return;
        }
      }

      const orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'orderNumber'> = {
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        address: selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery') 
          ? `${formData.get('address')}, ${formData.get('city')}, ${formData.get('postcode')}` 
          : 'Collection',
        total: finalTotal,
        orderType: selectedOrderType,
        paymentMethod: selectedPaymentMethod,
        items: order.map(item => {
          const addonPrice = calculateSelectedAddonPrice(item.selectedAddons);
          return {
            id: item.orderItemId,
            menuItem: {
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price,
              image: item.image || '',
              imageHint: item.imageHint || '',
              categoryId: item.categoryId,
              available: item.available || true,
              characteristics: item.characteristics || [],
              nutrition: item.nutrition || undefined,
            },
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            selectedAddons: item.selectedAddons || [],
            specialInstructions: item.specialInstructions || '',
            basePrice: item.price,
            addonPrice: addonPrice,
            finalPrice: item.price + addonPrice,
          };
        }),
        scheduledTime: selectedOrderType === 'advance' && advanceDate && advanceTime 
          ? new Date(`${advanceDate.toISOString().split('T')[0]}T${advanceTime}:00`) 
          : undefined,
        isAdvanceOrder: selectedOrderType === 'advance',
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: voucherDiscount,
        tax: 0,
        voucherCode: appliedVoucher?.code || undefined,
        printed: false,
        customerId: undefined,
        // Add payment transaction reference if card payment was processed
        paymentTransactionId: paymentResult?.transactionId || undefined,
        // Add overall order note/special instructions
        specialInstructions: orderNote.trim() || undefined,
      };

      const orderResult = await createOrder(orderData);
      
      // Process loyalty points redemption if points were used
      if (parseInt(pointsToRedeem) > 0 && customerAuth) {
        try {
          const response = await fetch('/api/customer/redeem-points', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              pointsToRedeem: parseInt(pointsToRedeem),
              orderId: orderResult.orderId,
              orderTotal: finalTotal
            }),
          });

          if (response.ok) {
            console.log('Loyalty points redeemed successfully');
            // Update customer's points balance locally
            if (loyaltyData) {
              setLoyaltyData({
                ...loyaltyData,
                pointsBalance: loyaltyData.pointsBalance - parseInt(pointsToRedeem)
              });
            }
          } else {
            console.error('Failed to redeem loyalty points');
            // Don't fail the order if points redemption fails
          }
        } catch (error) {
          console.error('Error processing loyalty points redemption:', error);
          // Don't fail the order if points redemption fails
        }
      }
      
      // Increment voucher usage if a voucher was applied
      if (appliedVoucher && tenantData?.id) {
        try {
          await TenantVoucherService.incrementVoucherUsage(tenantData.id, appliedVoucher.id);
        } catch (error) {
          console.error('Error incrementing voucher usage:', error);
          // Don't fail the order if voucher update fails
        }
      }
      
      // Clear the order and reset voucher
      clearOrder();
      setAppliedVoucher(null);
      setVoucherInput('');
      
      // Reset loyalty points redemption
      setPointsToRedeem('');
      
      // Redirect to order confirmation page
      const queryParams = new URLSearchParams({
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        orderType: orderResult.orderType,
        total: orderResult.total.toString(),
        customerName: orderResult.customerName,
      });
      
      if (orderResult.scheduledTime) {
        queryParams.append('scheduledTime', orderResult.scheduledTime.toString());
      }
      
      // Add postcode for delivery orders to calculate zone-specific delivery time
      if (selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) {
        const postcode = formData.get('postcode') as string;
        if (postcode) {
          queryParams.append('postcode', postcode);
        }
      }
      
      // Add advance fulfillment type for advance orders
      if (selectedOrderType === 'advance') {
        queryParams.append('advanceFulfillmentType', advanceFulfillmentType);
      }
      
      router.push(`/${tenantData?.slug}/order-confirmation?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Check if it's a capacity error
      if (error instanceof Error && error.message.includes('capacity')) {
        toast({
          title: 'Order Capacity Reached',
          description: 'The restaurant has reached its capacity for this time slot. Please try a different time or order later.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Order Failed',
          description: 'There was an error placing your order. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Check if no order types are available
  if (availableOrderTypes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-4 sm:py-8">
          <X className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mb-2 sm:mb-4" />
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Orders Currently Unavailable</h3>
          <p className="text-muted-foreground text-center text-sm sm:text-base">
            All order types (delivery, collection, advance) are currently disabled.<br />
            Please contact the restaurant directly or try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (order.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-4 sm:py-8">
          <ShoppingBasket className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-2 sm:mb-4" />
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Your basket is empty</h3>
          <p className="text-muted-foreground text-center text-sm sm:text-base">
            Add items from the menu to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold">
            <ShoppingBasket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="hidden sm:inline">Your Order ({totalItems} items)</span>
            <span className="sm:hidden">Cart ({totalItems})</span>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearOrder} 
            className="text-xs sm:text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-red-600 transition-all duration-200"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Order Items - Hide when hideCartItems is true (for mobile cart overlay) */}
        {!hideCartItems && (
          <div className="lg:block">
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 lg:max-h-none overflow-y-auto">
              {order.map((item) => {
                const addonPrice = calculateSelectedAddonPrice(item.selectedAddons);
                const itemTotalPrice = (item.price + addonPrice) * item.quantity;
                
                return (
                  <div key={item.orderItemId} className="flex items-start justify-between py-2 border-b last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.selectedAddons.map((addonGroup, groupIndex) => (
                            <div key={groupIndex} className="mb-1">
                              <span className="font-medium">{addonGroup.groupName}:</span>
                              {addonGroup.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="ml-2">
                                  {option.quantity > 1 ? `${option.quantity}x ` : ''}{option.optionId}
                                  {option.totalPrice > 0 && ` (+${currencySymbol}${option.totalPrice.toFixed(2)})`}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.specialInstructions && (
                        <div className="text-xs sm:text-sm text-muted-foreground italic truncate mt-1">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                      <div className="text-sm sm:text-base font-medium">
                        {currencySymbol}{itemTotalPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item.orderItemId, item.quantity - 1)}
                      >
                        <MinusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-sm sm:text-base">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item.orderItemId, item.quantity + 1)}
                      >
                        <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-red-600 transition-all duration-200"
                        onClick={() => removeFromOrder(item.orderItemId)}
                        title="Remove item"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Type Selection */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">How would you like your order?</Label>
          <RadioGroup value={selectedOrderType} onValueChange={(value: any) => setSelectedOrderType(value)}>
            {availableOrderTypes.includes('delivery') && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery">Delivery</Label>
              </div>
            )}
            {availableOrderTypes.includes('collection') && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="collection" id="collection" />
                <Label htmlFor="collection">Collection</Label>
              </div>
            )}
            {availableOrderTypes.includes('advance') && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advance" id="advance" />
                <Label htmlFor="advance">Advance Order</Label>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* Advance Order Configuration */}
        {selectedOrderType === 'advance' && (
          <div className="space-y-4 p-4 border border-gray-300 bg-gray-50 rounded-lg">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="font-semibold text-gray-900 text-lg">Schedule Your Order</h3>
              <p className="text-gray-600 text-sm">Choose when you want your order ready</p>
            </div>
            
            {/* Step 1: Fulfillment Method */}
            <div className="space-y-3">
              <Label className="font-medium text-gray-900">How would you like to receive your order?</Label>
              <div className="grid grid-cols-2 gap-3">
                {restaurantSettings?.orderTypeSettings?.deliveryEnabled && (
                  <Button
                    type="button"
                    variant={advanceFulfillmentType === 'delivery' ? 'default' : 'outline'}
                    className={`h-12 font-medium ${
                      advanceFulfillmentType === 'delivery' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setAdvanceFulfillmentType('delivery');
                      // Reset date and time when method changes
                      setAdvanceDate(undefined);
                      setAdvanceTime('');
                    }}
                  >
                    Delivery
                  </Button>
                )}
                {restaurantSettings?.orderTypeSettings?.collectionEnabled && (
                  <Button
                    type="button"
                    variant={advanceFulfillmentType === 'collection' ? 'default' : 'outline'}
                    className={`h-12 font-medium ${
                      advanceFulfillmentType === 'collection' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setAdvanceFulfillmentType('collection');
                      // Reset date and time when method changes
                      setAdvanceDate(undefined);
                      setAdvanceTime('');
                    }}
                  >
                    Collection
                  </Button>
                )}
              </div>
            </div>

            {/* Step 2: Date and Time Selection */}
            {advanceFulfillmentType && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Choose Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left h-11 bg-white border border-gray-300"
                        >
                          {advanceDate ? (
                            <span>{format(advanceDate, "PPP")}</span>
                          ) : (
                            <span className="text-gray-500">Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={advanceDate}
                          onSelect={(date) => {
                            setAdvanceDate(date);
                            setAdvanceTime(''); // Reset time when date changes
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const maxDays = restaurantSettings?.advanceOrderSettings?.maxDaysInAdvance || 60;
                            const maxDate = new Date();
                            maxDate.setDate(today.getDate() + maxDays);
                            return date < today || date > maxDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Choose Time</Label>
                    {advanceDate && timeSlots.length > 0 ? (
                      <Select value={advanceTime} onValueChange={setAdvanceTime}>
                        <SelectTrigger className="h-11 bg-white border border-gray-300">
                          {advanceTime ? (
                            <span>{advanceTime}</span>
                          ) : (
                            <span className="text-gray-500">Select time</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button 
                        variant="outline" 
                        disabled 
                        className="h-11 w-full bg-gray-100 border border-gray-200 text-gray-400"
                      >
                        {advanceDate ? (
                          timeSlots.length === 0 ? "No slots available" : "Loading slots..."
                        ) : (
                          "Select date first"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Same-day Notice */}
            {advanceDate && advanceDate.toDateString() === new Date().toDateString() && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-amber-800 font-medium">Same-Day Order</div>
                <div className="text-amber-700 text-sm">
                  Orders for today require at least {restaurantSettings?.advanceOrderSettings?.minHoursNotice || 4} hours notice
                </div>
              </div>
            )}

            {/* Order Summary */}
            {advanceDate && advanceTime && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 font-medium">Order Scheduled</div>
                <div className="text-green-700 text-sm">
                  {advanceFulfillmentType === 'delivery' ? 'Delivery' : 'Collection'} on {format(advanceDate, "EEEE, MMMM do")} at {advanceTime}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Postcode for Delivery */}
        {(selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) && (
          <div className="space-y-2">
            <Label htmlFor="postcode">Postcode (for delivery fee calculation)</Label>
            <Input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Enter postcode"
            />
            {deliveryError && (
              <p className="text-sm text-red-500">{deliveryError}</p>
            )}
          </div>
        )}

        {/* Voucher Section */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Voucher Code</Label>
          {appliedVoucher ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <div>
                <span className="text-sm font-medium text-green-700">
                  {appliedVoucher.code} applied
                </span>
                <div className="text-xs text-green-600">
                  Save {currencySymbol}{voucherDiscount.toFixed(2)}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveVoucher}
                className="text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                placeholder="Enter voucher code"
                className={voucherError ? 'border-destructive' : ''}
              />
              <Button onClick={handleApplyVoucher} variant="outline">
                Apply
              </Button>
            </div>
          )}
          {voucherError && (
            <p className="text-sm text-destructive">{voucherError}</p>
          )}
        </div>

        {/* Loyalty Points Redemption Section - Only for logged-in customers */}
        {showPointsSection && customerAuth?.authenticated && loyaltyData && loyaltyData.pointsBalance > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="flex items-center gap-2">
              <span>Redeem Loyalty Points</span>
              <span className="text-xs text-muted-foreground">
                Available: {loyaltyData.pointsBalance || 0} points (£{((loyaltyData.pointsBalance || 0) * 0.01).toFixed(2)})
              </span>
            </Label>
            {pointsDiscount > 0 ? (
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                <div>
                  <span className="text-sm font-medium text-blue-700">
                    {pointsToRedeem} points applied
                  </span>
                  <div className="text-xs text-blue-600">
                    Save £{pointsDiscount.toFixed(2)}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemovePoints}
                  className="text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder="Enter Point"
                  type="number"
                  min="100"
                  max={loyaltyData.pointsBalance}
                  className={pointsError ? 'border-destructive' : ''}
                />
                <Button onClick={handleApplyPoints} variant="outline">
                  Apply
                </Button>
              </div>
            )}
            {pointsError && (
              <p className="text-sm text-destructive">{pointsError}</p>
            )}
          </div>
        )}

        {/* Order Summary */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Delivery Fee:</span>
              <span>{currencySymbol}{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Voucher Discount:</span>
              <span>-{currencySymbol}{voucherDiscount.toFixed(2)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Points Discount:</span>
              <span>-{currencySymbol}{pointsDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{currencySymbol}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
              <ShoppingBasket className="mr-2 h-5 w-5" />
              Place Order - {currencySymbol}{finalTotal.toFixed(2)}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handlePlaceOrder(formData);
            }}>
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                  Enter your details to complete the order.
                </DialogDescription>
                
                {/* Collection Time Notice */}
                {selectedOrderType === 'collection' && 
                 restaurantSettings?.collectionTimeSettings?.enabled && 
                 restaurantSettings?.collectionTimeSettings?.displayMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {restaurantSettings.collectionTimeSettings.displayMessage.replace(
                          '{time}', 
                          String(restaurantSettings.collectionTimeSettings.collectionTimeMinutes || 30)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      defaultValue={currentUser?.name}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      defaultValue={currentUser?.phone}
                      placeholder="07123456789"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    defaultValue={currentUser?.email}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Address for Delivery */}
                {(selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) && (
                  <>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        placeholder="123 Main St" 
                        defaultValue={currentUser?.addresses?.find(a => a.isDefault)?.street} 
                        required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="city">City</Label>
                            <Input id="city" name="city" placeholder="London" defaultValue={currentUser?.addresses?.find(a => a.isDefault)?.city} required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} />
                        </div>
                        <div>
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input 
                              id="postcode" 
                              name="postcode" 
                              placeholder="SW1A 1AA" 
                              value={postcode}
                              onChange={(e) => setPostcode(e.target.value)}
                              required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} 
                            />
                            {deliveryError && (
                              <p className="text-sm text-red-500">{deliveryError}</p>
                            )}
                        </div>
                    </div>
                  </>
                )}

                {/* Order Notes */}
                <div>
                  <Label htmlFor="notes">Order Note (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Any special instructions? e.g., no onions"
                    rows={3}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label>Payment Method</Label>
                  <RadioGroup value={selectedPaymentMethod} onValueChange={(value: any) => setSelectedPaymentMethod(value)}>
                    {availablePaymentMethods.includes('cash') && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Cash</Label>
                      </div>
                    )}
                    {availablePaymentMethods.includes('card') && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Card</Label>
                      </div>
                    )}
                  </RadioGroup>
                  {availablePaymentMethods.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No payment methods are currently available. Please contact the restaurant.
                    </p>
                  )}
                </div>

                {/* Card Payment Details */}
                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium">Card Details</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          required={selectedPaymentMethod === 'card'}
                          maxLength={19}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                            const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                            e.target.value = formattedValue;
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            required={selectedPaymentMethod === 'card'}
                            maxLength={5}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              e.target.value = value;
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            placeholder="123"
                            required={selectedPaymentMethod === 'card'}
                            maxLength={4}
                            type="password"
                            onChange={(e) => {
                              e.target.value = e.target.value.replace(/[^0-9]/g, '');
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          name="cardholderName"
                          placeholder="John Smith"
                          required={selectedPaymentMethod === 'card'}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Your payment is secured with Global Payments
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="submit" className="w-full" size="lg">
                  Pay {currencySymbol}{finalTotal.toFixed(2)}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
});

// Login Dialog Component
const LoginDialog = React.memo(function LoginDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { login } = useTenantData();
    const { tenantData } = useTenant();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Sign up form state
    const [signupFirstName, setSignupFirstName] = React.useState('');
    const [signupLastName, setSignupLastName] = React.useState('');
    const [signupEmail, setSignupEmail] = React.useState('');
    const [signupPhone, setSignupPhone] = React.useState('');
    const [signupPassword, setSignupPassword] = React.useState('');
    
    // Forgot password state
    const [showForgotPassword, setShowForgotPassword] = React.useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = React.useState('');
    const [isForgotPasswordLoading, setIsForgotPasswordLoading] = React.useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                toast({ title: 'Login Successful', description: 'Welcome back!' });
                setIsOpen(false);
                setEmail('');
                setPassword('');
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: '❌ Login Failed', 
                    description: '⚠️ Invalid username or password. Please check your credentials and try again.',
                    duration: 5000
                });
            }
        } catch (error) {
            toast({ 
                variant: 'destructive', 
                title: '❌ Login Error', 
                description: '⚠️ An unexpected error occurred. Please try again later.',
                duration: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/customer/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `${signupFirstName} ${signupLastName}`.trim(),
                    email: signupEmail,
                    phone: signupPhone,
                    password: signupPassword,
                    tenantId: tenantData?.id
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast({ 
                    title: '🎉 Account Created Successfully!', 
                    description: `Welcome ${signupFirstName} ${signupLastName}! ${result.message}`,
                    duration: 6000
                });
                
                // Clear form and close dialog
                setSignupFirstName('');
                setSignupLastName('');
                setSignupEmail('');
                setSignupPhone('');
                setSignupPassword('');
                setIsOpen(false);
                
                // Auto-login after successful registration
                if (result.customer) {
                    // Refresh the page or trigger a re-fetch of customer data
                    window.location.reload();
                }
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: '❌ Registration Failed', 
                    description: result.error || 'Failed to create account. Please try again.',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Sign up error:', error);
            toast({ 
                variant: 'destructive', 
                title: '❌ Registration Error', 
                description: '⚠️ An unexpected error occurred. Please try again later.',
                duration: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsForgotPasswordLoading(true);
        
        try {
            const response = await fetch('/api/customer/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: forgotPasswordEmail,
                    tenantId: tenantData?.id
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast({ 
                    title: '📧 Password Reset Email Sent', 
                    description: 'Please check your email for password reset instructions.',
                    duration: 6000
                });
                
                // Clear form and return to login
                setForgotPasswordEmail('');
                setShowForgotPassword(false);
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: '❌ Reset Failed', 
                    description: result.error || 'Failed to send reset email. Please try again.',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast({ 
                variant: 'destructive', 
                title: '❌ Reset Error', 
                description: '⚠️ An unexpected error occurred. Please try again later.',
                duration: 5000
            });
        } finally {
            setIsForgotPasswordLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
                    </DialogTitle>
                    <DialogDescription>
                        {showForgotPassword 
                            ? 'Enter your email address and we\'ll send you a link to reset your password.'
                            : 'Sign in to your account to access exclusive features and faster checkout.'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                {showForgotPassword ? (
                    // Forgot Password Form
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input
                                id="forgot-email"
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isForgotPasswordLoading}>
                            {isForgotPasswordLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                        </Button>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="w-full"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setForgotPasswordEmail('');
                            }}
                        >
                            Back to Login
                        </Button>
                    </form>
                ) : (
                    // Login and Signup Tabs
                    <Tabs defaultValue="login">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Login</TabsTrigger>
                                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <div className="space-y-4">
                        
                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="link" 
                                    className="w-full text-sm text-muted-foreground"
                                    onClick={() => setShowForgotPassword(true)}
                                >
                                    Forgot your password?
                                </Button>
                            </form>
                        </TabsContent>
                    <TabsContent value="signup">
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-firstname">First Name</Label>
                                    <Input
                                        id="signup-firstname"
                                        type="text"
                                        value={signupFirstName}
                                        onChange={(e) => setSignupFirstName(e.target.value)}
                                        placeholder="Enter your first name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-lastname">Surname</Label>
                                    <Input
                                        id="signup-lastname"
                                        type="text"
                                        value={signupLastName}
                                        onChange={(e) => setSignupLastName(e.target.value)}
                                        placeholder="Enter your surname"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-phone">Phone Number</Label>
                                <Input
                                    id="signup-phone"
                                    type="tel"
                                    value={signupPhone}
                                    onChange={(e) => setSignupPhone(e.target.value)}
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    placeholder="Create a password (min 6 characters)"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                By signing up, you'll receive 100 loyalty points as a welcome bonus!
                            </p>
                        </form>
                    </TabsContent>
                </div>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
});

// Header Component
const CustomerHeader = React.memo(function CustomerHeader({ router, tenantData }: { router: any; tenantData: any }) {
    const { currentUser, isAuthenticated, logout, restaurantSettings } = useTenantData();

    const restaurantStatus = restaurantSettings?.openingHours ? 
        getRestaurantStatus(restaurantSettings.openingHours) : 
        { isOpen: true, message: 'Open' };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm shadow-sm">
            <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between px-2 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {restaurantSettings?.logo ? (
                            <Image 
                                src={restaurantSettings.logo} 
                                alt={restaurantSettings.name || 'Restaurant Logo'}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-full"
                                data-ai-hint={restaurantSettings.logoHint}
                            />
                        ) : (
                            <span className="text-white font-bold text-sm sm:text-lg">
                                {tenantData?.name?.charAt(0) || 'R'}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-headline text-lg sm:text-2xl font-bold text-foreground truncate">
                            {restaurantSettings?.name || tenantData?.name || 'Restaurant'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${restaurantStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-xs sm:text-sm ${restaurantStatus.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                {restaurantStatus.message}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    {isAuthenticated && currentUser ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3">
                                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                    <span className="hidden sm:inline">Hi, {currentUser.name.split(' ')[0]}</span>
                                    <span className="sm:hidden">{currentUser.name.split(' ')[0]}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/${tenantData?.slug}/customer/dashboard`)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Dashboard</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/${tenantData?.slug}/customer/profile`)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/${tenantData?.slug}/customer/orders`)}>
                                    <Package className="mr-2 h-4 w-4" />
                                    <span>My Orders</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <LoginDialog>
                            <Button variant="ghost" className="px-2 sm:px-3">
                                <LogIn className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                                <span className="hidden sm:inline">Login / Sign Up</span>
                                <span className="sm:hidden">Login</span>
                            </Button>
                        </LoginDialog>
                    )}
                </div>
            </div>
        </header>
    );
});

// Mobile Bottom Navigation Component
const MobileBottomNav = React.memo(function MobileBottomNav({ 
  totalItems, 
  onCartClick, 
  onSearchClick,
  activeSection = 'menu',
  router,
  tenantSlug
}: { 
  totalItems: number;
  onCartClick: () => void;
  onSearchClick: () => void;
  activeSection?: 'menu' | 'cart' | 'search' | 'account';
  router: any;
  tenantSlug?: string;
}) {
    const { currentUser, isAuthenticated } = useTenantData();

    const handleAccountClick = () => {
        if (isAuthenticated && tenantSlug) {
            router.push(`/${tenantSlug}/customer/dashboard`);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-gray-100/80 shadow-2xl lg:hidden">
            <div className="safe-area-inset-bottom">
                <div className="grid grid-cols-4 h-20 px-3 py-2">
                    {/* Menu */}
                    <button 
                        className={`flex flex-col items-center justify-center space-y-1.5 py-2.5 rounded-2xl mx-1 transition-all duration-300 ${
                            activeSection === 'menu' 
                                ? 'text-primary bg-gradient-to-t from-primary/15 to-primary/10 shadow-lg scale-105' 
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50/80 hover:scale-105'
                        }`}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                            activeSection === 'menu' ? 'bg-primary/20' : ''
                        }`}>
                            <MenuIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold">Menu</span>
                    </button>

                    {/* Search */}
                    <button 
                        className={`flex flex-col items-center justify-center space-y-1.5 py-2.5 rounded-2xl mx-1 transition-all duration-300 ${
                            activeSection === 'search' 
                                ? 'text-primary bg-gradient-to-t from-primary/15 to-primary/10 shadow-lg scale-105' 
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50/80 hover:scale-105'
                        }`}
                        onClick={onSearchClick}
                    >
                        <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                            activeSection === 'search' ? 'bg-primary/20' : ''
                        }`}>
                            <Search className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold">Search</span>
                    </button>

                    {/* Cart */}
                    <button 
                        className={`flex flex-col items-center justify-center space-y-1.5 py-2.5 rounded-2xl mx-1 transition-all duration-300 relative ${
                            activeSection === 'cart' 
                                ? 'text-primary bg-gradient-to-t from-primary/15 to-primary/10 shadow-lg scale-105' 
                                : 'text-gray-500 hover:text-primary hover:bg-gray-50/80 hover:scale-105'
                        }`}
                        onClick={onCartClick}
                    >
                        <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                            activeSection === 'cart' ? 'bg-primary/20' : ''
                        }`}>
                            <ShoppingBasket className="h-5 w-5" />
                            {totalItems > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg animate-pulse">
                                    {totalItems > 99 ? '99+' : totalItems}
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-semibold">Cart</span>
                    </button>

                    {/* Account */}
                    {isAuthenticated ? (
                        <button 
                            className={`flex flex-col items-center justify-center space-y-1.5 py-2.5 rounded-2xl mx-1 transition-all duration-300 ${
                                activeSection === 'account' 
                                    ? 'text-primary bg-gradient-to-t from-primary/15 to-primary/10 shadow-lg scale-105' 
                                    : 'text-gray-500 hover:text-primary hover:bg-gray-50/80 hover:scale-105'
                            }`}
                            onClick={handleAccountClick}
                        >
                            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                                activeSection === 'account' ? 'bg-primary/20' : ''
                            }`}>
                                <User className="h-5 w-5" />
                            </div>
                            <span className="text-xs font-semibold">Account</span>
                        </button>
                    ) : (
                        <LoginDialog>
                            <button 
                                className={`flex flex-col items-center justify-center space-y-1.5 py-2.5 rounded-2xl mx-1 transition-all duration-300 ${
                                    activeSection === 'account' 
                                        ? 'text-primary bg-gradient-to-t from-primary/15 to-primary/10 shadow-lg scale-105' 
                                        : 'text-gray-500 hover:text-primary hover:bg-gray-50/80 hover:scale-105'
                                }`}
                            >
                                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                                    activeSection === 'account' ? 'bg-primary/20' : ''
                                }`}>
                                    <User className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-semibold">Login</span>
                            </button>
                        </LoginDialog>
                    )}
                </div>
            </div>
        </div>
    );
});

// Floating Cart Button Component (for desktop/tablet)
const FloatingCartButton = React.memo(function FloatingCartButton({ 
    totalItems, 
    totalAmount, 
    currencySymbol, 
    onClick 
}: { 
    totalItems: number;
    totalAmount: number;
    currencySymbol: string;
    onClick: () => void;
}) {
    if (totalItems === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 hidden lg:block">
            <Button 
                onClick={onClick}
                className="rounded-full h-14 w-14 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-primary hover:bg-primary/90 group"
                size="lg"
            >
                <div className="relative">
                    <ShoppingBasket className="h-6 w-6" />
                    <Badge className="absolute -top-3 -right-3 h-6 w-6 p-0 flex items-center justify-center text-xs bg-background text-foreground border-2 border-primary">
                        {totalItems}
                    </Badge>
                </div>
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-background border rounded-lg px-3 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <p className="text-sm font-medium whitespace-nowrap">
                        {totalItems} items • {currencySymbol}{totalAmount.toFixed(2)}
                    </p>
                </div>
            </Button>
        </div>
    );
});

// Mobile Quick Search Component
const MobileQuickSearch = React.memo(function MobileQuickSearch({ 
    isOpen, 
    onClose, 
    searchQuery, 
    onSearchChange 
}: {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}) {
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background lg:hidden">
            <div className="flex items-center gap-3 p-4 border-b">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        ref={searchInputRef}
                        placeholder="Search menu items..."
                        className="pl-10 h-12 text-base"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="p-4">
                {searchQuery ? (
                    <p className="text-sm text-muted-foreground">
                        Searching for "{searchQuery}"...
                    </p>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Popular searches:</p>
                        <div className="flex flex-wrap gap-2">
                            {['Pizza', 'Burger', 'Chicken', 'Salad', 'Dessert'].map((term) => (
                                <Button 
                                    key={term}
                                    variant="outline" 
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => onSearchChange(term)}
                                >
                                    {term}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// Enhanced Mobile Menu Item Component
const MobileMenuItem = React.memo(function MobileMenuItem({ 
    item, 
    onAddToCart, 
    currencySymbol 
}: {
    item: MenuItemType;
    onAddToCart: (item: MenuItemType, quantity: number, instructions: string, selectedAddons?: SelectedAddon[]) => void;
    currencySymbol: string;
}) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening the dialog
        onAddToCart(item, 1, '', []);
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-100/50 hover:border-gray-200/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/50 cursor-pointer overflow-hidden"
                  onClick={() => setIsDialogOpen(true)}>
                <div className="p-3">
                    <div className="flex gap-3">
                        {/* Content - Left Side */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm leading-tight text-gray-900 mb-1.5 line-clamp-2">
                                {item.name}
                            </h4>
                            {item.description && (
                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                                    {item.description}
                                </p>
                            )}
                            
                            {/* Set Menu Items Display - Mobile */}
                            {item.isSetMenu && item.setMenuItems && item.setMenuItems.length > 0 && (
                                <div className="p-2 bg-gradient-to-r from-primary/5 to-primary/8 rounded-lg border border-primary/10 mb-2">
                                    <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                                        <Package className="h-2.5 w-2.5" />
                                        Set includes:
                                    </p>
                                    <div className="text-xs text-gray-700 font-medium leading-relaxed">
                                        {item.setMenuItems.map((setItem, index) => (
                                            <span key={setItem.id}>
                                                {setItem.quantity > 1 ? `${setItem.quantity}x ` : ''}{setItem.name}
                                                {index < item.setMenuItems!.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-0.5">
                                <p className="text-base font-bold text-gray-900">
                                    {currencySymbol}{item.price.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        
                        {/* Image with Smart Add Button - Right Side */}
                        <div className="relative flex-shrink-0">
                            {item.image && item.image.length > 0 && !item.image.includes('placehold.co') ? (
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-gray-50">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                objectFit: 'cover',
                                                objectPosition: 'center'
                                            }}
                                        />
                                    </div>
                                    {/* Compact Floating Add Button */}
                                    <div className="absolute -bottom-1.5 -right-1.5">
                                        <Button
                                            size="icon"
                                            onClick={handleQuickAdd}
                                            className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-2 border-white"
                                            aria-label={`Add ${item.name} to cart`}
                                        >
                                            <Plus className="h-4 w-4 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Compact standalone add button when no image - no placeholder box */
                                <Button
                                    size="icon"
                                    onClick={handleQuickAdd}
                                    className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                                    aria-label={`Add ${item.name} to cart`}
                                >
                                    <Plus className="h-5 w-5 text-white" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <MenuItemDialog 
                item={item} 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                onAddToCart={onAddToCart}
                currencySymbol={currencySymbol}
            />
        </>
    );
});

// Cover Image Section Component
const CoverImageSection = React.memo(function CoverImageSection() {
    const { restaurantSettings } = useTenantData();
    
    if (!restaurantSettings?.coverImage) {
        return null;
    }

    return (
        <div className="relative w-full h-32 sm:h-48 md:h-64 mb-4 overflow-hidden">
            <Image
                src={restaurantSettings.coverImage}
                alt={restaurantSettings.name || 'Restaurant Cover'}
                fill
                className="object-cover"
                data-ai-hint={restaurantSettings.coverImageHint}
                priority
            />
            {/* Optional overlay for better text readability if needed */}
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Optional restaurant info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                <div className="container mx-auto">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                        {restaurantSettings.name}
                    </h2>
                    {restaurantSettings.description && (
                        <p className="text-sm sm:text-base text-white/90 max-w-2xl">
                            {restaurantSettings.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

// Main Tenant Customer Interface Component
export default function TenantCustomerInterface() {
    const { getMenuWithCategoriesForCustomer, restaurantSettings, isLoading } = useTenantData();
    const { tenantData } = useTenant();
    const { toast } = useToast();
    const router = useRouter();
    
    const [order, setOrder] = React.useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Check for shop cart data on component mount
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('from') === 'shop') {
            const shopCartData = localStorage.getItem('shop-cart');
            const shopCartTenant = localStorage.getItem('shop-cart-tenant');
            
            if (shopCartData && shopCartTenant === tenantData?.slug) {
                try {
                    const shopCart = JSON.parse(shopCartData);
                    
                    // Convert shop cart items to order items
                    const orderItems: OrderItem[] = shopCart.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        specialInstructions: '',
                        selectedAddons: [],
                        categoryId: item.category_id,
                        image: item.image_url || '',
                        description: item.description || ''
                    }));
                    
                    setOrder(orderItems);
                    
                    // Clean up localStorage
                    localStorage.removeItem('shop-cart');
                    localStorage.removeItem('shop-cart-tenant');
                    
                    // Remove the URL parameter
                    window.history.replaceState({}, '', window.location.pathname);
                    
                    toast({
                        title: "Cart imported",
                        description: `${shopCart.length} items imported from shop`,
                    });
                } catch (error) {
                    console.error('Error importing shop cart:', error);
                    localStorage.removeItem('shop-cart');
                    localStorage.removeItem('shop-cart-tenant');
                }
            }
        }
    }, [tenantData?.slug, toast]);

    // Get restaurant status for mobile header
    const restaurantStatus = restaurantSettings?.openingHours ? 
        getRestaurantStatus(restaurantSettings.openingHours) : 
        { isOpen: true, message: 'Open' };

    // Process menu data to match customer page structure
    const menuItems = getMenuWithCategoriesForCustomer();
    
    // Group items by categories and handle sub-categories
    const menuData = React.useMemo(() => {
        const categoriesMap = new Map<string, {
            category: Category;
            items: MenuItemType[];
            subCategories: { category: Category; items: MenuItemType[] }[];
        }>();

        menuItems.forEach(({ category, items }) => {
            if (!categoriesMap.has(category.id)) {
                categoriesMap.set(category.id, {
                    category,
                    items: [],
                    subCategories: []
                });
            }
            
            const categoryData = categoriesMap.get(category.id)!;
            categoryData.items.push(...items);
        });

        return Array.from(categoriesMap.values());
    }, [menuItems]);

    // Filter menu data based on search
    const filteredMenuData = React.useMemo(() => {
        if (!searchQuery) return menuData;
        
        return menuData.map(categoryData => ({
            ...categoryData,
            items: categoryData.items.filter(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
            subCategories: categoryData.subCategories.map(subCat => ({
                ...subCat,
                items: subCat.items.filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
            })).filter(subCat => subCat.items.length > 0)
        })).filter(categoryData => categoryData.items.length > 0 || categoryData.subCategories.length > 0);
    }, [menuData, searchQuery]);

    const currencySymbol = getCurrencySymbol(restaurantSettings?.currency);

    const handleAddToCart = React.useCallback((item: MenuItemType, quantity: number, instructions: string, selectedAddons?: SelectedAddon[]) => {
        // Check if the same item with identical instructions and addons already exists
        const existingItemIndex = order.findIndex(orderItem => 
            orderItem.id === item.id &&
            orderItem.specialInstructions === instructions &&
            JSON.stringify(orderItem.selectedAddons) === JSON.stringify(selectedAddons || [])
        );

        if (existingItemIndex !== -1) {
            // Item already exists with same configuration - just increase quantity
            setOrder(prev => prev.map((orderItem, index) => 
                index === existingItemIndex 
                    ? { ...orderItem, quantity: orderItem.quantity + quantity }
                    : orderItem
            ));
            
            const totalQuantity = order[existingItemIndex].quantity + quantity;
            toast({
                title: 'Updated Cart',
                description: `${item.name} quantity updated to ${totalQuantity}.`,
            });
        } else {
            // New item or different configuration - create new entry
            const addonPrice = calculateSelectedAddonPrice(selectedAddons || []);
            const orderItem: OrderItem = {
                orderItemId: `${item.id}-${Date.now()}`,
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                categoryId: item.categoryId,
                available: item.available || true,
                selectedAddons: selectedAddons || [],
                quantity,
                specialInstructions: instructions,
                basePrice: item.price,
                addonPrice: addonPrice,
                finalPrice: item.price + addonPrice,
                
                // Optional fields
                imageHint: item.imageHint,
                characteristics: item.characteristics,
                nutrition: item.nutrition,
            };

            setOrder(prev => [...prev, orderItem]);
            
            toast({
                title: 'Added to Cart',
                description: `${quantity}x ${item.name} added to your order.`,
            });
        }
    }, [order, toast]);

    const handleUpdateQuantity = React.useCallback((orderItemId: string, quantity: number) => {
        if (quantity <= 0) {
            setOrder(prev => prev.filter(item => item.orderItemId !== orderItemId));
            return;
        }
        
        setOrder(prev => prev.map(item => 
            item.orderItemId === orderItemId ? { ...item, quantity } : item
        ));
    }, []);

    const handleRemoveFromOrder = React.useCallback((orderItemId: string) => {
        setOrder(prev => prev.filter(item => item.orderItemId !== orderItemId));
    }, []);

    const handleClearOrder = React.useCallback(() => {
        setOrder([]);
    }, []);

    // Memoize calculated values for better performance
    const orderTotal = React.useMemo(() => 
        order.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0),
        [order]
    );

    const totalItems = React.useMemo(() => 
        order.reduce((sum, item) => sum + item.quantity, 0),
        [order]
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading menu...</p>
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                {/* Desktop Header - Hidden on Mobile */}
                <div className="hidden lg:block">
                    <CustomerHeader router={router} tenantData={tenantData} />
                    <CoverImageSection />
                </div>

                {/* Mobile Cover Image */}
                {restaurantSettings?.coverImage && (
                    <div className="lg:hidden relative w-full h-48 sm:h-56 overflow-hidden">
                        <Image
                            src={restaurantSettings.coverImage}
                            alt={restaurantSettings.name || 'Restaurant Cover'}
                            fill
                            className="object-cover"
                            data-ai-hint={restaurantSettings.coverImageHint}
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Modern Mobile Restaurant Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="flex items-end justify-between">
                                <div className="flex-1">
                                    <h1 className="font-bold text-2xl text-white mb-1">{restaurantSettings?.name || 'Restaurant'}</h1>
                                    <p className="text-sm text-white/90 mb-3">{restaurantSettings?.description || 'Order online'}</p>
                                    <div className="flex items-center space-x-3">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 ${
                                            restaurantStatus.isOpen 
                                                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                                                : 'bg-red-500/20 text-red-100 border border-red-400/30'
                                        }`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${restaurantStatus.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                            <span>{restaurantStatus.isOpen ? 'Open Now' : 'Closed'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modern Mobile App-like Header - Only show when no cover image */}
                {!restaurantSettings?.coverImage && (
                    <div className="lg:hidden bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100/80 backdrop-blur-md">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex-1">
                                <h1 className="font-bold text-xl text-gray-900">{restaurantSettings?.name || 'Restaurant'}</h1>
                                <p className="text-sm text-gray-500">{restaurantSettings?.description || 'Order online'}</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-2 ${
                                restaurantStatus.isOpen 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                <div className={`h-2 w-2 rounded-full ${restaurantStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span>{restaurantStatus.isOpen ? 'Open' : 'Closed'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* All-device Menu Categories Nav - Always Sticky */}
                <MenuNav menuData={menuData} />
                
                <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-6">
                    {/* Modern Mobile App Layout */}
                    <div className="lg:hidden min-h-screen bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30">
                        {/* Mobile Menu with modern app-like design */}
                        <div className="space-y-3 pb-32 px-4 pt-3">
                            {filteredMenuData.map((categoryData, index) => (
                                <div 
                                    key={categoryData.category.id} 
                                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden transform transition-all duration-500 hover:scale-[1.01] hover:shadow-lg"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        animation: 'fadeInUp 0.6s ease-out forwards'
                                    }}
                                >
                                    <div id={`cat-${categoryData.category.id}`} className="bg-gradient-to-r from-primary/8 via-primary/5 to-transparent px-5 py-3 border-b border-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-1.5 w-10 bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full shadow-sm"></div>
                                            <h2 className="text-base font-bold text-gray-900 tracking-tight">{categoryData.category.name}</h2>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-3">
                                        {categoryData.items?.filter(item => 
                                            searchQuery === '' || 
                                            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((item, itemIndex) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    animationDelay: `${(index * 100) + (itemIndex * 50)}ms`,
                                                    animation: 'fadeInUp 0.4s ease-out forwards'
                                                }}
                                            >
                                                <MobileMenuItem
                                                    item={item}
                                                    onAddToCart={handleAddToCart}
                                                    currencySymbol={currencySymbol}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Cart Button */}
                        <FloatingCartButton 
                            totalItems={totalItems}
                            totalAmount={orderTotal}
                            currencySymbol={currencySymbol}
                            onClick={() => {
                                // Toggle cart view or navigate to cart
                                const cartElement = document.getElementById('mobile-cart');
                                if (cartElement) {
                                    cartElement.classList.toggle('translate-y-full');
                                }
                            }}
                        />

                        {/* Mobile Bottom Navigation */}
                        <MobileBottomNav 
                            totalItems={totalItems}
                            onCartClick={() => {
                                const cartElement = document.getElementById('mobile-cart');
                                if (cartElement) {
                                    cartElement.classList.remove('translate-y-full');
                                }
                            }}
                            onSearchClick={() => {
                                // Scroll to top to focus on search
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                // Focus search input after scroll
                                setTimeout(() => {
                                    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                    if (searchInput) {
                                        searchInput.focus();
                                    }
                                }, 300);
                            }}
                            router={router}
                            tenantSlug={tenantData?.slug}
                        />

                        {/* Enhanced Mobile Cart - Full Screen Overlay */}
                        <div id="mobile-cart" className="fixed inset-0 bg-white transform translate-y-full transition-transform duration-300 z-50 flex flex-col">
                            {/* Modern Cart Header */}
                            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
                                <button
                                    onClick={() => {
                                        const cartElement = document.getElementById('mobile-cart');
                                        if (cartElement) {
                                            cartElement.classList.add('translate-y-full');
                                        }
                                    }}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h2 className="text-lg font-semibold text-gray-900">Your Order</h2>
                                {order.length > 0 && (
                                    <button
                                        onClick={handleClearOrder}
                                        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                )}
                                {order.length === 0 && <div className="w-10"></div>}
                            </div>
                            
                            {/* Scrollable Cart Content */}
                            <div className="flex-1 overflow-y-auto bg-gray-50/30">
                                {order.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                                            <ShoppingBasket className="h-12 w-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
                                        <p className="text-gray-500 mb-8 leading-relaxed">Add delicious items from our menu to get started</p>
                                        <Button 
                                            onClick={() => {
                                                const cartElement = document.getElementById('mobile-cart');
                                                if (cartElement) {
                                                    cartElement.classList.add('translate-y-full');
                                                }
                                            }}
                                            className="w-full max-w-xs h-12 text-base font-semibold rounded-xl"
                                        >
                                            Browse Menu
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="pb-6">
                                        {/* Cart Items Section */}
                                        <div className="bg-white rounded-t-3xl mt-4 mx-4 shadow-sm border border-gray-100">
                                            <div className="p-4 border-b border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBasket className="h-5 w-5 text-primary" />
                                                    <h3 className="font-semibold text-gray-900">Cart ({order.length})</h3>
                                                </div>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {order.map((item) => (
                                                    <div key={item.orderItemId} className="p-4 border-b border-gray-50 last:border-b-0">
                                                        <div className="flex gap-3">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.name}</h4>
                                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                                    <div className="text-xs text-gray-600 mb-2">
                                                                        <p className="font-medium">Extra Options:</p>
                                                                        {item.selectedAddons.map((addonGroup, groupIndex) => (
                                                                            <div key={groupIndex} className="ml-2">
                                                                                <span className="font-medium">{addonGroup.groupName}:</span>
                                                                                {addonGroup.options.map((option, optionIndex) => (
                                                                                    <div key={optionIndex} className="ml-2">
                                                                                        {option.quantity > 1 ? `${option.quantity}x ` : ''}{option.optionId}
                                                                                        {option.totalPrice > 0 && ` (+${currencySymbol}${option.totalPrice.toFixed(2)})`}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {item.specialInstructions && (
                                                                    <p className="text-xs text-gray-600 mb-2">
                                                                        <span className="font-medium">Note:</span> {item.specialInstructions}
                                                                    </p>
                                                                )}
                                                                <p className="font-bold text-primary text-sm">
                                                                    {currencySymbol}{((item.price + (calculateSelectedAddonPrice(item.selectedAddons) || 0)) * item.quantity).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateQuantity(item.orderItemId, item.quantity - 1)}
                                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <MinusCircle className="h-4 w-4 text-gray-600" />
                                                                </button>
                                                                <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => handleUpdateQuantity(item.orderItemId, item.quantity + 1)}
                                                                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                                >
                                                                    <PlusCircle className="h-4 w-4 text-gray-600" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveFromOrder(item.orderItemId)}
                                                                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors ml-2"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Order Options - Use the OrderSummary component for the lower section */}
                                        <div className="px-4 mt-4">
                                            <OrderSummary
                                                order={order}
                                                updateQuantity={handleUpdateQuantity}
                                                removeFromOrder={handleRemoveFromOrder}
                                                clearOrder={handleClearOrder}
                                                currencySymbol={currencySymbol}
                                                router={router}
                                                hideCartItems={true}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout: Side by side with sticky cart */}
                    <div className="hidden lg:grid lg:grid-cols-4 gap-8">
                        {/* Left side: Menu */}
                        <div className="lg:col-span-3">
                            <MenuSection
                                menuData={filteredMenuData}
                                onAddToCart={handleAddToCart}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                currencySymbol={currencySymbol}
                            />
                        </div>
                        {/* Right sidebar: Sticky Cart */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-[60px] space-y-4">
                                <OrderSummary
                                    order={order}
                                    updateQuantity={handleUpdateQuantity}
                                    removeFromOrder={handleRemoveFromOrder}
                                    clearOrder={handleClearOrder}
                                    currencySymbol={currencySymbol}
                                    router={router}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
