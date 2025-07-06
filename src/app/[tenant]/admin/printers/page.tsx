'use client';

import React, { useState } from 'react';
import { Printer, Plus, Edit, Trash2, Save, X, Wifi, WifiOff, Settings2, TestTube2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import type { Printer as PrinterType, PrinterType as TypeEnum } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


const getPrinterTypeAttributes = (type: TypeEnum) => {
    switch (type) {
      case 'kitchen': return { icon: '🍳', color: 'bg-orange-100 text-orange-800' };
      case 'receipt': return { icon: '🧾', color: 'bg-blue-100 text-blue-800' };
      case 'bar': return { icon: '🍹', color: 'bg-teal-100 text-teal-800' };
      case 'dot-matrix': return { icon: '📄', color: 'bg-gray-200 text-gray-800' };
      case 'label': return { icon: '🏷️', color: 'bg-yellow-100 text-yellow-800' };
      default: return { icon: '🖨️', color: 'bg-gray-100 text-gray-800' };
    }
};

const PrinterCard = ({ printer, onEdit, onDelete, onTest, onToggle }: { printer: PrinterType, onEdit: (p: PrinterType) => void, onDelete: (id: string) => void, onTest: (p: PrinterType) => void, onToggle: (id: string) => void }) => {
    const { icon, color } = getPrinterTypeAttributes(printer.type);
    
    return (
        <Card className="flex flex-col hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">{icon}</div>
                        <div>
                            <CardTitle>{printer.name}</CardTitle>
                            <CardDescription>{printer.ipAddress}:{printer.port}</CardDescription>
                        </div>
                    </div>
                    <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(printer)}><Edit className="w-4 h-4" /></Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Printer?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the <strong>{printer.name}</strong> printer. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(printer.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary" className={cn("capitalize", color)}>{printer.type.replace('-', ' ')}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                        <Badge variant={printer.active ? 'default' : 'destructive'}>
                            {printer.active ? 'Active' : 'Inactive'}
                        </Badge>
                        {printer.active ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-destructive" />}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                 <Button variant="outline" className="w-full" onClick={() => onTest(printer)} disabled={!printer.active}>
                    <TestTube2 className="w-4 h-4 mr-2"/>
                    Test Print
                </Button>
                 <Button variant="secondary" className="w-full" onClick={() => onToggle(printer.id)}>
                    <Settings2 className="w-4 h-4 mr-2"/>
                    {printer.active ? 'Disable' : 'Enable'}
                </Button>
            </CardFooter>
        </Card>
    );
};

const PrinterFormDialog = ({ isOpen, onClose, onSave, printer }: { isOpen: boolean, onClose: () => void, onSave: (p: PrinterType) => void, printer: Partial<PrinterType> | null }) => {
    const [formData, setFormData] = useState<Partial<PrinterType> | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        if (isOpen && printer) {
            setFormData({ ...printer });
        } else if (isOpen) {
            setFormData({
                id: `printer-${Date.now()}`,
                name: '',
                ipAddress: '',
                port: 9100,
                type: 'kitchen',
                active: true,
            });
        }
    }, [isOpen, printer]);

    if (!isOpen || !formData) return null;

    const handleSaveClick = async () => {
        if (!formData.name || !formData.ipAddress) {
            toast({ variant: 'destructive', title: "Validation Error", description: "Printer name and IP address are required." });
            return;
        }
        await onSave(formData as PrinterType);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{printer?.id?.startsWith('printer-') ? 'Add New Printer' : 'Edit Printer'}</DialogTitle>
                    <DialogDescription>Configure connection details for a new or existing printer.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="printer-name">Printer Name</Label>
                        <Input id="printer-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Kitchen Printer 1" />
                    </div>
                    <div>
                        <Label htmlFor="printer-ip">IP Address</Label>
                        <Input id="printer-ip" value={formData.ipAddress} onChange={e => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="e.g., 192.168.1.101" />
                    </div>
                     <div>
                        <Label htmlFor="printer-port">Port</Label>
                        <Input id="printer-port" type="number" value={formData.port} onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) || 9100 })} placeholder="e.g., 9100" />
                    </div>
                    <div>
                         <Label htmlFor="printer-type">Printer Type</Label>
                         <Select value={formData.type} onValueChange={(value: TypeEnum) => setFormData({ ...formData, type: value })}>
                            <SelectTrigger id="printer-type"><SelectValue placeholder="Select a type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kitchen">Kitchen</SelectItem>
                                <SelectItem value="receipt">Receipt</SelectItem>
                                <SelectItem value="bar">Bar</SelectItem>
                                <SelectItem value="dot-matrix">Dot Matrix</SelectItem>
                                <SelectItem value="label">Label</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="printer-active" checked={formData.active} onCheckedChange={checked => setFormData({ ...formData, active: checked })}/>
                        <Label htmlFor="printer-active">Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick}><Save className="w-4 h-4 mr-2"/>Save Printer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function PrintersPage() {
    const { printers, savePrinter, deletePrinter, togglePrinterStatus } = useData();
    const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const handleAddNew = () => {
        setEditingPrinter(null);
        setIsFormOpen(true);
    };

    const handleEdit = (printer: PrinterType) => {
        setEditingPrinter(printer);
        setIsFormOpen(true);
    };
    
    const handleDelete = async (printerId: string) => {
        await deletePrinter(printerId);
        toast({ title: "Printer Deleted", description: "The printer has been removed." });
    };

    const handleSave = async (printerData: PrinterType) => {
        const isNew = printerData.id.startsWith('printer-');
        await savePrinter(printerData);
        toast({ title: isNew ? "Printer Added" : "Printer Updated", description: `The "${printerData.name}" printer has been saved.`});
        setIsFormOpen(false);
        setEditingPrinter(null);
    };

    const handleTestPrint = (printer: PrinterType) => {
        toast({
            title: "Test Print Sent",
            description: `A test print was sent to "${printer.name}" at ${printer.ipAddress}.`,
        });
        console.log(`Simulating test print for:`, printer);
    };

    const handleToggleStatus = async (printerId: string) => {
        await togglePrinterStatus(printerId);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-4">
                            <Printer className="w-8 h-8" />
                            <span className="text-2xl font-bold">Printer Management</span>
                        </CardTitle>
                        <CardDescription>Configure and manage all restaurant printers.</CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <Plus className="w-4 h-4 mr-2"/>
                        Add Printer
                    </Button>
                </CardHeader>
            </Card>

            {printers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {printers.map(printer => (
                        <PrinterCard 
                            key={printer.id}
                            printer={printer}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onTest={handleTestPrint}
                            onToggle={handleToggleStatus}
                        />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16">
                    <CardContent>
                        <Printer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold mb-2">No Printers Found</h3>
                        <p className="text-muted-foreground text-lg mb-6">Click "Add Printer" to configure your first printer.</p>
                        <Button onClick={handleAddNew}>
                            <Plus className="w-4 h-4 mr-2"/>
                            Add New Printer
                        </Button>
                    </CardContent>
                </Card>
            )}

            <PrinterFormDialog
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                printer={editingPrinter}
            />
        </div>
    );
}
