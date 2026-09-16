console.info('Nivetha Build 26 - hero slideshow, clean portfolio, no customer login');
const STORE_CONFIG = {
  commerceEnabled: false,
  portfolioMode: true,
  // Add the Nivetha Dhoti WhatsApp number in international format, digits only. Example: 919876543210
  whatsappNumber: '919791577700'
};

// Build 18: the enquiry list is session-only.
// Remove any legacy persistent list created by older builds.
try { localStorage.removeItem('nivetha_cart'); } catch {}

const S = {
  products: [],
  cart: loadCart(),
  activeProductId: null,
  enquiryType: localStorage.getItem('nivetha-enquiry-type') || 'retail'
};

function loadCart() {
  try {
    const saved = JSON.parse(sessionStorage.getItem('nivetha_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  resetCheckoutToken();
  sessionStorage.setItem('nivetha_cart', JSON.stringify(S.cart));
  updateCartCount();
}

const $ = id => document.getElementById(id);

const CHECKOUT_TOKEN_KEY = 'nivetha-checkout-token';
const LAST_ORDER_KEY = 'nivetha-last-order';

const money = v =>
  `₹${Number(v || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  })}`;

const esc = v =>
  String(v ?? '').replace(
    /[&<>"']/g,
    c =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c]
  );

async function load() {
  try {
    const r = await fetch('/api/products', {
      cache: 'no-store'
    });

    const d = await r.json();

    if (!r.ok) {
      throw new Error(d.error || 'Unable to load products');
    }

    S.products = d.products || [];

    reconcileCart();
    collections();
    filters();
    products();
    renderCart();

  } catch (e) {
    const m = `
      <p class="store-empty">
        We couldn't load the catalogue.<br>
        ${esc(e.message)}
      </p>
    `;

    $('productGrid').innerHTML = m;
    $('collectionGrid').innerHTML = m;
  }
}

const cats = () =>
  [...new Set(
    S.products
      .map(p => p.category)
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

function collections() {
  const t = $('collectionGrid');
  const cs = cats();

  if (!cs.length) {
    t.innerHTML =
      '<p class="store-empty">Collections will appear after products are added in Admin.</p>';
    return;
  }

  t.innerHTML = cs.slice(0, 5).map(c => {
    const p = S.products.find(
      x => x.category === c && x.image_1
    );

    const n = S.products.filter(
      x => x.category === c
    ).length;

    return `
      <a
        class="collection-card dynamic"
        href="#products"
        data-category="${esc(c)}"
      >
        ${
          p
            ? `<img
                src="${esc(p.image_1)}"
                alt="${esc(c)}"
              >`
            : ''
        }

        <div>
          <h3>${esc(c).toUpperCase()}</h3>
          <span>SHOP NOW ›</span>
          <small class="collection-count">
            ${n} product${n === 1 ? '' : 's'}
          </small>
        </div>
      </a>
    `;
  }).join('');

  t.querySelectorAll('[data-category]').forEach(a => {
    a.onclick = () => {
      $('storeCategory').value = a.dataset.category;
      products();
    };
  });
}

function filters() {
  const s = $('storeCategory');
  const cur = s.value;

  s.innerHTML =
    '<option value="">All Collections</option>' +
    cats()
      .map(
        c =>
          `<option value="${esc(c)}">${esc(c)}</option>`
      )
      .join('');

  if (cats().includes(cur)) {
    s.value = cur;
  }
}

function filtered() {
  const q =
    ($('storeSearch').value || '')
      .trim()
      .toLowerCase();

  const c =
    $('storeCategory').value;

  return S.products.filter(p =>
    (
      !q ||
      String(p.product_name || '')
        .toLowerCase()
        .includes(q) ||
      String(p.product_code || '')
        .toLowerCase()
        .includes(q)
    )
    &&
    (
      !c ||
      p.category === c
    )
  );
}

function products() {
  const a = filtered();

  $('storeCount').textContent =
    `Showing ${a.length} of ${S.products.length}`;

  $('productGrid').innerHTML = a.length
    ? a.map(p => {
        return `
          <article class="product-card dynamic">

            <div
              class="pic product-image-click"
              data-product-id="${p.id}"
            >
              ${
                p.image_1
                  ? `<img
                      class="product-img primary-img"
                      src="${esc(p.image_1)}"
                      alt="Dhoti ${esc(p.product_code || '')}"
                    >`
                  : ''
              }

              ${
                p.image_2
                  ? `<img
                      class="product-img secondary-img"
                      src="${esc(p.image_2)}"
                      alt="Dhoti ${esc(p.product_code || '')} alternate view"
                    >`
                  : ''
              }

              <button
                class="heart"
                type="button"
                aria-label="Add to wishlist"
              >
                ♡
              </button>
            </div>

            <div class="product-card-info">
              <p class="product-code">
                ${esc(p.product_name || p.product_code)}
              </p>

              <button
                class="view-details${isInEnquiry(p.id) ? ' enquiry-added' : ''}"
                data-id="${p.id}"
                type="button"
                aria-label="${isInEnquiry(p.id) ? 'Added to enquiry. View details for ' : 'View details for '}${esc(p.product_code || 'product')}"
              >
                ${isInEnquiry(p.id)
                  ? '<span class="enquiry-added-check" aria-hidden="true">✓</span><span>Added to Enquiry</span>'
                  : '<span>View Details</span><span class="view-details-arrow" aria-hidden="true">→</span>'}
              </button>
            </div>

          </article>
        `;
      }).join('')
    : '<p class="store-empty">No products match your selection.</p>';

  $('productGrid')
    .querySelectorAll('.view-details')
    .forEach(b => {
      b.onclick = () =>
        openModal(+b.dataset.id);
    });

  $('productGrid')
    .querySelectorAll('.product-image-click')
    .forEach(img => {
      img.onclick = e => {
        if (e.target.closest('.heart')) {
          return;
        }

        openModal(
          +img.dataset.productId
        );
      };
    });
}

function openModal(id) {
  const p = S.products.find(
    x => +x.id === id
  );

  if (!p) {
    return;
  }

  S.activeProductId = id;

  if ($('modalCartMessage')) $('modalCartMessage').textContent = '';
  updateEnquiryButton();

  $('modalProductCode').textContent =
    p.product_code || '';

  // Product name is intentionally not displayed in this storefront.
  if ($('modalProductName')) {
    $('modalProductName').textContent = '';
  }

  $('modalCategory').textContent =
    p.category || '';

  $('modalPrice').textContent = '';
  $('modalPrice').hidden = true;

  // Portfolio enquiry mode: availability is confirmed by the seller on WhatsApp.
  $('modalStock').textContent = '';
  $('modalStock').hidden = true;
  $('modalStock').classList.remove('out');

  $('modalDescription').textContent =
    p.description ||
    'Product details will be added soon.';

  const imgs = [
    p.image_1,
    p.image_2,
    p.image_3
  ].filter(Boolean);

  const main =
    $('modalMainImage');

  const thumbs =
    $('modalThumbs');

  const mainWrap =
    main.parentElement;

  mainWrap.classList.remove('zoomed');
  mainWrap.scrollTop = 0;
  mainWrap.scrollLeft = 0;

  main.onclick = () => {
    mainWrap.classList.toggle('zoomed');

    if (!mainWrap.classList.contains('zoomed')) {
      mainWrap.scrollTop = 0;
      mainWrap.scrollLeft = 0;
    }
  };

  if (imgs.length) {
    main.src = imgs[0];
    main.alt =
      `Dhoti ${p.product_code || ''}`;

    thumbs.innerHTML = imgs
      .map(
        (u, i) => `
          <button
            class="${i === 0 ? 'active' : ''}"
            data-img="${esc(u)}"
            type="button"
            aria-label="View image ${i + 1}"
          >
            <img
              src="${esc(u)}"
              alt=""
            >
          </button>
        `
      )
      .join('');

    thumbs
      .querySelectorAll('button')
      .forEach(b => {
        b.onclick = () => {
          main.src =
            b.dataset.img;

          mainWrap.classList.remove('zoomed');
          mainWrap.scrollTop = 0;
          mainWrap.scrollLeft = 0;

          thumbs
            .querySelectorAll('button')
            .forEach(x =>
              x.classList.remove('active')
            );

          b.classList.add('active');
        };
      });

  } else {
    main.removeAttribute('src');
    thumbs.innerHTML = '';
  }

  $('productModal').hidden =
    false;

  document.body.style.overflow =
    'hidden';
}


function productById(id) {
  return S.products.find(p => +p.id === +id);
}

function reconcileCart() {
  const selectedIds = new Set();

  S.cart.forEach(item => {
    const p = productById(item.id);
    if (!p) return;
    selectedIds.add(+p.id);
  });

  // Keep one entry per selected model. Quantity is intentionally not used in portfolio mode.
  S.cart = [...selectedIds].map(id => ({ id, qty: 1 }));
  saveCart();
}

function cartQuantity() {
  return S.cart.length;
}

function updateCartCount() {
  const el = $('cartCount');
  if (el) el.textContent = String(S.cart.length);
}

function isInEnquiry(id) {
  return S.cart.some(item => +item.id === +id);
}

function updateEnquiryButton() {
  const add = $('modalAddToCart');
  if (!add) return;
  const selected = isInEnquiry(S.activeProductId);
  add.disabled = false;
  add.classList.toggle('selected', selected);
  add.textContent = selected ? '✓ ADDED TO ENQUIRY' : 'ADD TO ENQUIRY';
  add.setAttribute('aria-pressed', selected ? 'true' : 'false');
}

function addActiveProductToCart() {
  const p = productById(S.activeProductId);
  if (!p) return;

  const message = $('modalCartMessage');
  const existingIndex = S.cart.findIndex(item => +item.id === +p.id);

  if (existingIndex >= 0) {
    if (message) message.textContent = 'This model is already in your enquiry.';
    updateEnquiryButton();
    return;
  }

  S.cart.push({ id: +p.id, qty: 1 });
  saveCart();
  renderCart();
  products();
  updateEnquiryButton();
  if (message) message.textContent = 'Added to your enquiry list.';
}

function removeFromCart(id) {
  S.cart = S.cart.filter(item => +item.id !== +id);
  saveCart();
  renderCart();
  products();

  if (+S.activeProductId === +id && !$('productModal').hidden) {
    updateEnquiryButton();
    const message = $('modalCartMessage');
    if (message) message.textContent = 'Removed from your enquiry list.';
  }
}

function renderEnquiryType() {
  document.querySelectorAll('[name="enquiryType"]').forEach(input => {
    input.checked = input.value === S.enquiryType;
  });
}

function renderCart() {
  updateCartCount();

  const itemsEl = $('cartItems');
  const subtotalEl = $('cartSubtotal');
  const sendButton = $('checkoutButton');
  if (!itemsEl || !subtotalEl) return;

  const rows = S.cart.map(item => {
    const p = productById(item.id);
    if (!p) return '';

    return `
      <article class="cart-item">
        <div class="cart-item-image">
          ${p.image_1 ? `<img src="${esc(p.image_1)}" alt="Dhoti ${esc(p.product_code || '')}">` : ''}
        </div>
        <div class="cart-item-info">
          <p class="cart-item-code">${esc(p.product_code || '')}</p>
          ${p.category ? `<small>${esc(p.category)}</small>` : ''}
          <div class="cart-item-actions">
            <button class="cart-remove" type="button" data-cart-remove="${p.id}">REMOVE</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  itemsEl.innerHTML = rows ||
    '<div class="cart-empty"><span>♡</span><p>Your enquiry list is empty.</p><small>Open a dhoti and tap Add to Enquiry.</small></div>';

  subtotalEl.textContent = String(S.cart.length);
  if (sendButton) sendButton.disabled = S.cart.length === 0;
  renderEnquiryType();

  itemsEl.querySelectorAll('[data-cart-remove]').forEach(b => {
    b.onclick = () => removeFromCart(+b.dataset.cartRemove);
  });
}

function openCart() {
  renderCart();
  $('cartDrawer').classList.add('open');
  $('cartDrawer').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $('cartDrawer').classList.remove('open');
  $('cartDrawer').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}


function closeModal() {
  $('productModal').hidden =
    true;

  document.body.style.overflow =
    '';
}


function createEnquirySnapshot() {
  const items = S.cart.map((item, index) => {
    const p = productById(item.id);
    if (!p) return null;
    return {
      id: String(p.id ?? item.id),
      product_code: p.product_code || `Dhoti ${index + 1}`,
      category: p.category || '',
      image_1: p.image_1 || '',
      image_2: p.image_2 || '',
      image_3: p.image_3 || ''
    };
  }).filter(Boolean);
  return {
    enquiryId: `ENQ-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    enquiryType: S.enquiryType === 'wholesale' ? 'wholesale' : 'retail',
    items
  };
}

function getShareableEnquiryUrl(snapshot) {
  const ids = snapshot.items.map(item => String(item.id)).filter(Boolean);
  const params = new URLSearchParams();
  params.set('ids', ids.join(','));
  params.set('type', snapshot.enquiryType);
  return `${window.location.origin}/enquiry.html?${params.toString()}`;
}

function buildWhatsAppRequestMessage(snapshot) {
  const lines = [
    "Hello Nivetha Dhoti's,",
    '',
    'I am interested in the following dhotis:',
    ''
  ];
  snapshot.items.forEach((item, index) => {
    const collection = item.category ? ` (${item.category})` : '';
    lines.push(`${index + 1}. ${item.product_code}${collection}`);
  });
  lines.push('', `Enquiry type: ${snapshot.enquiryType === 'wholesale' ? 'Wholesale' : 'Retail'}`);
  lines.push('', 'View all selected dhoti images in one place:');
  lines.push(getShareableEnquiryUrl(snapshot));
  lines.push('', `Enquiry reference: ${snapshot.enquiryId}`);
  lines.push('', 'Please confirm availability and share the price/details for the selected models. Thank you.');
  return lines.join('\n');
}

function getWhatsAppRequestUrl(snapshot) {
  const number = String(STORE_CONFIG.whatsappNumber || '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(number)) return '';
  const text = encodeURIComponent(buildWhatsAppRequestMessage(snapshot));
  return `https://wa.me/${number}?text=${text}`;
}

function setWhatsAppQrSource(image, url, status) {
  const encoded = encodeURIComponent(url);
  const sources = [
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encoded}`,
    `https://quickchart.io/qr?size=320&margin=2&ecLevel=M&text=${encoded}`
  ];
  let sourceIndex = 0;

  if (status) status.textContent = 'Preparing your WhatsApp QR code…';
  image.alt = 'WhatsApp enquiry QR code';
  image.removeAttribute('src');

  image.onload = () => {
    image.classList.add('is-ready');
    if (status) status.textContent = 'Scan this QR code with your phone camera to open the enquiry in WhatsApp.';
  };

  image.onerror = () => {
    sourceIndex += 1;
    if (sourceIndex < sources.length) {
      image.src = sources[sourceIndex];
      return;
    }
    image.classList.remove('is-ready');
    if (status) status.textContent = 'QR code could not be loaded. Use “Open WhatsApp on this device” below.';
  };

  image.classList.remove('is-ready');
  image.src = sources[sourceIndex];
}

function openWhatsAppQr(url) {
  const dialog = $('whatsappQrDialog');
  const image = $('whatsappQrImage');
  const openLink = $('whatsappQrOpenLink');
  const status = $('whatsappQrStatus');
  if (!dialog || !image || !openLink) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  openLink.href = url;
  setWhatsAppQrSource(image, url, status);
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

function closeWhatsAppQr() {
  const dialog = $('whatsappQrDialog');
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}
window.closeWhatsAppQr = closeWhatsAppQr;

function sendWhatsAppRequest() {
  const message = $('checkoutMessage');
  if (!S.cart.length) return;


  const snapshot = createEnquirySnapshot();
  const url = getWhatsAppRequestUrl(snapshot);
  if (!url) {
    if (message) message.textContent = 'Nivetha WhatsApp number is not configured yet.';
    return;
  }


  // Clear the active enquiry list after submission while keeping the generated QR/message intact.
  S.cart = [];
  saveCart();
  renderCart();
  products();

  closeCart();
  openWhatsAppQr(url);
  if (message) message.textContent = '';
}

function checkoutMoney(v){return `₹${Math.max(0,Number(v||0)).toLocaleString('en-IN')}`;}
function checkoutSubtotalValue(){return S.cart.reduce((sum,item)=>{const p=productById(item.id);return p?sum+Number(p.retail_price||0)*Number(item.qty||0):sum;},0);}
function renderCheckoutSummary(){const box=$('checkoutItems');if(!box)return;box.innerHTML=S.cart.map(item=>{const p=productById(item.id);if(!p)return '';const q=Number(item.qty||0),pr=Number(p.retail_price||0),img=p.image_1||'';return `<article class="checkout-item"><div class="checkout-item-image-wrap">${img?`<img src="${img}" alt="${p.product_code||'Product'}">`:''}</div><div class="checkout-item-info"><strong>${p.product_code||'Product'}</strong><span>Qty: ${q}</span><span>${checkoutMoney(pr)} each</span></div><strong class="checkout-item-total">${checkoutMoney(pr*q)}</strong></article>`;}).join('');const sub=checkoutSubtotalValue(),ship=S.cart.length?Number(STORE_CONFIG.shippingCharge||0):0;$('checkoutSubtotal').textContent=checkoutMoney(sub);$('checkoutShipping').textContent=ship?checkoutMoney(ship):'FREE';$('checkoutTotal').textContent=checkoutMoney(sub+ship);}
function openCheckout(){
  if(!STORE_CONFIG.commerceEnabled||!S.cart.length)return;
  closeCart();
  renderCheckoutSummary();
  $('checkoutFormMessage')?.classList.remove('success');
  if($('checkoutFormMessage')) $('checkoutFormMessage').textContent='';
  $('backToCartButton')?.removeAttribute('disabled');
  setCheckoutProcessing(false,'PAY NOW');
  $('checkoutModal').hidden=false;
  document.body.classList.add('checkout-open');
}
function closeCheckout(){$('checkoutModal').hidden=true;document.body.classList.remove('checkout-open');}
function setCheckoutError(n,m){const e=document.querySelector(`[data-error-for="${n}"]`);if(e)e.textContent=m;}
function validateCheckoutForm(){document.querySelectorAll('[data-error-for]').forEach(e=>e.textContent='');const d={name:$('checkoutName').value.trim(),mobile:$('checkoutMobile').value.replace(/\D/g,''),email:$('checkoutEmail').value.trim(),address1:$('checkoutAddress1').value.trim(),city:$('checkoutCity').value.trim(),state:$('checkoutState').value,pincode:$('checkoutPincode').value.replace(/\D/g,'')};let ok=true;if(d.name.length<2){setCheckoutError('name','Enter the customer name.');ok=false;}if(!/^[6-9]\d{9}$/.test(d.mobile)){setCheckoutError('mobile','Enter a valid 10-digit Indian mobile number.');ok=false;}if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)){setCheckoutError('email','Enter a valid email address.');ok=false;}if(d.address1.length<5){setCheckoutError('address1','Enter the delivery address.');ok=false;}if(d.city.length<2){setCheckoutError('city','Enter the city.');ok=false;}if(!d.state){setCheckoutError('state','Select the state.');ok=false;}if(!/^\d{6}$/.test(d.pincode)){setCheckoutError('pincode','Enter a valid 6-digit pincode.');ok=false;}return ok;}
function getCheckoutToken(){
  let token=localStorage.getItem(CHECKOUT_TOKEN_KEY);
  if(!token){
    token=(window.crypto?.randomUUID?.() || `nd-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(CHECKOUT_TOKEN_KEY,token);
  }
  return token;
}
function resetCheckoutToken(){localStorage.removeItem(CHECKOUT_TOKEN_KEY);}
function checkoutCustomerPayload(){
  return {
    name:$('checkoutName').value.trim(),
    mobile:$('checkoutMobile').value.replace(/\D/g,''),
    email:$('checkoutEmail').value.trim(),
    address1:$('checkoutAddress1').value.trim(),
    address2:$('checkoutAddress2').value.trim(),
    city:$('checkoutCity').value.trim(),
    state:$('checkoutState').value,
    pincode:$('checkoutPincode').value.replace(/\D/g,'')
  };
}
function setCheckoutProcessing(isProcessing, label = ''){
  const button=$('placeOrderButton');
  if(!button)return;
  button.disabled=Boolean(isProcessing);
  button.textContent=label || (isProcessing ? 'PROCESSING...' : 'PAY NOW');
}

async function markPaymentFailed(order, error = {}){
  try{
    await fetch('/api/payments',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        action:'failed',
        orderId:Number(order?.id||0),
        checkoutToken:getCheckoutToken(),
        code:error.code||error.error?.code||'',
        description:error.description||error.error?.description||''
      })
    });
  }catch(_error){ /* best-effort status update only */ }
}

function finishPaidCheckout(order){
  const message=$('checkoutFormMessage');
  const orderNumber=order?.order_number||'';
  const paymentId=order?.razorpay_payment_id||'';
  localStorage.setItem(LAST_ORDER_KEY,JSON.stringify(order||{}));
  S.cart=[];
  sessionStorage.removeItem('nivetha_cart');
  resetCheckoutToken();
  renderCart();
  if(message){
    message.textContent=`Payment successful. Order ${orderNumber} is confirmed${paymentId?` · Payment ${paymentId}`:''}.`;
    message.classList.add('success');
  }
  setCheckoutProcessing(true,'ORDER CONFIRMED');
  $('backToCartButton')?.setAttribute('disabled','disabled');
}

async function verifyRazorpayPayment(order, paymentResponse){
  const response=await fetch('/api/payments',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      action:'verify',
      orderId:Number(order?.id||0),
      checkoutToken:getCheckoutToken(),
      razorpay_order_id:paymentResponse.razorpay_order_id,
      razorpay_payment_id:paymentResponse.razorpay_payment_id,
      razorpay_signature:paymentResponse.razorpay_signature
    })
  });
  const data=await response.json();
  if(!response.ok){
    const error=new Error(data.error||'Payment verification failed.');
    error.paymentReceived=Boolean(data.paymentReceived);
    error.order=data.order||null;
    throw error;
  }
  return data.order||order;
}

async function openRazorpayCheckout(paymentData, order){
  const message=$('checkoutFormMessage');
  if(typeof window.Razorpay!=='function'){
    throw new Error('Payment window could not be loaded. Please check your connection and try again.');
  }

  return await new Promise((resolve,reject)=>{
    let finished=false;
    const customer=checkoutCustomerPayload();
    const razorpay=new window.Razorpay({
      key:paymentData.keyId,
      amount:paymentData.amount,
      currency:paymentData.currency||'INR',
      name:paymentData.name||"Nivetha Dhoti's",
      description:paymentData.description||`Order ${order?.order_number||''}`,
      order_id:paymentData.razorpayOrderId,
      prefill:{
        name:customer.name||'',
        email:customer.email||'',
        contact:customer.mobile||''
      },
      notes:{
        nivetha_order_number:order?.order_number||''
      },
      theme:{color:'#5b2f18'},
      modal:{
        ondismiss:()=>{
          if(finished)return;
          finished=true;
          const error=new Error('Payment was not completed. Your order is still pending and you can retry payment.');
          error.dismissed=true;
          reject(error);
        }
      },
      handler:async paymentResponse=>{
        if(finished)return;
        finished=true;
        try{
          if(message)message.textContent='Payment received. Verifying securely...';
          setCheckoutProcessing(true,'VERIFYING PAYMENT...');
          const verifiedOrder=await verifyRazorpayPayment(order,paymentResponse);
          resolve(verifiedOrder);
        }catch(error){
          reject(error);
        }
      }
    });

    razorpay.on('payment.failed',async response=>{
      if(finished)return;
      finished=true;
      await markPaymentFailed(order,response?.error||response||{});
      const reason=response?.error?.description||'Payment failed. Please try again.';
      reject(new Error(reason));
    });

    razorpay.open();
  });
}

async function handleCheckoutSubmit(e){
  e.preventDefault();
  const message=$('checkoutFormMessage');
  message?.classList.remove('success');
  if(!validateCheckoutForm()){
    if(message)message.textContent='Please correct the highlighted fields.';
    return;
  }

  setCheckoutProcessing(true,'PREPARING PAYMENT...');
  if(message)message.textContent='Checking stock and preparing secure payment...';

  try{
    const orderResponse=await fetch('/api/orders',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        checkoutToken:getCheckoutToken(),
        customer:checkoutCustomerPayload(),
        items:S.cart.map(item=>({id:Number(item.id),qty:Number(item.qty||0)})),
        shippingCharge:Number(STORE_CONFIG.shippingCharge||0)
      })
    });
    const orderData=await orderResponse.json();
    if(!orderResponse.ok)throw new Error(orderData.error||'Unable to prepare order.');
    const order=orderData.order||{};
    localStorage.setItem(LAST_ORDER_KEY,JSON.stringify(order));

    if(message)message.textContent=`Order ${order.order_number||''} prepared. Opening secure payment...`;

    const paymentResponse=await fetch('/api/payments',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        action:'create',
        orderId:Number(order.id||0),
        checkoutToken:getCheckoutToken()
      })
    });
    const paymentData=await paymentResponse.json();
    if(!paymentResponse.ok)throw new Error(paymentData.error||'Unable to start payment.');

    if(paymentData.alreadyPaid){
      finishPaidCheckout(paymentData.order||order);
      return;
    }

    setCheckoutProcessing(true,'PAYMENT OPEN...');
    if(message)message.textContent='Complete the payment in the Razorpay window.';
    const verifiedOrder=await openRazorpayCheckout(paymentData,order);
    finishPaidCheckout(verifiedOrder);
  }catch(error){
    if(message){
      message.textContent=error.paymentReceived
        ? (error.message||'Payment received, but the order needs manual attention. Please contact support.')
        : (error.message||'Unable to complete payment. Please try again.');
    }
    if(!error.paymentReceived)setCheckoutProcessing(false,'RETRY PAYMENT');
    else setCheckoutProcessing(true,'CONTACT SUPPORT');
  }
}
function applyCommerceMode(){
  document.documentElement.dataset.commerce=STORE_CONFIG.commerceEnabled?'on':'off';
  document.documentElement.dataset.portfolio=STORE_CONFIG.portfolioMode?'on':'off';
}

document.addEventListener(
  'DOMContentLoaded',
  () => {

    $('storeSearch')
      .addEventListener(
        'input',
        products
      );

    $('storeCategory')
      .addEventListener(
        'change',
        products
      );

    $('modalAddToCart')?.addEventListener('click', addActiveProductToCart);

    document.querySelectorAll('[name="enquiryType"]').forEach(input => {
      input.addEventListener('change', e => {
        S.enquiryType = e.target.value === 'wholesale' ? 'wholesale' : 'retail';
        localStorage.setItem('nivetha-enquiry-type', S.enquiryType);
        renderEnquiryType();
      });
    });

    $('cartButton')?.addEventListener('click', openCart);

    document.querySelectorAll('[data-close-cart]').forEach(x => {
      x.addEventListener('click', closeCart);
    });
    $('checkoutButton')?.addEventListener('click', sendWhatsAppRequest);
    const qrDialog = $('whatsappQrDialog');
    qrDialog?.addEventListener('click', event => {
      const rect = qrDialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) closeWhatsAppQr();
    });


    updateCartCount();

    document
      .querySelectorAll(
        '[data-close-modal]'
      )
      .forEach(x => {
        x.onclick =
          closeModal;
      });

    document
      .addEventListener(
        'keydown',
        e => {
          if (e.key === 'Escape') {
            if (!$('productModal').hidden) closeModal();
            if ($('cartDrawer').classList.contains('open')) closeCart();
            if ($('whatsappQrDialog')?.open) closeWhatsAppQr();
          }
        }
      );

    applyCommerceMode();
    load();
  }
);

/* Build 39 — automatic first-visit guided tour (desktop + mobile). */
(() => {
  const TOUR_KEY = 'nevetha-guided-tour-v1-complete';
  const steps = [
    { title:'Welcome to Nevetha Handlooms', text:'Take a quick tour to see how to browse our dhotis and send an enquiry on WhatsApp.' },
    { target:'#collections', title:'Browse Collections', text:'Explore our dhotis by collection to quickly find the style you are looking for.' },
    { target:'.store-toolbar', title:'Search & Filter', text:'Search by product name or code, and filter the collection to narrow your choices.' },
    { target:'#productGrid', title:'Choose a Dhoti', text:'Open any dhoti to view its details and add the model to your enquiry list.' },
    { target:'#cartButton', title:'My Enquiry', text:'Your selected dhotis appear here. Choose Retail or Wholesale and send your request through WhatsApp.' },
    { title:'You’re Ready', text:'That’s it! Browse, select your favourite dhotis and send your enquiry directly to us on WhatsApp.' }
  ];
  let current = 0;
  const $tour = document.getElementById('siteTour');
  const $focus = document.getElementById('siteTourFocus');
  const $card = document.getElementById('siteTourCard');
  if (!$tour || !$focus || !$card) return;

  const finish = () => {
    localStorage.setItem(TOUR_KEY, '1');
    $tour.hidden = true;
    document.body.style.overflow = '';
  };
  const position = () => {
    const step = steps[current];
    const el = step.target ? document.querySelector(step.target) : null;
    $card.classList.remove('centered');
    if (!el) {
      $focus.hidden = true;
      $card.classList.add('centered');
      return;
    }
    // Build 40: keep header enquiry target in its real visible position.
    // For other targets, use instant scrolling so the highlight is measured only
    // after the page has reached its final position (avoids smooth-scroll drift).
    if (step.target !== '#cartButton') {
      const before = el.getBoundingClientRect();
      if (before.top < 12 || before.bottom > innerHeight - 12) {
        el.scrollIntoView({behavior:'auto', block:'center'});
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const pad = 7;
      $focus.hidden = false;
      Object.assign($focus.style,{left:`${Math.max(6,r.left-pad)}px`,top:`${Math.max(6,r.top-pad)}px`,width:`${Math.min(innerWidth-12,r.width+pad*2)}px`,height:`${Math.min(innerHeight-12,r.height+pad*2)}px`});
      const cw = Math.min(360, innerWidth-28), ch = $card.offsetHeight || 210, gap=14;
      let left = Math.min(Math.max(14,r.left), innerWidth-cw-14);
      let top = r.bottom+gap;
      if (top+ch>innerHeight-14) top = r.top-ch-gap;
      if (top<14) { top = Math.max(14,innerHeight-ch-14); left=14; }
      Object.assign($card.style,{left:`${left}px`,top:`${top}px`,transform:'none'});
    }));
  };
  const render = () => {
    const step=steps[current];
    document.getElementById('siteTourProgress').textContent=`Step ${current+1} of ${steps.length}`;
    document.getElementById('siteTourTitle').textContent=step.title;
    document.getElementById('siteTourText').textContent=step.text;
    document.getElementById('siteTourBack').style.visibility=current===0?'hidden':'visible';
    document.getElementById('siteTourNext').textContent=current===steps.length-1?'Finish':'Next';
    position();
  };
  const start = () => { current=0; $tour.hidden=false; document.body.style.overflow='hidden'; render(); };
  document.getElementById('siteTourSkip').addEventListener('click', finish);
  document.getElementById('siteTourBack').addEventListener('click',()=>{if(current>0){current--;render();}});
  document.getElementById('siteTourNext').addEventListener('click',()=>{if(current<steps.length-1){current++;render();}else finish();});
  window.addEventListener('resize',()=>{if(!$tour.hidden) position();});
  if (!localStorage.getItem(TOUR_KEY)) setTimeout(start, 800);
})();

/* Build 39 — tell the customer that the active enquiry was cleared after QR creation. */
(() => {
  const notice = document.getElementById('enquiryClearedNotice');
  const close = document.getElementById('enquiryClearedNoticeClose');
  if (!notice) return;
  const show = () => { notice.hidden=false; clearTimeout(show.timer); show.timer=setTimeout(()=>notice.hidden=true,9000); };
  close?.addEventListener('click',()=>notice.hidden=true);
  const dialog = document.getElementById('whatsappQrDialog');
  dialog?.addEventListener('close', show);
  // Fallback for browsers where the dialog close event is not emitted by the custom close helper.
  const original = window.closeWhatsAppQr;
  if (typeof original === 'function') window.closeWhatsAppQr = function(){ const wasOpen=dialog?.open || dialog?.hasAttribute('open'); original(); if(wasOpen) show(); };
})();
