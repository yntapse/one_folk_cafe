'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, ImagePlus, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, toggleProductAvailability, createCategory } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn, fmtCurrency } from '@/lib/utils';
import type { ProductWithCategory, Category } from '@/types';

export default function Products() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    fullPlatePrice: '',
    halfPlatePrice: '',
    halfPlateAvailable: false,
    image: '',
    available: true,
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added!');
      setShowModal(false);
    },
    onError: () => toast.error('Failed to add product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated!');
      setShowModal(false);
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted!');
      setProductToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete product');
      setProductToDelete(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleProductAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; image_url?: string }) => createCategory(data),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (newCat.data) setForm(f => ({ ...f, category: newCat.data!.name }));
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatImage('');
      setCatDropdownOpen(false);
      toast.success('Category added!');
    },
    onError: () => toast.error('Failed to add category'),
  });

  const filtered = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.category_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || p.category_name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0].name : '',
      fullPlatePrice: '',
      halfPlatePrice: '',
      halfPlateAvailable: false,
      image: '',
      available: true,
    });
    setShowModal(true);
  };

  const openEdit = (p: ProductWithCategory) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      category: p.category_name || '',
      fullPlatePrice: String(p.full_plate_price),
      halfPlatePrice: p.half_plate_price ? String(p.half_plate_price) : '',
      halfPlateAvailable: p.half_plate_available || false,
      image: p.image_url || '',
      available: p.available,
    });
    setShowModal(true);
    setCatDropdownOpen(false);
    setIsAddingCategory(false);
    setNewCatImage('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, image: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleCatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewCatImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.fullPlatePrice) {
      toast.error('Name and full plate price are required');
      return;
    }

    const cat = categories.find((c: Category) => c.name === form.category);
    if (!cat) {
      toast.error('Please select a valid category');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      category_id: cat.id,
      full_plate_price: parseFloat(form.fullPlatePrice),
      half_plate_price: form.halfPlateAvailable && form.halfPlatePrice ? parseFloat(form.halfPlatePrice) : null,
      half_plate_available: form.halfPlateAvailable,
      image_url: form.image || null,
      available: form.available,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleToggleAvailable = (p: ProductWithCategory) => {
    toggleMutation.mutate(p.id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} items in menu</p>
        </div>
        <Button onClick={openAdd} disabled={isLoadingCategories} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        <div className="w-48 relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between" onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}>
                <span className="truncate">{categoryFilter}</span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onSelect={() => { setCategoryFilter('All Categories'); setFilterDropdownOpen(false); }}
                className={categoryFilter === 'All Categories' ? 'bg-accent text-accent-foreground' : ''}
              >
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((c: Category) => (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={() => { setCategoryFilter(c.name); setFilterDropdownOpen(false); }}
                  className={categoryFilter === c.name ? 'bg-accent text-accent-foreground' : ''}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-secondary/50 text-left border-b border-border">
                  {['Product', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoadingProducts ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Loading products...</td>
                  </tr>
                ) : filtered.map((p: ProductWithCategory) => (
                  <tr key={p.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{p.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="secondary" className="text-xs">{p.category_name}</Badge>
                    </td>
                    <td className="px-5 py-4 font-bold text-primary">
                      <div className="flex flex-col">
                        <span>{fmtCurrency(p.full_plate_price)}</span>
                        {p.half_plate_available && (
                          <span className="text-xs text-muted-foreground font-normal">Half: {fmtCurrency(Number(p.half_plate_price))}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Button
                        variant={p.available ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleAvailable(p)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold transition-colors shadow-sm',
                          p.available
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                        )}
                      >
                        {p.available ? '● Available' : '○ Unavailable'}
                      </Button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setProductToDelete({ id: p.id, name: p.name })} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !isLoadingProducts && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Vanilla Latte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Brief product description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category *</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-10"
                          onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                        >
                          <span className="truncate">{form.category || 'Select a category'}</span>
                          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-full max-h-64">
                        {isAddingCategory ? (
                          <div className="p-2 space-y-2">
                            <Input
                              autoFocus
                              placeholder="New Category Name"
                              value={newCatName}
                              onChange={e => setNewCatName(e.target.value)}
                            />
                            <div className="flex gap-2 items-center">
                              {newCatImage && (
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary flex-shrink-0 border border-border">
                                  <img src={newCatImage} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <Label className="flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs border border-border rounded-lg cursor-pointer hover:bg-secondary">
                                <ImagePlus className="w-3.5 h-3.5" />
                                <span>{newCatImage ? 'Change' : 'Add Image'}</span>
                                <input type="file" accept="image/*" onChange={handleCatImageUpload} className="hidden" />
                              </Label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => newCatName.trim() && createCategoryMutation.mutate({ name: newCatName.trim(), image_url: newCatImage || undefined })}
                                disabled={createCategoryMutation.isPending || !newCatName.trim()}
                                className="flex-1"
                              >
                                {createCategoryMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button type="button" variant="outline" onClick={() => { setIsAddingCategory(false); setNewCatName(''); setNewCatImage(''); }} className="flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="max-h-40 overflow-y-auto p-1">
                              {categories.map((c: Category) => (
                                <DropdownMenuItem
                                  key={c.id}
                                  onSelect={() => { setForm({ ...form, category: c.name }); setCatDropdownOpen(false); }}
                                  className={form.category === c.name ? 'bg-accent text-accent-foreground' : ''}
                                >
                                  {c.name}
                                </DropdownMenuItem>
                              ))}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setIsAddingCategory(true)}>
                              <Plus className="w-3.5 h-3.5 mr-2" /> Add New Category
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullPlatePrice">Full Plate Price (₹) *</Label>
                    <Input
                      id="fullPlatePrice"
                      type="number"
                      value={form.fullPlatePrice}
                      onChange={e => setForm({ ...form, fullPlatePrice: e.target.value })}
                      placeholder="299"
                      min="1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-secondary/50 transition-colors flex-1">
                    <div
                      onClick={() => setForm({ ...form, halfPlateAvailable: !form.halfPlateAvailable })}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors flex items-center px-0.5',
                        form.halfPlateAvailable ? 'bg-primary' : 'bg-border'
                      )}
                    >
                      <div className={cn('w-5 h-5 rounded-full bg-white shadow transition-transform', form.halfPlateAvailable ? 'translate-x-5' : 'translate-x-0')} />
                    </div>
                    <span className="text-sm font-medium">Enable Half Plate</span>
                  </Label>
                  {form.halfPlateAvailable && (
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="halfPlatePrice">Half Plate Price (₹) *</Label>
                      <Input
                        id="halfPlatePrice"
                        type="number"
                        value={form.halfPlatePrice}
                        onChange={e => setForm({ ...form, halfPlatePrice: e.target.value })}
                        placeholder="199"
                        min="1"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Product Image (URL or Upload)</Label>
                  <div className="flex gap-3 items-center">
                    {form.image && form.image.startsWith('http') && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {form.image && form.image.startsWith('data:image') && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border">
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <Label className="flex-1 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border rounded-xl py-3 px-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{form.image ? 'Change image' : 'Click to attach image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </Label>
                  </div>
                </div>
                <Label className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div
                    onClick={() => setForm({ ...form, available: !form.available })}
                    className={cn(
                      'w-11 h-6 rounded-full transition-colors flex items-center px-0.5',
                      form.available ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    <div className={cn('w-5 h-5 rounded-full bg-white shadow transition-transform', form.available ? 'translate-x-5' : 'translate-x-0')} />
                  </div>
                  <span className="text-sm font-medium">Available for ordering</span>
                </Label>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {productToDelete && (
          <Dialog open={true} onOpenChange={(open) => !open && setProductToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Product?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action will remove it from the menu.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProductToDelete(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate(productToDelete.id)} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}