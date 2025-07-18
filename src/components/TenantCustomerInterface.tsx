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
import type { OrderItem, MenuItem as MenuItemType, Addon, Category, OpeningHoursPerDay, Order, Voucher } from '@/lib/types';
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
  LogOut,
  Home,
  Menu as MenuIcon,
  Heart,
  ChevronUp,
  Clock,
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

function MenuNav({ menuData }: { menuData: { category: Category }[] }) {
    const [activeCategory, setActiveCategory] = React.useState<string | null>(
        menuData.length > 0 ? menuData[0].category.id : null
    );
    
    // This effect updates the active category based on scroll position
    React.useEffect(() => {
        const handleScroll = () => {
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
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check in case a category is already in view
        handleScroll(); 

        return () => window.removeEventListener('scroll', handleScroll);
    }, [menuData]);
    
    return (
        <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm shadow-sm border-b">
            <div className="container mx-auto flex items-center justify-center p-2 overflow-x-auto">
                <div className="flex gap-1.5 sm:gap-2">
                    {menuData.map(({ category }) => (
                        <Button 
                            asChild 
                            key={category.id} 
                            variant={activeCategory === category.id ? 'default' : 'secondary'} 
                            className="flex-shrink-0 font-medium transition-colors text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-2 h-6 sm:h-8"
                        >
                            <a href={`#cat-${category.id}`}>{category.name}</a>
                        </Button>
                    ))}
                </div>
            </div>
        </nav>
    );
}

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
  onAddToCart: (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => void;
  currencySymbol: string;
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedAddons, setSelectedAddons] = React.useState<Addon[]>([]);
  const [instructions, setInstructions] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
      setInstructions('');
    }
  }, [isOpen]);

  const handleToggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };
  
  const totalPrice = (item.price + selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * quantity;

  const handleConfirm = () => {
    onAddToCart(item, selectedAddons, quantity, instructions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-0">
          {item.image && !item.image.includes('placehold.co') && (
            <div className="relative h-48 -mx-6 -mt-6 mb-4">
              <Image src={item.image!} alt={item.name} data-ai-hint={item.imageHint} fill className="rounded-t-lg object-cover" />
            </div>
          )}
          <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6 max-h-[40vh] overflow-y-auto pr-2">
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
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-muted-foreground">Add-ons</h4>
              <div className="space-y-2">
                {item.addons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <Label htmlFor={addon.name} className="font-medium">{addon.name}</Label>
                      <p className="text-sm text-muted-foreground">+{currencySymbol}{parseFloat(String(addon.price || '0')).toFixed(2)}</p>
                    </div>
                    <Button
                      variant={selectedAddons.find((a) => a.id === addon.id) ? 'default' : 'outline'}
                      size="icon" onClick={() => handleToggleAddon(addon)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="special-instructions" className="font-semibold text-muted-foreground">Special Instructions</Label>
            <Textarea 
              id="special-instructions" 
              placeholder="e.g. no onions, extra spicy" 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 pt-4 border-t">
            <div className="flex items-center justify-between w-full">
                <Label className="font-semibold text-muted-foreground">Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(1, q-1))}><MinusCircle className="h-5 w-5"/></Button>
                  <span className="font-bold text-lg w-10 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(q => q+1)}><PlusCircle className="h-5 w-5"/></Button>
                </div>
            </div>
            <Button onClick={handleConfirm} className="w-full font-headline text-lg h-12">
              Add to Order - {currencySymbol}{totalPrice.toFixed(2)}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MenuItem({
  item,
  onAddToCart,
  currencySymbol
}: {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => void;
  currencySymbol: string;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const hasImage = item.image && !item.image.includes('placehold.co');

  const hasAddons = item.addons && item.addons.length > 0;
  const isBasePriceZero = item.price === 0;
  
  let displayPrice = item.price;
  let pricePrefix = '';

  if (isBasePriceZero && hasAddons) {
    const addonPrices = item.addons!.map(a => a.price);
    if (addonPrices.length > 0) {
        displayPrice = Math.min(...addonPrices);
        pricePrefix = 'From ';
    }
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the dialog
    onAddToCart(item, [], 1, '');
  };

  return (
    <>
      <div 
        className="flex items-start justify-between p-2.5 sm:p-3 rounded-lg border transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group bg-background"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-start gap-2.5 sm:gap-3 flex-grow min-w-0">
          {hasImage && (
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <Image
                    src={item.image!}
                    alt={item.name}
                    data-ai-hint={item.imageHint}
                    fill
                    className="rounded-md object-cover"
                />
            </div>
          )}
          <div className="flex-grow min-w-0">
              <h4 className="font-semibold text-sm sm:text-base leading-tight">{item.name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 text-balance line-clamp-2">{item.description}</p>
              
              {/* Set Menu Items Display */}
              {item.isSetMenu && item.setMenuItems && item.setMenuItems.length > 0 && (
                <div className="mt-1.5 p-1.5 bg-primary/5 rounded-md border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-0.5">Set includes:</p>
                  <div className="text-xs text-muted-foreground">
                    {item.setMenuItems.map((setItem, index) => (
                      <span key={setItem.id}>
                        {setItem.quantity > 1 ? `${setItem.quantity}x ` : ''}{setItem.name}
                        {index < item.setMenuItems!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-end mt-1.5 gap-2">
                <p className="text-sm sm:text-base font-bold text-primary flex-shrink-0">
                  {pricePrefix}{currencySymbol}{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                </p>
                {item.characteristics && item.characteristics.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                        <TooltipProvider>
                            {item.characteristics.slice(0, 3).map(charId => {
                                const IconComponent = getIconComponent(charId, Utensils);
                                
                                return (
                                    <Tooltip key={charId}>
                                        <TooltipTrigger>
                                            <div className="transition-transform hover:scale-110">
                                                <IconComponent className="h-3 w-3" />
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
        </div>
        
        <div className="ml-2 flex-shrink-0 self-center">
            <Button 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                aria-label={`Add ${item.name} to cart`}
                onClick={handleQuickAdd}
            >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
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
}

function MenuSection({
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
  onAddToCart: (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => void;
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
}

function OrderSummary({
  order,
  updateQuantity,
  removeFromOrder,
  clearOrder,
  currencySymbol,
  router
}: {
  order: OrderItem[];
  updateQuantity: (orderItemId: string, quantity: number) => void;
  removeFromOrder: (orderItemId: string) => void;
  clearOrder: () => void;
  currencySymbol: string;
  router: any;
}) {
  const { toast } = useToast();
  const { restaurantSettings, currentUser, createOrder } = useTenantData();
  const { tenantData } = useTenant();
  
  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = order.reduce(
    (acc, item) =>
      acc +
      (item.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity,
    0
  );
  const taxes = subtotal * (restaurantSettings?.taxRate || 0);
  
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

  // Generate time slots for advance orders
  React.useEffect(() => {
    if (selectedOrderType === 'advance' && advanceDate) {
      const slots: string[] = [];
      
      // Generate basic time slots from 9 AM to 9 PM
      for (let hour = 9; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }
      
      setTimeSlots(slots);
    }
  }, [selectedOrderType, advanceDate]);

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

  const finalTotal = subtotal + taxes + deliveryFee - voucherDiscount;

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
        items: order.map(item => ({
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
            addons: item.addons || [],
            characteristics: item.characteristics || [],
            nutrition: item.nutrition || undefined,
          },
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          selectedAddons: item.selectedAddons || [],
          specialInstructions: item.specialInstructions || '',
        })),
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
      };

      const orderResult = await createOrder(orderData);
      
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
          <Button variant="ghost" size="sm" onClick={clearOrder} className="text-xs sm:text-sm hover:bg-destructive/10 hover:text-destructive">
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Order Items - Collapsible on mobile */}
        <div className="lg:block">
          <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 lg:max-h-none overflow-y-auto">
            {order.map((item) => (
              <div key={item.orderItemId} className="flex items-start justify-between py-2 border-b last:border-b-0">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                  {item.selectedAddons.length > 0 && (
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">
                      {item.selectedAddons.map(addon => addon.name).join(', ')}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-xs sm:text-sm text-muted-foreground italic truncate">
                      Note: {item.specialInstructions}
                    </div>
                  )}
                  <div className="text-sm sm:text-base font-medium">
                    {currencySymbol}{((item.price + item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity).toFixed(2)}
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
                    className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => removeFromOrder(item.orderItemId)}
                    title="Remove item"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Advance Order Options */}
        {selectedOrderType === 'advance' && (
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <Label className="text-sm font-semibold">Fulfillment Type</Label>
            <RadioGroup value={advanceFulfillmentType} onValueChange={(value: any) => setAdvanceFulfillmentType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="advance-delivery" />
                <Label htmlFor="advance-delivery">Delivery</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="collection" id="advance-collection" />
                <Label htmlFor="advance-collection">Collection</Label>
              </div>
            </RadioGroup>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="advance-date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !advanceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {advanceDate ? format(advanceDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={advanceDate}
                      onSelect={setAdvanceDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="advance-time">Time</Label>
                <Select value={advanceTime} onValueChange={setAdvanceTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
              <Button variant="ghost" size="sm" onClick={handleRemoveVoucher}>
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
}

// Login Dialog Component
function LoginDialog({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const { login } = useTenantData();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
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
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Welcome Back</DialogTitle>
                    <DialogDescription>
                        Sign in to your account to access exclusive features and faster checkout.
                    </DialogDescription>
                </DialogHeader>
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
                            <Button type="submit" className="w-full">
                                Sign In
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="signup">
                        <div className="text-center text-muted-foreground">
                            <p>Sign up functionality coming soon!</p>
                        </div>
                    </TabsContent>
                </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// Header Component
function CustomerHeader() {
    const { currentUser, isAuthenticated, logout, restaurantSettings } = useTenantData();
    const { tenantData } = useTenant();

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
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
}

// Mobile Bottom Navigation Component
function MobileBottomNav({ 
  totalItems, 
  onCartClick, 
  onSearchClick,
  activeSection = 'menu' 
}: { 
  totalItems: number;
  onCartClick: () => void;
  onSearchClick: () => void;
  activeSection?: 'menu' | 'cart' | 'search' | 'account';
}) {
    const { currentUser, isAuthenticated } = useTenantData();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl lg:hidden">
            <div className="grid grid-cols-4 h-18 px-2">
                {/* Menu */}
                <button 
                    className={`flex flex-col items-center justify-center space-y-1.5 py-2 rounded-xl mx-1 transition-all duration-200 ${
                        activeSection === 'menu' 
                            ? 'text-primary bg-primary/15 shadow-sm' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <MenuIcon className="h-5 w-5" />
                    <span className="text-xs font-semibold">Menu</span>
                </button>

                {/* Search */}
                <button 
                    className={`flex flex-col items-center justify-center space-y-1.5 py-2 rounded-xl mx-1 transition-all duration-200 ${
                        activeSection === 'search' 
                            ? 'text-primary bg-primary/15 shadow-sm' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                    onClick={onSearchClick}
                >
                    <Search className="h-5 w-5" />
                    <span className="text-xs font-semibold">Search</span>
                </button>

                {/* Cart */}
                <button 
                    className={`flex flex-col items-center justify-center space-y-1.5 py-2 rounded-xl mx-1 transition-all duration-200 relative ${
                        activeSection === 'cart' 
                            ? 'text-primary bg-primary/15 shadow-sm' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                    onClick={onCartClick}
                >
                    <div className="relative">
                        <ShoppingBasket className="h-5 w-5" />
                        {totalItems > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-white border-2 border-white shadow-md">
                                {totalItems > 99 ? '99+' : totalItems}
                            </Badge>
                        )}
                    </div>
                    <span className="text-xs font-semibold">Cart</span>
                </button>

                {/* Account */}
                <button 
                    className={`flex flex-col items-center justify-center space-y-1.5 py-2 rounded-xl mx-1 transition-all duration-200 ${
                        activeSection === 'account' 
                            ? 'text-primary bg-primary/15 shadow-sm' 
                            : 'text-gray-600 hover:text-primary hover:bg-primary/5'
                    }`}
                >
                    <User className="h-5 w-5" />
                    <span className="text-xs font-semibold">{isAuthenticated ? 'Account' : 'Login'}</span>
                </button>
            </div>
        </div>
    );
}

// Floating Cart Button Component (for desktop/tablet)
function FloatingCartButton({ 
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
}

// Mobile Quick Search Component
function MobileQuickSearch({ 
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
}

// Enhanced Mobile Menu Item Component
function MobileMenuItem({ 
    item, 
    onAddToCart, 
    currencySymbol 
}: {
    item: MenuItemType;
    onAddToCart: (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => void;
    currencySymbol: string;
}) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const handleQuickAdd = () => {
        onAddToCart(item, [], 1, '');
    };

    return (
        <Card className="border-0 shadow-none hover:shadow-sm transition-all duration-200 bg-white rounded-xl overflow-hidden">
            <CardContent className="p-0">
                <div className="flex gap-3 p-4">
                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <h4 className="font-bold text-base leading-tight line-clamp-2 text-gray-900">
                            {item.name}
                        </h4>
                        {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        )}
                        
                        {/* Set Menu Items Display - Mobile */}
                        {item.isSetMenu && item.setMenuItems && item.setMenuItems.length > 0 && (
                            <div className="p-2.5 bg-primary/8 rounded-lg border border-primary/15">
                                <p className="text-xs font-bold text-primary mb-1">Set includes:</p>
                                <div className="text-xs text-gray-700 font-medium">
                                    {item.setMenuItems.map((setItem, index) => (
                                        <span key={setItem.id}>
                                            {setItem.quantity > 1 ? `${setItem.quantity}x ` : ''}{setItem.name}
                                            {index < item.setMenuItems!.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-lg font-bold text-primary">
                                {currencySymbol}{item.price.toFixed(2)}
                            </p>
                            <Button
                                size="sm"
                                onClick={handleQuickAdd}
                                className="rounded-full h-8 w-8 p-0 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                <Plus className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Image */}
                    {item.image && (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                data-ai-hint={item.imageHint}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Cover Image Section Component
function CoverImageSection() {
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
}

// Main Tenant Customer Interface Component
export default function TenantCustomerInterface() {
    const { getMenuWithCategoriesForCustomer, restaurantSettings, isLoading } = useTenantData();
    const { tenantData } = useTenant();
    const { toast } = useToast();
    const router = useRouter();
    
    const [order, setOrder] = React.useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

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

    const handleAddToCart = (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => {
        // Check if the same item with identical addons and instructions already exists
        const existingItemIndex = order.findIndex(orderItem => 
            orderItem.id === item.id &&
            orderItem.specialInstructions === instructions &&
            orderItem.selectedAddons.length === addons.length &&
            orderItem.selectedAddons.every(existingAddon => 
                addons.find(newAddon => newAddon.id === existingAddon.id)
            )
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
            const orderItem: OrderItem = {
                orderItemId: `${item.id}-${Date.now()}`,
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                categoryId: item.categoryId,
                available: item.available || true,
                selectedAddons: addons,
                quantity,
                specialInstructions: instructions,
                
                // Optional fields
                imageHint: item.imageHint,
                addons: item.addons,
                characteristics: item.characteristics,
                nutrition: item.nutrition,
            };

            setOrder(prev => [...prev, orderItem]);
            
            toast({
                title: 'Added to Cart',
                description: `${quantity}x ${item.name} added to your order.`,
            });
        }
    };

    const handleUpdateQuantity = (orderItemId: string, quantity: number) => {
        if (quantity <= 0) {
            setOrder(prev => prev.filter(item => item.orderItemId !== orderItemId));
            return;
        }
        
        setOrder(prev => prev.map(item => 
            item.orderItemId === orderItemId ? { ...item, quantity } : item
        ));
    };

    const handleRemoveFromOrder = (orderItemId: string) => {
        setOrder(prev => prev.filter(item => item.orderItemId !== orderItemId));
    };

    const handleClearOrder = () => {
        setOrder([]);
    };

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
                    <CustomerHeader />
                    <CoverImageSection />
                </div>

                {/* Mobile App-like Header */}
                <div className="lg:hidden bg-gradient-to-r from-white to-gray-50 shadow-sm sticky top-0 z-50 border-b border-gray-100">
                    <div className="flex items-center p-4">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {restaurantSettings?.logo && (
                                <div className="relative">
                                    <img 
                                        src={restaurantSettings.logo} 
                                        alt="Restaurant Logo"
                                        className="h-10 w-10 rounded-xl object-cover flex-shrink-0 ring-2 ring-primary/10"
                                    />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h1 className="font-bold text-lg text-gray-900 truncate leading-tight">{restaurantSettings?.name || 'Restaurant'}</h1>
                                <p className="text-sm text-gray-600 truncate font-medium">{restaurantSettings?.description || 'Delicious food awaits'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* All-device Menu Categories Nav - Always Sticky */}
                <MenuNav menuData={menuData} />
                
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                    {/* Mobile App Layout */}
                    <div className="lg:hidden min-h-screen bg-gradient-to-b from-gray-50 to-white">
                        {/* Mobile Menu with enhanced items */}
                        <div className="space-y-4 pb-24">
                            {filteredMenuData.map((categoryData) => (
                                <div key={categoryData.category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div id={`cat-${categoryData.category.id}`} className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-1 w-8 bg-primary rounded-full"></div>
                                            <h2 className="text-lg font-bold text-gray-900">{categoryData.category.name}</h2>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {categoryData.items?.filter(item => 
                                            searchQuery === '' || 
                                            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map((item) => (
                                            <MobileMenuItem
                                                key={item.id}
                                                item={item}
                                                onAddToCart={handleAddToCart}
                                                currencySymbol={currencySymbol}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Cart Button */}
                        <FloatingCartButton 
                            totalItems={order.reduce((sum, item) => sum + item.quantity, 0)}
                            totalAmount={order.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
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
                            totalItems={order.reduce((sum, item) => sum + item.quantity, 0)}
                            onCartClick={() => {
                                const cartElement = document.getElementById('mobile-cart');
                                if (cartElement) {
                                    cartElement.classList.toggle('translate-y-full');
                                }
                            }}
                            onSearchClick={() => {
                                // Open search modal or focus search input
                                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                if (searchInput) {
                                    searchInput.focus();
                                }
                            }}
                        />

                        {/* Hidden Cart Summary for mobile - slides up when needed */}
                        <div id="mobile-cart" className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl transform translate-y-full transition-transform duration-300 z-40 rounded-t-3xl overflow-hidden">
                            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2"></div>
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
