import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import PaymentService from '../services/paymentService';
import AddressService from '../services/addressService';
import { PROVINCES, getProvinceCodeByName, getProvinceNameByCode } from '../data/provinces';
import ProvincesService from '../services/provincesService';

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

const useCheckout = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { cart, user } = state;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Voucher from URL ───────────────────────────────────────────────────────
  const voucherCode = searchParams.get('voucherCode') || null;
  const voucherDiscountType = searchParams.get('discountType') || null;
  const voucherDiscountValue = Number(searchParams.get('discountValue')) || 0;
  const voucherMaxDiscount = Number(searchParams.get('maxDiscountAmount')) || null;
  const selectedIds = JSON.parse(searchParams.get('items') || 'null');

  // ── State ──────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingInfo, setShippingInfo] = useState({
    receiverName: user?.fullName || '',
    receiverPhone: user?.phone || '',
    provinceCode: '',
    provinceName: '',
    ward: '',
    detailAddress: '',
    note: '',
  });
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');

  // ── Only the items the user selected in Cart ─────────────────────────────────
  const selectedCart = Array.isArray(selectedIds) && selectedIds.length > 0
    ? cart.filter(item => selectedIds.includes(item.cartKey || item.variantId || item.variantSlug || item.slug || item.id || item._id))
    : cart;

  // ── Load saved addresses & default shipping address ─────────────────────────
  useEffect(() => {
    AddressService.getAddresses()
      .then(res => {
        setSavedAddresses(res.data);
        const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          const code = defaultAddr.province
            ? (PROVINCES.find(p => p.name === defaultAddr.province)?.code || getProvinceCodeByName(defaultAddr.province) || '')
            : '';
          setShippingInfo(prev => ({
            ...prev,
            receiverName: prev.receiverName || defaultAddr.receiverName || '',
            receiverPhone: prev.receiverPhone || defaultAddr.receiverPhone || '',
            provinceCode: code,
            provinceName: defaultAddr.province || '',
            ward: defaultAddr.ward || '',
            detailAddress: defaultAddr.detailAddress || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => selectedCart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedCart]
  );

  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  const discountAmount = useMemo(() => {
    if (!voucherCode) return 0;
    if (voucherDiscountType === 'PERCENT') {
      let discount = subtotal * (voucherDiscountValue / 100);
      if (voucherMaxDiscount != null) {
        discount = Math.min(discount, voucherMaxDiscount);
      }
      return Math.round(discount);
    }
    if (voucherDiscountType === 'FIXED') {
      return Math.min(voucherDiscountValue, subtotal);
    }
    return 0;
  }, [voucherCode, voucherDiscountType, voucherDiscountValue, voucherMaxDiscount, subtotal]);

  const total = subtotal + shippingFee - discountAmount;

  // ── Shared order data builder (DRY) ────────────────────────────────────────
  const buildOrderData = useCallback((paymentMethodValue) => {
    const fullAddress = [
      shippingInfo.detailAddress,
      shippingInfo.ward,
      shippingInfo.provinceName,
    ].filter(Boolean).join(', ');
    return {
      userId: user?.id,
      receiverName: shippingInfo.receiverName,
      receiverPhone: shippingInfo.receiverPhone,
      shippingAddressText: fullAddress,
      note: shippingInfo.note,
      subtotalAmount: subtotal,
      discountAmount: discountAmount,
      voucherCode: voucherCode,
      shippingFee: shippingFee,
      totalAmount: total,
      paymentMethod: paymentMethodValue,
      items: selectedCart.map((item) => ({
        variantId: item.variantId || Number(item.id) || null,
        productName: item.name,
        sku: item.sku || '',
        color: item.color || '',
        ram: item.ram || '',
        storage: item.storage || '',
        unitPrice: item.price,
        quantity: item.quantity,
        imageUrl: item.thumbnailUrl || item.imageUrl || item.images?.[0] || '',
      })),
    };
  }, [user, shippingInfo, subtotal, discountAmount, voucherCode, shippingFee, total, selectedCart]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateShippingInfo = useCallback(() => {
    if (!shippingInfo.receiverName?.trim()) {
      setError('Vui lòng nhập họ tên người nhận.');
      return false;
    }
    if (!shippingInfo.receiverPhone?.trim()) {
      setError('Vui lòng nhập số điện thoại.');
      return false;
    }
    if (!/^\d{9,11}$/.test(shippingInfo.receiverPhone.replace(/\s/g, ''))) {
      setError('Số điện thoại không hợp lệ (9–11 chữ số).');
      return false;
    }
    if (!shippingInfo.provinceCode?.trim()) {
      setError('Vui lòng chọn Tỉnh / Thành phố.');
      return false;
    }
    if (!shippingInfo.ward?.trim()) {
      setError('Vui lòng chọn Phường / Xã.');
      return false;
    }
    if (!shippingInfo.detailAddress?.trim()) {
      setError('Vui lòng nhập địa chỉ cụ thể.');
      return false;
    }
    return true;
  }, [shippingInfo]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'provinceCode') {
        updated.ward = '';
      }
      return updated;
    });
    setError('');
  }, []);

  const handleSelectAddress = useCallback((addr) => {
    const code = addr.province
      ? (PROVINCES.find(p => p.name === addr.province)?.code || getProvinceCodeByName(addr.province) || '')
      : '';
    setSelectedAddressId(addr.id);
    setShippingInfo(prev => ({
      ...prev,
      receiverName: addr.receiverName || '',
      receiverPhone: addr.receiverPhone || '',
      provinceCode: code,
      provinceName: addr.province || '',
      ward: addr.ward || '',
      detailAddress: addr.detailAddress || '',
    }));
    setError('');
  }, []);

  const handlePlaceOrder = useCallback(async (e) => {
    e?.preventDefault();
    if (!validateShippingInfo()) return;

    if (paymentMethod === 'payos') {
      await handlePayOSPayment();
    } else {
      handleCODPayment();
    }
  }, [paymentMethod, validateShippingInfo]);

  const handlePayOSPayment = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      const orderData = buildOrderData('PAYOS');
      const response = await PaymentService.placeOrderAndPay(orderData);
      const payment = response.data;

      if (payment.qrCode) {
        setPaymentData({ payment });
        setShowQR(true);
      } else if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    } catch (err) {
      console.error('PayOS payment error:', err);
      setError(err.response?.data?.message || 'Không thể tạo thanh toán PayOS. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, buildOrderData]);

  const handleCODPayment = useCallback(() => {
    const orderData = buildOrderData('COD');

    PaymentService.placeOrderAndPay(orderData)
      .then((res) => {
        dispatch({ type: 'CLEAR_CART' });
        const raw = res.data;
        // Support both { order: { orderCode } } and { orderCode } flat structure
        const orderCode = raw?.order?.orderCode ?? raw?.orderCode ?? raw?.code ?? null;
        if (orderCode) {
          navigate(`/payment/success?orderCode=${orderCode}`);
        } else {
          console.warn('placeOrderAndPay response:', raw);
          navigate('/payment/success');
        }
      })
      .catch((err) => {
        console.error('COD order error:', err);
        setError(err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      });
  }, [buildOrderData, dispatch, navigate]);

  const handleCancelQR = useCallback(() => {
    if (paymentData?.payment?.orderCode) {
      navigate(`/payment/cancel?orderCode=${paymentData.payment.orderCode}`);
    } else {
      setShowQR(false);
      setPaymentData(null);
    }
  }, [paymentData, navigate]);

  const handlePayOSPaymentSuccess = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  return {
    // State
    cart,
    selectedCart,
    user,
    paymentMethod,
    shippingInfo,
    isProcessing,
    paymentData,
    showQR,
    error,
    savedAddresses,
    selectedAddressId,
    // Computed
    subtotal,
    shippingFee,
    discountAmount,
    total,
    voucherCode,
    // Setters
    setPaymentMethod,
    setShippingInfo,
    setPaymentData,
    setShowQR,
    setError,
    // Handlers
    handleInputChange,
    handleSelectAddress,
    handlePlaceOrder,
    handlePayOSPayment,
    handleCancelQR,
    handlePayOSPaymentSuccess,
    // Helpers
    fmt,
  };
};

export default useCheckout;
