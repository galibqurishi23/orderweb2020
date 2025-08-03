'use client';

import React, { useState, useMemo, useRef } from 'react';
import { getCurrencySymbol } from '@/lib/currency-utils';
import { 
  ChefHat, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Package, 
  Tag,
  Image as ImageIcon,
  Grid3X3,
  List,
  CheckCircle,
  XCircle,
  Upload,
  X,
  Settings,
  Layers,
  Copy,
  FileText,
  PlusCircle,
  Utensils
} from 'lucide-react';
import { useTenantData } from '@/context/TenantDataContext';
import type { Addon, SetMenuItem } from '@/lib/types';
import type { MenuItem, MenuCategory, AddonGroup, AddonOption } from '@/lib/menu-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function TenantMenuPage() {
  const { 
    menuItems, 
    categories, 
    saveMenuItem, 
    deleteMenuItem, 
    saveCategory, 
    deleteCategory, 
    restaurantSettings,
    isLoading
  } = useTenantData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencySymbol = useMemo(() => {
    return getCurrencySymbol(restaurantSettings?.currency || 'GBP');
  }, [restaurantSettings?.currency]);

  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageHint: '',
    available: true,
    categoryId: '',
    addons: [],
    characteristics: [],
    nutrition: undefined,
    isSetMenu: false,
    setMenuItems: []
  });

  const [categoryForm, setCategoryForm] = useState<Partial<MenuCategory>>({
    name: '',
    active: true,
    displayOrder: 0,
    parentId: undefined
  });

  const filteredAndSortedItems = useMemo(() => {
    let filtered = menuItems || [];

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        filtered = filtered.filter(item => !item.categoryId);
      } else {
        filtered = filtered.filter(item => item.categoryId === selectedCategory);
      }
    }

    // Filter by search query
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.description?.toLowerCase().includes(lowercasedQuery)
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'category':
          const categoryA = categories?.find(c => c.id === a.categoryId)?.name || '';
          const categoryB = categories?.find(c => c.id === b.categoryId)?.name || '';
          return categoryA.localeCompare(categoryB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [menuItems, selectedCategory, searchQuery, sortBy, categories]);

  // Get hierarchical categories display
  const getHierarchicalCategories = () => {
    const parentCategories = categories?.filter(cat => !cat.parentId) || [];
    return parentCategories.map(parent => ({
      ...parent,
      subcategories: categories?.filter(cat => cat.parentId === parent.id) || []
    }));
  };

  // Get filtered categories (excluding self and children when editing)
  const getFilteredCategories = (excludeId?: string) => {
    return categories?.filter(cat => cat.id !== excludeId) || [];
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setItemForm({ ...itemForm, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setItemForm({ ...itemForm, imageUrl: '' });
  };

  // Set menu item handlers
  const addSetMenuItem = () => {
    const newSetItem: SetMenuItem = {
      id: `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menuItemId: '',
      quantity: 1,
      name: '',
      replaceable: false,
      replaceableWith: []
    };
    setItemForm({
      ...itemForm,
      setMenuItems: [...(itemForm.setMenuItems || []), newSetItem]
    });
  };

  const removeSetMenuItem = (setItemId: string) => {
    setItemForm({
      ...itemForm,
      setMenuItems: itemForm.setMenuItems?.filter(item => item.id !== setItemId)
    });
  };

  const updateSetMenuItem = (setItemId: string, updates: Partial<SetMenuItem>) => {
    setItemForm({
      ...itemForm,
      setMenuItems: itemForm.setMenuItems?.map(item => 
        item.id === setItemId ? { ...item, ...updates } : item
      )
    });
  };

  // Add-on handlers
  const addAddon = () => {
    const newAddon: AddonGroup = {
      id: `addon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: '', // Will be set by service
      name: '',
      description: '',
      type: 'radio',
      required: false,
      multiple: false,
      maxSelections: 1,
      active: true,
      displayOrder: 0,
      options: []
    };
    setItemForm({
      ...itemForm,
      addons: [...(itemForm.addons || []), newAddon]
    });
  };

  const removeAddon = (addonId: string) => {
    setItemForm({
      ...itemForm,
      addons: itemForm.addons?.filter(addon => addon.id !== addonId)
    });
  };

  const updateAddon = (addonId: string, updates: Partial<AddonGroup>) => {
    setItemForm({
      ...itemForm,
      addons: itemForm.addons?.map(addon => 
        addon.id === addonId ? { ...addon, ...updates } : addon
      )
    });
  };

  const addAddonOption = (addonId: string) => {
    const newOption: AddonOption = {
      id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addonGroupId: addonId,
      name: '',
      price: 0,
      available: true,
      displayOrder: 0
    };
    
    setItemForm({
      ...itemForm,
      addons: itemForm.addons?.map(addon => 
        addon.id === addonId 
          ? { ...addon, options: [...(addon.options || []), newOption] }
          : addon
      )
    });
  };

  const removeAddonOption = (addonId: string, optionId: string) => {
    setItemForm({
      ...itemForm,
      addons: itemForm.addons?.map(addon => 
        addon.id === addonId 
          ? { ...addon, options: addon.options?.filter(option => option.id !== optionId) }
          : addon
      )
    });
  };

  const updateAddonOption = (addonId: string, optionId: string, updates: Partial<AddonOption>) => {
    setItemForm({
      ...itemForm,
      addons: itemForm.addons?.map(addon => 
        addon.id === addonId 
          ? { 
              ...addon, 
              options: addon.options?.map(option => 
                option.id === optionId ? { ...option, ...updates } : option
              ) 
            }
          : addon
      )
    });
  };

  // Form reset functions
  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      imageHint: '',
      available: true,
      categoryId: '',
      addons: [],
      characteristics: [],
      nutrition: undefined,
      isSetMenu: false,
      setMenuItems: []
    });
    setEditingItem(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      active: true,
      displayOrder: categories?.length || 0,
      parentId: undefined
    });
    setEditingCategory(null);
  };

  // Handler functions
  const handleSaveItem = async () => {
    if (!itemForm.name || itemForm.price === undefined || itemForm.price < 0) {
      toast({ 
        title: "Validation Error", 
        description: "Please provide a valid name and price", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const itemToSave: MenuItem = {
        id: editingItem?.id || '', // Empty ID for new items
        tenantId: '', // Will be set by the service
        name: itemForm.name!,
        description: itemForm.description || '',
        price: Number(itemForm.price),
        imageUrl: itemForm.imageUrl || '',
        imageHint: itemForm.imageHint || '',
        available: itemForm.available ?? true,
        categoryId: itemForm.categoryId || '',
        addons: itemForm.addons || [],
        characteristics: itemForm.characteristics || [],
        nutrition: itemForm.nutrition,
        isSetMenu: itemForm.isSetMenu || false,
        setMenuItems: itemForm.setMenuItems || [],
        preparationTime: itemForm.preparationTime || 0,
        isFeatured: itemForm.isFeatured || false,
        tags: itemForm.tags
      };

      await saveMenuItem(itemToSave);
      toast({ 
        title: "Success", 
        description: `Menu item ${editingItem ? 'updated' : 'created'} successfully`,
        variant: "default"
      });
      setIsItemDialogOpen(false);
      resetItemForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save menu item. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast({ 
        title: "Validation Error", 
        description: "Category name is required", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const categoryToSave: MenuCategory = {
        id: editingCategory?.id || '', // Empty ID for new categories
        tenantId: '', // Will be set by the service
        name: categoryForm.name!,
        active: categoryForm.active ?? true,
        displayOrder: Number(categoryForm.displayOrder) || 0,
        parentId: categoryForm.parentId,
        imageUrl: categoryForm.imageUrl,
        icon: categoryForm.icon,
        color: categoryForm.color
      };

      await saveCategory(categoryToSave);
      toast({ 
        title: "Success", 
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully`,
        variant: "default"
      });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ 
        title: "Error", 
        description: "Failed to save category. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      imageUrl: item.imageUrl,
      imageHint: item.imageHint,
      available: item.available,
      categoryId: item.categoryId,
      addons: item.addons,
      characteristics: item.characteristics,
      nutrition: item.nutrition,
      isSetMenu: item.isSetMenu,
      setMenuItems: item.setMenuItems,
      preparationTime: item.preparationTime,
      tags: item.tags
    });
    setIsItemDialogOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      active: category.active,
      displayOrder: category.displayOrder,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
      icon: category.icon,
      color: category.color
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    try {
      await deleteMenuItem(item.id);
      toast({ 
        title: "Success", 
        description: "Menu item deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete menu item", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteCategory = async (category: MenuCategory) => {
    try {
      await deleteCategory(category.id);
      toast({ 
        title: "Success", 
        description: "Category deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete category", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Menu Management</h1>
              <p className="text-slate-600 mt-1">
                Create and manage your restaurant's menu items, categories, and pricing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
        
        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Total Items</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{menuItems?.length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Categories</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">{categories?.length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">Set Menus</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{menuItems?.filter(item => item.isSetMenu).length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Available</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{menuItems?.filter(item => item.available).length || 0}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1">
          <TabsTrigger value="items" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Package className="w-4 h-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Tag className="w-4 h-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Menu Items</CardTitle>
                  <CardDescription>Manage your food items, set menus, and add-ons</CardDescription>
                </div>
                
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search and Filter */}
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search items..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        {getHierarchicalCategories().map(parent => (
                          <div key={parent.id}>
                            <SelectItem value={parent.id}>
                              {parent.name}
                            </SelectItem>
                            {parent.subcategories.map(sub => (
                              <SelectItem key={sub.id} value={sub.id}>
                                └ {sub.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Add Button */}
                  <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetItemForm} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              value={itemForm.name}
                              onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                              placeholder="Item name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="price">Price ({currencySymbol}) *</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={itemForm.price}
                              onChange={(e) => setItemForm({...itemForm, price: parseFloat(e.target.value) || 0})}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={itemForm.description || ''}
                            onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                            placeholder="Describe your item..."
                            rows={3}
                          />
                        </div>
                        
                        {/* Image Upload and Category */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Image Upload
                            </Label>
                            <div className="space-y-2">
                              {itemForm.imageUrl ? (
                                <div className="relative">
                                  <img
                                    src={itemForm.imageUrl}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={removeImage}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">No image uploaded</p>
                                  </div>
                                </div>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Image
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select 
                              value={itemForm.categoryId || "uncategorized"} 
                              onValueChange={(value) => setItemForm({
                                ...itemForm, 
                                categoryId: value === "uncategorized" ? "" : value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="uncategorized">No Category</SelectItem>
                                {getHierarchicalCategories().map(parent => (
                                  <div key={parent.id}>
                                    <SelectItem value={parent.id}>
                                      {parent.name}
                                    </SelectItem>
                                    {parent.subcategories.map(sub => (
                                      <SelectItem key={sub.id} value={sub.id}>
                                        └ {sub.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Set Menu Section */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isSetMenu"
                              checked={itemForm.isSetMenu}
                              onCheckedChange={(checked) => setItemForm({...itemForm, isSetMenu: checked})}
                            />
                            <Label htmlFor="isSetMenu" className="flex items-center gap-2">
                              <Utensils className="w-4 h-4" />
                              This is a set menu
                            </Label>
                          </div>
                          
                          {itemForm.isSetMenu && (
                            <div className="border rounded-lg p-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Set Menu Items</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addSetMenuItem}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Item
                                </Button>
                              </div>
                              
                              {itemForm.setMenuItems?.map((setItem, index) => (
                                <div key={setItem.id} className="border rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Item {index + 1}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSetMenuItem(setItem.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Display Name</Label>
                                      <Input
                                        value={setItem.name}
                                        onChange={(e) => updateSetMenuItem(setItem.id, { name: e.target.value })}
                                        placeholder="e.g., Main Course"
                                        className="h-8"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={1}
                                        onChange={(e) => {/* updateSetMenuItem(setItem.id, { quantity: parseInt(e.target.value) || 1 }) */}}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`replaceable-${setItem.id}`}
                                      checked={false}
                                      onCheckedChange={(checked) => {/* updateSetMenuItem(setItem.id, { replaceable: checked as boolean }) */}}
                                    />
                                    <Label htmlFor={`replaceable-${setItem.id}`} className="text-xs">
                                      Customer can replace this item
                                    </Label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Add-ons Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Add-ons</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addAddon}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Add-on
                            </Button>
                          </div>
                          
                          {itemForm.addons?.map((addon, index) => (
                            <div key={addon.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Add-on {index + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeAddon(addon.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Name</Label>
                                  <Input
                                    value={addon.name}
                                    onChange={(e) => updateAddon(addon.id, { name: e.target.value })}
                                    placeholder="e.g., Extra Cheese"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    value={addon.description || ''}
                                    onChange={(e) => updateAddon(addon.id, { description: e.target.value })}
                                    placeholder="e.g., Choose your size"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Type</Label>
                                  <Select
                                    value={addon.type}
                                    onValueChange={(value: any) => updateAddon(addon.id, { type: value })}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="radio">Radio (Single Choice)</SelectItem>
                                      <SelectItem value="checkbox">Checkbox (Multiple Choice)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`required-${addon.id}`}
                                    checked={addon.required}
                                    onCheckedChange={(checked) => updateAddon(addon.id, { required: checked as boolean })}
                                  />
                                  <Label htmlFor={`required-${addon.id}`} className="text-xs">
                                    Required
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`multiple-${addon.id}`}
                                    checked={addon.multiple}
                                    onCheckedChange={(checked) => updateAddon(addon.id, { multiple: checked as boolean })}
                                  />
                                  <Label htmlFor={`multiple-${addon.id}`} className="text-xs">
                                    Multiple selection
                                  </Label>
                                </div>
                                {addon.multiple && (
                                  <div>
                                    <Label className="text-xs">Max selections</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={addon.maxSelections}
                                      onChange={(e) => updateAddon(addon.id, { maxSelections: parseInt(e.target.value) || 1 })}
                                      className="h-8"
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Addon Options */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">Options</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addAddonOption(addon.id)}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                                
                                {addon.options?.map((option, optionIndex) => (
                                  <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <Input
                                      value={option.name}
                                      onChange={(e) => updateAddonOption(addon.id, option.id, { name: e.target.value })}
                                      placeholder="Option name"
                                      className="h-8 flex-1"
                                    />
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={option.price}
                                      onChange={(e) => updateAddonOption(addon.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                                      placeholder="Price"
                                      className="h-8 w-20"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAddonOption(addon.id, option.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="available"
                            checked={itemForm.available}
                            onCheckedChange={(checked) => setItemForm({...itemForm, available: checked})}
                          />
                          <Label htmlFor="available" className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Available for orders
                          </Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveItem} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          {editingItem ? 'Update Item' : 'Create Item'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedItems.length > 0 ? (
                      filteredAndSortedItems.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell>
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-12 h-12 object-cover rounded-lg shadow-sm" 
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {item.name}
                                {item.isSetMenu && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                    Set Menu
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.categoryId ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {categories?.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No Category</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {currencySymbol}{item.price.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {item.isSetMenu && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Set Menu
                                </Badge>
                              )}
                              {item.addons && item.addons.length > 0 && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {item.addons.length} Add-ons
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.available ? "default" : "secondary"}
                              className={item.available ? "bg-green-100 text-green-800 border-green-200" : ""}
                            >
                              {item.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditItem(item)}
                                className="h-8 w-8"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteItem(item)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="w-12 h-12" />
                            <div>
                              {searchQuery || selectedCategory !== 'all' 
                                ? "No items found matching your criteria" 
                                : "No menu items yet. Create your first item!"
                              }
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Categories
                </CardTitle>
                <CardDescription>Organize your menu with categories and sub-categories</CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        placeholder="Category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentCategory">Parent Category</Label>
                      <Select
                        value={categoryForm.parentId || "none"}
                        onValueChange={(value) => setCategoryForm({
                          ...categoryForm,
                          parentId: value === "none" ? undefined : value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              No Parent (Main Category)
                            </div>
                          </SelectItem>
                          {getFilteredCategories(editingCategory?.id).filter(cat => !cat.parentId).map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryOrder">Sort Order</Label>
                      <Input
                        id="categoryOrder"
                        type="number"
                        min="0"
                        value={categoryForm.displayOrder}
                        onChange={(e) => setCategoryForm({...categoryForm, displayOrder: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="categoryActive"
                        checked={categoryForm.active}
                        onCheckedChange={(checked) => setCategoryForm({...categoryForm, active: checked})}
                      />
                      <Label htmlFor="categoryActive" className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Active category
                      </Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCategory} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Items Count</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 ? (
                      // Show hierarchical structure
                      (() => {
                        const renderCategory = (category: MenuCategory, isSubcategory = false) => (
                          <TableRow key={category.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {isSubcategory ? (
                                  <>
                                    <span className="text-gray-400">└</span>
                                    <Layers className="w-4 h-4 text-gray-500" />
                                  </>
                                ) : (
                                  <Tag className="w-4 h-4 text-blue-600" />
                                )}
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {menuItems?.filter(item => item.categoryId === category.id).length || 0} items
                              </Badge>
                            </TableCell>
                            <TableCell>{category.displayOrder}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={category.active ? "default" : "secondary"}
                                className={category.active ? "bg-green-100 text-green-800 border-green-200" : ""}
                              >
                                {category.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditCategory(category)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{category.name}"? Items in this category will become uncategorized. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteCategory(category)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                        
                        return getHierarchicalCategories()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .flatMap(parent => [
                            renderCategory(parent, false),
                            ...parent.subcategories
                              .sort((a, b) => a.displayOrder - b.displayOrder)
                              .map(sub => renderCategory(sub, true))
                          ]);
                      })()
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Tag className="w-12 h-12" />
                            <div>No categories yet. Create your first category!</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
