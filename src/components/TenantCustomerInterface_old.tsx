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
        <nav className="sticky top-20 z-30 w-full bg-background/95 backdrop-blur-sm shadow-md">
            <div className="container mx-auto flex items-center justify-center p-2 overflow-x-auto">
                <div className="flex gap-2">
                    {menuData.map(({ category }) => (
                        <Button 
                            asChild 
                            key={category.id} 
                            variant={activeCategory === category.id ? 'default' : 'secondary'} 
                            className="flex-shrink-0 font-bold tracking-wide transition-colors"
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
        className="flex items-start justify-between p-4 rounded-lg border transition-shadow hover:shadow-md cursor-pointer group"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-start gap-4 flex-grow">
          {hasImage && (
            <div className="relative h-20 w-20 flex-shrink-0">
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    data-ai-hint={item.imageHint}
                    fill
                    className="rounded-md object-cover"
                />
            </div>
          )}
          <div className="flex-grow">
              <h4 className="font-bold text-lg">{item.name}</h4>
              <p className="text-sm text-muted-foreground mt-1 text-balance">{item.description}</p>
              <div className="flex justify-between items-end mt-2">
                <p className="text-md font-bold text-primary">
                  {pricePrefix}{currencySymbol}{typeof displayPrice === 'number' ? displayPrice.toFixed(2) : displayPrice}
                </p>
        {item.characteristics && item.characteristics.length > 0 && (
            <div className="flex flex-wrap gap-1">
                <TooltipProvider>
                    {item.characteristics.map(charId => {
                        const IconComponent = getIconComponent(charId, Utensils);
                        
                        return (
                            <Tooltip key={charId}>
                                <TooltipTrigger>
                                    <div className="transition-transform hover:scale-110">
                                        <IconComponent />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{charId}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </div>
        )}
              </div>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0 self-center">
            <Button size="icon" className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" aria-label={`View options for ${item.name}`}>
                <Plus className="h-5 w-5" />
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
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-grow">
                <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Utensils className="h-6 w-6" /> Menu
                </CardTitle>
                <CardDescription>
                Explore our delicious offerings. All dishes are prepared with the
                freshest ingredients.
                </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search menu..."
                    className="pl-10"
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
              <AccordionTrigger className="font-headline text-xl scroll-mt-40 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md px-4 font-bold hover:no-underline">
                {category.name}
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                         <h4 className="font-headline text-lg text-muted-foreground pl-4 border-l-2 border-primary mb-4">{subCat.name}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
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
                <p className="font-semibold">No items found for "{searchQuery}"</p>
                <p className="text-sm">Try a different search term.</p>
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
  const { restaurantSettings, currentUser, createOrder, deliveryZones, vouchers } = useTenantData();
  
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card' | 'voucher'>('cash');
  const [voucherInput, setVoucherInput] = React.useState('');
  const [voucherError, setVoucherError] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<Voucher | null>(null);
  
  React.useEffect(() => {
    if (selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) {
      // Calculate delivery fee based on postcode
      if (postcode && deliveryZones) {
        const zone = deliveryZones.find(z => 
          z.postcodes.some(pc => 
            postcode.toLowerCase().startsWith(pc.toLowerCase())
          )
        );
        setDeliveryFee(zone?.fee || 0);
      }
    } else {
      setDeliveryFee(0);
    }
  }, [selectedOrderType, advanceFulfillmentType, postcode, deliveryZones]);

  // Generate time slots for advance orders
  React.useEffect(() => {
    if (selectedOrderType === 'advance' && advanceDate) {
      const slots: string[] = [];
      
      // Get opening hours for the selected date
      const dayOfWeek = advanceDate.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek] as keyof OpeningHoursPerDay;
      
      const openingHours = restaurantSettings?.openingHours?.[dayName];
      
      if (openingHours?.isOpen && openingHours.openTime && openingHours.closeTime) {
        const [openHour, openMinute] = openingHours.openTime.split(':').map(Number);
        const [closeHour, closeMinute] = openingHours.closeTime.split(':').map(Number);
        
        // Generate 30-minute slots
        for (let hour = openHour; hour < closeHour || (hour === closeHour && 0 < closeMinute); hour++) {
          for (let minute = (hour === openHour ? openMinute : 0); minute < 60; minute += 30) {
            if (hour === closeHour && minute >= closeMinute) break;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeString);
          }
        }
      }
      
      setTimeSlots(slots);
    }
  }, [selectedOrderType, advanceDate, restaurantSettings?.openingHours]);

  const voucherDiscount = appliedVoucher ? Math.min(appliedVoucher.discountAmount, subtotal) : 0;
  const finalTotal = subtotal + taxes + deliveryFee - voucherDiscount;

  const handleApplyVoucher = () => {
    if (!voucherInput.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    const voucher = vouchers?.find(v => v.code.toLowerCase() === voucherInput.toLowerCase());
    
    if (!voucher) {
      setVoucherError('Invalid voucher code');
      return;
    }

    if (!voucher.isActive) {
      setVoucherError('This voucher is no longer active');
      return;
    }

    if (new Date(voucher.expiryDate) < new Date()) {
      setVoucherError('This voucher has expired');
      return;
    }

    if (voucher.minimumOrderValue && subtotal < voucher.minimumOrderValue) {
      setVoucherError(`Minimum order value of ${currencySymbol}${voucher.minimumOrderValue.toFixed(2)} required`);
      return;
    }

    setAppliedVoucher(voucher);
    setVoucherError('');
    toast({
      title: 'Voucher Applied!',
      description: `You saved ${currencySymbol}${Math.min(voucher.discountAmount, subtotal).toFixed(2)}`,
    });
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

      const orderData: Omit<Order, 'id' | 'createdAt' | 'status'> = {
        customerName,
        customerPhone,
        customerEmail,
        address: selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery') 
          ? `${formData.get('address')}, ${formData.get('city')}, ${formData.get('postcode')}` 
          : 'Collection',
        total: finalTotal,
        orderType: selectedOrderType,
        fulfillmentType: selectedOrderType === 'advance' ? advanceFulfillmentType : selectedOrderType,
        paymentMethod: selectedPaymentMethod,
        items: order,
        notes: formData.get('notes') as string || '',
        advanceDateTime: selectedOrderType === 'advance' && advanceDate && advanceTime 
          ? new Date(`${advanceDate.toISOString().split('T')[0]}T${advanceTime}:00`) 
          : undefined,
        deliveryFee,
        taxes,
        voucherCode: appliedVoucher?.code,
        voucherDiscount,
      };

      await createOrder(orderData);
      
      toast({
        title: 'Order Placed Successfully!',
        description: `Your ${selectedOrderType} order has been confirmed.`,
      });

      // Clear the order
      clearOrder();
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Order Failed',
        description: 'There was an error placing your order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (order.length === 0) {
    return (
      <Card className="sticky top-24">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ShoppingBasket className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Your basket is empty</h3>
          <p className="text-muted-foreground text-center">
            Add items from the menu to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5" />
            Your Order ({totalItems} items)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearOrder}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {order.map((item) => (
            <div key={item.orderItemId} className="flex items-start justify-between py-2 border-b last:border-b-0">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                {item.selectedAddons.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {item.selectedAddons.map(addon => addon.name).join(', ')}
                  </div>
                )}
                {item.specialInstructions && (
                  <div className="text-sm text-muted-foreground italic">
                    Note: {item.specialInstructions}
                  </div>
                )}
                <div className="text-sm font-medium">
                  {currencySymbol}{((item.price + item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.orderItemId, item.quantity - 1)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.orderItemId, item.quantity + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeFromOrder(item.orderItemId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
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
                title: '❌ Login Failed', 
                description: '⚠️ An error occurred during login. Please try again.',
                duration: 5000
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <Tabs defaultValue="login">
                    <DialogHeader>
                        <DialogTitle>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                            </TabsList>
                        </DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Access your account or create a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-login">Email</Label>
                                <Input 
                                    id="email-login" 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="me@example.com" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-login">Password</Label>
                                <Input 
                                    id="password-login" 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    required 
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full">Log In</Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    <TabsContent value="signup">
                        <div className="space-y-4 py-4">
                            <p className="text-center text-sm text-muted-foreground">
                                Sign-up functionality is coming soon! Please use the demo login credentials for now.
                            </p>
                            <div className="text-xs text-center p-2 bg-muted rounded-md">
                                <p>Demo Email: <b>customer@example.com</b></p>
                                <p>Password: <b>password123</b></p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// Header Component
function Header() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { isAuthenticated, currentUser, logout, restaurantSettings } = useTenantData();
    const { tenantData } = useTenant();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm transition-all duration-300',
                isScrolled ? 'border-b shadow-sm' : ''
            )}
        >
            <div className="container mx-auto flex h-20 items-center justify-between p-4">
                <div className="flex items-center gap-2">
                    {restaurantSettings?.logo ? (
                        <img 
                            src={restaurantSettings.logo} 
                            alt={restaurantSettings.name} 
                            className="h-8 w-8 rounded-full object-cover" 
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {tenantData?.name?.charAt(0) || 'R'}
                            </span>
                        </div>
                    )}
                    <h1 className="font-headline text-3xl font-bold text-foreground">
                        {restaurantSettings?.name || tenantData?.name || 'Restaurant'}
                    </h1>
                </div>
                <div>
                    {isAuthenticated && currentUser ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    <span>Hi, {currentUser.name.split(' ')[0]}</span>
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
                            <Button variant="ghost">
                                <LogIn className="mr-2 h-4 w-4"/>
                                Login / Sign Up
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
    const { getMenuWithCategories, restaurantSettings, isLoading, createOrder } = useTenantData();
    const { tenantData } = useTenant();
    const { toast } = useToast();
    
    const [cart, setCart] = React.useState<OrderItem[]>([]);
    const [showCart, setShowCart] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const menuData = getMenuWithCategories();
    const filteredMenuData = React.useMemo(() => {
        if (!searchTerm) return menuData;
        
        return menuData.map(categoryData => ({
            ...categoryData,
            items: categoryData.items.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(categoryData => categoryData.items.length > 0);
    }, [menuData, searchTerm]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = (menuItem: MenuItemType, quantity: number = 1) => {
        const cartItem: OrderItem = {
            ...menuItem, // Spread the menu item properties
            orderItemId: `${menuItem.id}-${Date.now()}`,
            quantity,
            selectedAddons: [],
            specialInstructions: '',
        };

        setCart(prev => [...prev, cartItem]);
        toast({
            title: 'Added to Cart',
            description: `${quantity}x ${menuItem.name} added to your cart.`,
        });
    };

    const handleRemoveFromCart = (itemId: string) => {
        setCart(prev => prev.filter(item => item.orderItemId !== itemId));
    };

    const handleUpdateCartQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(itemId);
            return;
        }
        
        setCart(prev => prev.map(item => 
            item.orderItemId === itemId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const orderData: Omit<Order, 'id' | 'createdAt' | 'status'> = {
                customerName: currentUser?.name || 'Guest Customer',
                customerPhone: currentUser?.phone || '',
                customerEmail: currentUser?.email || '',
                address: '',
                items: cart.map(item => ({
                    id: item.orderItemId,
                    quantity: item.quantity,
                    menuItem: {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        imageUrl: item.imageUrl,
                        imageHint: item.imageHint,
                        available: item.available,
                        categoryId: item.categoryId,
                        addons: item.addons,
                        characteristics: item.characteristics,
                        nutrition: item.nutrition
                    } as MenuItemType,
                    selectedAddons: item.selectedAddons || [],
                    specialInstructions: item.specialInstructions
                })),
                total: cartTotal,
                orderType: 'pickup',
                isAdvanceOrder: false,
                subtotal: cartTotal,
                deliveryFee: 0,
                discount: 0,
                tax: cartTotal * (restaurantSettings?.taxRate || 0.2),
                voucherCode: '',
                printed: false,
                paymentMethod: 'cash'
            };

            await createOrder(orderData);
            setCart([]);
            setShowCart(false);
            toast({
                title: 'Order Placed!',
                description: 'Your order has been placed successfully.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Order Failed',
                description: 'There was an error placing your order. Please try again.',
            });
        }
    };

    const { currentUser } = useTenantData();

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
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                
                {/* Search Bar */}
                <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-sm border-b">
                    <div className="container mx-auto p-4">
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search menu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Menu Navigation */}
                {filteredMenuData.length > 0 && <MenuNav menuData={filteredMenuData} />}

                {/* Menu Content */}
                <main className="container mx-auto p-4 pb-24">
                    {filteredMenuData.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-800">Welcome to {tenantData?.name}!</h2>
                                <p className="text-muted-foreground">
                                    {searchTerm ? 'No items found matching your search.' : 'Our menu is being updated. Please check back soon!'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredMenuData.map(({ category, items }) => (
                            <section key={category.id} id={`cat-${category.id}`} className="mb-12">
                                <div className="mb-6">
                                    <h2 className="font-headline text-3xl font-bold mb-2">{category.name}</h2>
                                    {category.description && (
                                        <p className="text-muted-foreground">{category.description}</p>
                                    )}
                                </div>
                                
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {items.map((item) => (
                                        <Card 
                                            key={item.id} 
                                            className="overflow-hidden hover:shadow-lg transition-all duration-300"
                                        >
                                            {item.imageUrl && !item.imageUrl.includes('placehold.co') && (
                                                <div className="relative h-48">
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        data-ai-hint={item.imageHint}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-semibold text-lg">{item.name}</h3>
                                                    <span className="text-lg font-bold text-primary">
                                                        {getCurrencySymbol(restaurantSettings?.currency)}{item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <p className="text-muted-foreground text-sm mb-3">{item.description}</p>
                                                )}
                                                {item.characteristics && item.characteristics.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {item.characteristics.slice(0, 3).map((char) => (
                                                            <Badge key={char} variant="outline" className="text-xs">
                                                                {char}
                                                            </Badge>
                                                        ))}
                                                        {item.characteristics.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{item.characteristics.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                                <Button 
                                                    size="sm" 
                                                    className="w-full"
                                                    onClick={() => handleAddToCart(item, 1)}
                                                    disabled={!item.available}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {item.available ? 'Add to Cart' : 'Unavailable'}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </main>

                {/* Floating Cart Button */}
                {cartItemCount > 0 && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <Button
                            size="lg"
                            onClick={() => setShowCart(true)}
                            className="rounded-full shadow-lg"
                        >
                            <ShoppingBasket className="mr-2 h-5 w-5" />
                            {cartItemCount} items • {getCurrencySymbol(restaurantSettings?.currency)}{cartTotal.toFixed(2)}
                        </Button>
                    </div>
                )}

                {/* Cart Sidebar */}
                <Dialog open={showCart} onOpenChange={setShowCart}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Your Cart</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.orderItemId} className="flex items-center gap-3 p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {getCurrencySymbol(restaurantSettings?.currency)}{item.price.toFixed(2)} each
                                            </p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    Note: {item.specialInstructions}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleUpdateCartQuantity(item.orderItemId, item.quantity - 1)}
                                            >
                                                <MinusCircle className="h-4 w-4" />
                                            </Button>
                                            <span className="w-8 text-center">{item.quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleUpdateCartQuantity(item.orderItemId, item.quantity + 1)}
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveFromCart(item.orderItemId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <DialogFooter className="flex-col gap-4">
                                <div className="flex justify-between items-center w-full text-lg font-bold">
                                    <span>Total:</span>
                                    <span>{getCurrencySymbol(restaurantSettings?.currency)}{cartTotal.toFixed(2)}</span>
                                </div>
                                <Button onClick={handleCheckout} className="w-full">
                                    Place Order
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
