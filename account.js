const CUSTOMER_STORAGE_KEY='nivetha-customer';
const RETURN_TO_CHECKOUT_KEY='nivetha-return-to-checkout';
const RETURN_TO_WHATSAPP_KEY='nivetha-return-to-whatsapp';
const $=id=>document.getElementById(id);

function getCustomer(){try{return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY)||'null')}catch{return null}}
function saveCustomer(customer){localStorage.setItem(CUSTOMER_STORAGE_KEY,JSON.stringify(customer))}
function returnToStore(){
  const params=new URLSearchParams(window.location.search);
  const wantsHistory=params.get('return')==='history';
  const wantsWhatsApp=params.get('return')==='whatsapp'||localStorage.getItem(RETURN_TO_WHATSAPP_KEY)==='1';
  const wantsCheckout=params.get('return')==='checkout'||localStorage.getItem(RETURN_TO_CHECKOUT_KEY)==='1';
  if(wantsHistory){ window.location.href='enquiry-history.html'; return; }
  if(wantsWhatsApp){
    localStorage.removeItem(RETURN_TO_WHATSAPP_KEY);
    window.location.href='index.html?whatsapp=1';
    return;
  }
  window.location.href=wantsCheckout?'index.html?checkout=1':'index.html';
}
function render(){
  const customer=getCustomer();
  $('loginForm').hidden=Boolean(customer);
  $('loggedInPanel').hidden=!customer;
  if(customer){
    $('accountTitle').textContent='Your account';
    $('accountIntro').textContent='You are logged in. You can continue to your selected dhoti list or return to the catalogue.';
    $('welcomeText').textContent=`Welcome${customer.name?' '+customer.name:''}${customer.mobile?' · '+customer.mobile:''}`;
  }
}
$('loginMobile').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,10)});
$('loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('loginName').value.trim();
  const mobile=$('loginMobile').value.replace(/\D/g,'');
  const email=$('loginEmail').value.trim();
  $('loginError').textContent='';
  if(!/^[6-9]\d{9}$/.test(mobile)){ $('loginError').textContent='Enter a valid 10-digit Indian mobile number.'; return; }
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ $('loginError').textContent='Enter a valid email address.'; return; }
  saveCustomer({name,mobile,email,loggedInAt:Date.now()});
  returnToStore();
});
$('continueShopping').addEventListener('click',returnToStore);
$('logoutButton').addEventListener('click',()=>{localStorage.removeItem(CUSTOMER_STORAGE_KEY);localStorage.removeItem(RETURN_TO_CHECKOUT_KEY);localStorage.removeItem(RETURN_TO_WHATSAPP_KEY);render()});
render();
