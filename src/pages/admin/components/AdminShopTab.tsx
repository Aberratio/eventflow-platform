import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Package, 
  ShoppingCart,
  Infinity,
  Box
} from 'lucide-react';
import { mockShopProducts, shopCategoryLabels, mockShopOrders, mockUsers } from '@/data/mockData';
import { ShopProduct, ShopOrder, ShopCategory } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

const orderStatusLabels: Record<ShopOrder['status'], string> = {
  pending: 'Oczekujące',
  paid: 'Opłacone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

const orderStatusColors: Record<ShopOrder['status'], string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning',
  paid: 'bg-primary/20 text-primary border-primary',
  shipped: 'bg-accent/20 text-accent-foreground border-accent',
  delivered: 'bg-success/20 text-success border-success',
  cancelled: 'bg-destructive/20 text-destructive border-destructive',
};

export const AdminShopTab = () => {
  const [activeTab, setActiveTab] = useState('products');
  
  // Products state
  const [products, setProducts] = useState<ShopProduct[]>(mockShopProducts);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState<ShopCategory | 'all'>('all');
  const [productAvailability, setProductAvailability] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ShopProduct | null>(null);
  
  // Orders state
  const [orders, setOrders] = useState<ShopOrder[]>(mockShopOrders);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState<ShopOrder['status'] | 'all'>('all');
  const [viewingOrder, setViewingOrder] = useState<ShopOrder | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');
  const [orderNewStatus, setOrderNewStatus] = useState<ShopOrder['status']>('pending');

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                           product.brand.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategory === 'all' || product.category === productCategory;
      const matchesAvailability = productAvailability === 'all' ||
                                  (productAvailability === 'inStock' && product.inStock) ||
                                  (productAvailability === 'outOfStock' && !product.inStock);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [products, productSearch, productCategory, productAvailability]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                           mockUsers.find(u => u.id === order.userId)?.name.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatus === 'all' || order.status === orderStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatus]);

  // Product form state
  const [productForm, setProductForm] = useState<Partial<ShopProduct>>({});

  const handleEditProduct = (product: ShopProduct) => {
    setEditingProduct(product);
    setProductForm({ ...product });
    setIsProductDialogOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      description: '',
      price: 0,
      category: 'apparel',
      brand: '',
      imageUrl: '',
      inStock: true,
      isService: false,
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.price) {
      toast.error('Wypełnij wymagane pola');
      return;
    }

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...productForm } as ShopProduct : p
      ));
      toast.success('Produkt został zaktualizowany');
    } else {
      const newProduct: ShopProduct = {
        id: `prod-${Date.now()}`,
        slug: productForm.name?.toLowerCase().replace(/\s+/g, '-') || '',
        ...productForm as ShopProduct,
      };
      setProducts([...products, newProduct]);
      toast.success('Produkt został dodany');
    }
    setIsProductDialogOpen(false);
  };

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      setProducts(products.filter(p => p.id !== deletingProduct.id));
      toast.success('Produkt został usunięty');
      setDeletingProduct(null);
    }
  };

  const handleViewOrder = (order: ShopOrder) => {
    setViewingOrder(order);
    setOrderTrackingNumber(order.trackingNumber || '');
    setOrderNewStatus(order.status);
    setIsOrderDialogOpen(true);
  };

  const handleSaveOrder = () => {
    if (viewingOrder) {
      setOrders(orders.map(o => 
        o.id === viewingOrder.id 
          ? { ...o, status: orderNewStatus, trackingNumber: orderTrackingNumber || undefined }
          : o
      ));
      toast.success('Zamówienie zostało zaktualizowane');
      setIsOrderDialogOpen(false);
    }
  };

  const getCustomerName = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || 'Nieznany klient';
  };

  const getCustomerEmail = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.email || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zarządzanie Sklepem</h2>
          <p className="text-muted-foreground">Produkty, zamówienia i sprzedaż</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Produktów</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Box className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{products.filter(p => p.inStock).length}</p>
                <p className="text-xs text-muted-foreground">Dostępnych</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <ShoppingCart className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Zamówień</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <ShoppingCart className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Oczekujących</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produkty
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Zamówienia
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Szukaj produktów..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={productCategory} onValueChange={(v) => setProductCategory(v as ShopCategory | 'all')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Kategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      {Object.entries(shopCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={productAvailability} onValueChange={(v) => setProductAvailability(v as 'all' | 'inStock' | 'outOfStock')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Dostępność" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      <SelectItem value="inStock">Dostępne</SelectItem>
                      <SelectItem value="outOfStock">Niedostępne</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddProduct} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Dodaj produkt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Obraz</TableHead>
                      <TableHead>Nazwa</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead className="text-right">Cena</TableHead>
                      <TableHead className="text-center">Stan mag.</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-24">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {shopCategoryLabels[product.category]}
                          </Badge>
                          {product.isService && (
                            <Badge variant="secondary" className="ml-1">Usługa</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {product.price} zł
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              {product.originalPrice} zł
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {product.isService ? (
                            <Infinity className="h-4 w-4 mx-auto text-muted-foreground" />
                          ) : (
                            <span>{product.stockCount ?? '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.inStock ? 'default' : 'secondary'}>
                            {product.inStock ? 'Dostępny' : 'Niedostępny'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingProduct(product)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredProducts.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  Nie znaleziono produktów
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj zamówień..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={orderStatus} onValueChange={(v) => setOrderStatus(v as ShopOrder['status'] | 'all')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie</SelectItem>
                    {Object.entries(orderStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nr zamówienia</TableHead>
                      <TableHead>Klient</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Kwota</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-24">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getCustomerName(order.userId)}</p>
                            <p className="text-sm text-muted-foreground">{getCustomerEmail(order.userId)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {order.totalPrice.toFixed(2)} zł
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={orderStatusColors[order.status]}>
                            {orderStatusLabels[order.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredOrders.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  Nie znaleziono zamówień
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Edit/Add Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edytuj produkt' : 'Dodaj nowy produkt'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nazwa *</Label>
                <Input
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Nazwa produktu"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={productForm.slug || ''}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  placeholder="nazwa-produktu"
                />
              </div>
              <div>
                <Label>Marka</Label>
                <Input
                  value={productForm.brand || ''}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  placeholder="SportTime"
                />
              </div>
              <div className="col-span-2">
                <Label>Opis</Label>
                <Textarea
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Opis produktu..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Cena *</Label>
                <Input
                  type="number"
                  value={productForm.price || ''}
                  onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Cena oryginalna (opcjonalna)</Label>
                <Input
                  type="number"
                  value={productForm.originalPrice || ''}
                  onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) || undefined })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Kategoria</Label>
                <Select 
                  value={productForm.category || 'apparel'} 
                  onValueChange={(v) => setProductForm({ ...productForm, category: v as ShopCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(shopCategoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stan magazynowy</Label>
                <Input
                  type="number"
                  value={productForm.stockCount || ''}
                  onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                  placeholder="0"
                  disabled={productForm.isService}
                />
              </div>
              <div className="col-span-2">
                <Label>URL obrazu</Label>
                <Input
                  value={productForm.imageUrl || ''}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.inStock || false}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, inStock: checked })}
                />
                <Label>Dostępny w sprzedaży</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={productForm.isService || false}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, isService: checked })}
                />
                <Label>To jest usługa (bez dostawy)</Label>
              </div>
              {productForm.isService && (
                <>
                  <div className="col-span-2">
                    <Label>Szczegóły usługi</Label>
                    <Textarea
                      value={productForm.serviceDetails || ''}
                      onChange={(e) => setProductForm({ ...productForm, serviceDetails: e.target.value })}
                      placeholder="Informacje o aktywacji, dostępie..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Ważność (dni)</Label>
                    <Input
                      type="number"
                      value={productForm.validityDays || ''}
                      onChange={(e) => setProductForm({ ...productForm, validityDays: Number(e.target.value) })}
                      placeholder="365"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Zapisz zmiany' : 'Dodaj produkt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Zamówienie {viewingOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Klient</p>
                  <p className="font-medium">{getCustomerName(viewingOrder.userId)}</p>
                  <p className="text-sm text-muted-foreground">{getCustomerEmail(viewingOrder.userId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data zamówienia</p>
                  <p className="font-medium">
                    {format(new Date(viewingOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: pl })}
                  </p>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={orderNewStatus} onValueChange={(v) => setOrderNewStatus(v as ShopOrder['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Produkty</p>
                <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                        {item.size && ` (${item.size})`}
                        {item.color && `, ${item.color}`}
                      </span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} zł</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dostawa</p>
                  <p>{viewingOrder.deliveryMethod.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Koszt</p>
                  <p>{viewingOrder.deliveryPrice.toFixed(2)} zł</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Płatność</p>
                  <p>{viewingOrder.paymentMethod.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Dopłata</p>
                  <p>{viewingOrder.paymentSurcharge.toFixed(2)} zł</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <span className="font-semibold">SUMA</span>
                <span className="text-xl font-bold">{viewingOrder.totalPrice.toFixed(2)} zł</span>
              </div>

              <div>
                <Label>Numer przesyłki</Label>
                <Input
                  value={orderTrackingNumber}
                  onChange={(e) => setOrderTrackingNumber(e.target.value)}
                  placeholder="Wprowadź numer przesyłki..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Zamknij
            </Button>
            <Button onClick={handleSaveOrder}>
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć produkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć produkt "{deletingProduct?.name}"? 
              Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
