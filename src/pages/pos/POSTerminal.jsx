import { useState, useEffect, useRef, useCallback } from 'react'
import { PRODUCT_IMAGES } from '@/lib/seed-data'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useCashStore } from '@/stores/cashStore'
import { useAppStore } from '@/stores/appStore'
import { Btn, Input, Modal, Select } from '@/components/ui'
import { notify, ReceiptModal, BarcodeScanner, ImgWithFallback } from '@/components/shared'
import { fmt, ts, genId, isBannerActive, getTier, isUuid } from '@/lib/utils'
import dayjs from 'dayjs'
import { POSProductGrid } from './POSProductGrid'
import { POSCartPanel } from './POSCartPanel'
import { CardTerminal } from './CardTerminal'
import { CardPaymentModal, generateSimulatedCardRead } from './CardPaymentModal'
import { CardAuthorizingFlow } from './CardAuthorizingFlow'
import { QrPaymentModal, generateSimulatedQrRead } from './QrPaymentModal'
import { SplitPaymentDetailModal } from './SplitPaymentDetailModal'
import { CashierReturns } from '@/pages/cashier/CashierReturns'
import { inventoryService, productsService, ordersService, parkedBillsService, paymentsService, sitePricesService, promotionsService, returnsService, categoriesService } from '@/services'
import { isSupabaseConfigured } from '@/lib/supabase'

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia ? window.matchMedia(query).matches : false)
  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia(query)
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])
  return matches
}

