const S = {
  products: [],
  cart: loadCart(),
  activeProductId: null,
  modalQty: 1
};

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('nivetha_cart') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('nivetha_cart', JSON.stringify(S.cart));
  updateCartCount();
}

const $ = id => document.getElementById(id);

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
        const stock =
          Number(p.stock || 0) > 0;

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
                ${esc(p.product_code)}
              </p>

              <strong class="product-price">
                ${money(p.retail_price)}
              </strong>

              <p
                class="stock-line ${stock ? '' : 'out'}"
              >
                ${
                  stock
                    ? `In stock · ${esc(p.stock)}`
                    : 'Out of stock'
                }
              </p>

              <button
                class="view-details"
                data-id="${p.id}"
                type="button"
              >
                VIEW DETAILS
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
  S.modalQty = 0;

  if ($('modalCartMessage')) $('modalCartMessage').textContent = '';
  updateModalQuantity();

  $('modalProductCode').textContent =
    p.product_code || '';

  // Product name is intentionally not displayed in this storefront.
  if ($('modalProductName')) {
    $('modalProductName').textContent = '';
  }

  $('modalCategory').textContent =
    p.category || '';

  $('modalPrice').textContent =
    money(p.retail_price);

  const stock =
    Number(p.stock || 0) > 0;

  $('modalStock').textContent = stock
    ? `In stock · ${p.stock} available`
    : 'Currently out of stock';

  $('modalStock')
    .classList
    .toggle(
      'out',
      !stock
    );

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
  const merged = new Map();

  S.cart.forEach(item => {
    const p = productById(item.id);
    if (!p) return;

    const stock = Math.max(0, Number(p.stock || 0));
    if (stock <= 0) return;

    const id = +p.id;
    const qty = Math.max(1, Number(item.qty || 1));
    const current = merged.get(id) || 0;

    merged.set(id, Math.min(stock, current + qty));
  });

  S.cart = [...merged.entries()].map(([id, qty]) => ({ id, qty }));
  saveCart();
}

