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
import { useData } from '@/context/DataContext';
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
        <div className="py-4 space-y-6 max-h-[40vh] overflow-y-auto pr-2">            {item.characteristics && item.characteristics.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></span>
                        Dietary Information
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {item.characteristics.map(charId => {
                            // For now, since we don't have characteristics data, just show the ID
                            // This can be enhanced later when characteristics system is re-implemented
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
                        // For now, since we don't have characteristics data, just show the ID
                        // This can be enhanced later when characteristics system is re-implemented
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
  const { restaurantSettings, currentUser, createOrder, deliveryZones, vouchers } = useData();
  
  const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = order.reduce(
    (acc, item) =>
      acc +
      (item.price + item.selectedAddons.reduce((a, ad) => a + ad.price, 0)) * item.quantity,
    0
  );
  const taxes = subtotal * restaurantSettings.taxRate;
  
  const availableOrderTypes = React.useMemo(() => [
        restaurantSettings.orderTypeSettings?.deliveryEnabled && 'delivery',
        restaurantSettings.orderTypeSettings?.collectionEnabled && 'collection',
        restaurantSettings.orderTypeSettings?.advanceOrderEnabled && 'advance',
    ].filter(Boolean) as ('delivery' | 'collection' | 'advance')[], [restaurantSettings]);

  const defaultOrderType = availableOrderTypes.length > 0 ? availableOrderTypes[0] : 'delivery';
  
  const [selectedOrderType, setSelectedOrderType] = React.useState<'delivery' | 'collection' | 'advance'>(defaultOrderType);
  const [advanceFulfillmentType, setAdvanceFulfillmentType] = React.useState<'delivery' | 'collection'>('delivery');
  
  const [advanceDate, setAdvanceDate] = React.useState<Date | undefined>();
  const [advanceTime, setAdvanceTime] = React.useState('');
  const [timeSlots, setTimeSlots] = React.useState<string[]>([]);
  
  const [postcode, setPostcode] = React.useState(currentUser?.addresses.find(a => a.isDefault)?.postcode || '');
  const [deliveryFee, setDeliveryFee] = React.useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<'cash' | 'card' | 'voucher'>('cash');
  const [voucherInput, setVoucherInput] = React.useState('');
  const [voucherError, setVoucherError] = React.useState('');
  const [appliedVoucher, setAppliedVoucher] = React.useState<Voucher | null>(null);
  
  React.useEffect(() => {
    if (selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) {
      const pc = postcode.trim().toUpperCase();
      const zone = deliveryZones.find(z => z.postcodes.includes(pc));
      setDeliveryFee(zone ? zone.deliveryFee : 0);
    } else {
      setDeliveryFee(0);
    }
  }, [postcode, deliveryZones, selectedOrderType, advanceFulfillmentType]);

  // Calculate discount if voucher is applied
  const discount = React.useMemo(() => {
    if (!appliedVoucher) return 0;
    if (subtotal < appliedVoucher.minOrder) return 0;
    if (appliedVoucher.type === 'amount') {
      return Math.min(appliedVoucher.value, appliedVoucher.maxDiscount || appliedVoucher.value, subtotal);
    } else if (appliedVoucher.type === 'percentage') {
      const percent = subtotal * (appliedVoucher.value / 100);
      return Math.min(percent, appliedVoucher.maxDiscount || percent, subtotal);
    }
    return 0;
  }, [appliedVoucher, subtotal]);
  const total = subtotal + taxes + deliveryFee - discount;

  React.useEffect(() => {
    if (!advanceDate || !restaurantSettings) {
        setTimeSlots([]);
        setAdvanceTime('');
        return;
    }

    const dayOfWeek = format(advanceDate, 'EEEE').toLowerCase() as keyof typeof restaurantSettings.openingHours;
    const daySettings = restaurantSettings.openingHours[dayOfWeek];

    const generateTimeSlots = (daySettings: OpeningHoursPerDay) => {
        const slots: string[] = [];
        if (daySettings.closed) return slots;
        const interval = 15; // 15-minute intervals

        const addSlots = (open?: string, close?: string) => {
            if (!open || !close) return;
            
            let currentTime = new Date(`1970-01-01T${open}:00`);
            const endTime = new Date(`1970-01-01T${close}:00`);

            while (currentTime < endTime) {
                slots.push(currentTime.toTimeString().substring(0, 5));
                currentTime.setMinutes(currentTime.getMinutes() + interval);
            }
        };

        addSlots(daySettings.morningOpen, daySettings.morningClose);
        addSlots(daySettings.eveningOpen, daySettings.eveningClose);
        
        return slots;
    };

    const newSlots = generateTimeSlots(daySettings);
    setTimeSlots(newSlots);
    setAdvanceTime(''); // Reset time when date changes
  }, [advanceDate, restaurantSettings]);


  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const isDeliveryRequired = selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery');

    if (isDeliveryRequired) {
        const zone = deliveryZones.find(z => z.postcodes.includes(postcode.trim().toUpperCase()));
        if (!zone) {
            toast({
                variant: 'destructive',
                title: 'Invalid Postcode',
                description: 'Sorry, we do not deliver to this area.',
            });
            return;
        }
    }

    if (selectedOrderType === 'advance' && (!advanceDate || !advanceTime)) {
        toast({
            variant: 'destructive',
            title: 'Incomplete Information',
            description: 'Please select a date and time for your advance order.',
        });
        return;
    }

    let scheduledTime: Date | undefined;
    if (selectedOrderType === 'advance' && advanceDate && advanceTime) {
        const [hours, minutes] = advanceTime.split(':').map(Number);
        scheduledTime = new Date(advanceDate);
        scheduledTime.setHours(hours, minutes);
    }

    const newOrder: Omit<Order, 'id' | 'createdAt' | 'status'> = {
      customerName: formData.get('name') as string,
      customerPhone: formData.get('phone') as string,
      address: formData.get('address') as string,
      items: order.map(oi => ({
        id: oi.id,
        quantity: oi.quantity,
        menuItem: oi,
        selectedAddons: oi.selectedAddons,
        specialInstructions: oi.specialInstructions,
      })),
      total,
      subtotal,
      tax: taxes,
      deliveryFee: deliveryFee,
      isAdvanceOrder: selectedOrderType === 'advance',
      orderType: selectedOrderType,
      scheduledTime,
      printed: false,
      customerId: currentUser?.id,
      discount,
      voucherCode: appliedVoucher?.code,
      paymentMethod: selectedPaymentMethod, // <-- add this
    };

    await createOrder(newOrder);

    toast({
      title: 'Order Placed!',
      description: `Thank you for your order. We've received your details.`,
    });
    clearOrder();
    const closeButton = document.getElementById('checkout-dialog-close');
    closeButton?.click();
  };

  const handleApplyVoucher = () => {
    setVoucherError('');
    const code = voucherInput.trim();
    const voucher = vouchers.find(v => v.code.toLowerCase() === code.toLowerCase() && v.active && subtotal >= v.minOrder && (!v.expiryDate || new Date(v.expiryDate) > new Date()));
    if (!voucher) {
      setVoucherError('Invalid or expired voucher code, or minimum order not met.');
      setAppliedVoucher(null);
      return;
    }
    setAppliedVoucher(voucher);
    setVoucherError('');
    toast({ title: 'Voucher applied!', description: `Discount: ${voucher.type === 'amount' ? currencySymbol + voucher.value : voucher.value + '%'}` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-headline text-2xl">
          <span>Your Order</span>
           {totalItems > 0 && (
            <Badge variant="secondary" className="flex h-7 w-7 items-center justify-center rounded-full p-0 text-base font-bold">
              {totalItems}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review your items before checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[300px] space-y-4 overflow-y-auto">
        {order.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <ShoppingBasket className="h-12 w-12 mb-4" />
            <p className="font-semibold">Your basket is empty</p>
            <p className="text-sm">Add items from the menu to get started.</p>
          </div>
        ) : (
          order.map((item) => (
            <div key={item.orderItemId} className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                 {item.selectedAddons.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {item.selectedAddons.map(a => `+ ${a.name}`).join(', ')}
                  </p>
                )}
                {item.specialInstructions && (
                    <p className="text-xs text-muted-foreground italic">Note: {item.specialInstructions}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {currencySymbol}{(item.price + item.selectedAddons.reduce((sum, addon) => sum + addon.price, 0)).toFixed(2)} each
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(item.orderItemId, item.quantity - 1)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
                <span>{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(item.orderItemId, item.quantity + 1)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeFromOrder(item.orderItemId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
      {order.length > 0 && (
        <CardFooter className="flex-col space-y-4">
          <Separator />
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
             <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{currencySymbol}{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes ({restaurantSettings.taxRate * 100}%)</span>
              <span>{currencySymbol}{taxes.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success font-semibold">
                <span>Voucher Discount</span>
                <span>-{currencySymbol}{discount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{currencySymbol}{total.toFixed(2)}</span>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full font-headline"
                disabled={order.length === 0}
              >
                Checkout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-headline">Checkout</DialogTitle>
                <DialogDescription>
                  Enter your details to complete the order.
                </DialogDescription>
                <DialogTrigger asChild>
                  <button id="checkout-dialog-close" className="hidden" />
                </DialogTrigger>
              </DialogHeader>
              <form onSubmit={handleCheckout} className="space-y-4">
                 <div className="space-y-2">
                    <Label>How would you like your order?</Label>
                    <RadioGroup value={selectedOrderType} onValueChange={(v) => setSelectedOrderType(v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {availableOrderTypes.includes('delivery') && (
                        <div>
                            <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                            <Label htmlFor="delivery" className="flex h-16 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Delivery</Label>
                        </div>
                        )}
                         {availableOrderTypes.includes('collection') && (
                        <div>
                            <RadioGroupItem value="collection" id="collection" className="peer sr-only" />
                            <Label htmlFor="collection" className="flex h-16 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Collection</Label>
                        </div>
                        )}
                        {availableOrderTypes.includes('advance') && (
                        <div>
                            <RadioGroupItem value="advance" id="advance" className="peer sr-only" />
                            <Label htmlFor="advance" className="flex h-16 items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-center hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Advance Order</Label>
                        </div>
                        )}
                    </RadioGroup>
                </div>

                {selectedOrderType === 'advance' && (
                    <div className="space-y-4 rounded-md border p-4">
                        <Label>Fulfillment for Advance Order</Label>
                        <RadioGroup value={advanceFulfillmentType} onValueChange={(v) => setAdvanceFulfillmentType(v as any)} className="flex space-x-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="delivery" id="adv-delivery" />
                                <Label htmlFor="adv-delivery" className="font-normal">Delivery</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="collection" id="adv-collection" />
                                <Label htmlFor="adv-collection" className="font-normal">Collection</Label>
                            </div>
                        </RadioGroup>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                                <Label htmlFor="advance-date">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="advance-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !advanceDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {advanceDate ? format(advanceDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={advanceDate}
                                            onSelect={setAdvanceDate}
                                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label htmlFor="advance-time">Time</Label>
                                <Select
                                    value={advanceTime}
                                    onValueChange={setAdvanceTime}
                                    disabled={!advanceDate || timeSlots.length === 0}
                                >
                                    <SelectTrigger id="advance-time">
                                        <SelectValue placeholder="Select a time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeSlots.length > 0 ? (
                                            timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)
                                        ) : (
                                            <SelectItem value="closed" disabled>
                                                {advanceDate ? 'Restaurant is closed' : 'Select a date first'}
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" defaultValue={currentUser?.name} required />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="07123456789" defaultValue={currentUser?.phone} required />
                    </div>
                </div>
                
                {(selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')) && (
                    <>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" placeholder="123 Main St" defaultValue={currentUser?.addresses.find(a => a.isDefault)?.street} required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" placeholder="London" defaultValue={currentUser?.addresses.find(a => a.isDefault)?.city} required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postcode">Postcode</Label>
                                <Input id="postcode" name="postcode" value={postcode} onChange={e => setPostcode(e.target.value)} placeholder="SW1A 2AA" required={selectedOrderType === 'delivery' || (selectedOrderType === 'advance' && advanceFulfillmentType === 'delivery')} />
                            </div>
                        </div>
                    </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="order-note">Order Note (optional)</Label>
                  <Textarea id="order-note" name="order-note" placeholder="Any special instructions? e.g., no onions" />
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={(v) => setSelectedPaymentMethod(v as 'cash' | 'card' | 'voucher')}
                    className="flex flex-col gap-2"
                  >
                    {restaurantSettings.paymentSettings?.cash?.enabled && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="cash" id="pay-cash" />
                        <Label htmlFor="pay-cash">Cash</Label>
                      </div>
                    )}
                    {restaurantSettings.paymentSettings?.stripe?.enabled && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="card" id="pay-card" />
                        <Label htmlFor="pay-card">Card</Label>
                      </div>
                    )}
                    {vouchers.some(v => v.active) && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="voucher" id="pay-voucher" />
                        <Label htmlFor="pay-voucher">Voucher</Label>
                      </div>
                    )}
                  </RadioGroup>
                  {selectedPaymentMethod === 'voucher' && (
                    <div className="space-y-2 mt-2">
                      <Label htmlFor="voucher-code">Voucher Code</Label>
                      <div className="flex gap-2">
                        <Input id="voucher-code" value={voucherInput} onChange={e => setVoucherInput(e.target.value)} placeholder="Enter voucher code" />
                        <Button type="button" onClick={handleApplyVoucher} variant="secondary">Apply</Button>
                      </div>
                      {voucherError && <p className="text-destructive text-xs">{voucherError}</p>}
                      {appliedVoucher && <p className="text-success text-xs">Voucher applied: {appliedVoucher.code}</p>}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="submit" className="w-full font-headline">
                    Pay {currencySymbol}{total.toFixed(2)}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}

export default function DineDeskPage() {
  const [order, setOrder] = React.useState<OrderItem[]>([]);
  const { toast } = useToast();
  const { menuItems, categories, restaurantSettings } = useData();
  const [searchQuery, setSearchQuery] = React.useState('');

  const currencySymbol = React.useMemo(() => {
    return getCurrencySymbol(restaurantSettings.currency);
  }, [restaurantSettings.currency]);

  const filteredMenuItems = React.useMemo(() => {
    if (!searchQuery) {
        return menuItems;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return menuItems.filter(item => 
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.description.toLowerCase().includes(lowercasedQuery)
    );
  }, [menuItems, searchQuery]);
  
  const menuData = React.useMemo(() => {
    const activeCategories = categories.filter(c => c.active);
    const topLevel = activeCategories
      .filter(c => !c.parentId)
      .sort((a, b) => a.order - b.order);

    return topLevel.map(category => {
      const subCategories = activeCategories
        .filter(sub => sub.parentId === category.id)
        .sort((a, b) => a.order - b.order);

      const categoryItems = filteredMenuItems.filter(item => item.categoryId === category.id && item.available);
      
      const subCategoryData = subCategories.map(sub => ({
          category: sub,
          items: filteredMenuItems.filter(item => item.categoryId === sub.id && item.available),
        })).filter(sub => sub.items.length > 0);

      return {
        category,
        items: categoryItems,
        subCategories: subCategoryData,
      };
    }).filter(category => category.items.length > 0 || category.subCategories.length > 0);
  }, [filteredMenuItems, categories]);

  const handleAddToCart = (item: MenuItemType, addons: Addon[], quantity: number, instructions: string) => {
    const newOrderItem: OrderItem = {
        ...item,
        orderItemId: `order-item-${Date.now()}-${Math.random()}`,
        quantity,
        selectedAddons: addons,
        specialInstructions: instructions.trim() ? instructions.trim() : undefined,
    };

    setOrder(prev => [...prev, newOrderItem]);

    toast({
      title: `${item.name} added!`,
      description: 'Item successfully added to your order.',
    });
  };

  const handleUpdateQuantity = (orderItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromOrder(orderItemId);
    } else {
      setOrder(
        order.map((item) =>
          item.orderItemId === orderItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };
  
  const handleRemoveFromOrder = (orderItemId: string) => {
    setOrder(order.filter((item) => item.orderItemId !== orderItemId));
  };

  const handleClearOrder = () => {
    setOrder([]);
  };

  return (
    <>
      {restaurantSettings.coverImage && (
        <div className="container mx-auto p-4">
            <div className="relative h-48 w-full overflow-hidden rounded-lg shadow-md md:h-64">
                <Image
                    src={restaurantSettings.coverImage}
                    alt={restaurantSettings.name || 'Restaurant Cover Image'}
                    data-ai-hint={restaurantSettings.coverImageHint}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
      )}

      <MenuNav menuData={menuData} />
      <main className="container mx-auto grid grid-cols-1 gap-8 p-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <MenuSection 
            menuData={menuData} 
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currencySymbol={currencySymbol}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-[148px]">
            <OrderSummary
              order={order}
              updateQuantity={handleUpdateQuantity}
              removeFromOrder={handleRemoveFromOrder}
              clearOrder={handleClearOrder}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      </main>
    </>
  );
}