export const POSTerminal = ({ products, setProducts, orders, setOrders, returns = [], setReturns, users, setUsers, coupons, settings, counters, addAudit, currentUser, siteId }) => {
  const { t } = useTheme()
  const { currentUser: authUser } = useAuth()
  const { toggleSidebarCollapsed } = useAppStore()
  const navigate = useNavigate()
  const user = currentUser || authUser
  const isMobile = useMediaQuery('(max-width: 1024px)')

  const { session, isLoading, loadSession } = useCashStore()
  const searchRef = useRef(null)

  useEffect(() => {
    if (!session) {
      loadSession(user?.counter_id || 'c0000000-0000-0000-0000-000000000001')
    }
  }, [user])

  useEffect(() => {
    if (session && searchRef.current) {
      searchRef.current.focus()
    }
  }, [session])

  const effectiveSiteId = siteId || 'b0000000-0000-0000-0000-000000000001'

  useEffect(() => {
    if (!isSupabaseConfigured() || !effectiveSiteId || !session) return
    parkedBillsService.fetchParkedBills(effectiveSiteId, user?.id).then((data) => {
      if (data?.length) setParked(data)
    }).catch(() => { })
  }, [effectiveSiteId, session, user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured() || !effectiveSiteId) return
    Promise.all([sitePricesService.fetchSitePrices(effectiveSiteId), promotionsService.fetchActivePromotions()])
      .then(([sitePrices, promos]) => {
        const map = {}
          ; (sitePrices || []).forEach(sp => { map[sp.product_id] = sp.price })
        setSitePricesMap(map)
        setPromotionsMap(promos || [])
      })
      .catch(() => { })
  }, [effectiveSiteId])

  const [cart, setCart] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [payMethod, setPayMethod] = useState('Card')
  const [splitCash, setSplitCash] = useState('')
  const [splitCard, setSplitCard] = useState('')
  const [splitQr, setSplitQr] = useState('')
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false)
  const collectingSplitCardRef = useRef(false)
  const [splitCardProof, setSplitCardProof] = useState(null)
  const [splitQrProof, setSplitQrProof] = useState(null)
  const [splitQrFlowActive, setSplitQrFlowActive] = useState(false)
  const [cardPaymentDisplayAmount, setCardPaymentDisplayAmount] = useState(null)
  const [showReceipt, setShowReceipt] = useState(null)
  const [custSearch, setCustSearch] = useState('')
  const [selCust, setSelCust] = useState(null)
  const [showNewCust, setShowNewCust] = useState(false)
  const [otpStep, setOtpStep] = useState(1)
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '' })
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [cashGiven, setCashGiven] = useState('')
  const [cardNum, setCardNum] = useState('')
  const [showManualScan, setShowManualScan] = useState(false)
  const [manualScanCode, setManualScanCode] = useState('')
  const [orderLookupNum, setOrderLookupNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [qrPaymentStatus, setQrPaymentStatus] = useState(null) // null, 'processing', 'received'
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [loyaltyRedeem, setLoyaltyRedeem] = useState(false)
  const [parked, setParked] = useState([])
  const [favourites] = useState([1, 6, 9, 4])
  const [showCustDisplay, setShowCustDisplay] = useState(false)
  const [showCartMobile, setShowCartMobile] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const [showBarcodeInput, setShowBarcodeInput] = useState(false)
  const [barcodeScanMode, setBarcodeScanMode] = useState('manual') // 'camera' | 'manual'
  const [showParkedDropdown, setShowParkedDropdown] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [cartSearch, setCartSearch] = useState('')
  const [showReprint, setShowReprint] = useState(false)
  const [reprintOrderNum, setReprintOrderNum] = useState('')
  const [reprintOrder, setReprintOrder] = useState(null)
  const [reprintLoading, setReprintLoading] = useState(false)
  const [manualDiscountPct, setManualDiscountPct] = useState(0)
  const [sitePricesMap, setSitePricesMap] = useState({})
  const [promotionsMap, setPromotionsMap] = useState([])
  const [checkoutProcessing, setCheckoutProcessing] = useState(false)
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false)
  const [cardReadData, setCardReadData] = useState(null)
  const [cardTapPhase, setCardTapPhase] = useState(null)
  const [showQrPaymentModal, setShowQrPaymentModal] = useState(false)
  const [qrReadData, setQrReadData] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [loadOrderInput, setLoadOrderInput] = useState('')
  const [loadOrderLoading, setLoadOrderLoading] = useState(false)
  const [loadedOrderForReturn, setLoadedOrderForReturn] = useState(null)
  const [returnReasonCode, setReturnReasonCode] = useState('damaged')
  const [returnProcessMode, setReturnProcessMode] = useState('return')
  const [returnRefundMethod, setReturnRefundMethod] = useState('original')

  const [variantProduct, setVariantProduct] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState({})
  const [lastAddedTrigger, setLastAddedTrigger] = useState({ id: null, ts: 0 })

  useEffect(() => {
    if (payMethod !== 'Card') {
      setShowCardPaymentModal(false)
      setCardReadData(null)
      setCardTapPhase(null)
    }
    if (payMethod !== 'QR') {
      setShowQrPaymentModal(false)
      setQrReadData(null)
      setQrPaymentStatus(null)
    } else {
      if (cart.length > 0 && qrPaymentStatus === null) {
        setQrPaymentStatus('processing')
      }
    }
    if (payMethod !== 'Split') {
      setShowSplitPaymentModal(false)
    }
  }, [payMethod, cart.length])

  useEffect(() => {
    setSplitCardProof(null)
    setSplitQrProof(null)
  }, [splitCash, splitCard, splitQr])

  useEffect(() => {
    if (payMethod !== 'Split') {
      collectingSplitCardRef.current = false
      setSplitQrFlowActive(false)
      setCardPaymentDisplayAmount(null)
      setSplitCardProof(null)
      setSplitQrProof(null)
    }
  }, [payMethod])

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    categoriesService.fetchCategories()
      .then(data => {
        if (data) {
          const names = ['All', ...data.map(c => c.name)]
          setCategories(names)
        }
      })
      .catch(() => { })
  }, [])

  const barcodeBuffer = useRef('')
  const lastKeyTime = useRef(0)

  const resolveProductFromCode = useCallback(async (code) => {
    if (!code?.trim()) return null
    const c = String(code).trim()
    if (isSupabaseConfigured()) {
      try {
        const lookedUp = await productsService.lookupBarcode(c)
        if (lookedUp) {
          const fromState = products.find(p => p.id === lookedUp.id)
          return fromState || { ...lookedUp, stock: lookedUp.stock ?? 0 }
        }
      } catch (_) { /* fall through to local match */ }
    }
    return products.find(p => p.sku === c || p.barcode === c || p.id?.toString() === c) || null
  }, [products])

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      const now = Date.now()
      if (now - lastKeyTime.current > 80) barcodeBuffer.current = ''
      lastKeyTime.current = now

      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        const code = barcodeBuffer.current
        barcodeBuffer.current = ''
        const product = await resolveProductFromCode(code)
        if (product) {
          if (removeMode) {
            removeFromCart(product.id)
            setScanMsg(`🗑️ Removed: ${product.name}`)
          } else {
            addToCart(product)
            setScanMsg(`✓ Scanned: ${product.name}`)
          }
        } else {
          setScanMsg('❌ Product not found: ' + code)
        }
        setTimeout(() => setScanMsg(''), 2500)
        return
      }
      if (e.key.length === 1) barcodeBuffer.current += e.key
    }
    const handler = (e) => { handleKeyDown(e).catch(() => { }) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [products, removeMode, resolveProductFromCode])

  const banners = []
  const activeOffers = (settings.banners || banners || []).filter(b => isBannerActive?.(b)).filter(b => b.offerType !== 'none') || []
  // no global vatRate — tax is per-product
  const filteredProds = products.filter(p => (cat === 'All' || p.category === cat) && (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())))
  const favProds = products.filter(p => favourites.includes(p.id))

  const getEffectiveBasePrice = useCallback((product) => {
    const sitePrice = sitePricesMap[product.id]
    if (sitePrice != null) return Number(sitePrice)
    const promoForProduct = promotionsMap.find(pr => pr.product_id === product.id)
    if (promoForProduct) return Number(promoForProduct.promo_price)
    const promoForCat = promotionsMap.find(pr => pr.category_id === product.category_id)
    if (promoForCat) return Number(promoForCat.promo_price)
    return Number(product.price ?? product.base_price ?? 0)
  }, [sitePricesMap, promotionsMap])

  const getItemDiscount = useCallback((product) => {
    const promo = product.promo
    if (promo?.active && promo.price != null) {
      const now = new Date()
      const start = promo.startDate ? new Date(promo.startDate) : null
      const end = promo.endDate ? new Date(promo.endDate) : null
      const inRange = (!start || now >= start) && (!end || now <= end)
      if (inRange) {
        const promoPrice = Number(promo.price)
        if (promoPrice > 0 && product.price > 0) {
          const effectiveDiscount = (1 - promoPrice / product.price) * 100
          return Math.max(0, effectiveDiscount)
        }
      }
    }
    const offer = activeOffers.find(b => b.offerType === 'category' && b.offerTarget === product.category)
    const bannerDisc = offer ? offer.offerDiscount : 0
    const prodDisc = product.discount || 0
    return Math.max(bannerDisc, prodDisc)
  }, [activeOffers])

  const handleNewOrder = () => {
    if (cart.length > 0) {
      if (!window.confirm('Clear current cart and start new order?')) return
    }
    setCart([])
    setSelCust(null)
    setAppliedCoupon(null)
    setCouponCode('')
    setManualDiscountPct(0)
    setSearch('')
    notify('New order started', 'success')
  }

  const handleParkOrder = async () => {
    if (cart.length === 0) { notify('Cart is empty', 'error'); return }
    try {
      await parkedBillsService.parkBill(
        effectiveSiteId,
        user?.counter_id,
        user?.id,
        selCust?.id,
        cart,
        ''
      )
      // Refresh parked list
      const updated = await parkedBillsService.fetchParkedBills(effectiveSiteId, user?.id)
      setParked(updated)
      setCart([])
      setSelCust(null)
      notify('Order parked successfully', 'success')
    } catch (err) {
      notify(err.message || 'Failed to park order', 'error')
    }
  }

  const handleRecallOrder = (p) => {
    if (cart.length > 0) {
      if (!window.confirm('Replace current cart with parked order?')) return
    }
    setCart(p.cart || [])
    if (p.customerId) {
      // should ideally lookup customer from ID, but for now just clear or use cached
      setSelCust(null)
    }
    parkedBillsService.deleteParkedBill(p.id).then(() => {
      setParked(old => old.filter(x => x.id !== p.id))
    })
    setShowParkedDropdown(false)
    notify('Order recalled', 'success')
  }

  const handleProductClick = (p) => {
    const attrs = p.dynamic_attributes || {}
    const keys = Object.keys(attrs).filter(k => attrs[k] && attrs[k].length > 0)

    if (keys.length > 0) {
      setVariantProduct(p)
      const initial = {}
      keys.forEach(k => { initial[k] = attrs[k][0] })
      setSelectedVariant(initial)
    } else {
      addToCart(p)
    }
  }

  const addToCart = (p, variantStr = '', overridePrice = null) => {
    const cartId = variantStr ? `${p.id}-${variantStr}` : p.id
    if (removeMode) {
      const existing = cart.find(i => i.id === cartId)
      if (!existing) {
        notify(`${p.name} is not in the cart!`, 'warning')
        return
      }
      removeFromCart(cartId)
      notify(`Decreased ${p.name} qty`, 'info')
      return
    }

    const displayName = variantStr ? `${p.name} (${variantStr})` : p.name
    const currentQtyForProduct = cart.filter(i => (i.originalId || i.id) === p.id).reduce((s, i) => s + i.qty, 0)
    if (currentQtyForProduct >= p.stock) { notify(`Only ${p.stock} total in stock for ${p.name}!`, 'error'); return }
    const disc = getItemDiscount(p)
    const effectivePrice = overridePrice != null ? Number(overridePrice) : getEffectiveBasePrice(p)
    setCart(c => {
      const ex = c.find(i => i.id === cartId)
      if (ex) return c.map(i => i.id === cartId ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { ...p, id: cartId, originalId: p.id, name: displayName, qty: 1, discount: disc, price: effectivePrice, taxPct: p.taxPct ?? 20, overridePrice: overridePrice != null ? Number(overridePrice) : null }]
    })
    setLastAddedTrigger({ id: cartId, ts: Date.now() })
    if (disc > 0) notify(`🎉 ${disc}% offer applied on ${p.name}!`, 'success')
  }

  const updateCartItemPrice = (itemId, newPrice) => {
    const num = parseFloat(newPrice)
    if (isNaN(num) || num < 0) return
    setCart(c => c.map(i => i.id === itemId ? { ...i, price: num, overridePrice: num } : i))
  }

  const confirmVariant = () => {
    if (!variantProduct) return
    const parts = Object.entries(selectedVariant)
      .filter(([_, val]) => !!val)
      .map(([key, val]) => `${key}: ${val}`)
    addToCart(variantProduct, parts.join(', '))
    setVariantProduct(null)
  }

  const updateQty = (id, d) => {
    const ci = cart.find(i => i.id === id)
    if (!ci) return
    const baseId = ci.originalId || id
    const p = products.find(x => x.id === baseId)
    if (!p) return

    if (loadedOrderForReturn && ci.maxReturnQty != null) {
      const newQty = Math.max(0, Math.min(ci.maxReturnQty, ci.qty + d))
      setCart(c => c.map(i => i.id === id ? { ...i, qty: newQty } : i).filter(i => i.qty > 0))
      return
    }
    if (d > 0) {
      const currentQtyForProduct = cart.filter(i => (i.originalId || i.id) === baseId).reduce((s, i) => s + i.qty, 0)
      if (currentQtyForProduct >= p.stock) { notify(`Max total stock reached for ${p.name} (${p.stock})`, 'error'); return }
    }
    setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0))
  }

  const removeFromCart = (productId) => {
    setCart(c => {
      const cartId = c.find(i => (i.originalId || i.id) === productId || i.id === productId)?.id
      if (!cartId) return c
      const item = c.find(i => i.id === cartId)
      if (!item) return c
      if (item.qty <= 1) {
        return c.filter(i => i.id !== cartId)
      }
      return c.map(i => i.id === cartId ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  const cartSubtotal = cart.reduce((s, i) => s + ((i.price ?? 0) * (1 - (i.discount || 0) / 100)) * i.qty, 0)
  const cartTax = cart.reduce((s, i) => { const lineNet = (i.price ?? 0) * (1 - (i.discount || 0) / 100) * i.qty; return s + lineNet * ((i.taxPct ?? 0) / 100) }, 0)
  const cartBeforeExtras = cartSubtotal + cartTax
  let couponDiscount = 0
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') couponDiscount = cartBeforeExtras * appliedCoupon.value / 100
    else if (appliedCoupon.type === 'fixed') couponDiscount = Math.min(appliedCoupon.value, cartBeforeExtras)
  }
  const custPoints = selCust?.loyaltyPoints || 0
  const loyaltyDiscount = loyaltyRedeem ? Math.min(custPoints * (settings.loyaltyValue || 0.01), cartBeforeExtras - couponDiscount) : 0
  const amountAfterCouponLoyalty = cartBeforeExtras - couponDiscount - loyaltyDiscount
  const manualDiscountAmount = amountAfterCouponLoyalty * (manualDiscountPct / 100)
  const cartTotal = Math.max(0, Math.round((amountAfterCouponLoyalty - manualDiscountAmount) * 100) / 100)
  const cashGivenNum = parseFloat(cashGiven) || 0
  const cashChange = payMethod === 'Cash' && cashGiven !== '' ? Math.round((cashGivenNum - cartTotal) * 100) / 100 : 0
  const pointsEarned = selCust ? Math.floor(cartTotal * (settings.loyaltyRate || 1)) : 0
  const isCashInsufficient = payMethod === 'Cash' && cashGiven !== '' && cashGivenNum < cartTotal

  const applyCoupon = () => {
    const c = coupons.find(x => x.code === couponCode.toUpperCase() && x.active && new Date(x.expiry) >= new Date())
    if (!c) { notify('Invalid or expired coupon', 'error'); return }
    if (cartSubtotal < c.minOrder) { notify(`Minimum order ${fmt(c.minOrder, settings?.sym)} required`, 'error'); return }
    setAppliedCoupon(c); notify(`Coupon ${c.code} applied!`, 'success')
  }

  const parkBill = async () => {
    if (cart.length === 0) return
    const cartForStore = cart.map(i => ({ id: i.id, originalId: i.originalId, name: i.name, qty: i.qty, price: i.price, discount: i.discount || 0, overridePrice: i.overridePrice ?? null }))
    try {
      if (isSupabaseConfigured()) {
        const pb = await parkedBillsService.parkBill(effectiveSiteId, user?.counter_id, user?.id, selCust?.id, cartForStore)
        setParked(p => [...p, { id: pb.id, cart, customerId: selCust?.id, ts: new Date().toLocaleString() }])
      } else {
        setParked(p => [...p, { id: genId('PARKED'), cart, customerId: selCust?.id, ts: ts() }])
      }
      setCart([]); setSelCust(null)
      notify('Bill parked', 'info')
    } catch (err) {
      notify(err?.message || 'Failed to park bill', 'error')
    }
  }

  const recallBill = async (pb) => {
    setCart(pb.cart)
    setSelCust(pb.customerId ? users?.find(u => u.id === pb.customerId) || null : null)
    if (isSupabaseConfigured() && pb.id) {
      try { await parkedBillsService.deleteParkedBill(pb.id) } catch (_) { }
    }
    setParked(p => p.filter(x => x.id !== pb.id))
    setShowParkedDropdown(false)
    setLoadedOrderForReturn(null)
    notify('Parked bill recalled', 'success')
  }

  const loadOrderForReturn = async (orderNum) => {
    const num = String(orderNum || loadOrderInput).trim()
    if (!num) return
    setLoadOrderLoading(true)
    setLoadedOrderForReturn(null)
    setCart([])
    try {
      const fromState = orders?.find(o => String(o.order_number || o.id).toLowerCase() === num.toLowerCase())
      let order = fromState
      if (!order && isSupabaseConfigured()) {
        order = await ordersService.fetchOrderByNumber(num)
      }
      if (!order) {
        notify('Order not found', 'error')
        setLoadOrderLoading(false)
        return
      }
      const items = order.order_items || order.items || []
      if (items.length === 0) {
        notify('Order has no items', 'error')
        setLoadOrderLoading(false)
        return
      }
      const cartItems = items.map((oi) => {
        const origQty = oi.quantity ?? oi.qty ?? 1
        const matchedProduct = products?.find(p => p.id === (oi.product_id || oi.productId))
        return {
          id: genId('CART'),
          originalId: oi.product_id || oi.productId,
          orderItemId: oi.id,
          maxReturnQty: origQty,
          name: oi.product_name || oi.name || matchedProduct?.name || 'Item',
          qty: origQty,
          price: oi.unit_price ?? oi.price ?? 0,
          discount: oi.discount_pct ?? oi.discount ?? 0,
          taxPct: oi.tax_pct ?? matchedProduct?.taxPct ?? 20,
        }
      })
      setCart(cartItems)
      setLoadedOrderForReturn(order)
      setLoadOrderInput('')
      setSelCust(order.customer_id ? users?.find(u => u.id === order.customer_id) || null : null)
      notify(`Order ${order.order_number || order.id} loaded for return`, 'success')
    } catch (err) {
      notify(err?.message || 'Failed to load order', 'error')
    } finally {
      setLoadOrderLoading(false)
    }
  }

  const clearReturnMode = () => {
    setLoadedOrderForReturn(null)
    setCart([])
    setReturnReasonCode('damaged')
    setReturnProcessMode('return')
    setReturnRefundMethod('original')
    setAppliedCoupon(null)
    setCouponCode('')
    setManualDiscountPct(0)
    notify('Return mode cleared', 'info')
  }

  const processReturnFromCart = async () => {
    if (!loadedOrderForReturn || cart.length === 0) return
    const returnOnlyItems = cart.filter(i => i.orderItemId)
    const replacementOnlyItems = cart.filter(i => !i.orderItemId)
    if (returnProcessMode === 'exchange') {
      if (returnOnlyItems.length === 0) {
        notify('No return items selected', 'error')
        return
      }
      if (replacementOnlyItems.length === 0) {
        notify('Add replacement items from product grid', 'error')
        return
      }
    } else if (returnOnlyItems.length === 0) {
      notify('No return items selected', 'error')
      return
    }
    const returnDays = settings?.returnDays ?? 30
    const orderDate = loadedOrderForReturn.created_at || loadedOrderForReturn.date
    const withinWindow = !orderDate || (dayjs(orderDate).isValid() && dayjs().diff(dayjs(orderDate), 'day') <= returnDays)
    if (!withinWindow) {
      notify(`Return window is ${returnDays} days`, 'error')
      return
    }
    const isProductReturnable = (pid) => {
      const p = products?.find(pr => pr.id === pid)
      return p == null || p.returnable !== false
    }
    const hasNonReturnable = returnOnlyItems.some(i => !isProductReturnable(i.originalId || i.id))
    if (hasNonReturnable) {
      notify('Some return items are non-returnable', 'error')
      return
    }
    setCheckoutProcessing(true)
    try {
      const returnItems = returnOnlyItems.map(i => {
        const lineRefund = (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1)
        return {
          productId: i.originalId || i.id,
          orderItemId: i.orderItemId,
          qty: i.qty ?? 1,
          refundAmount: Math.round(lineRefund * 100) / 100,
          restock: true,
        }
      })
      const refundAmount = returnItems.reduce((s, i) => s + i.refundAmount, 0)
      const effectiveRefundMethod = returnProcessMode === 'exchange' ? 'exchange' : returnRefundMethod
      const ret = await returnsService.createReturnWithItems({
        orderId: loadedOrderForReturn.id,
        customerId: loadedOrderForReturn.customer_id || loadedOrderForReturn.customerId || null,
        type: 'partial',
        reasonCode: returnReasonCode,
        reason: returnReasonCode,
        refundMethod: effectiveRefundMethod,
        items: returnItems,
        processedBy: user?.id,
        siteId: effectiveSiteId,
      })
      if (ret) {
        setReturns(rs => [ret, ...(rs || [])])
        const applyStockUpdates = (ps) => ps.map(p => {
          const inc = returnItems.find(ri => ri.productId === p.id)
          const dec = returnProcessMode === 'exchange' ? replacementOnlyItems.find(ri => (ri.originalId || ri.id) === p.id) : null
          let stock = p.stock ?? 0
          if (inc) stock += inc.qty
          if (dec) stock = Math.max(0, stock - (dec.qty ?? 1))
          return (inc || dec) ? { ...p, stock } : p
        })
        setProducts(applyStockUpdates)
        if (effectiveRefundMethod !== 'exchange' && effectiveRefundMethod !== 'store_credit' && refundAmount > 0) {
          const origPayment = loadedOrderForReturn.payment_method || loadedOrderForReturn.payment
          if (origPayment === 'Cash' || origPayment === 'Split') {
            useCashStore.getState().addMovement('refund', refundAmount, `Refund: ${ret.return_number || ret.id}`, user)
          }
        }
        if (returnProcessMode === 'exchange') {
          const exchangeItems = replacementOnlyItems.map(i => ({
            productId: i.originalId || i.id,
            name: i.name,
            qty: i.qty ?? 1,
            price: i.price ?? 0,
            discount: i.discount || 0,
          }))
          const subtotal = exchangeItems.reduce((s, i) => s + (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1), 0)
          const taxAmount = Math.round(replacementOnlyItems.reduce((s, i) => { const lineNet = (i.price ?? 0) * (1 - (i.discount || 0) / 100) * (i.qty ?? 1); return s + lineNet * ((i.taxPct ?? 0) / 100) }, 0) * 100) / 100
          const total = Math.round((subtotal + taxAmount) * 100) / 100
          const exchangeOrder = await ordersService.createOrderWithItems({
            siteId: effectiveSiteId,
            counterId: user?.counter_id || null,
            cashierId: user?.id,
            customerId: loadedOrderForReturn.customer_id || loadedOrderForReturn.customerId || null,
            items: exchangeItems,
            subtotal,
            taxAmount,
            discountAmount: 0,
            loyaltyDiscount: 0,
            total,
            paymentMethod: 'Exchange',
            paymentDetails: { exchange_for_return_id: ret.id },
            loyaltyEarned: 0,
            loyaltyUsed: 0,
            manualDiscountPct: 0,
          })
          if (exchangeOrder) {
            setOrders(os => [exchangeOrder, ...(os || [])])
            for (const item of replacementOnlyItems) {
              try {
                await inventoryService.deductStock(item.originalId || item.id, effectiveSiteId, item.qty ?? 1, 'sell', `Exchange: ${exchangeOrder.order_number || exchangeOrder.id}`, user?.id)
              } catch (_) { /* ignore */ }
            }
          }
          notify(`Exchange: Return ${ret.return_number || ret.id} + Order ${exchangeOrder?.order_number || exchangeOrder?.id}`, 'success')
        } else {
          notify(`Return ${ret.return_number || ret.id} processed`, 'success')
        }
        addAudit(user, 'Return Processed', 'POS', `${ret.return_number || ret.id} — ${fmt(refundAmount, settings?.sym)}`)
        clearReturnMode()
      }
    } catch (err) {
      notify(err?.message || 'Failed to process return', 'error')
    } finally {
      setCheckoutProcessing(false)
    }
  }

  const handleBarcodeScan = async (barcode) => {
    const code = String(barcode || manualBarcode).trim()
    if (code.match(/^ORD-|^ord-/i)) {
      await loadOrderForReturn(code)
      setManualBarcode('')
      setShowBarcodeInput(false)
      setTimeout(() => setScanMsg(''), 2500)
      return
    }
    const product = await resolveProductFromCode(code)
    if (product) {
      if (loadedOrderForReturn && returnProcessMode !== 'exchange') {
        setScanMsg('↩️ Return mode — use Load Order')
      } else if (removeMode) {
        removeFromCart(product.id)
        setScanMsg(`🗑️ Removed: ${product.name}`)
      } else {
        addToCart(product)
        setScanMsg(`✓ Scanned: ${product.name}`)
      }
    } else {
      setScanMsg('❌ Product not found')
    }
    setTimeout(() => setScanMsg(''), 2500)
    setManualBarcode('')
    setShowBarcodeInput(false)
  }

  const lookupCustomer = () => {
    const c = users.find(u => u.role === 'customer' && (u.phone === custSearch || u.name.toLowerCase().includes(custSearch.toLowerCase()) || u.email.toLowerCase().includes(custSearch.toLowerCase())))
    if (c) { setSelCust(c); notify(`✓ ${c.name} — ⭐${c.loyaltyPoints} pts`, 'success') }
    else notify('Customer not found. Add as new?', 'warning')
  }

  const sendNewCustOtp = () => {
    if (!newCustForm.name || !newCustForm.phone) return
    const code = String(Math.floor(100000 + Math.random() * 900000))
    setGeneratedOtp(code)
    setOtpStep(2)
    notify(`OTP for ${newCustForm.phone}: ${code}`, 'info', 8000)
  }

  const verifyNewCust = () => {
    if (otpInput !== generatedOtp) { notify('Wrong OTP', 'error'); return }
    // TODO: Replace with Supabase Auth invite flow — no password stored client-side
    const nc = { id: Date.now(), name: newCustForm.name, phone: newCustForm.phone, email: `${newCustForm.phone.replace(/\s/g, '')}@customer.com`, role: 'customer', avatar: newCustForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2), active: true, joinDate: ts(), loyaltyPoints: 0, tier: 'Bronze', totalSpent: 0 }
    setUsers(us => [...us, nc])
    setSelCust(nc)
    setShowNewCust(false)
    setOtpStep(1); setNewCustForm({ name: '', phone: '' }); setOtpInput('')
    addAudit(user, 'Customer Registered', 'POS', `New customer ${nc.name} registered`)
    notify(`${nc.name} registered & attached!`, 'success')
  }

  const processOrder = async (opts = {}) => {
    const cardInfo = opts.card
    const qrInfo = opts.qr
    if (checkoutProcessing) return
    setCheckoutProcessing(true)
    const effectiveCardLast4 = payMethod === 'Card'
      ? (cardInfo?.last4 ?? cardNum.slice(-4))
      : null
    const effectiveCardAuthRef = payMethod === 'Card' ? (cardInfo?.authRef ?? null) : null
    const effectiveQrTxnRef = payMethod === 'QR' ? (qrInfo?.txnRef ?? null) : null
    const effectiveQrProvider = payMethod === 'QR' ? (qrInfo?.provider ?? null) : null
    
    // Extract split details from modern implementation
    const splitCashAmt = payMethod === 'Split' ? (opts?.splitPayments || []).filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0) : null
    const splitCardAmt = payMethod === 'Split' ? (opts?.splitPayments || []).filter(p => p.method === 'Card').reduce((sum, p) => sum + p.amount, 0) : null
    const splitQrAmt   = payMethod === 'Split' ? (opts?.splitPayments || []).filter(p => p.method === 'QR').reduce((sum, p) => sum + p.amount, 0) : null
    const splitCardFirst = payMethod === 'Split' ? (opts?.splitPayments || []).find(p => p.method === 'Card') : null
    const splitQrFirst = payMethod === 'Split' ? (opts?.splitPayments || []).find(p => p.method === 'QR') : null
    const ptUsed = loyaltyRedeem ? Math.floor(loyaltyDiscount / (settings.loyaltyValue || 0.01)) : 0
    const orderItems = cart.map(i => ({
      productId: i.originalId || i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      discount: i.discount || 0,
      overridePrice: i.overridePrice ?? null,
    }))
    let createdOrder = null
    try {
      if (isSupabaseConfigured()) {
        createdOrder = await ordersService.createOrderWithItems({
          siteId: effectiveSiteId,
          counterId: user?.counter_id || null,
          cashierId: user?.id,
          customerId: selCust?.id || null,
          items: orderItems,
          subtotal: cartSubtotal,
          taxAmount: cartTax,
          discountAmount: couponDiscount + loyaltyDiscount + manualDiscountAmount,
          manualDiscountPct,
          loyaltyDiscount,
          total: cartTotal,
          paymentMethod: payMethod,
          paymentDetails: {
            card_last4: effectiveCardLast4,
            card_auth_ref: effectiveCardAuthRef,
            qr_txn_ref: effectiveQrTxnRef,
            qr_provider: effectiveQrProvider,
            cash_given: payMethod === 'Cash' ? cashGivenNum : null,
            cash_change: payMethod === 'Cash' ? cashChange : null,
            split_cash: splitCashAmt,
            split_card: splitCardAmt,
            split_qr: splitQrAmt,
            split_card_last4: splitCardFirst?.last4 ?? null,
            split_card_auth_ref: splitCardFirst?.authRef ?? null,
            split_qr_txn_ref: splitQrFirst?.txnRef ?? null,
            split_qr_provider: splitQrFirst ? 'QR / wallet (simulated)' : null,
          },
          loyaltyEarned: selCust ? pointsEarned : 0,
          loyaltyUsed: ptUsed,
        })
        for (const item of cart) {
          const productId = item.originalId || item.id
          if (isUuid(productId)) {
            await inventoryService.deductStock(productId, effectiveSiteId, item.qty, 'sell', `Sale: ${createdOrder?.order_number || createdOrder?.id}`, user?.id)
          }
        }
        try {
          const paymentRows = payMethod === 'Split'
            ? (opts.splitPayments || []).map(p => {
                if (p.method === 'Cash') return { amount: p.amount, method: 'split_cash', details: {} }
                if (p.method === 'Card') return { amount: p.amount, method: 'split_card', details: { card_last4: p.last4, card_auth_ref: p.authRef } }
                if (p.method === 'QR') return { amount: p.amount, method: 'qr', details: { split_portion: true, qr_txn_ref: p.txnRef, qr_provider: p.provider } }
                return null
              }).filter(Boolean)
            : [{ amount: cartTotal, method: payMethod.toLowerCase(), details: { card_last4: effectiveCardLast4, card_auth_ref: effectiveCardAuthRef, qr_txn_ref: effectiveQrTxnRef, qr_provider: effectiveQrProvider } }]
          await paymentsService.createPayments(createdOrder.id, paymentRows)
        } catch (_) { /* payments table may not exist yet */ }
      }
    } catch (err) {
      notify(err?.message || 'Failed to process order', 'error')
      setCheckoutProcessing(false)
      return
    }
    const orderId = createdOrder?.order_number || createdOrder?.id || genId('ORD')
    const newOrder = {
      id: orderId,
      order_number: createdOrder?.order_number,
      customerId: selCust?.id || null,
      customerName: selCust?.name || 'Walk-in',
      cashierId: user.id,
      cashierName: user.name,
      items: orderItems.map(i => ({ ...i, productId: i.productId })),
      subtotal: cartSubtotal,
      tax: cartTax,
      discountAmt: couponDiscount + loyaltyDiscount,
      loyaltyDiscount,
      couponDiscount,
      couponCode: appliedCoupon?.code || null,
      deliveryCharge: 0,
      total: cartTotal,
      payment: payMethod,
      cardLast4: effectiveCardLast4,
      cardAuthRef: effectiveCardAuthRef,
      qrTxnRef: effectiveQrTxnRef,
      qrProvider: effectiveQrProvider,
      cashGiven: payMethod === 'Cash' ? cashGivenNum : splitCashAmt,
      cashChange: payMethod === 'Cash' ? cashChange : null,
      splitCash: splitCashAmt,
      splitCard: splitCardAmt,
      splitQr: splitQrAmt,
      date: ts(),
      counter: user.counter || 'Counter 1',
      status: 'completed',
      orderType: 'in-store',
      loyaltyEarned: selCust ? pointsEarned : 0,
      loyaltyUsed: ptUsed,
    }
    setOrders(o => [newOrder, ...o])
    setProducts(ps => ps.map(p => { const ci = cart.find(i => (i.originalId || i.id) === p.id); return ci ? { ...p, stock: p.stock - ci.qty } : p }))
    if (selCust) {
      const newPts = Math.max(0, (selCust.loyaltyPoints || 0) - ptUsed + pointsEarned)
      const newSpent = (selCust.totalSpent || 0) + cartTotal
      setUsers(us => us.map(u => u.id === selCust.id ? { ...u, loyaltyPoints: newPts, totalSpent: newSpent, tier: getTier(newSpent) } : u))
    }
    addAudit(user, 'Payment Completed', 'POS', `${orderId} — ${fmt(cartTotal, settings?.sym)} via ${payMethod}`)

    // Record Cash Movement if applicable
    if (payMethod === 'Cash') {
      useCashStore.getState().addMovement('sale', cartTotal, `Sale: ${orderId}`, user)
    } else if (payMethod === 'Split') {
      const splitCashAmt = (opts.splitPayments || []).filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0)
      if (splitCashAmt > 0) {
        useCashStore.getState().addMovement('sale', splitCashAmt, `Split Sale (Cash portion): ${orderId}`, user)
      }
    }

    notify(`Order ${orderId} complete! 🎉`, 'success')
    setShowReceipt(newOrder)
    setCart([]); setCashGiven(''); setCardNum(''); setCardExp(''); setCardCvv(''); setQrPaymentStatus(null); setAppliedCoupon(null); setCouponCode(''); setLoyaltyRedeem(false); setSplitCash(''); setSplitCard(''); setSplitQr(''); setManualDiscountPct(0); setShowCardPaymentModal(false); setCardReadData(null); setCardTapPhase(null); setShowQrPaymentModal(false); setQrReadData(null); setShowSplitPaymentModal(false); collectingSplitCardRef.current = false; setSplitCardProof(null); setSplitQrProof(null); setSplitQrFlowActive(false); setCardPaymentDisplayAmount(null)
    setCheckoutProcessing(false)
  }

  const handleCardTerminalTap = () => {
    if (cart.length === 0) {
      notify('Add items to the cart first', 'error')
      return
    }
    setCardTapPhase('authorizing')
  }

  const onCardAuthorizingSuccess = () => {
    setCardTapPhase(null)
    setCardReadData(generateSimulatedCardRead(cartTotal))
    setShowCardPaymentModal(true)
  }

  const onCardAuthorizingDeclined = () => {
    setCardTapPhase('failed')
  }

  const onCardFailureRetry = () => {
    setCardTapPhase('authorizing')
  }

  const onCardChangePaymentMethod = () => {
    setCardTapPhase(null)
    setPayMethod('Cash')
    notify('Switched to Cash. Enter cash given to complete.', 'info')
  }

  const closeCardPaymentModal = () => {
    setShowCardPaymentModal(false)
    setCardReadData(null)
  }

  const confirmCardPaymentFromModal = (cardDetails) => {
    if (!cardDetails?.sufficient) return
    const info = { last4: cardDetails.last4, authRef: cardDetails.authRef }
    setShowCardPaymentModal(false)
    setCardReadData(null)
    void processOrder({ card: info })
  }



  const handleQrScanComplete = () => {
    if (cart.length === 0) return
    if (payMethod === 'QR' && qrPaymentStatus === 'processing') {
      setQrPaymentStatus('received')
      setTimeout(() => {
        setShowCustDisplay(false)
        setQrReadData(generateSimulatedQrRead(cartTotal))
        setShowQrPaymentModal(true)
      }, 1500)
    }
  }

  const closeQrPaymentModal = () => {
    setShowQrPaymentModal(false)
    setQrReadData(null)
    setQrPaymentStatus('processing')
  }

  const confirmQrPaymentFromModal = () => {
    if (!qrReadData) return
    const info = { txnRef: qrReadData.txnRef, provider: qrReadData.provider }
    setShowQrPaymentModal(false)
    setQrReadData(null)
    void processOrder({ qr: info })
  }

  const handleSplitPaymentComplete = (payments) => {
    setShowSplitPaymentModal(false)
    void processOrder({ splitPayments: payments })
  }

  const checkout = () => {
    if (cart.length === 0) return
    if (payMethod === 'Cash' && (cashGiven === '' || cashGivenNum < cartTotal)) { notify('Enter sufficient cash amount', 'error'); return }
    if (payMethod === 'Card') { notify('Use the card terminal: tap the card, then confirm payment in the details window', 'info'); return }

    if (payMethod === 'QR') {
      if (qrPaymentStatus === null) {
        setQrPaymentStatus('processing')
        setShowCustDisplay(true)
        return
      }
      notify('After QR scan, confirm payment received in the details window', 'info')
      return
    }

    if (payMethod === 'Split') {
      setShowSplitPaymentModal(true)
      return
    }
    processOrder()
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontSize: 40, animation: 'spin 2s linear infinite' }}>⌛</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>Checking Cash Session...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 120px)', gap: 20 }}>
        <div style={{ fontSize: 100 }}>🔒</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: t.text, marginBottom: 8 }}>Till is Currently Closed</div>
          <div style={{ fontSize: 16, color: t.text3, maxWidth: 400, margin: '0 auto' }}>
            You cannot process any sales until a cash session is opened.
            Please open the till in Cash Management first.
          </div>
        </div>
        <Btn t={t} variant="primary" size="lg" onClick={() => navigate('/app/cash')}>
          Go to Cash Management →
        </Btn>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f4f4', overflow: 'hidden', paddingTop: 48 }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', background: t.topbar || '#fff', padding: '0 16px', gap: 12, borderBottom: `1px solid ${t.border}`, alignItems: 'center', height: 48, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => toggleSidebarCollapsed()}
            style={{
              background: t.bg3,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontSize: 16,
              color: t.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ☰
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                color: t.text2,
                fontSize: 18,
                cursor: 'pointer',
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = t.accent}
              onMouseLeave={e => e.currentTarget.style.color = t.text2}
              title="Go Back"

            >
              ←
            </button>
            {!isMobile && (
              <>
                <span style={{ color: t.text, fontWeight: 700 }}>SCSTix</span>
                <span style={{ color: t.text4, fontSize: 12, marginLeft: 8 }}>›</span>
                <span style={{ color: t.text2, fontSize: 13, fontWeight: 600 }}>POS Terminal</span>
              </>
            )}
            {isMobile && <span style={{ color: t.text, fontWeight: 700 }}>POS</span>}
          </div>
        </div>
        
        <div style={{ flex: 1 }}></div>

        {session && !isMobile && (
          <div style={{ marginRight: 20, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: t.text3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Shift Start</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: t.accent }}>{session.openedAt}</div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
          {[
            { label: 'TP SALE', icon: '🔥', color: '#f1f5f9', textColor: '#1e293b', onClick: () => { setSearch('Jersey'); notify('Filtering for Top Sale Items', 'success') } },
            { label: 'LOGOUT', icon: '⏻', color: '#ffedd5', textColor: '#9a3412', onClick: () => navigate('/logout') },
          ].map((btn, idx) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: btn.color,
                color: btn.textColor || '#fff',
                border: 'none',
                borderRadius: 8,
                width: isMobile ? 60 : 90,
                height: isMobile ? 36 : 42,
                cursor: 'pointer',
                gap: 2,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: isMobile ? 14 : 18 }}>{btn.icon}</span>
              <span style={{ fontSize: isMobile ? 8 : 9, fontWeight: 800, whiteSpace: 'nowrap' }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: isMobile ? '8px 10px 0' : '12px 20px 0', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 24, overflow: isMobile ? 'auto' : 'hidden' }}>
        {/* Left Column: Actions and Content */}
        <div style={{ flex: isMobile ? 'none' : 2, display: 'flex', flexDirection: 'column', gap: 12, overflow: isMobile ? 'visible' : 'hidden' }}>
          
          {/* Unified Top Action Bar (Matches User Reference) */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center', 
            background: '#f8fafc', 
            padding: '12px 16px', 
            borderRadius: 12, 
            border: '1.5px solid #e2e8f0',
            flexWrap: 'wrap'
          }}>
            {/* Return Mode Status Indicator */}
            {loadedOrderForReturn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1.5px solid #fde68a', padding: '6px 12px', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#d97706' }}>
                  {returnProcessMode === 'exchange' ? '↔ EXCHANGE MODE' : `↩️ RETURN MODE: ${loadedOrderForReturn.order_number || loadedOrderForReturn.id}`}
                </span>
                <button onClick={clearReturnMode} style={{ background: '#fef3c7', border: 'none', color: '#d97706', cursor: 'pointer', fontWeight: 900, fontSize: 14, padding: '0 4px', borderRadius: 4 }}>✕</button>
              </div>
            )}

            {/* Search Box (Enlarged) & Remove Mode Toggle */}
            <div style={{ flex: 3, minWidth: 300, display: 'flex', gap: 10, alignItems: 'stretch' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  ref={searchRef}
                  value={search || ''} 
                  onChange={e => setSearch?.(e.target.value)} 
                  placeholder="Search / SKU..." 
                  style={{ width: '100%', height: '100%', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '10px 12px 10px 36px', fontSize: 13, outline: 'none' }} 
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>

              {search.length > 1 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', borderRadius: 8, zIndex: 1000, maxHeight: 400, overflowY: 'auto', marginTop: 6, border: '1px solid #e2e8f0' }}>
                  {filteredProds.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>No products found</div>
                  ) : (
                    filteredProds.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => { handleProductClick(p); setSearch('') }}
                        style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9' }}>
                          <ImgWithFallback src={p.image || p.image_url || PRODUCT_IMAGES[p.name]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{p.sku} · {p.category}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#ef4444' }}>{fmt(p.price, settings?.sym)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setRemoveMode(!removeMode)}
              style={{
                background: removeMode ? '#fee2e2' : '#f8fafc',
                color: removeMode ? '#ef4444' : '#64748b',
                border: `1.5px solid ${removeMode ? '#fca5a5' : '#e2e8f0'}`,
                borderRadius: 8,
                padding: '0 16px',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              title="Toggle Remove Mode: Scanned items will be reduced in qty"
            >
              <span style={{ fontSize: 14 }}>{removeMode ? '🔴' : '⚪'}</span> 
              {removeMode ? 'REMOVE MODE' : 'SCAN MODE'}
            </button>
          </div>




            {/* Quick Actions Group */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowReturnModal(true)} style={{ background: '#eff6ff', color: '#2563eb', border: '1.5px solid #dbeafe', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>↩️</span> Return
              </button>
              <button onClick={handleParkOrder} style={{ background: '#fef3c7', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⏸️</span> Park
              </button>
              <button onClick={() => setShowParkedDropdown(true)} style={{ background: '#fff', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                <span>📂</span> Parked
                {parked.length > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', border: '2px solid #fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>{parked.length}</span>}
              </button>
              <button onClick={() => setShowReprint(true)} style={{ background: '#f8fafc', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🖨️</span> Reprint
              </button>
              <button onClick={() => { setBarcodeScanMode('manual'); setShowBarcodeInput(true) }} style={{ background: '#eff6ff', color: '#2563eb', border: '1.5px solid #dbeafe', borderRadius: 8, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📸</span> Scan
              </button>
            </div>
          </div>

          {/* Cart Table is now at the TOP of the content area */}
          <div style={{ flex: isMobile ? 'none' : 1, border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', minHeight: isMobile ? 350 : 'calc(100vh - 320px)' }}>
            <POSCartPanel cart={cart} updateQty={updateQty} setCart={setCart} removeFromCart={removeFromCart} removeMode={removeMode} setRemoveMode={setRemoveMode} cartSearch={cartSearch} setCartSearch={setCartSearch} selCust={selCust} setSelCust={setSelCust} custSearch={custSearch} setCustSearch={setCustSearch} lookupCustomer={lookupCustomer} setShowNewCust={setShowNewCust} loyaltyRedeem={loyaltyRedeem} setLoyaltyRedeem={setLoyaltyRedeem} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} couponCode={couponCode} setCouponCode={setCouponCode} applyCoupon={applyCoupon} cartSubtotal={cartSubtotal} cartTax={cartTax} couponDiscount={couponDiscount} loyaltyDiscount={loyaltyDiscount} manualDiscountPct={manualDiscountPct} setManualDiscountPct={setManualDiscountPct} manualDiscountAmount={manualDiscountAmount} cartTotal={cartTotal} pointsEarned={pointsEarned} payMethod={payMethod} setPayMethod={setPayMethod} cashGiven={cashGiven} setCashGiven={setCashGiven} cashGivenNum={cashGivenNum} cashChange={cashChange} cardNum={cardNum} setCardNum={setCardNum} setCardExp={setCardExp} setCardCvv={setCardCvv} splitCash={splitCash} setSplitCash={setSplitCash} splitCard={splitCard} setSplitCard={setSplitCard} splitQr={splitQr} setSplitQr={setSplitQr} checkout={checkout} setShowCustDisplay={setShowCustDisplay} updateCartItemPrice={updateCartItemPrice} user={user} checkoutProcessing={checkoutProcessing} qrPaymentStatus={qrPaymentStatus} settings={settings} t={t} loadedOrderForReturn={loadedOrderForReturn} processReturnFromCart={processReturnFromCart} clearReturnMode={clearReturnMode} returnReasonCode={returnReasonCode} setReturnReasonCode={setReturnReasonCode} returnProcessMode={returnProcessMode} setReturnProcessMode={setReturnProcessMode} returnRefundMethod={returnRefundMethod} setReturnRefundMethod={setReturnRefundMethod} lastAddedTrigger={lastAddedTrigger} isFullView={true} showFooter={false} />
          </div>

          {/* Product Grid is now BELOW the table */}
          {!isMobile && (
            <div style={{ height: 140, overflowY: 'auto' }}>
               <POSProductGrid search={''} setSearch={() => {}} categories={[]} cat={''} setCat={() => {}} filteredProds={[]} favProds={products.filter(p => [1,2,3,4,5].includes(p.id))} getItemDiscount={() => 0} addToCart={addToCart} scanMsg={scanMsg} parkBill={parkBill} parked={parked} recallBill={recallBill} showParkedDropdown={showParkedDropdown} setShowParkedDropdown={setShowParkedDropdown} setShowBarcodeInput={setShowBarcodeInput} setShowReprint={setShowReprint} setShowReturnModal={setShowReturnModal} loadOrderInput={loadOrderInput} setLoadOrderInput={setLoadOrderInput} loadOrderForReturn={loadOrderForReturn} loadOrderLoading={loadOrderLoading} loadedOrderForReturn={loadedOrderForReturn} returnProcessMode={returnProcessMode} settings={settings} t={t} />
            </div>
          )}
        </div>

        {/* Right Column: Checkout and Payment */}
        <div style={{ width: isMobile ? '100%' : 380, flexShrink: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: isMobile ? 40 : 0 }}>
          {/* Customer info */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#1e293b' }}>{selCust ? selCust.name : 'Walk-in Customer'}</div>
                {selCust && <div style={{ fontSize: 11, color: t.accent, fontWeight: 700 }}>⭐ {selCust.loyaltyPoints} points</div>}
              </div>
              <button 
                onClick={() => setShowNewCust(true)}
                style={{ background: t.accent + '20', color: t.accent, border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                {selCust ? 'Change' : '+ Add'}
              </button>
            </div>
          </div>

          {/* Totals Summary */}
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>Total Items</span>
              <span style={{ fontWeight: 800, color: '#1e293b' }}>{cart.reduce((a, c) => a + c.qty, 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(cartSubtotal, settings?.sym)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#64748b' }}>
              <span>Tax</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(cartTax, settings?.sym)}</span>
            </div>
            {couponDiscount + loyaltyDiscount + manualDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#10b981' }}>
                <span>Discounts</span>
                <span style={{ fontWeight: 700 }}>-{fmt(couponDiscount + loyaltyDiscount + manualDiscountAmount, settings?.sym)}</span>
              </div>
            )}
            
            <div style={{ marginTop: 'auto', background: '#1e293b', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Total Payable</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#ef4444' }}>{fmt(cartTotal, settings?.sym)}</div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Payment Method</div>
                <button 
                  onClick={() => setShowCustDisplay(true)} 
                  title="Show Customer Display" 
                  style={{ background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', fontSize: 13, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontWeight: 600 }}
                >
                  <span style={{ fontSize: 14 }}>🖥️</span>
                  Cust. Display
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { id: 'Cash', label: 'CASH', icon: '💵' },
                  { id: 'Card', label: 'CARD', icon: '💳' },
                  { id: 'QR', label: 'QR PAY', icon: '🤳' },
                  { id: 'Split', label: 'SPLIT', icon: '🔗' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 12,
                      border: `2px solid ${payMethod === m.id ? t.accent : '#e2e8f0'}`,
                      background: payMethod === m.id ? t.accent + '10' : '#fff',
                      color: payMethod === m.id ? t.accent : '#475569',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 900 }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Payment Inputs */}
            {payMethod === 'Cash' && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.3s ease' }}>
                <Input t={t} label="Cash Given" value={cashGiven} onChange={setCashGiven} placeholder="0.00" type="number" autoFocus />
                {isCashInsufficient && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 900, color: '#ef4444', background: '#fef2f2', padding: '6px 10px', borderRadius: 8, border: '1px solid #fee2e2' }}>⚠️ Insufficient Amount</div>}
                {cashChange > 0 && <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: t.green }}>Change: {fmt(cashChange, settings?.sym)}</div>}
              </div>
            )}
            {payMethod === 'Split' && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.3s ease', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: t.text3, marginBottom: 12 }}>
                  Split payment allows combining Cash, Card, and QR. Click below to enter amounts.
                </div>
              </div>
            )}
            {payMethod === 'QR' && qrPaymentStatus === 'processing' && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ textAlign: 'center', background: t.bg3, padding: 12, borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: t.text2, marginBottom: 4 }}>Waiting for customer scan…</div>
                  <div style={{ fontSize: 10, color: t.text3 }}>Customer display or simulate below</div>
                </div>
                <div
                  onClick={handleQrScanComplete}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleQrScanComplete()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0a0f1e',
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    border: '1px dashed #334155',
                  }}
                >
                  <span style={{ fontSize: 18 }}>🤳</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>SIMULATE QR SCAN (cashier)</span>
                </div>
              </div>
            )}
            {payMethod === 'Card' && (
              <div style={{ marginTop: 14, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Card terminal</div>
                <CardTerminal onTapComplete={handleCardTerminalTap} disabled={cart.length === 0 || checkoutProcessing || cardTapPhase !== null} settings={settings} t={t} />
                <div style={{ marginTop: 10, fontSize: 12, color: t.text3, lineHeight: 1.45 }}>
                  Tap the strip to start. Authorizing opens first, then payment details (prototype).
                </div>
              </div>
            )}
          </div>

          {/* Checkout Button */}
          <div style={{ padding: 20, borderTop: '1px solid #f1f5f9' }}>
            <button 
              onClick={checkout}
              disabled={cart.length === 0 || checkoutProcessing || isCashInsufficient || payMethod === 'Card' || (payMethod === 'QR' && qrPaymentStatus !== null) || showSplitPaymentModal}
              style={{ 
                width: '100%',
                background: (cart.length === 0 || checkoutProcessing || isCashInsufficient || payMethod === 'Card' || (payMethod === 'QR' && qrPaymentStatus !== null) || showSplitPaymentModal) ? '#94a3b8' : '#10b981', 
                color: '#fff', border: 'none', borderRadius: 12, 
                padding: '16px', cursor: (cart.length === 0 || checkoutProcessing || payMethod === 'Card' || (payMethod === 'QR' && qrPaymentStatus !== null) || showSplitPaymentModal) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 16, fontWeight: 900, boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
              }}
            >
              <span style={{ fontSize: 22 }}>✓</span>
              {checkoutProcessing ? 'Processing...' : payMethod === 'Card' ? 'USE CARD TERMINAL BELOW' : payMethod === 'QR' && qrPaymentStatus === null ? 'START QR PAYMENT' : payMethod === 'QR' && qrPaymentStatus === 'processing' ? 'WAITING FOR SCAN…' : payMethod === 'QR' && qrPaymentStatus === 'received' ? 'CONFIRM IN PAYMENT WINDOW' : payMethod === 'Split' ? 'OPEN SPLIT PAYMENT MODAL' : 'COMPLETE PAYMENT'}
            </button>
          </div>

        </div>
      </div>

      <CardAuthorizingFlow
        phase={cardTapPhase}
        onAuthorized={onCardAuthorizingSuccess}
        onDeclined={onCardAuthorizingDeclined}
        onRetry={onCardFailureRetry}
        onChangePaymentMethod={onCardChangePaymentMethod}
        t={t}
      />

      <CardPaymentModal
        open={showCardPaymentModal}
        onClose={closeCardPaymentModal}
        read={cardReadData}
        cartTotal={cartTotal}
        displayAmount={cardPaymentDisplayAmount}
        settings={settings}
        t={t}
        onConfirmPayment={confirmCardPaymentFromModal}
      />

      <QrPaymentModal
        open={showQrPaymentModal}
        onClose={closeQrPaymentModal}
        read={qrReadData}
        cartTotal={cartTotal}
        settings={settings}
        t={t}
        onConfirmPayment={confirmQrPaymentFromModal}
      />

      <SplitPaymentDetailModal
        open={showSplitPaymentModal}
        onClose={() => setShowSplitPaymentModal(false)}
        onCompleteSplitPayment={handleSplitPaymentComplete}
        cartTotal={cartTotal}
        settings={settings}
        t={t}
      />

      {showParkedDropdown && (
        <Modal t={t} title="Parked Orders" subtitle="Select an order to recall" onClose={() => setShowParkedDropdown(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
            {parked.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: t.text3 }}>No parked orders found</div>
            ) : (
              parked.map(p => (
                <div 
                  key={p.id} 
                  style={{ padding: 16, background: t.bg3, borderRadius: 12, border: `1px solid ${t.border}`, cursor: 'pointer' }}
                  onClick={() => handleRecallOrder(p)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, color: t.text }}>Order #{p.id.toString().slice(-4)}</span>
                    <span style={{ fontSize: 11, color: t.text4 }}>{p.ts}</span>
                  </div>
                  <div style={{ fontSize: 12, color: t.text2 }}>
                    {p.cart.length} items · Total: {fmt(p.cart.reduce((s, i) => s + (i.price * i.qty), 0), settings?.sym)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {variantProduct && (
        <Modal t={t} title="Select Variant" subtitle={variantProduct.name} onClose={() => setVariantProduct(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(variantProduct.dynamic_attributes || {}).map(([key, values]) => (
              values && values.length > 0 && (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.text3, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{key}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {values.map(val => (
                      <button
                        key={val}
                        onClick={() => setSelectedVariant(v => ({ ...v, [key]: val }))}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 10,
                          border: `2px solid ${selectedVariant[key] === val ? t.accent : t.border}`,
                          background: selectedVariant[key] === val ? t.accent + '15' : t.bg3,
                          color: selectedVariant[key] === val ? t.accent : t.text,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <Btn t={t} variant="ghost" onClick={() => setVariantProduct(null)} style={{ flex: 1 }}>Cancel</Btn>
              <Btn t={t} variant="primary" onClick={confirmVariant} style={{ flex: 1 }}>Add to Cart</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showNewCust && (
        <Modal t={t} title="Register New Customer" subtitle="Verify phone number via OTP" onClose={() => { setShowNewCust(false); setOtpStep(1) }}>
          {otpStep === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input t={t} label="Customer Full Name" value={newCustForm.name} onChange={v => setNewCustForm(f => ({ ...f, name: v }))} required />
              <Input t={t} label="Mobile Number" value={newCustForm.phone} onChange={v => setNewCustForm(f => ({ ...f, phone: v }))} placeholder="+44 7700 900000" required note="OTP will be sent to verify this number" />
              <Btn t={t} onClick={sendNewCustOtp} disabled={!newCustForm.name || !newCustForm.phone} fullWidth>Send OTP →</Btn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: t.yellowBg, border: `1px solid ${t.yellowBorder}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, color: t.yellow, fontWeight: 700, marginBottom: 4 }}>📱 Demo OTP sent to {newCustForm.phone}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: t.yellow, letterSpacing: 8, fontFamily: 'monospace' }}>{generatedOtp}</div>
              </div>
              <Input t={t} label="Enter 6-Digit OTP" value={otpInput} onChange={setOtpInput} placeholder="______" />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn t={t} variant="ghost" onClick={() => setOtpStep(1)}>← Back</Btn>
                <Btn t={t} variant="success" onClick={verifyNewCust} disabled={otpInput.length < 6} style={{ flex: 1 }}>✓ Verify & Register</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {showBarcodeInput && (
        <Modal t={t} title="Scan Barcode" subtitle="Camera scan or manual entry" onClose={() => setShowBarcodeInput(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <button onClick={() => setBarcodeScanMode('camera')} style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: `2px solid ${barcodeScanMode === 'camera' ? t.accent : t.border}`, background: barcodeScanMode === 'camera' ? t.accent + '20' : t.bg3, color: barcodeScanMode === 'camera' ? t.accent : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📷 Camera</button>
              <button onClick={() => setBarcodeScanMode('manual')} style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: `2px solid ${barcodeScanMode === 'manual' ? t.accent : t.border}`, background: barcodeScanMode === 'manual' ? t.accent + '20' : t.bg3, color: barcodeScanMode === 'manual' ? t.accent : t.text3, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⌨️ Manual</button>
            </div>
            {barcodeScanMode === 'camera' ? (
              <>
                <BarcodeScanner t={t} active={showBarcodeInput && barcodeScanMode === 'camera'} onDetected={(code) => handleBarcodeScan(code)} onError={() => notify('Camera access denied', 'error')} />
                <div style={{ fontSize: 11, color: t.text4 }}>Keyboard wedge scanners also work — just scan when focused</div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: 16, background: t.bg3, borderRadius: 10 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⌨️</div>
                  <div style={{ fontSize: 13, color: t.text3 }}>Type or paste barcode/SKU</div>
                </div>
                <div onKeyDown={e => e.key === 'Enter' && manualBarcode.trim() && handleBarcodeScan(manualBarcode)}>
                  <Input t={t} label="Barcode/SKU" value={manualBarcode} onChange={setManualBarcode} placeholder="Scan or type barcode..." />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn t={t} variant="ghost" onClick={() => setShowBarcodeInput(false)} style={{ flex: 1 }}>Cancel</Btn>
              {barcodeScanMode === 'manual' && <Btn t={t} variant="success" onClick={() => handleBarcodeScan(manualBarcode)} disabled={!manualBarcode.trim()} style={{ flex: 1 }}>✓ Lookup</Btn>}
            </div>
          </div>
        </Modal>
      )}

      {showCustDisplay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0a0f1e', borderRadius: 20, padding: 32, width: 480, color: '#fff', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', marginBottom: 4 }}>S</div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>SCSTix EPOS</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{user?.counter} · Customer Display</div>
            </div>
            {selCust && <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 16px', marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Welcome,</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>{selCust.name}</div>
              <div style={{ fontSize: 12, color: '#fbbf24' }}>⭐ {selCust.loyaltyPoints} points balance</div>
            </div>}
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 14 }}>
              {cart.map(i => <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#1e293b' }}>
                    <ImgWithFallback src={i.image || i.image_url || PRODUCT_IMAGES[i.name]} alt={i.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>{i.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>Qty: {i.qty}</span>
                  </div>
                </div>
                <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 15 }}>{fmt(i.price * (1 - (i.discount || 0) / 100) * i.qty, settings?.sym)}</span>
              </div>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 900, color: '#fff', paddingTop: 10, borderTop: '2px solid #334155', marginTop: 6 }}>
              <span>TOTAL</span><span style={{ color: '#ef4444' }}>{fmt(cartTotal, settings?.sym)}</span>
            </div>
            {payMethod === 'QR' && qrPaymentStatus === 'processing' && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <div
                  onClick={handleQrScanComplete}
                  style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 10, cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: 140, height: 140, display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 1 }}>
                    {Array.from({ length: 64 }, (_, i) => <div key={i} style={{ background: (i + Math.floor(i / 8)) % 3 === 0 ? '#000' : '#fff', borderRadius: 1 }}></div>)}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 700 }}>Scan QR code or click to simulate success</div>
              </div>
            )}
            {payMethod === 'QR' && qrPaymentStatus === 'received' && (
              <div style={{ marginTop: 24, textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: 40, color: '#4ade80', marginBottom: 14 }}>✓</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#4ade80' }}>Scan complete</div>
                <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Cashier will confirm payment on the register</div>
              </div>
            )}
            <button onClick={() => setShowCustDisplay(false)} style={{ width: '100%', marginTop: 20, padding: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Close Display</button>
          </div>
        </div>
      )}

      {showReceipt && <ReceiptModal order={showReceipt} settings={settings} onClose={() => setShowReceipt(null)} t={t} />}

      {showReprint && (
        <Modal t={t} title="Reprint Receipt" onClose={() => { setShowReprint(false); setReprintOrder(null); setReprintOrderNum('') }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input t={t} label="Order number" value={reprintOrderNum} onChange={setReprintOrderNum} placeholder="e.g. ORD-0001" />
            <Btn t={t} onClick={async () => {
              if (!reprintOrderNum.trim()) return
              setReprintLoading(true)
              setReprintOrder(null)
              try {
                const o = await ordersService.fetchOrderByNumber(reprintOrderNum.trim())
                if (!o) { notify('Order not found', 'error'); setReprintLoading(false); return }
                const cashierName = users?.find(u => u.id === o.cashier_id)?.name || o.cashier_id || 'Cashier'
                const receiptOrder = {
                  id: o.order_number,
                  order_number: o.order_number,
                  date: o.created_at ? new Date(o.created_at).toLocaleString() : '',
                  counter: 'Counter',
                  cashierName,
                  customerName: o.customer_id ? (users?.find(u => u.id === o.customer_id)?.name || 'Customer') : 'Walk-in',
                  items: (o.order_items || []).map(i => ({ name: i.product_name, qty: i.quantity, price: i.unit_price, discount: i.discount_pct || 0 })),
                  subtotal: o.subtotal,
                  tax: o.tax_amount,
                  deliveryCharge: o.delivery_charge || 0,
                  couponDiscount: o.discount_amount || 0,
                  couponCode: null,
                  loyaltyDiscount: o.loyalty_discount || 0,
                  total: o.total,
                  payment: o.payment_method || 'Cash',
                  cardLast4: o.payment_details?.card_last4 || null,
                  cashGiven: o.payment_details?.cash_given || null,
                  cashChange: o.payment_details?.cash_change || null,
                  loyaltyEarned: o.loyalty_earned || 0,
                }
                setReprintOrder(receiptOrder)
                setShowReprint(false)
              } catch (err) {
                notify(err?.message || 'Failed to fetch order', 'error')
              } finally {
                setReprintLoading(false)
              }
            }} disabled={!reprintOrderNum.trim() || reprintLoading}>{reprintLoading ? 'Looking up...' : 'Lookup & Reprint'}</Btn>
          </div>
        </Modal>
      )}

      {reprintOrder && <ReceiptModal order={reprintOrder} settings={settings} onClose={() => setReprintOrder(null)} t={t} />}

      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: t.bg, borderRadius: 16, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: t.shadowMd, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.bg, zIndex: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: t.text }}>↩️ Return / Exchange</span>
              <button onClick={() => setShowReturnModal(false)} style={{ padding: '8px 14px', background: t.bg3, border: `1px solid ${t.border}`, borderRadius: 9, color: t.text2, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Close</button>
            </div>
            <div style={{ padding: 20 }}>
              <CashierReturns
                orders={orders}
                setOrders={setOrders}
                returns={returns}
                setReturns={setReturns}
                products={products}
                setProducts={setProducts}
                settings={settings}
                addAudit={addAudit}
                currentUser={user}
                siteId={effectiveSiteId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
