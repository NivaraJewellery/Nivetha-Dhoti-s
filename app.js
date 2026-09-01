const products=[
 {code:'ND001',name:'Classic White Cotton Dhoti',category:'Classic Cotton',retail:799,wholesale:540,moq:10},
 {code:'ND002',name:'Traditional Gold Border Dhoti',category:'Zari Border',retail:1099,wholesale:760,moq:10},
 {code:'ND003',name:'Premium Celebration Dhoti',category:'Premium Collection',retail:1499,wholesale:1040,moq:8}
];
const grid=document.querySelector('#productGrid');
grid.innerHTML=products.map(p=>`<article class="product"><div class="product-img">Product photo</div><p class="code">${p.code} · ${p.category}</p><h3>${p.name}</h3><p class="price">₹${p.retail.toLocaleString('en-IN')}</p><p>Wholesale pricing available after approval.</p></article>`).join('');
