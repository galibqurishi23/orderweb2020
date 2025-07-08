'use client';

import React, { useState, useMemo } from 'react';
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
  XCircle
} from 'lucide-react';
import { useTenantData } from '@/context/TenantDataContext';
import type { MenuItem, Category } from '@/lib/types';
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

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
    nutrition: undefined
  });

  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '',
    description: '',
    active: true,
    order: 0
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
      nutrition: undefined
    });
    setEditingItem(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      active: true,
      order: categories?.length || 0
    });
    setEditingCategory(null);
  };

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
        imageUrl: itemForm.imageUrl || '',
        imageHint: itemForm.imageHint || '',
        available: itemForm.available ?? true,
        categoryId: itemForm.categoryId || '',
        addons: itemForm.addons || [],
        characteristics: itemForm.characteristics || [],
        nutrition: itemForm.nutrition
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
        order: Number(categoryForm.order) || 0,
        parentId: undefined
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
      imageUrl: item.imageUrl,
      imageHint: item.imageHint,
      available: item.available,
      categoryId: item.categoryId,
      addons: item.addons,
      characteristics: item.characteristics,
      nutrition: item.nutrition
    });
    setIsItemDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      active: category.active,
      order: category.order
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

  const handleDeleteCategory = async (category: Category) => {
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant's menu items and categories
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Items</span>
              </div>
              <p className="text-2xl font-bold">{menuItems?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Categories</span>
              </div>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <p className="text-2xl font-bold">{menuItems?.filter(item => item.available).length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Unavailable</span>
              </div>
              <p className="text-2xl font-bold">{menuItems?.filter(item => !item.available).length || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
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
                  <CardDescription>Manage your food and drink items</CardDescription>
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
                        {categories?.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={(value: 'name' | 'price' | 'category') => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* View Mode and Add Button */}
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={resetItemForm} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
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
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="imageUrl" className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Image URL
                              </Label>
                              <Input
                                id="imageUrl"
                                value={itemForm.imageUrl}
                                onChange={(e) => setItemForm({...itemForm, imageUrl: e.target.value})}
                                placeholder="https://..."
                              />
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
                                  {categories?.map(category => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
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
                              <div className="font-medium">{item.name}</div>
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
                        <TableCell colSpan={6} className="h-24 text-center">
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
                <CardDescription>Organize your menu with categories</CardDescription>
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
                      <Label htmlFor="categoryOrder">Sort Order</Label>
                      <Input
                        id="categoryOrder"
                        type="number"
                        min="0"
                        value={categoryForm.order}
                        onChange={(e) => setCategoryForm({...categoryForm, order: parseInt(e.target.value) || 0})}
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
                      <TableHead>Description</TableHead>
                      <TableHead>Items Count</TableHead>
                      <TableHead>Sort Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 ? (
                      categories
                        .sort((a, b) => a.order - b.order)
                        .map(category => (
                          <TableRow key={category.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="max-w-xs">
                              <span className="line-clamp-2">{category.description || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {menuItems?.filter(item => item.categoryId === category.id).length || 0} items
                              </Badge>
                            </TableCell>
                            <TableCell>{category.order}</TableCell>
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
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
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
