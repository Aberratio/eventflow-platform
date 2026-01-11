import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck, CreditCard, Smartphone, Building, Banknote, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { mockDeliveryMethods, mockShopPaymentMethods } from '@/data/mockData';

const paymentIcons: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  blik: <Smartphone className="h-4 w-4" />,
  transfer: <Building className="h-4 w-4" />,
  cod: <Banknote className="h-4 w-4" />,
};

const CartPage = () => {
  const { items, getProduct, updateItemQuantity, removeItemByVariant, clearCart, totalPrice, totalItems } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedDelivery, setSelectedDelivery] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryMethod = mockDeliveryMethods.find(d => d.id === selectedDelivery);
  const paymentMethod = mockShopPaymentMethods.find(p => p.id === selectedPayment);
  
  const deliveryPrice = deliveryMethod?.price || 0;
  const paymentSurcharge = paymentMethod?.surcharge || 0;

  const canCheckout = items.length > 0 && !!selectedDelivery && !!selectedPayment;

  const handleCheckout = async () => {
    if (!canCheckout) return;

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Zamówienie złożone!',
      description: 'Dziękujemy za zakupy. Potwierdzenie zostało wysłane na email.',
    });
    
    clearCart();
    navigate('/shop');
    setIsProcessing(false);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Twój koszyk jest pusty</h1>
            <p className="text-muted-foreground">
              Dodaj produkty, aby kontynuować zakupy
            </p>
            <Button asChild>
              <Link to="/shop">Przejdź do sklepu</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/shop">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kontynuuj zakupy
            </Link>
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          Koszyk ({totalItems} {totalItems === 1 ? 'produkt' : totalItems < 5 ? 'produkty' : 'produktów'})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items & Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {items.map((item, index) => {
                const product = getProduct(item.productId);
                if (!product) return null;
                
                return (
                  <CartItemCard
                    key={`${item.productId}-${item.size}-${item.color}-${index}`}
                    item={item}
                    product={product}
                    onUpdateQuantity={(quantity) => 
                      updateItemQuantity(item.productId, quantity, item.size, item.color)
                    }
                    onRemove={() => 
                      removeItemByVariant(item.productId, item.size, item.color)
                    }
                  />
                );
              })}
            </div>

            {/* Delivery Options */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Dostawa
              </h2>
              
              <RadioGroup value={selectedDelivery} onValueChange={setSelectedDelivery}>
                <div className="space-y-3">
                  {mockDeliveryMethods.map((method) => (
                    <div key={method.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {method.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {method.estimatedDays}
                            </div>
                          </div>
                          <div className="font-medium">
                            {method.price === 0 ? 'Gratis' : `${method.price.toFixed(2)} zł`}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Payment Options */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metoda płatności
              </h2>
              
              <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                <div className="space-y-3">
                  {mockShopPaymentMethods.map((method) => (
                    <div key={method.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="mt-1" />
                      <Label htmlFor={`payment-${method.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div className="font-medium flex items-center gap-2">
                            {paymentIcons[method.id]}
                            {method.name}
                          </div>
                          {method.surcharge && method.surcharge > 0 && (
                            <div className="text-sm text-muted-foreground">
                              +{method.surcharge.toFixed(2)} zł
                            </div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary
                productTotal={totalPrice}
                itemCount={totalItems}
                deliveryPrice={deliveryPrice}
                paymentSurcharge={paymentSurcharge}
                onCheckout={handleCheckout}
                isProcessing={isProcessing}
                canCheckout={canCheckout}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
