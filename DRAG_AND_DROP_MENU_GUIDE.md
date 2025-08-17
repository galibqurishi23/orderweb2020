# Drag-and-Drop Menu Management 🎯

## Overview
The menu management system now includes drag-and-drop functionality for easy reordering of categories and menu items. This replaces the manual "Sort Order" field with an intuitive drag interface.

## Features Added

### 🏷️ Categories
- **Drag Handle**: Grab the grip icon (⋮⋮) to drag categories up/down
- **Hierarchical Support**: Parent and subcategories maintain their relationships during reordering
- **Visual Feedback**: Items become semi-transparent while dragging
- **Auto-Save**: Order is automatically saved to the database
- **Real-time Updates**: Order changes are immediately reflected in the shop page

### 🍽️ Menu Items
- **Drag Handle**: Grab the grip icon (⋮⋮) to drag menu items up/down
- **Category-Aware**: When filtering by category, only items in that category are reordered
- **Cross-Category**: When viewing "All Categories", items can be reordered globally
- **Visual Feedback**: Items become semi-transparent while dragging
- **Auto-Save**: Order is automatically saved to the database

## How to Use

### Reordering Categories
1. Navigate to **Admin > Menu Management > Categories** tab
2. Look for the grip icon (⋮⋮) in the leftmost column
3. Click and drag the grip icon to move the category up or down
4. Release to drop the category in its new position
5. The new order is automatically saved

### Reordering Menu Items
1. Navigate to **Admin > Menu Management > Menu Items** tab
2. Optionally filter by a specific category for category-specific ordering
3. Look for the grip icon (⋮⋮) in the leftmost column
4. Click and drag the grip icon to move the item up or down
5. Release to drop the item in its new position
6. The new order is automatically saved

## Technical Implementation

### Database Changes
- Added `display_order` column to `categories` table
- Added `display_order` column to `menu_items` table
- Existing records automatically initialized with proper order values

### API Endpoints
- `PUT /api/tenant/menu/categories/reorder` - Reorder categories
- `PUT /api/tenant/menu/items/reorder` - Reorder menu items

### Frontend Components
- `SortableCategoriesTable.tsx` - Drag-and-drop categories table
- `SortableMenuItemsTable.tsx` - Drag-and-drop menu items table
- Uses `@dnd-kit` library for modern drag-and-drop functionality

### Libraries Used
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list implementation
- `@dnd-kit/utilities` - Utility functions for drag-and-drop

## Shop Page Impact
The order you set in the admin panel will be reflected immediately on the customer-facing shop page:
- Categories appear in the order you set
- Menu items within each category appear in the order you set
- This provides full control over how customers see your menu

## Benefits
- ✅ **Intuitive**: No more manual number entry
- ✅ **Visual**: See the order as you arrange it
- ✅ **Fast**: Instant reordering with drag-and-drop
- ✅ **Error-free**: No conflicts or duplicate order numbers
- ✅ **Mobile-friendly**: Works on touch devices
- ✅ **Accessible**: Keyboard navigation support

## Troubleshooting
- If drag-and-drop doesn't work, ensure JavaScript is enabled
- If order doesn't save, check your internet connection
- If items jump back, refresh the page to reload the latest order
- Contact support if you encounter persistent issues

## Migration Notes
- Existing menu structure is preserved
- All existing categories and items automatically get proper order values
- The old "Sort Order" field has been removed from the category form
- No data loss during the upgrade process
