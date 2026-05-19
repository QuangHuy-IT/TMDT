import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCheckout from '../hooks/useCheckout';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { OrderSummary } from '../components/checkout/OrderSummary';
import { QRPaymentView } from '../components/checkout/QRPaymentView';

export const Checkout = () => {
  const checkout = useCheckout();
  const navigate = useNavigate();

  // ── QR payment view ────────────────────────────────────────────────────────
  if (checkout.showQR && checkout.paymentData) {
    return (
      <QRPaymentView
        paymentData={checkout.paymentData}
        onCancel={checkout.handleCancelQR}
        onSuccess={checkout.handlePayOSPaymentSuccess}
        navigate={navigate}
      />
    );
  }

  // ── Main checkout layout ───────────────────────────────────────────────────
  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-black text-gray-900 mb-10 uppercase tracking-tighter">
          Thanh toán
        </h1>

        <form
          onSubmit={checkout.handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          {/* Left column */}
          <div className="lg:col-span-7 space-y-6">
            <CheckoutForm
              shippingInfo={checkout.shippingInfo}
              paymentMethod={checkout.paymentMethod}
              isProcessing={checkout.isProcessing}
              error={checkout.error}
              savedAddresses={checkout.savedAddresses}
              selectedAddressId={checkout.selectedAddressId}
              onInputChange={checkout.handleInputChange}
              onSelectAddress={checkout.handleSelectAddress}
              onSubmit={checkout.handlePlaceOrder}
              onPaymentMethodChange={checkout.setPaymentMethod}
            />
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-5">
            <OrderSummary
              cart={checkout.selectedCart}
              subtotal={checkout.subtotal}
              shippingFee={checkout.shippingFee}
              discountAmount={checkout.discountAmount}
              total={checkout.total}
              voucherCode={checkout.voucherCode}
              fmt={checkout.fmt}
            />
          </div>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
