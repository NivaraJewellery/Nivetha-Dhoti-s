let adminPassword='',products=[];
const $=id=>document.getElementById(id);
const money=v=>`₹${Number(v||0).toLocaleString('en-IN')}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function api(path,o={}){
  const r=await fetch(path,{...o,headers:{'Content-Type':'application/json','x-admin-password':adminPassword,...(o.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||'Request failed');
  return d;
}

$('loginForm').onsubmit=async e=>{
  e.preventDefault(); adminPassword=$('adminPassword').value; $('loginMessage').textContent='';
  try{
    const d=await api('/api/admin-products'); products=d.products||[];
    $('loginPanel').hidden=true; $('adminApp').hidden=false; refresh();
  }catch(x){$('loginMessage').textContent=x.message}
};

function refreshCats(){
  const cur=$('filterCategory').value,c=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
  $('filterCategory').innerHTML='<option value="">All Categories</option>'+c.map(x=>`<option>${esc(x)}</option>`).join('');
  $('filterCategory').value=cur;
}
function filt(){
  let n=$('filterName').value.toLowerCase(),c=$('filterCode').value.toLowerCase(),k=$('filterCategory').value;
  return products.filter(p=>(!n||p.product_name.toLowerCase().includes(n))&&(!c||p.product_code.toLowerCase().includes(c))&&(!k||p.category===k));
}
function refresh(){
  refreshCats(); let a=filt();
  $('resultCount').textContent=`Showing ${a.length} of ${products.length} products`;
  $('productList').innerHTML=a.length?a.map(p=>`<article class="product-row"><img src="${esc(p.image_1||'')}" onerror="this.style.visibility='hidden'"><div><strong>${esc(p.product_name)}</strong><small>${esc(p.product_code)} · ${esc(p.category)}</small></div><div class="price-box"><span>Retail</span><strong>${money(p.retail_price)}</strong></div><div class="price-box"><span>Wholesale</span><strong>${money(p.wholesale_price)}</strong></div><div class="price-box"><span>MOQ</span><strong>${p.wholesale_moq}</strong></div><div><span class="status ${p.active?'':'off'}">${p.active?'ACTIVE':'HIDDEN'}</span><small>Stock: ${p.stock}</small></div><div class="row-actions"><button onclick="editProduct(${p.id})">Edit</button><button class="danger" onclick="deleteProduct(${p.id})">Delete</button></div></article>`).join(''):'<p>No products match the filters.</p>';
}
['filterName','filterCode'].forEach(i=>$(i).oninput=refresh);
$('filterCategory').onchange=refresh;
$('clearFilters').onclick=()=>{$('filterName').value='';$('filterCode').value='';$('filterCategory').value='';refresh()};

function showImage(slot,url){
  const preview=$(`preview${slot}`),empty=$(`empty${slot}`);
  if(url){preview.src=url;preview.style.display='block';empty.style.display='none'}
  else{preview.removeAttribute('src');preview.style.display='none';empty.style.display='grid'}
}
function setImage(slot,url){$(`image${slot}`).value=url||'';showImage(slot,url)}

async function uploadImage(slot,file){
  const status=$(`uploadStatus${slot}`);
  if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){
    status.textContent='Please select JPG, PNG or WEBP.'; return;
  }
  if(file.size>4*1024*1024){
    status.textContent='Image is too large. Maximum 4 MB.'; return;
  }
  status.textContent='Uploading...';
  $(`file${slot}`).disabled=true;
  try{
    const productCode=($('productCode').value||'product').trim();
    const r=await fetch('/api/admin-upload',{
      method:'POST',
      headers:{
        'Content-Type':file.type,
        'x-admin-password':adminPassword,
        'x-file-name':file.name,
        'x-product-code':productCode
      },
      body:file
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d.error||'Upload failed');
    setImage(slot,d.url);
    status.textContent='Uploaded successfully.';
  }catch(e){
    status.textContent=e.message;
  }finally{
    $(`file${slot}`).disabled=false;
    $(`file${slot}`).value='';
  }
}
[1,2,3].forEach(slot=>{
  $(`file${slot}`).onchange=e=>uploadImage(slot,e.target.files?.[0]);
  $(`remove${slot}`).onclick=()=>{setImage(slot,'');$(`uploadStatus${slot}`).textContent='Image removed from this product.'};
});

function reset(){
  $('productForm').reset();$('productId').value='';$('stock').value=0;$('wholesaleMoq').value=1;$('active').checked=true;
  $('formTitle').textContent='Add product';$('formMessage').textContent='';
  [1,2,3].forEach(i=>{setImage(i,'');$(`uploadStatus${i}`).textContent=''});
}
function open(){$('productFormPanel').classList.add('open');$('productFormPanel').scrollIntoView({behavior:'smooth'})}
$('newProduct').onclick=()=>{reset();open()};
$('cancelEdit').onclick=()=>{$('productFormPanel').classList.remove('open');reset()};

window.editProduct=id=>{
  let p=products.find(x=>x.id===id);if(!p)return;
  $('productId').value=p.id;$('productCode').value=p.product_code;$('productName').value=p.product_name;
  $('category').value=p.category;$('retailPrice').value=p.retail_price;$('wholesalePrice').value=p.wholesale_price;
  $('wholesaleMoq').value=p.wholesale_moq;$('stock').value=p.stock;$('description').value=p.description||'';
  $('active').checked=!!p.active;$('formTitle').textContent='Edit product';
  setImage(1,p.image_1||'');setImage(2,p.image_2||'');setImage(3,p.image_3||'');open();
};

window.deleteProduct=async id=>{
  let p=products.find(x=>x.id===id);
  if(!confirm(`Delete ${p?.product_name||'this product'}?`))return;
  try{await api('/api/admin-products',{method:'DELETE',body:JSON.stringify({id})});products=products.filter(x=>x.id!==id);refresh()}
  catch(e){alert(e.message)}
};

$('productForm').onsubmit=async e=>{
  e.preventDefault();$('formMessage').textContent='Saving...';
  let b={id:$('productId').value?Number($('productId').value):undefined,productCode:$('productCode').value,productName:$('productName').value,category:$('category').value,retailPrice:Number($('retailPrice').value),wholesalePrice:Number($('wholesalePrice').value),wholesaleMoq:Number($('wholesaleMoq').value),stock:Number($('stock').value),image1:$('image1').value,image2:$('image2').value,image3:$('image3').value,description:$('description').value,active:$('active').checked};
  try{
    await api('/api/admin-products',{method:b.id?'PATCH':'POST',body:JSON.stringify(b)});
    products=(await api('/api/admin-products')).products||[];refresh();$('formMessage').textContent='Saved successfully.';
    setTimeout(()=>{$('productFormPanel').classList.remove('open');reset()},600)
  }catch(x){$('formMessage').textContent=x.message}
};
