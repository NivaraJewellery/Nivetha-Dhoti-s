const S={products:[]};const $=id=>document.getElementById(id);const money=v=>`₹${Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function load(){try{const r=await fetch('/api/products',{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to load products');S.products=d.products||[];collections();filters();products()}catch(e){const m=`<p class="store-empty">We couldn't load the catalogue.<br>${esc(e.message)}</p>`;$('productGrid').innerHTML=m;$('collectionGrid').innerHTML=m}}
const cats=()=>[...new Set(S.products.map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
function collections(){const t=$('collectionGrid'),cs=cats();if(!cs.length){t.innerHTML='<p class="store-empty">Collections will appear after products are added in Admin.</p>';return}t.innerHTML=cs.slice(0,5).map(c=>{const p=S.products.find(x=>x.category===c&&x.image_1),n=S.products.filter(x=>x.category===c).length;return `<a class="collection-card dynamic" href="#products" data-category="${esc(c)}">${p?`<img src="${esc(p.image_1)}" alt="${esc(c)}">`:''}<div><h3>${esc(c).toUpperCase()}</h3><span>SHOP NOW ›</span><small class="collection-count">${n} product${n===1?'':'s'}</small></div></a>`}).join('');t.querySelectorAll('[data-category]').forEach(a=>a.onclick=()=>{$('storeCategory').value=a.dataset.category;products()})}
function filters(){const s=$('storeCategory'),cur=s.value;s.innerHTML='<option value="">All Collections</option>'+cats().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');if(cats().includes(cur))s.value=cur}
function filtered(){const q=($('storeSearch').value||'').trim().toLowerCase(),c=$('storeCategory').value;return S.products.filter(p=>(!q||String(p.product_name).toLowerCase().includes(q)||String(p.product_code).toLowerCase().includes(q))&&(!c||p.category===c))}
function products(){
  const a=filtered();

  $('storeCount').textContent=`Showing ${a.length} of ${S.products.length}`;

  $('productGrid').innerHTML=a.length
    ? a.map(p=>{
        const stock=Number(p.stock||0)>0;

        return `
          <article class="product-card dynamic">

            <div class="pic product-image-click" data-product-id="${p.id}">
              ${
                p.image_1
                  ? `<img
                      class="product-img primary-img"
                      src="${esc(p.image_1)}"
                      alt="${esc(p.product_name)}"
                    >`
                  : ''
              }

              ${
                p.image_2
                  ? `<img
                      class="product-img secondary-img"
                      src="${esc(p.image_2)}"
                      alt="${esc(p.product_name)}"
                    >`
                  : ''
              }

              <button class="heart" type="button">♡</button>
            </div>

            <p class="product-code">${esc(p.product_code)}</p>

            <h3>${esc(p.product_name)}</h3>

            <strong>${money(p.retail_price)}</strong>

            <p class="stock-line ${stock?'':'out'}">
              ${stock ? `In stock · ${esc(p.stock)}` : 'Out of stock'}
            </p>

            <button class="view-details" data-id="${p.id}">
              VIEW DETAILS
            </button>

          </article>
        `;
      }).join('')
    : '<p class="store-empty">No products match your selection.</p>';

  /* View Details button */
  $('productGrid')
    .querySelectorAll('.view-details')
    .forEach(b=>{
      b.onclick=()=>openModal(+b.dataset.id);
    });

  /* Product image click */
  $('productGrid')
    .querySelectorAll('.product-image-click')
    .forEach(img=>{
      img.onclick=(e)=>{
        if(e.target.closest('.heart')) return;
        openModal(+img.dataset.productId);
      };
    });
}