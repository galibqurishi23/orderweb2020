'use client';

import React, { useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
import type { MenuItem, MenuCategory } from '@/lib/menu-types';
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
import { SortableMenuItemsTable } from '@/components/admin/SortableMenuItemsTable';
import { SortableCategoriesTable } from '@/components/admin/SortableCategoriesTable';

export default function TenantMenuPage() {
  const pathname = usePathname();
  const tenantSlug = pathname.split('/')[1]; // Extract tenant from /tenant/admin/menu
  
  const { 
    menuItems, 
    categories, 
    saveMenuItem, 
    deleteMenuItem, 
    saveCategory, 
    deleteCategory, 
    restaurantSettings,
    isLoading,
    refreshData,
    updateCategoriesOrder,
    updateMenuItemsOrder
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
    image: '',
    imageHint: '',
    available: true,
    categoryId: '',
    characteristics: [],
    nutrition: undefined,
    isSetMenu: false
  });

  const [categoryForm, setCategoryForm] = useState<Partial<MenuCategory>>({
    name: '',
    description: '',
    active: true,
    parentId: undefined
  });

  // Handler functions for menu items
  const setEditingMenuItem = (item: MenuItem | null) => {
    if (item) {
      setItemForm({
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        imageHint: item.imageHint,
        available: item.available,
        categoryId: item.categoryId,
        addons: item.addons || [],
        characteristics: item.characteristics || [],
        nutrition: item.nutrition,
        isSetMenu: item.isSetMenu,
        setMenuItems: item.setMenuItems || []
      });
      setEditingItem(item);
      setIsItemDialogOpen(true);
    }
  };

  const setViewingMenuItem = (item: MenuItem | null) => {
    // For now, just use the edit function
    setEditingMenuItem(item);
  };

  const handleMenuItemReorder = async (itemIds: string[], categoryId?: string) => {
    // Optimistic update - immediately update the UI
    updateMenuItemsOrder(itemIds, categoryId);

    try {
      const response = await fetch(`/api/tenant/menu/items/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, categoryId, tenantId: tenantSlug })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder items');
      }

      toast({
        title: "Items Reordered",
        description: "Menu items have been reordered successfully.",
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      // If API fails, revert by refreshing data from server
      await refreshData();
      toast({
        title: "Error",
        description: "Failed to reorder menu items.",
        variant: "destructive"
      });
    }
  };

  const reorderCategories = async (categoryIds: string[]) => {
    // Optimistic update - immediately update the UI
    updateCategoriesOrder(categoryIds);

    try {
      const response = await fetch(`/api/tenant/menu/categories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds, tenantId: tenantSlug })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }

      toast({
        title: "Categories Reordered",
        description: "Categories have been reordered successfully.",
      });
    } catch (error) {
      console.error('Error reordering categories:', error);
      // If API fails, revert by refreshing data from server
      await refreshData();
      toast({
        title: "Error",
        description: "Failed to reorder categories.",
        variant: "destructive"
      });
    }
  };

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
        setItemForm({ ...itemForm, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setItemForm({ ...itemForm, image: '' });
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
    const newAddon: Addon = {
      id: `addon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      price: 0,
      type: 'extra',
      required: false,
      multiple: false,
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

  const updateAddon = (addonId: string, updates: Partial<Addon>) => {
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
      name: '',
      price: 0,
      available: true
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
      image: '',
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
      description: '',
      active: true,
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
        id: editingItem?.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: itemForm.name!,
        description: itemForm.description || '',
        price: Number(itemForm.price),
        image: itemForm.image || '',
        imageHint: itemForm.imageHint || '',
        available: itemForm.available ?? true,
        categoryId: itemForm.categoryId || '',
        addons: itemForm.addons || [],
        characteristics: itemForm.characteristics || [],
        nutrition: itemForm.nutrition,
        isSetMenu: itemForm.isSetMenu || false,
        setMenuItems: itemForm.setMenuItems || [],
        preparationTime: itemForm.preparationTime,
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
      const categoryToSave: Category = {
        id: editingCategory?.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: categoryForm.name!,
        description: categoryForm.description || '',
        active: categoryForm.active ?? true,
        parentId: categoryForm.parentId,
        image: categoryForm.image,
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
      description: item.description,
      price: item.price,
      image: item.image,
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
      description: category.description,
      active: category.active,
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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gray-50 rounded-2xl p-8 shadow-sm border border-gray-200">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shadow-sm">
              <ChefHat className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Menu Management</h1>
              <p className="text-gray-600 text-lg font-medium mt-1">
                Manage your restaurant's menu items and categories with professional tools
              </p>
            </div>
          </div>
          
          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Items</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{menuItems?.length || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Categories</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{categories?.length || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Set Menus</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{menuItems?.filter(item => item.isSetMenu).length || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Available</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{menuItems?.filter(item => item.available).length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="items" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium">
            <Package className="w-4 h-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-medium">
            <Tag className="w-4 h-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Menu Items</CardTitle>
                  <CardDescription className="text-gray-600">Manage your food items, set menus, and add-ons</CardDescription>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search items..."
                        className="pl-10 w-64 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-52 border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 rounded-lg shadow-lg">
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
                            value={itemForm.description}
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
                              {itemForm.image ? (
                                <div className="relative">
                                  <img
                                    src={itemForm.image}
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
                                        value={setItem.quantity}
                                        onChange={(e) => updateSetMenuItem(setItem.id, { quantity: parseInt(e.target.value) || 1 })}
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`replaceable-${setItem.id}`}
                                      checked={setItem.replaceable}
                                      onCheckedChange={(checked) => updateSetMenuItem(setItem.id, { replaceable: checked as boolean })}
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
                                  <Label className="text-xs">Price ({currencySymbol})</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={addon.price}
                                    onChange={(e) => updateAddon(addon.id, { price: parseFloat(e.target.value) || 0 })}
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
                                      <SelectItem value="size">Size</SelectItem>
                                      <SelectItem value="extra">Extra</SelectItem>
                                      <SelectItem value="sauce">Sauce</SelectItem>
                                      <SelectItem value="sides">Sides</SelectItem>
                                      <SelectItem value="drink">Drink</SelectItem>
                                      <SelectItem value="dessert">Dessert</SelectItem>
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
                {filteredAndSortedItems.length > 0 ? (
                  <SortableMenuItemsTable
                    items={filteredAndSortedItems}
                    categories={categories || []}
                    currency={restaurantSettings?.currency || 'USD'}
                    onEdit={setEditingMenuItem}
                    onDelete={(item) => deleteMenuItem(item.id)}
                    onView={setViewingMenuItem}
                    onReorder={handleMenuItemReorder}
                    selectedCategory={selectedCategory}
                  />
                ) : (
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
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package className="w-12 h-12" />
                            <div>No menu items yet. Create your first item!</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
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
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="Category description"
                        rows={3}
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
                {categories && categories.length > 0 ? (
                  <SortableCategoriesTable
                    categories={categories}
                    menuItems={menuItems || []}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                    onReorder={reorderCategories}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Items Count</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Tag className="w-12 h-12" />
                            <div>No categories yet. Create your first category!</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
