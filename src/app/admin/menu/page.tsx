'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Save, X, Check, Ban, Eye, EyeOff, Upload } from 'lucide-react';
import { useData } from '@/context/DataContext';
import type { MenuItem, Category, Addon, Characteristic, NutritionInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const MenuItemCard = ({ item, categoryName, onEdit, onDelete, onToggleAvailability, currencySymbol }: { item: MenuItem; categoryName: string; onEdit: (item: MenuItem) => void; onDelete: (itemId: string) => void; onToggleAvailability: (itemId: string) => void; currencySymbol: string; }) => {
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
        <Card className={cn("flex flex-col hover:shadow-xl transition-shadow duration-300", !item.available && "opacity-60 bg-muted/50")}>
            <CardHeader className="p-0">
                <div className="relative h-48">
                    <Image src={item.imageUrl} alt={item.name} data-ai-hint={item.imageHint} fill className="rounded-t-lg object-cover" />
                    <div className="absolute top-3 right-3 flex space-x-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-md" onClick={() => onEdit(item)}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-md"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete <strong>{item.name}</strong>. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <Badge variant={item.available ? "default" : "destructive"} className="absolute top-3 left-3 shadow-md">{item.available ? 'Available' : 'Unavailable'}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{item.name}</CardTitle>
                    <p className="text-xl font-bold text-primary">{pricePrefix}{currencySymbol}{displayPrice.toFixed(2)}</p>
                </div>
                <CardDescription className="mt-1 line-clamp-2">{item.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 flex justify-between items-center">
                <Badge variant="outline">{categoryName}</Badge>
                <Button variant="secondary" size="sm" onClick={() => onToggleAvailability(item.id)}>
                    {item.available ? <Ban className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                    {item.available ? 'Set Unavailable' : 'Set Available'}
                </Button>
            </CardFooter>
        </Card>
    );
};

const CategoryCard = ({ category, onEdit, onDelete, onToggleActive }: { category: Category; onEdit: (category: Category) => void; onDelete: (categoryId: string) => void; onToggleActive: (categoryId: string) => void; }) => (
    <Card className={cn("hover:shadow-xl transition-shadow duration-300", !category.active && "opacity-60 bg-muted/50")}>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant={category.active ? 'default' : 'secondary'}>{category.active ? 'Active' : 'Inactive'}</Badge>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onToggleActive(category.id)}>
                    {category.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}><Edit className="w-4 h-4" /></Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Deleting <strong>{category.name}</strong> will also un-categorize its menu items and delete any sub-categories. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
    </Card>
);

const MenuFormDialog = ({ isOpen, onClose, onSave, item, categories, currencySymbol }: { isOpen: boolean; onClose: () => void; onSave: (item: MenuItem) => void; item: Partial<MenuItem> | null; categories: Category[]; currencySymbol: string; }) => {
    const [formData, setFormData] = useState<Partial<MenuItem> | null>(null);
    const [newAddon, setNewAddon] = useState<Partial<Addon>>({ name: '', price: 0, type: 'extra' });
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData({ ...item });
            } else {
                setFormData({
                    id: `item-${Date.now()}`,
                    name: '',
                    description: '',
                    price: 0,
                    categoryId: categories.find(c => !c.parentId)?.id || '',
                    available: true,
                    addons: [],
                    characteristics: [],
                    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
                    imageUrl: 'https://placehold.co/600x400.png',
                    imageHint: 'food placeholder'
                });
            }
        }
    }, [isOpen, item, categories]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ variant: 'destructive', title: "File too large", description: "Please upload an image smaller than 5MB." });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const targetWidth = 600;
                const targetHeight = 400;
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const imgAspectRatio = img.width / img.height;
                const canvasAspectRatio = targetWidth / targetHeight;
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

                if (imgAspectRatio > canvasAspectRatio) {
                    sWidth = img.height * canvasAspectRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    sHeight = img.width / canvasAspectRatio;
                    sy = (img.height - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setFormData(prev => prev ? { ...prev, imageUrl: dataUrl } : null);
                toast({ title: "Image Updated", description: "The new image preview is ready." });
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: "Error reading file", description: "Could not read the selected file." });
        }
        reader.readAsDataURL(file);

        if (e.target) {
            e.target.value = '';
        }
    };


    if (!isOpen || !formData) return null;
    
    const handleAddAddon = () => {
        if (newAddon.name && newAddon.price !== undefined) {
          const addon: Addon = {
            id: `addon-${Date.now()}`,
            name: newAddon.name,
            price: newAddon.price,
            type: newAddon.type as 'size' | 'extra' | 'sauce' | 'sides'
          };
          setFormData({ ...formData, addons: [...(formData.addons || []), addon] });
          setNewAddon({ name: '', price: 0, type: 'extra' });
        }
    };

    const handleRemoveAddon = (addonId: string) => {
        setFormData({ ...formData, addons: (formData.addons || []).filter(addon => addon.id !== addonId) });
    };

    const handleToggleCharacteristic = (characteristicId: Characteristic) => {
        if (!formData) return;
        const currentCharacteristics = formData.characteristics || [];
        const newCharacteristics = currentCharacteristics.includes(characteristicId)
            ? currentCharacteristics.filter(c => c !== characteristicId)
            : [...currentCharacteristics, characteristicId];
        setFormData({ ...formData, characteristics: newCharacteristics });
    };

    const handleNutritionChange = (field: keyof NutritionInfo, value: string) => {
        if (!formData) return;
        setFormData({
            ...formData,
            nutrition: {
                ...(formData.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 }),
                [field]: parseFloat(value) || 0,
            },
        });
    };

    const handleSaveClick = () => {
        if (!formData.name || formData.price === undefined || !formData.categoryId) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Name, price, and category are required." });
            return;
        }
        // Remove nutrition if all fields are empty or zero
        let nutrition = formData.nutrition;
        if (nutrition) {
            const allEmpty = [nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fat].every(val => !val || val === 0);
            if (allEmpty) nutrition = undefined;
        }
        onSave({ ...formData, nutrition } as MenuItem);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit Menu Item' : 'Add New Item'}</DialogTitle>
                    <DialogDescription>Fill in the details for the menu item.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 py-4 overflow-y-auto pr-4 -mr-4">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <Label htmlFor="item-name">Name</Label>
                            <Input id="item-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Classic Burger" />
                        </div>
                        <div>
                            <Label htmlFor="item-desc">Description</Label>
                            <Textarea id="item-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="A short description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="item-price">Price ({currencySymbol})</Label>
                                <Input id="item-price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} />
                            </div>
                             <div>
                                <Label htmlFor="item-category">Category</Label>
                                <Select value={formData.categoryId} onValueChange={value => setFormData({ ...formData, categoryId: value })}>
                                    <SelectTrigger id="item-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                                     <SelectContent>
                                        {categories.filter(c => c.active).filter(c => !c.parentId).sort((a,b) => a.order - b.order).map(parentCat => (
                                            <SelectGroup key={parentCat.id}>
                                                <SelectLabel>{parentCat.name}</SelectLabel>
                                                <SelectItem value={parentCat.id}>{parentCat.name}</SelectItem>
                                                {categories.filter(sub => sub.parentId === parentCat.id).sort((a,b) => a.order - b.order).map(subCat => (
                                                    <SelectItem key={subCat.id} value={subCat.id}>&nbsp;&nbsp;{subCat.name}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Switch id="item-available" checked={formData.available} onCheckedChange={checked => setFormData({ ...formData, available: checked })}/>
                            <Label htmlFor="item-available">Available for purchase</Label>
                        </div>
                        <div>
                            <Label>Item Image</Label>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Image 
                                        src={formData.imageUrl || 'https://placehold.co/600x400.png'} 
                                        alt={formData.name || 'Menu item'} 
                                        width={80} 
                                        height={60} 
                                        className="rounded-md object-cover bg-muted"
                                    />
                                    <div className="flex-grow space-y-2">
                                        <p className="text-xs text-muted-foreground">Upload an image that will be resized to 600x400px.</p>
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4"/> Upload
                                        </Button>
                                        <Input 
                                            ref={fileInputRef}
                                            type="file" 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/webp" 
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                         <div className="space-y-3">
                            <Label className="text-lg font-semibold text-gray-900">Characteristics & Allergens</Label>
                            <p className="text-sm text-gray-600">Select dietary requirements and allergen information</p>
                            <Card className="border-2 border-gray-100 shadow-sm">
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                                        {characteristicsList.map(char => {
                                            const isSelected = formData.characteristics?.includes(char.id);
                                            return (
                                                <div 
                                                    key={char.id} 
                                                    className={`group relative cursor-pointer transition-all duration-200 ease-in-out ${
                                                        isSelected 
                                                            ? 'scale-105 shadow-md' 
                                                            : 'hover:scale-102 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => handleToggleCharacteristic(char.id)}
                                                >
                                                    <div className={`
                                                        flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200
                                                        ${isSelected 
                                                            ? 'border-blue-300 bg-blue-50 shadow-blue-100' 
                                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                        }
                                                    `}>
                                                        <div className="mb-2 transform transition-transform duration-200 group-hover:scale-110">
                                                            <char.icon />
                                                        </div>
                                                        <label
                                                            htmlFor={`char-${char.id}`}
                                                            className={`
                                                                text-xs font-medium text-center leading-tight cursor-pointer transition-colors duration-200
                                                                ${isSelected 
                                                                    ? 'text-blue-700' 
                                                                    : 'text-gray-700 group-hover:text-gray-900'
                                                                }
                                                            `}
                                                        >
                                                            {char.label}
                                                        </label>
                                                        <Checkbox
                                                            id={`char-${char.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleToggleCharacteristic(char.id)}
                                                            className={`
                                                                absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                                                ${isSelected ? 'opacity-100' : ''}
                                                            `}
                                                        />
                                                        {isSelected && (
                                                            <div className="absolute inset-0 rounded-xl border-2 border-blue-400 bg-blue-100/20 pointer-events-none">
                                                                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {formData.characteristics && formData.characteristics.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-sm text-gray-600 mb-2">Selected characteristics:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.characteristics.map(charId => {
                                                    const char = characteristicsList.find(c => c.id === charId);
                                                    return char ? (
                                                        <span 
                                                            key={charId}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full border border-blue-200"
                                                        >
                                                            <char.icon />
                                                            {char.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label>Add-ons</Label>
                        <div className="p-4 border rounded-md space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Input value={newAddon.name} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })} placeholder="Name"/>
                                <Input type="number" value={newAddon.price} onChange={e => setNewAddon({ ...newAddon, price: parseFloat(e.target.value) || 0})} placeholder="Price"/>
                                 <Select value={newAddon.type} onValueChange={(value: any) => setNewAddon({ ...newAddon, type: value })}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="extra">Extra</SelectItem>
                                        <SelectItem value="size">Size</SelectItem>
                                        <SelectItem value="sauce">Sauce</SelectItem>
                                        <SelectItem value="sides">Sides</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddAddon} className="w-full">Add Add-on</Button>
                            <div className="space-y-2 h-24 overflow-y-auto">
                                {(formData.addons || []).map(addon => (
                                    <div key={addon.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-sm">
                                        <span>{addon.name} (+{currencySymbol}{addon.price.toFixed(2)})</span>
                                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleRemoveAddon(addon.id)}><X className="w-4 h-4"/></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="nutrition">
                                    <AccordionTrigger>
                                        <Label>Nutrition Information (Optional)</Label>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <Label htmlFor="item-calories" className="text-xs">Calories (kcal)</Label>
                                                <Input id="item-calories" type="number" value={formData.nutrition?.calories || ''} onChange={e => handleNutritionChange('calories', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label htmlFor="item-protein" className="text-xs">Protein (g)</Label>
                                                <Input id="item-protein" type="number" value={formData.nutrition?.protein || ''} onChange={e => handleNutritionChange('protein', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label htmlFor="item-carbs" className="text-xs">Carbs (g)</Label>
                                                <Input id="item-carbs" type="number" value={formData.nutrition?.carbs || ''} onChange={e => handleNutritionChange('carbs', e.target.value)} />
                                            </div>
                                            <div>
                                                <Label htmlFor="item-fat" className="text-xs">Fat (g)</Label>
                                                <Input id="item-fat" type="number" value={formData.nutrition?.fat || ''} onChange={e => handleNutritionChange('fat', e.target.value)} />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                </div>
                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick}><Save className="w-4 h-4 mr-2"/>Save Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CategoryFormDialog = ({ isOpen, onClose, onSave, category, categories }: { isOpen: boolean; onClose: () => void; onSave: (category: Category) => void; category: Partial<Category> | null; categories: Category[] }) => {
    const [formData, setFormData] = useState<Partial<Category> | null>(null);
    const { toast } = useToast();
    const topLevelCategories = categories.filter(c => !c.parentId);

    React.useEffect(() => {
        if (isOpen) {
            if (category) {
                setFormData({ ...category });
            } else {
                setFormData({
                    id: `cat-${Date.now()}`,
                    name: '',
                    description: '',
                    active: true,
                    order: categories.filter(c => !c.parentId).length,
                    parentId: undefined
                });
            }
        }
    }, [isOpen, category, categories]);

    if (!isOpen || !formData) return null;

    const handleSaveClick = () => {
        if (!formData.name) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Category name is required." });
            return;
        }
        onSave(formData as Category);
        onClose();
    };

    const handleParentChange = (value: string) => {
        const newParentId = value === 'none' ? undefined : value;
        const newOrder = categories.filter(c => c.parentId === newParentId).length;
        setFormData(prev => prev ? { ...prev, parentId: newParentId, order: newOrder } : null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                     <DialogDescription>Create a new category or sub-category for your menu.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cat-name">Name</Label>
                        <Input id="cat-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Appetizers" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cat-desc">Description</Label>
                        <Textarea id="cat-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="A short description..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cat-parent">Parent Category</Label>
                        <Select
                            value={formData.parentId || 'none'}
                            onValueChange={handleParentChange}
                        >
                            <SelectTrigger id="cat-parent">
                                <SelectValue placeholder="Make this a top-level category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (Top-Level Category)</SelectItem>
                                {topLevelCategories
                                    .filter(c => c.id !== formData.id) // Can't be its own parent
                                    .map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground px-1">Select a parent to create a sub-category.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cat-order">Display Order</Label>
                        <Input
                            id="cat-order"
                            type="number"
                            value={formData.order}
                            onChange={e => setFormData(prev => prev ? { ...prev, order: parseInt(e.target.value) || 0 } : null)}
                        />
                         <p className="text-xs text-muted-foreground px-1">Lower numbers appear first in the menu.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="cat-active" checked={formData.active} onCheckedChange={checked => setFormData({ ...formData, active: checked })}/>
                        <Label htmlFor="cat-active">Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick}><Save className="w-4 h-4 mr-2"/>Save Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function MenuManagementPage() {
    const { menuItems, setMenuItems, categories, setCategories, saveMenuItem, deleteMenuItem, saveCategory, deleteCategory: deleteCategoryFromContext, restaurantSettings } = useData();
    
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    
    const [isItemFormOpen, setIsItemFormOpen] = useState(false);
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
    
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');

    const currencySymbol = useMemo(() => {
        if (restaurantSettings.currency === 'USD') return '$';
        if (restaurantSettings.currency === 'EUR') return '€';
        return '£';
    }, [restaurantSettings.currency]);

    const handleAddNew = () => {
        if (activeTab === 'items') {
            setEditingItem(null);
            setIsItemFormOpen(true);
        } else {
            setEditingCategory(null);
            setIsCategoryFormOpen(true);
        }
    };

    const handleEditItem = (item: MenuItem) => {
        setEditingItem(item);
        setIsItemFormOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setIsCategoryFormOpen(true);
    };

    const handleSaveItem = (itemData: MenuItem) => {
        saveMenuItem(itemData);
        toast({ title: itemData.id.startsWith('item-') ? "Item Added" : "Item Updated", description: `"${itemData.name}" has been saved.`});
        setIsItemFormOpen(false);
        setEditingItem(null);
    };

    const handleDeleteItem = (itemId: string) => {
        deleteMenuItem(itemId);
        toast({ variant: 'destructive', title: "Item Deleted", description: "The menu item has been removed." });
    };

    const handleToggleItemAvailability = (itemId: string) => {
        let itemName = '';
        const updatedItems = menuItems.map(i => {
            if (i.id === itemId) {
                itemName = i.name;
                return { ...i, available: !i.available };
            }
            return i;
        });
        setMenuItems(updatedItems);
        toast({ title: 'Availability Updated', description: `"${itemName}" status has been changed.`});
    };

    const handleSaveCategory = (catData: Category) => {
        saveCategory(catData);
        toast({ title: catData.id.startsWith('cat-') ? "Category Added" : "Category Updated", description: `"${catData.name}" has been saved.`});
        setIsCategoryFormOpen(false);
        setEditingCategory(null);
    };

    const handleDeleteCategory = (catId: string) => {
        deleteCategoryFromContext(catId);
        toast({ variant: 'destructive', title: "Category Deleted", description: "The category and any sub-categories have been removed." });
    };

    const handleToggleCategoryActive = (catId: string) => {
        let catName = '';
        const updatedCategories = categories.map(c => {
            if (c.id === catId) {
                catName = c.name;
                return { ...c, active: !c.active };
            }
            return c;
        });
        setCategories(updatedCategories);
        toast({ title: 'Status Updated', description: `"${catName}" status has been changed.`});
    };

    const filteredItems = useMemo(() => {
        if (selectedCategoryFilter === 'all') return menuItems;
        return menuItems.filter(item => item.categoryId === selectedCategoryFilter);
    }, [menuItems, selectedCategoryFilter]);
    
    return (
        <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'items' | 'categories')}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold">Menu Management</CardTitle>
                        <CardDescription>Manage your restaurant's menu items and categories.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <TabsList>
                            <TabsTrigger value="items">Menu Items</TabsTrigger>
                            <TabsTrigger value="categories">Categories</TabsTrigger>
                        </TabsList>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" /> Add New {activeTab === 'items' ? 'Item' : 'Category'}
                        </Button>
                    </div>
                </div>

                <TabsContent value="items">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter by Category</CardTitle>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button size="sm" variant={selectedCategoryFilter === 'all' ? 'default' : 'secondary'} onClick={() => setSelectedCategoryFilter('all')}>All Items</Button>
                                {categories.filter(c => c.active).sort((a,b) => a.order - b.order).map(category => (
                                    !category.parentId && (
                                        <Button key={category.id} size="sm" variant={selectedCategoryFilter === category.id ? 'default' : 'secondary'} onClick={() => setSelectedCategoryFilter(category.id)}>
                                            {category.name}
                                        </Button>
                                    )
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredItems.map(item => (
                                    <MenuItemCard 
                                        key={item.id} 
                                        item={item} 
                                        categoryName={categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
                                        onEdit={handleEditItem}
                                        onDelete={handleDeleteItem}
                                        onToggleAvailability={handleToggleItemAvailability}
                                        currencySymbol={currencySymbol}
                                    />
                                ))}
                            </div>
                             {filteredItems.length === 0 && (
                                <div className="text-center py-16 text-muted-foreground">
                                    <p>No items found in this category.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="categories">
                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <CardTitle>Manage Categories</CardTitle>
                                    <CardDescription>Manage your menu categories and sub-categories.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {categories.filter(c => !c.parentId).sort((a,b) => a.order - b.order).map(category => (
                                <div key={category.id}>
                                    <CategoryCard 
                                        category={category} 
                                        onEdit={handleEditCategory}
                                        onDelete={handleDeleteCategory}
                                        onToggleActive={handleToggleCategoryActive}
                                    />
                                    <div className="ml-8 mt-2 space-y-2 border-l-2 pl-4">
                                        {categories
                                            .filter(sub => sub.parentId === category.id)
                                            .sort((a,b) => a.order - b.order)
                                            .map(subCategory => (
                                                <CategoryCard
                                                    key={subCategory.id}
                                                    category={subCategory}
                                                    onEdit={handleEditCategory}
                                                    onDelete={handleDeleteCategory}
                                                    onToggleActive={handleToggleCategoryActive}
                                                />
                                            ))
                                        }
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <MenuFormDialog 
                isOpen={isItemFormOpen} 
                onClose={() => setIsItemFormOpen(false)} 
                onSave={handleSaveItem} 
                item={editingItem}
                categories={categories}
                currencySymbol={currencySymbol}
            />

            <CategoryFormDialog
                isOpen={isCategoryFormOpen}
                onClose={() => setIsCategoryFormOpen(false)}
                onSave={handleSaveCategory}
                category={editingCategory}
                categories={categories}
            />
        </div>
    );
}
