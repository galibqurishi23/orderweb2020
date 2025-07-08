'use client';

import * as React from 'react';
import Image from 'next/image';
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
                    // Offset to account for sticky header and nav bar
                    if (rect.top <= 220) { 
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
        <nav className="sticky top-16 sm:top-20 z-30 w-full bg-background/95 backdrop-blur-sm shadow-md">
            <div className="container mx-auto flex items-center justify-center p-2 overflow-x-auto">
                <div className="flex gap-1 sm:gap-2">
                    {menuData.map(({ category }) => (
                        <Button 
                            asChild 
                            key={category.id} 
                            variant={activeCategory === category.id ? 'default' : 'secondary'} 
                            className="flex-shrink-0 font-bold tracking-wide transition-colors text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-auto"
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
          {item.imageUrl && !item.imageUrl.includes('placehold.co') && (
            <div className="relative h-48 -mx-6 -mt-6 mb-4">
              <Image src={item.imageUrl} alt={item.name} data-ai-hint={item.imageHint} fill className="rounded-t-lg object-cover" />
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
                      <p className="text-sm text-muted-foreground">+{currencySymbol}{addon.price.toFixed(2)}</p>
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
  const hasImage = item.imageUrl && !item.imageUrl.includes('placehold.co');

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

  return (
    <>
      <div 
        className="flex items-start justify-between p-3 sm:p-4 rounded-lg border transition-shadow hover:shadow-md cursor-pointer group"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-start gap-3 sm:gap-4 flex-grow min-w-0">
          {hasImage && (
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    data-ai-hint={item.imageHint}
                    fill
                    className="rounded-md object-cover"
                />
            </div>
          )}
          <div className="flex-grow min-w-0">
              <h4 className="font-bold text-base sm:text-lg leading-tight">{item.name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-balance line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-end mt-2 gap-2">
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
                                                <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
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
        
        <div className="ml-2 sm:ml-4 flex-shrink-0 self-center">
            <Button size="icon" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" aria-label={`View options for ${item.name}`}>
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 font-headline text-xl sm:text-2xl">
                <Utensils className="h-5 w-5 sm:h-6 sm:w-6" /> Menu
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                Explore our delicious offerings. All dishes are prepared with the
                freshest ingredients.
                </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search menu..."
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={accordionDefaultValue} className="w-full space-y-1">
          {menuData.map(({ category, items, subCategories }) => (
            <AccordionItem
              key={category.id}
              value={category.name}
              id={`cat-${category.id}`}
              className="border-none mb-2"
            >
              <AccordionTrigger className="font-headline text-lg sm:text-xl scroll-mt-40 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md px-3 sm:px-4 py-2 sm:py-3 font-bold hover:no-underline">
                {category.name}
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
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
                  <div className="mt-6 space-y-4">
                    {subCategories.map(({ category: subCat, items: subItems }) => (
                       <div key={subCat.id}>
                         <h4 className="font-headline text-base sm:text-lg text-muted-foreground pl-4 border-l-2 border-primary mb-4">{subCat.name}</h4>
                         <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 pl-4">
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
          ))}
        </Accordion>
         {menuData.length === 0 && searchQuery && (
            <div className="text-center py-10 text-muted-foreground">
                <p className="font-semibold text-sm sm:text-base">No items found for "{searchQuery}"</p>
                <p className="text-xs sm:text-sm">Try a different search term.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderSummary({
  order,
  updateQuantity,
  removeFromOrder,
  clearOrder,
  currencySymbol
}: {
  order: OrderItem[];
  updateQuantity: (orderItemId: string, quantity: number) => void;
  removeFromOrder: (orderItemId: string) => void;
  clearOrder: () => void;
  currencySymbol: string;
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

  const defaultOrderType = availableOrderTypes.length > 0 ? availableOrderTypes[0] : 'delivery';
  
  const [selectedOrderType, setSelectedOrderType] = React.useState<'delivery' | 'collection' | 'advance'>(defaultOrderType);
  const [advanceFulfillmentType, setAdvanceFulfillmentType] = React.useState<'delivery' | 'collection'>('delivery');
  
  const [advanceDate, setAdvanceDate] = React.useState<Date | undefined>();
  const [advanceTime, setAdvanceTime] = React.useState('');
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  
  const [postcode, setPostcode] = React.useState(currentUser?.addresses?.find(a => a.isDefault)?.postcode || '');
  const [deliveryFee, setDeliveryFee] = React.useState(0);
  const [deliveryError, setDeliveryError] = React.useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card' | 'voucher'>('cash');
  const [voucherInput, setVoucherInput] = React.useState('');
  const [voucherError, setVoucherError] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<Voucher | null>(null);
  
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
            description: 'Please provide complete delivery address.',
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
            imageUrl: item.imageUrl || '',
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
      };

      await createOrder(orderData);
      
      // Increment voucher usage if a voucher was applied
      if (appliedVoucher && tenantData?.id) {
        try {
          await TenantVoucherService.incrementVoucherUsage(tenantData.id, appliedVoucher.id);
        } catch (error) {
          console.error('Error incrementing voucher usage:', error);
          // Don't fail the order if voucher update fails
        }
      }
      
      toast({
        title: 'Order Placed Successfully!',
        description: `Your ${selectedOrderType} order has been confirmed.`,
      });

      // Clear the order and reset voucher
      clearOrder();
      setAppliedVoucher(null);
      setVoucherInput('');
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Order Failed',
        description: 'There was an error placing your order. Please try again.',
        variant: 'destructive',
      });
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ShoppingBasket className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Your Order ({totalItems} items)</span>
            <span className="sm:hidden">Order ({totalItems})</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearOrder} className="text-xs sm:text-sm">
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
                    className="h-6 w-6 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                    onClick={() => removeFromOrder(item.orderItemId)}
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
          {taxes > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax ({((restaurantSettings?.taxRate || 0) * 100).toFixed(1)}%):</span>
              <span>{currencySymbol}{taxes.toFixed(2)}</span>
            </div>
          )}
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
            <Button className="w-full" size="lg">
              Place Order - {currencySymbol}{finalTotal.toFixed(2)}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <form action={handlePlaceOrder}>
              <DialogHeader>
                <DialogTitle>Checkout</DialogTitle>
                <DialogDescription>
                  Enter your details to complete the order.
                </DialogDescription>
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
                            <Input id="postcode" name="postcode" placeholder="SW1A 1AA" defaultValue={postcode} required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} />
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
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash">Cash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card">Card</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="voucher" id="voucher" />
                      <Label htmlFor="voucher">Voucher</Label>
                    </div>
                  </RadioGroup>
                </div>
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
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm sm:text-lg">
                            {tenantData?.name?.charAt(0) || 'R'}
                        </span>
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

// Main Tenant Customer Interface Component
export default function TenantCustomerInterface() {
    const { getMenuWithCategories, restaurantSettings, isLoading } = useTenantData();
    const { tenantData } = useTenant();
    const { toast } = useToast();
    
    const [order, setOrder] = React.useState<OrderItem[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Process menu data to match customer page structure
    const menuItems = getMenuWithCategories();
    
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
        const orderItem: OrderItem = {
            orderItemId: `${item.id}-${Date.now()}`,
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
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
                <CustomerHeader />
                <MenuNav menuData={menuData} />
                
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
                    {/* Mobile Layout: Stack vertically */}
                    <div className="lg:hidden space-y-6">
                        {/* Mobile Cart Summary - Collapsible */}
                        <div className="sticky top-[140px] z-30 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
                            <OrderSummary
                                order={order}
                                updateQuantity={handleUpdateQuantity}
                                removeFromOrder={handleRemoveFromOrder}
                                clearOrder={handleClearOrder}
                                currencySymbol={currencySymbol}
                            />
                        </div>
                        {/* Mobile Menu */}
                        <div className="px-2">
                            <MenuSection
                                menuData={filteredMenuData}
                                onAddToCart={handleAddToCart}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                currencySymbol={currencySymbol}
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
                            <div className="sticky top-24 space-y-4">
                                <OrderSummary
                                    order={order}
                                    updateQuantity={handleUpdateQuantity}
                                    removeFromOrder={handleRemoveFromOrder}
                                    clearOrder={handleClearOrder}
                                    currencySymbol={currencySymbol}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
