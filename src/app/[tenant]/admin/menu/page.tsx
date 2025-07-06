'use client';

import React, { useState, useMemo } from 'react';
import { ChefHat, Plus, Edit, Trash2, Search, Package, Tag } from 'lucide-react';
import { useData } from '@/context/DataContext';
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

export default function TenantMenuPage() {
  const { menuItems, categories, saveMenuItem, deleteMenuItem, saveCategory, deleteCategory, restaurantSettings } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const currencySymbol = useMemo(() => {
    if (restaurantSettings.currency === 'USD') return '$';
    if (restaurantSettings.currency === 'EUR') return '€';
    return '£';
  }, [restaurantSettings.currency]);

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

  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(lowercasedQuery) ||
        item.description?.toLowerCase().includes(lowercasedQuery)
      );
    }

    return filtered;
  }, [menuItems, selectedCategory, searchQuery]);

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
      order: 0
    });
    setEditingCategory(null);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.price) {
      toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
      return;
    }

    try {
      const itemToSave: MenuItem = {
        id: editingItem?.id || `item_${Date.now()}`,
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
      toast({ title: "Success", description: `Menu item ${editingItem ? 'updated' : 'created'} successfully` });
      setIsItemDialogOpen(false);
      resetItemForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save menu item", variant: "destructive" });
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast({ title: "Error", description: "Category name is required", variant: "destructive" });
      return;
    }

    try {
      const categoryToSave: Category = {
        id: editingCategory?.id || `cat_${Date.now()}`,
        name: categoryForm.name!,
        description: categoryForm.description || '',
        active: categoryForm.active ?? true,
        order: Number(categoryForm.order) || 0,
        parentId: undefined
      };

      await saveCategory(categoryToSave);
      toast({ title: "Success", description: `Category ${editingCategory ? 'updated' : 'created'} successfully` });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
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

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteMenuItem(itemId);
        toast({ title: "Success", description: "Menu item deleted successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete menu item", variant: "destructive" });
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category? Items in this category will become uncategorized.')) {
      try {
        await deleteCategory(categoryId);
        toast({ title: "Success", description: "Category deleted successfully" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <ChefHat className="w-8 h-8" />
            <span className="text-2xl font-bold">Menu Management</span>
          </CardTitle>
          <CardDescription>
            Manage your restaurant's menu items and categories.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search menu items..."
                    className="pl-10 w-64"
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
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetItemForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                          placeholder="Item name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Price ({currencySymbol}) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={itemForm.price}
                          onChange={(e) => setItemForm({...itemForm, price: parseFloat(e.target.value) || 0})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={itemForm.description}
                        onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                          id="imageUrl"
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({...itemForm, imageUrl: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={itemForm.categoryId} onValueChange={(value) => setItemForm({...itemForm, categoryId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Category</SelectItem>
                            {categories.map(category => (
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
                      <Label htmlFor="available">Available</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveItem}>
                      {editingItem ? 'Update' : 'Create'}
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
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.categoryId ? (
                              <Badge variant="outline">
                                {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No Category</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {currencySymbol}{item.price.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.available ? "default" : "secondary"}>
                              {item.available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {searchQuery || selectedCategory !== 'all' 
                            ? "No items found matching your criteria." 
                            : "No menu items yet. Add your first item!"
                          }
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Organize your menu items with categories</CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="categoryName">Name *</Label>
                      <Input
                        id="categoryName"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        placeholder="Category name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="Category description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryOrder">Order</Label>
                      <Input
                        id="categoryOrder"
                        type="number"
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
                      <Label htmlFor="categoryActive">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCategory}>
                      {editingCategory ? 'Update' : 'Create'}
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
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {menuItems.filter(item => item.categoryId === category.id).length} items
                            </Badge>
                          </TableCell>
                          <TableCell>{category.order}</TableCell>
                          <TableCell>
                            <Badge variant={category.active ? "default" : "secondary"}>
                              {category.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No categories yet. Add your first category!
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