function cartQuantity() {
  return S.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function updateCartCount() {
  const el = $('cartCount');
  if (el) el.textContent = cartQuantity();
}

function updateModalQuantity() {
  const el = $('modalQty');
  if (el) el.textContent = S.modalQty;

  const p = productById(S.activeProductId);
  const stock = p ? Math.max(0, Number(p.stock || 0)) : 0;
  const minus = $('modalQtyMinus');
  const plus = $('modalQtyPlus');
  const add = $('modalAddToCart');

  if (minus) minus.disabled = S.modalQty <= 0;
  if (plus) plus.disabled = S.modalQty >= stock;

  if (add) {
    add.disabled = stock <= 0 || S.modalQty <= 0;

    if (stock <= 0) {
      add.textContent = 'OUT OF STOCK';
    } else if (S.modalQty <= 0) {
      add.textContent = 'SELECT QUANTITY';
    } else {
      add.textContent = 'ADD TO CART';
    }
  }
}

function changeModalQuantity(delta) {
  const p = productById(S.activeProductId);
  if (!p) return;

  const stock = Math.max(0, Number(p.stock || 0));
  S.modalQty = Math.min(stock, Math.max(0, S.modalQty + delta));
  updateModalQuantity();
}

function addActiveProductToCart() {
  const p = productById(S.activeProductId);
  if (!p) return;

  const stock = Math.max(0, Number(p.stock || 0));
  const selectedQty = Math.max(0, Number(S.modalQty || 0));

  if (!stock || selectedQty <= 0) {
    updateModalQuantity();
    return;
  }

  const existing = S.cart.find(item => +item.id === +p.id);
  const currentQty = existing ? Math.max(0, Number(existing.qty || 0)) : 0;
  const availableToAdd = Math.max(0, stock - currentQty);
  const qtyToAdd = Math.min(selectedQty, availableToAdd);
  const message = $('modalCartMessage');

  if (qtyToAdd <= 0) {
    if (message) {
      message.textContent = `Maximum available stock (${stock}) is already in your cart.`;
    }
    S.modalQty = 0;
    updateModalQuantity();
    return;
  }

  if (existing) {
    existing.qty = currentQty + qtyToAdd;
  } else {
    S.cart.push({ id: +p.id, qty: qtyToAdd });
  }

  saveCart();
  renderCart();

  if (message) {
    message.textContent =
      qtyToAdd < selectedQty
        ? `Added ${qtyToAdd}. Cart now has the maximum available stock (${stock}).`
        : `Added ${qtyToAdd} to cart.`;
  }

  // Reset to zero after adding so repeated clicks cannot add again accidentally.
  S.modalQty = 0;
  updateModalQuantity();
}

function changeCartQuantity(id, delta) {
  const item = S.cart.find(x => +x.id === +id);
  const p = productById(id);
  if (!item || !p) return;

  const stock = Math.max(0, Number(p.stock || 0));
  const next = Number(item.qty || 0) + delta;

  if (next <= 0) {
    removeFromCart(id);
    return;
  }

  item.qty = Math.min(next, stock);
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  S.cart = S.cart.filter(item => +item.id !== +id);
  saveCart();
  renderCart();
}

function renderCart() {
  updateCartCount();

  const itemsEl = $('cartItems');
  const subtotalEl = $('cartSubtotal');
  const checkout = $('checkoutButton');
  if (!itemsEl || !subtotalEl) return;

  let subtotal = 0;

  const rows = S.cart.map(item => {
    const p = productById(item.id);
    if (!p) return '';

    const qty = Math.max(1, Number(item.qty || 1));
    const stock = Math.max(0, Number(p.stock || 0));
    const price = Number(p.retail_price || 0);
    subtotal += price * qty;

    return `
      <article class="cart-item">
        <div class="cart-item-image">
          ${p.image_1 ? `<img src="${esc(p.image_1)}" alt="Dhoti ${esc(p.product_code || '')}">` : ''}
        </div>
        <div class="cart-item-info">
          <p class="cart-item-code">${esc(p.product_code || '')}</p>
          <strong>${money(price)}</strong>
          <small>${stock} available</small>
          <div class="cart-item-actions">
            <div class="qty-control small">
              <button type="button" data-cart-minus="${p.id}" aria-label="Decrease quantity">−</button>
              <span>${qty}</span>
              <button type="button" data-cart-plus="${p.id}" aria-label="Increase quantity" ${qty >= stock ? 'disabled' : ''}>+</button>
            </div>
            <button class="cart-remove" type="button" data-cart-remove="${p.id}">REMOVE</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  itemsEl.innerHTML = rows ||
    '<div class="cart-empty"><span>🛒</span><p>Your cart is empty.</p><small>Add a dhoti from the collection to begin.</small></div>';

  subtotalEl.textContent = money(subtotal);
  if (checkout) checkout.disabled = S.cart.length === 0;

  itemsEl.querySelectorAll('[data-cart-minus]').forEach(b => {
    b.onclick = () => changeCartQuantity(+b.dataset.cartMinus, -1);
  });

  itemsEl.querySelectorAll('[data-cart-plus]').forEach(b => {
    b.onclick = () => changeCartQuantity(+b.dataset.cartPlus, 1);
  });

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

    $('modalQtyMinus')?.addEventListener('click', () => changeModalQuantity(-1));
    $('modalQtyPlus')?.addEventListener('click', () => changeModalQuantity(1));
    $('modalAddToCart')?.addEventListener('click', addActiveProductToCart);

    $('cartButton')?.addEventListener('click', openCart);

    document.querySelectorAll('[data-close-cart]').forEach(x => {
      x.addEventListener('click', closeCart);
    });

    $('checkoutButton')?.addEventListener('click', () => {
      if ($('checkoutMessage')) {
        $('checkoutMessage').textContent = 'Checkout will be added in the next build.';
      }
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
          }
        }
      );

    load();
  }
);
