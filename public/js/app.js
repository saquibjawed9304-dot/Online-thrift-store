const API = '/api';
let allProducts=[], cart=[], wishlist=[], currentUser=null, lastPage='home', selectedAddress=null;
let activeFilters={priceRange:null,condition:null};
const pageCache = {};
const FB_IMG='https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format';

function loadProducts(){
  showLoader(true);
  var x=new XMLHttpRequest();
  x.open('GET',API+'/products?limit=100',true);
  x.timeout=5000;
  x.onreadystatechange=function(){
    if(x.readyState!==4)return;
    if (x.status === 200) {
      try {
        var d = JSON.parse(x.responseText);
        allProducts = (d.products || d).map(function(p){
          return {
            id: p._id || p.id,
            name: p.name,
            price: p.price,
            orig: p.originalPrice || p.orig,
            gender: p.gender,
            img: (p.images && p.images[0]) || '',
            cat: p.category,
            brand: p.brand,
            cond: p.condition,
            sizes: p.sizes || ['S','M','L','XL'],
            style: p.style,
            desc: p.description
          };
        });
      } catch (e) {
        console.error("❌ Failed to parse products JSON:", e);
      }
    } else {
      console.error("❌ Failed to load products from backend, status:", x.status);
    }
    showLoader(false); startApp();
  };
  x.ontimeout = x.onerror = function(){
    console.error("❌ API not reachable");
    showLoader(false);
    startApp();
  };
  x.send();
}



function startApp(){
  try{
    var sc=localStorage.getItem('th_cart');
    var sw=localStorage.getItem('th_wishlist');
    var su=localStorage.getItem('th_user');
    if(sc)cart=JSON.parse(sc);
    if(sw)wishlist=JSON.parse(sw);
    if(su){currentUser=JSON.parse(su);updateHeaderBtn();}
  }catch(e){}
  updateCartBadge(); updateWishlistCount();
  if(!currentUser) { goTo('login'); } 
  else { goTo('home'); }
}

function apiCall(method,endpoint,body,cb){
  var x=new XMLHttpRequest();
  x.open(method,API+endpoint,true);
  x.setRequestHeader('Content-Type','application/json');
  var tok=localStorage.getItem('th_token');
  if(tok)x.setRequestHeader('Authorization','Bearer '+tok);
  x.onreadystatechange=function(){
    if(x.readyState!==4)return;
    try{var d=JSON.parse(x.responseText);cb(x.status>=400?d:null,d);}
    catch(e){cb({message:'Server error'},null);}
  };
  x.onerror=function(){cb({message:'Cannot reach server'},null);};
  x.send(body?JSON.stringify(body):null);
}

// ── Auth guard ──
var PROTECTED=['men', 'women', 'tshirts', 'hoodies', 'jackets', 'bottoms', 'wtshirts', 'whoodies',
  'wjackets', 'wdresses', 'wbottoms', 'brands', 'style', 'outlet', 'stores', 'search',
  'wishlist', 'cart', 'address', 'payment', 'account', 'nike', 'adidas', 'carhartt',
  'levis', 'puma', 'tommy', 'champion', 'y2k', 'festival', 'premium', 'product-detail', 'add-product'];

function requireLogin(page){
  if(!currentUser&&PROTECTED.indexOf(page)!==-1){showGuard();return;}
  goTo(page);
}
function showGuard(){document.getElementById('auth-guard').classList.add('show');}
function hideGuard(){document.getElementById('auth-guard').classList.remove('show');}

// ── Routing ──
async function loadPageFragment(page) {
  // Mapping for category sub-pages that use the unified listing template
  const subCategories = ['tshirts', 'hoodies', 'jackets', 'bottoms', 'wtshirts', 'whoodies', 'wjackets', 'wdresses', 'wbottoms', 'nike', 'adidas', 'carhartt', 'levis', 'puma', 'tommy', 'champion', 'y2k', 'festival', 'premium', 'outlet'];
  const fileName = subCategories.includes(page) ? 'listing' : page;

  if (pageCache[fileName]) return pageCache[fileName];
  
  try {
    const res = await fetch(`pages/${fileName}.html`);
    if (!res.ok) throw new Error('Page not found');
    const html = await res.text();
    pageCache[fileName] = html;
    return html;
  } catch (e) {
    console.error('Error loading page:', e);
    return '<div class="page active"><p style="text-align:center;padding:50px">Error loading page. <a onclick="goTo(\'home\')">Return Home</a></p></div>';
  }
}

async function goTo(page) {
  if (!currentUser && page !== 'login' && page !== 'signup') {
    page = 'login';
  }
  lastPage = page;

  const contentArea = document.getElementById('app-content');
  if (!contentArea) return;

  // Show small loader indicator if wanted, or just fetch
  const html = await loadPageFragment(page);
  contentArea.style.opacity = '0';
  
  setTimeout(() => {
    contentArea.innerHTML = html;
    
    // Find the injected page container and ensure it's active
    const newPage = contentArea.querySelector('.page');
    if (newPage) newPage.classList.add('active');

    var hdr = document.querySelector('header');
    if (hdr) hdr.style.display = (page === 'login' || page === 'signup') ? 'none' : 'flex';

    window.scrollTo(0, 0);
    contentArea.style.opacity = '1';

    // Custom logic for unified listing template
    if (PM[page] && page !== 'men' && page !== 'women' && page !== 'brands' && page !== 'style') {
      setupListingPage(page);
    }

    populatePage(page);
    
    if (page === 'search') setTimeout(function () { 
      const si = document.getElementById('search-input');
      if(si) si.focus(); 
    }, 60);
    
    if (page === 'wishlist') renderWishlist();
    if (page === 'cart') renderCart();
    if (page === 'account') showAccountInfo();
    if (page === 'address') loadSavedAddresses();
    if (page === 'add-product') setupAddProductForm();
    if (page === 'payment') initPaymentPage();
    updateWishlistBtns();
    showLoader(false);
  }, 100); 
}

function initPaymentPage(){
  if(!cart.length) return;
  
  // Auto-select address if not set
  if(!selectedAddress && savedAddresses.length > 0){
    selectedAddress = savedAddresses[0];
  } else if(!selectedAddress && currentUser && currentUser.address && currentUser.address.street){
    selectedAddress = {
      name: currentUser.name,
      phone: currentUser.phone || '',
      street: currentUser.address.street,
      city: currentUser.address.city,
      state: currentUser.address.state,
      pin: currentUser.address.pincode
    };
  }

  var itemsTotal=cart.reduce(function(s, i){return s+i.price;}, 0);
  var shipping=itemsTotal > 999 ? 0 : 49;
  var total = itemsTotal + shipping;

  var list=document.getElementById('payment-items-list');
  if(list){
    var html = cart.map(function(item){
      return '<div style="display:flex;justify-content:space-between"><span>'+item.name+'</span><strong>\u20B9'+item.price.toLocaleString('en-IN')+'</strong></div>';
    }).join('');
    if(shipping > 0) {
      html += '<div style="display:flex;justify-content:space-between;border-top:1px dashed #eee;margin-top:4px;padding-top:4px;font-size:12px;color:#888"><span>Shipping Fee</span><strong>\u20B9'+shipping+'</strong></div>';
    }
    list.innerHTML = html;
  }
  
  ['payment-total', 'card-amt', 'qr-amount', 'nb-amt'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.textContent='\u20B9'+total.toLocaleString('en-IN');
  });
  
  document.querySelectorAll('.final-total-text').forEach(function(el){
    el.textContent='\u20B9'+total.toLocaleString('en-IN');
  });

  var codEl = document.getElementById('cod-total-text');
  if(codEl) codEl.textContent = '\u20B9'+(total + 40).toLocaleString('en-IN');

  if(selectedAddress){
    var da=document.getElementById('delivery-address-text');
    if(da)da.textContent=selectedAddress.name+', '+selectedAddress.street+', '+selectedAddress.city+' - '+selectedAddress.pin;
  }
}

function setupListingPage(page) {
  const cfg = PM[page];
  const titleEl = document.getElementById('listing-title');
  const filtersEl = document.getElementById('listing-filters');
  const containerEl = document.getElementById('listing-container');
  const backSection = document.getElementById('listing-back-link');
  const backUrl = document.getElementById('listing-back-url');

  if (titleEl) titleEl.textContent = page.charAt(0).toUpperCase() + page.slice(1);
  if (containerEl) containerEl.id = cfg.c;
  
  // Setup back button
  if (backSection && backUrl) {
    backSection.style.display = 'block';
    const backTarget = cfg.g || 'men'; // simple logic
    backUrl.onclick = () => goTo(backTarget);
    backUrl.textContent = `← Back to ${backTarget.charAt(0).toUpperCase() + backTarget.slice(1)}`;
  }

  // Inject filters if it's a category that typically has them
  if (filtersEl) {
    filtersEl.innerHTML = `
      <button class="filter-btn" data-ft="pr" data-fv="b" onclick="setFilter('priceRange',[0,699])">Under ₹699</button>
      <button class="filter-btn" data-ft="pr" data-fv="m" onclick="setFilter('priceRange',[700,1499])">₹700–₹1499</button>
      <button class="filter-btn" data-ft="pr" data-fv="p" onclick="setFilter('priceRange',[1500,9999])">Above ₹1500</button>
      <button class="filter-btn" style="background:#f5f5f5;color:#555" onclick="clearFilters()">✕ Clear</button>
    `;
  }
}

function setupAddProductForm() {
  const ids = ['prod-name', 'prod-price', 'prod-orig', 'prod-desc', 'prod-brand', 'prod-img'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  const preview = document.getElementById('prod-img-preview');
  if(preview) preview.innerHTML = '<span style="color:#aaa;font-size:12px">Preview</span>';
}

// ── Login ──
function doLogin(){
  var email=document.getElementById('login-email').value.trim();
  var pass=document.getElementById('login-password').value;
  var eOk=vGmail('login-email', 'le-err');
  var pOk=vPass('login-password', 'lp-err');
  if(!email){forceErr('login-email', 'le-err', 'Email is required');return;}
  if(!pass){forceErr('login-password', 'lp-err', 'Password is required');return;}
  if(!eOk||!pOk)return;
  var btn=document.getElementById('login-btn');
  btn.textContent='Logging in...';btn.disabled=true;
  apiCall('POST', '/auth/login', {email:email, password:pass}, function(err, data){
    btn.textContent='Login to ThriftHub';btn.disabled=false;
    if(err){notify('Error: '+(err.message||'Login failed'));return;}
    localStorage.setItem('th_token', data.token);
    localStorage.setItem('th_user', JSON.stringify(data.user));
    currentUser=data.user;
    clearAuthFields();
    updateHeaderBtn();
    notify('Welcome back, '+data.user.name+'!');
    goTo('men');
  });
}

// ── Signup — redirects to LOGIN after success ──
function doSignup(){
  var name=document.getElementById('reg-name').value.trim();
  var email=document.getElementById('reg-email').value.trim();
  var pass=document.getElementById('reg-password').value;
  var nOk=vName('reg-name', 'rn-err');
  var eOk=vGmail('reg-email', 're-err');
  var pOk=vPass('reg-password', 'rp-err');
  if(!name){forceErr('reg-name', 'rn-err', 'Name is required');return;}
  if(!email){forceErr('reg-email', 're-err', 'Email is required');return;}
  if(!pass){forceErr('reg-password', 'rp-err', 'Password is required');return;}
  if(!nOk||!eOk||!pOk)return;
  var btn=document.getElementById('signup-btn');
  btn.textContent='Creating account...';btn.disabled=true;
  apiCall('POST', '/auth/register', {name:name, email:email, password:pass}, function(err, data){
    btn.textContent='Create Account';btn.disabled=false;
    if(err){notify('Error: '+(err.message||'Signup failed'));return;}
    clearAuthFields();
    notify('Account created! Please login to continue.');
    // Always go to login page after signup without logging them in!
    goTo('login');
  });
}

function doLogout(){
  localStorage.removeItem('th_token');localStorage.removeItem('th_user');
  currentUser=null; cart=[];wishlist=[];
  saveCart();saveWishlist();
  updateCartBadge();updateWishlistCount();
  updateHeaderBtn();
  notify('Logged out. See you soon!');
  goTo('home');
}

function handleAccountClick(){if(currentUser)goTo('account');else goTo('login');}

function updateHeaderBtn(){
  var b=document.getElementById('account-btn');
  if(b)b.innerHTML='<b>'+String.fromCodePoint(0x1F464)+'</b> '+(currentUser?currentUser.name.split(' ')[0]:'Account');
}

function showAccountInfo(){
  if(!currentUser){goTo('login');return;}
  var n=document.getElementById('acc-name-display');
  var e=document.getElementById('acc-email-display');
  if(n)n.textContent=currentUser.name;
  if(e)e.textContent=currentUser.email;

  // Populate update form
  var un=document.getElementById('upd-name'); if(un) un.value=currentUser.name;
  var up=document.getElementById('upd-phone'); if(up) up.value=currentUser.phone||'';

  // Listing visibility (everyone can list now)
  var adm=document.getElementById('admin-actions');
  if(adm) adm.style.display='block'; 

  // Fetch orders
  apiCall('GET', '/orders/my', null, function(err, orders){
    if(!err && orders) renderOrders(orders);
  });
}

function renderOrders(orders) {
  var container = document.getElementById('acc-orders');
  if(!container) return;
  
  if(!orders || !orders.length){
    container.innerHTML = 'You haven\'t placed any orders yet.';
    return;
  }

  container.innerHTML = orders.map(function(o){
    if(!o || !o._id || !o.items) return '';
    var date = new Date(o.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
    var totalAmount = o.totalAmount != null ? o.totalAmount : 0;
    var itemsList = o.items.map(function(item){
      return item.name + ' (x' + (item.quantity || 1) + ')';
    }).join(', ');
    
    return '<div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:12px;text-align:left;box-shadow:0 2px 8px rgba(0,0,0,0.03)">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'+
        '<span style="font-weight:700;font-size:13px;color:#c8a96e">#' + o._id.slice(-6).toUpperCase() + '</span>'+
        '<span style="font-size:12px;color:#888">' + date + '</span>'+
      '</div>'+
      '<div style="font-size:13px;color:#333;margin-bottom:8px;font-weight:500;line-height:1.4">' + itemsList + '</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f9f9f9;padding-top:8px">'+
        '<span style="font-size:14px;font-weight:700">\u20B9' + totalAmount.toLocaleString('en-IN') + '</span>'+
        '<span style="font-size:11px;padding:3px 8px;border-radius:12px;background:#f9f6f2;color:#c8a96e;font-weight:700;text-transform:uppercase">' + (o.status || 'Processing') + '</span>'+
      '</div>'+
    '</div>';
  }).join('');
}

function doUpdateAccount(){
  var name=document.getElementById('upd-name').value.trim();
  var phone=document.getElementById('upd-phone').value.trim();
  var pass=document.getElementById('upd-password').value;
  if(!name){notify('Name is required');return;}
  
  var body={name:name, phone:phone};
  if(pass) body.password=pass;

  notify('Updating account...');
  apiCall('PUT', '/auth/profile', body, function(err, data){
    if(err){notify('Update failed: '+(err.message||'Server error')); return;}
    currentUser = Object.assign({}, currentUser, data); // Merge updates
    localStorage.setItem('th_user', JSON.stringify(currentUser));
    updateHeaderBtn();
    showAccountInfo();
    notify('Profile updated successfully!');
    document.getElementById('upd-password').value='';
  });
}

function doAddProduct(){
  var name=document.getElementById('prod-name').value.trim();
  var price=Number(document.getElementById('prod-price').value);
  var orig=Number(document.getElementById('prod-orig').value);
  var desc=document.getElementById('prod-desc').value.trim();
  var gender=document.getElementById('prod-gender').value;
  var cat=document.getElementById('prod-cat').value;
  var brand=document.getElementById('prod-brand').value.trim();
  var cond=document.getElementById('prod-cond').value;
  var img=document.getElementById('prod-img').value.trim();

  if(!name||!price||!orig||!desc||!img){notify('Please fill all required fields');return;}

  var body = {
    name: name,
    price: price,
    originalPrice: orig,
    description: desc,
    gender: gender,
    category: cat,
    brand: brand,
    condition: cond,
    images: [img],
    sizes: ['S','M','L','XL'] // Default details
  };

  notify('Uploading product...');
  apiCall('POST', '/products', body, function(err, data){
    if(err){notify('Failed to add product: '+(err.message||'Server error')); return;}
    notify('✅ Product added successfully!');
    loadProducts();
    goTo('account');
  });
}

function clearAuthFields(){
  ['login-email', 'login-password', 'reg-name', 'reg-email', 'reg-password'].forEach(function(id){
    var el=document.getElementById(id);if(el){el.value='';el.className='';}
  });
  ['le-err', 'lp-err', 'rn-err', 're-err', 'rp-err'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.textContent='';
  });
}

// ── Populate pages ──
var PM={
  'men':      {c:'men-products-container',   g:'men'},
  'women':    {c:'women-products-container', g:'women'},
  'tshirts':  {c:'listing-container',  g:'men',  k:'tshirts'},
  'hoodies':  {c:'listing-container',  g:'men',  k:'hoodies'},
  'jackets':  {c:'listing-container',  g:'men',  k:'jackets'},
  'bottoms':  {c:'listing-container',  g:'men',  k:'bottoms'},
  'wtshirts': {c:'listing-container', g:'women', k:'tshirts'},
  'whoodies': {c:'listing-container', g:'women', k:'hoodies'},
  'wjackets': {c:'listing-container', g:'women', k:'jackets'},
  'wdresses': {c:'listing-container', g:'women', k:'dresses'},
  'wbottoms': {c:'listing-container', g:'women', k:'bottoms'},
  'nike':     {c:'listing-container',     b:'Nike'},
  'adidas':   {c:'listing-container',   b:'Adidas'},
  'carhartt': {c:'listing-container', b:'Carhartt'},
  'levis':    {c:'listing-container',    b:'Levis'},
  'puma':     {c:'listing-container',     b:'Puma'},
  'tommy':    {c:'listing-container',    b:'Tommy'},
  'champion': {c:'listing-container', b:'Champion'},
  'y2k':      {c:'listing-container',      s:'y2k'},
  'festival': {c:'listing-container', s:'festival'},
  'premium':  {c:'listing-container',  s:'premium'},
  'outlet':   {c:'listing-container',   outlet:true}
};

function populatePage(page){
  var cfg=PM[page];if(!cfg)return;
  var el=document.getElementById(cfg.c);if(!el)return;
  var items=allProducts;
  if(cfg.g)items=items.filter(function(p){return p.gender===cfg.g;});
  if(cfg.k)items=items.filter(function(p){return p.cat===cfg.k;});
  if(cfg.b)items=items.filter(function(p){return p.brand===cfg.b;});
  if(cfg.s)items=items.filter(function(p){return p.style===cfg.s;});
  items=applyFilters(items);
  renderCards(el, items, cfg.outlet);
}

function applyFilters(items){
  if(activeFilters.priceRange){var mn=activeFilters.priceRange[0], mx=activeFilters.priceRange[1];items=items.filter(function(p){return p.price>=mn&&p.price<=mx;});}
  if(activeFilters.condition)items=items.filter(function(p){return p.cond===activeFilters.condition;});
  return items;
}

// ── Build product card using only DOM ──
function makeImg(src, pid){
  var img=document.createElement('img');
  img.src=src||FB_IMG; img.loading='lazy';
  img.onclick=(function(id){return function(){openProduct(id);};})(pid);
  img.onerror=(function(){return function(){this.src=FB_IMG;};})(pid);
  return img;
}

function makeWlBtn(pid, active){
  var btn=document.createElement('button');
  btn.className='wishlist-btn'+(active?' active':'');
  btn.dataset.pid=pid; btn.textContent=active?'\u2764\uFE0F':'\uD83E\uDD0D';
  btn.onclick=(function(id){return function(){toggleWishlist(id);event.stopPropagation();};})(pid);
  return btn;
}

function makeGenderBadge(gender){
  var sp=document.createElement('span');
  sp.className='gender-badge '+(gender==='women'?'badge-women':'badge-men');
  sp.textContent=gender==='women'?'Women':'Men';
  return sp;
}

function makeQtySelector(initial, onChange) {
  var box = document.createElement('div'); box.className = 'qty-box';
  var m = document.createElement('button'); m.className = 'qty-btn'; m.textContent = '-';
  var v = document.createElement('span'); v.className = 'qty-val'; v.textContent = initial || 1;
  var p = document.createElement('button'); p.className = 'qty-btn'; p.textContent = '+';
  
  m.onclick = function(e) { 
    e.stopPropagation(); 
    var cur = parseInt(v.textContent); 
    if(cur > 1) { v.textContent = cur - 1; if(onChange) onChange(cur - 1); }
  };
  p.onclick = function(e) { 
    e.stopPropagation(); 
    var cur = parseInt(v.textContent); 
    if(cur < 10) { v.textContent = cur + 1; if(onChange) onChange(cur + 1); }
  };
  
  box.appendChild(m); box.appendChild(v); box.appendChild(p);
  box.getValue = function() { return parseInt(v.textContent); };
  return box;
}

function renderCards(el, items, isOutlet){
  el.innerHTML='';
  if(!items.length){
    var p=document.createElement('p');
    p.style.cssText='color:#aaa;padding:20px;width:100%';
    p.innerHTML='No products found. <a onclick="clearFilters()" style="color:#c8a96e;cursor:pointer">Clear filters</a>';
    el.appendChild(p);return;
  }
  items.forEach(function(p){
    var salePrice=isOutlet?Math.round(p.orig*0.6):p.price;
    var disc=Math.round((1-salePrice/p.orig)*100);
    var wlActive=wishlist.indexOf(String(p.id))!==-1;
    var card=document.createElement('div'); card.className='card';
    var wrap=document.createElement('div'); wrap.style.position='relative';
    wrap.appendChild(makeImg(p.img, p.id));
    wrap.appendChild(makeGenderBadge(p.gender));
    wrap.appendChild(makeWlBtn(p.id, wlActive));
    card.appendChild(wrap);
    var nm=document.createElement('div'); nm.className='card-name'; nm.textContent=p.name;
    var pr=document.createElement('div'); pr.className='price-row';
    pr.innerHTML='<span class="sale-price">\u20B9'+salePrice.toLocaleString('en-IN')+'</span>'+
      '<span class="orig-price">\u20B9'+p.orig.toLocaleString('en-IN')+'</span>'+
      (disc>0?'<span class="disc-badge">'+disc+'% OFF</span>':'');
    
    // Size Selector
    var szRow = document.createElement('div'); szRow.className = 'card-size-row';
    szRow.dataset.selected = 'M';
    (p.sizes || ['S','M','L','XL']).forEach(function(s){
      var b = document.createElement('button'); b.className = 'sz-btn' + (s === 'M' ? ' active' : '');
      b.textContent = s;
      b.onclick = function(e){
        e.stopPropagation();
        szRow.querySelectorAll('.sz-btn').forEach(function(x){x.classList.remove('active');});
        b.classList.add('active');
        szRow.dataset.selected = s;
      };
      szRow.appendChild(b);
    });

    // Quantity Selector for Card
    var qSel = makeQtySelector(1);
    qSel.style.margin = '10px auto';

    var addBtn=document.createElement('button'); addBtn.className='card-add-btn';
    addBtn.innerHTML='Add to Cart \uD83D\uDED2';
    addBtn.onclick=function(e){
      e.stopPropagation();
      var chosenSize = szRow.dataset.selected;
      var qty = qSel.getValue();
      addToCart(p.id, p.name, salePrice, p.img, chosenSize, qty);
    };
    
    card.appendChild(nm);
    card.appendChild(pr);
    card.appendChild(szRow);
    card.appendChild(qSel);
    card.appendChild(addBtn);

    // Make the entire card clickable (except for buttons)
    card.onclick = function(e) {
      if (e.target.tagName !== 'BUTTON') {
        openProduct(p.id);
      }
    };
    
    el.appendChild(card);
  });
}

// ── Product Detail ──
function openProduct(id){
  var p=allProducts.find(function(x){return String(x.id)===String(id);});
  if(!p)return;
  var img=document.getElementById('d-img');
  img.src=p.img?p.img.replace('w=500', 'w=700'):FB_IMG;
  img.onerror=function(){this.src=FB_IMG;};
  var badge=document.getElementById('d-badge');
  badge.textContent=p.gender==='women'?'Women':'Men';
  badge.style.cssText=p.gender==='women'
    ?'background:#e8b4c8;color:#6b2c4a;display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:8px'
    :'background:#b4c8e8;color:#1a3a5c;display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:8px';
  document.getElementById('d-name').textContent=p.name;
  document.getElementById('d-price').textContent='\u20B9'+p.price.toLocaleString('en-IN');
  document.getElementById('d-orig').textContent='\u20B9'+p.orig.toLocaleString('en-IN');
  document.getElementById('d-disc').textContent=Math.round((1-p.price/p.orig)*100)+'% OFF';
  document.getElementById('d-meta').textContent='Brand: '+p.brand+' \u00B7 Condition: '+p.cond;
  document.getElementById('d-desc').textContent=p.desc;
  var sel=document.getElementById('d-sizes');
  sel.innerHTML=p.sizes.map(function(s){return '<option>'+s+'</option>';}).join('');
  
  var qtyCont = document.getElementById('d-qty-container');
  var dQty;
  if(qtyCont){
    qtyCont.innerHTML = '';
    dQty = makeQtySelector(1);
    qtyCont.appendChild(dQty);
  }

  document.getElementById('d-cart-btn').onclick=function(){
    var size = document.getElementById('d-sizes').value;
    var qty = dQty ? dQty.getValue() : 1;
    addToCart(p.id, p.name, p.price, p.img, size, qty);
  };
  goTo('product-detail');
}

// ── Cart ──
function addToCart(id, name, price, img, size, qty){
  qty = qty || 1;
  size = size || 'M';
  var existing = cart.find(function(item){ return item.id === id && item.size === size; });
  if(existing){
    existing.quantity = (existing.quantity || 1) + qty;
  } else {
    cart.push({id:id, name:name, price:price, img:img||'', size:size, quantity:qty});
  }
  saveCart(); updateCartBadge(); notify(qty + ' x ' + name+' added to cart!');
}
function removeFromCart(id, size){
  cart=cart.filter(function(i){return !(i.id===id && i.size===size);});
  saveCart(); updateCartBadge(); renderCart();
}
function renderCart(){
  var c=document.getElementById('cart-container');
  var tb=document.getElementById('cart-total-box');
  var em=document.getElementById('cart-empty');
  c.querySelectorAll('.cart-item').forEach(function(x){x.remove();});
  if(!cart.length){em.style.display='block';tb.style.display='none';return;}
  em.style.display='none';tb.style.display='block';
  var total=0;
  cart.forEach(function(item, i){
    var itemTotal = item.price * (item.quantity || 1);
    total += itemTotal;
    var div=document.createElement('div'); div.className='cart-item';
    var img=document.createElement('img');
    img.src=item.img||FB_IMG;
    img.onerror=function(){this.src=FB_IMG;};
    div.appendChild(img);
    var dd=document.createElement('div'); dd.className='cart-details';
    var strong=document.createElement('strong'); strong.textContent=item.name;
    var sizeLabel=document.createElement('div');
    sizeLabel.style.cssText='font-size:11px;color:#888;margin-top:2px';
    sizeLabel.textContent='Size: ' + (item.size || 'M');
    
    var qtyControl = makeQtySelector(item.quantity || 1, function(newQty){
      item.quantity = newQty;
      saveCart(); renderCart();
    });
    qtyControl.style.marginTop = '8px';

    var pricediv=document.createElement('div'); pricediv.className='item-price';
    pricediv.textContent='\u20B9'+itemTotal.toLocaleString('en-IN');
    
    var rmBtn=document.createElement('button');
    rmBtn.textContent='Remove';
    rmBtn.style.cssText='padding:4px 10px;margin-top:8px;font-size:11px;border-radius:5px;background:#fff;color:#e05252;border:1px solid #e05252;margin-left:10px';
    rmBtn.onclick=(function(cid, csz){return function(){removeFromCart(cid, csz);};})(item.id, item.size);
    
    var actionRow = document.createElement('div'); actionRow.style.display='flex'; actionRow.style.alignItems='center';
    actionRow.appendChild(qtyControl); actionRow.appendChild(rmBtn);

    dd.appendChild(strong);dd.appendChild(sizeLabel);dd.appendChild(pricediv);dd.appendChild(actionRow);
    div.appendChild(dd);c.appendChild(div);
  });
  document.getElementById('cart-total-display').textContent='Total: \u20B9'+total.toLocaleString('en-IN');
}
function updateCartBadge(){document.getElementById('cart-count').textContent=cart.length;}
function saveCart(){localStorage.setItem('th_cart', JSON.stringify(cart));}

// ── Wishlist ──
function toggleWishlist(id){
  id=String(id);
  var i=wishlist.indexOf(id);
  if(i>-1)wishlist.splice(i, 1);else wishlist.push(id);
  saveWishlist();updateWishlistBtns();updateWishlistCount();
}
function renderWishlist(){
  var c=document.getElementById('wishlist-container');
  var em=document.getElementById('wishlist-empty');
  c.innerHTML='';
  if(!wishlist.length){em.style.display='block';c.style.display='none';return;}
  em.style.display='none';c.style.display='flex';
  wishlist.forEach(function(id){
    var p=allProducts.find(function(x){return String(x.id)===String(id);});
    if(!p)return;
    var disc=Math.round((1-p.price/p.orig)*100);
    var card=document.createElement('div');card.className='card';
    var wrap=document.createElement('div');wrap.style.position='relative';
    var img=document.createElement('img');
    img.src=p.img||FB_IMG;img.loading='lazy';
    img.onclick=(function(pid){return function(){openProduct(pid);};})(p.id);
    img.onerror=function(){this.src=FB_IMG;};
    var hbtn=document.createElement('button');hbtn.className='wishlist-btn active';
    hbtn.textContent='\u2764\uFE0F';hbtn.title='Remove from wishlist';
    hbtn.onclick=(function(pid){return function(){toggleWishlist(pid);renderWishlist();};})(p.id);
    var gbadge=makeGenderBadge(p.gender);
    wrap.appendChild(img);wrap.appendChild(hbtn);wrap.appendChild(gbadge);
    card.appendChild(wrap);
    var nm=document.createElement('div');nm.className='card-name';nm.textContent=p.name;
    var pr=document.createElement('div');pr.className='price-row';
    pr.innerHTML='<span class="sale-price">\u20B9'+p.price.toLocaleString('en-IN')+'</span>'+
      '<span class="orig-price">\u20B9'+p.orig.toLocaleString('en-IN')+'</span>'+
      (disc>0?'<span class="disc-badge">'+disc+'% OFF</span>':'');
    card.appendChild(nm);
    card.appendChild(pr);
    
    // Add Size Selector to Wishlist
    var szRow=document.createElement('div'); szRow.className='card-size-row';
    szRow.dataset.selected='M';
    ['S','M','L','XL'].forEach(function(s){
      var b=document.createElement('button'); b.className='sz-btn'+(s==='M'?' active':'');
      b.textContent=s;
      b.onclick=function(e){
        e.stopPropagation();
        szRow.querySelectorAll('.sz-btn').forEach(function(x){x.classList.remove('active');});
        b.classList.add('active');
        szRow.dataset.selected=s;
      };
      szRow.appendChild(b);
    });
    card.appendChild(szRow);

    var addBtn=document.createElement('button');addBtn.className='wishlist-card-add';
    addBtn.textContent='Add to Cart \uD83D\uDED2';
    addBtn.onclick=function(e){
      e.stopPropagation();
      var chosenSize = szRow.dataset.selected;
      addToCart(p.id, p.name, p.price, p.img||'', chosenSize);
    };
    card.appendChild(addBtn);
    c.appendChild(card);
  });
}
function updateWishlistBtns(){
  document.querySelectorAll('.wishlist-btn[data-pid]').forEach(function(btn){
    var on=wishlist.indexOf(String(btn.dataset.pid))!==-1;
    btn.classList.toggle('active', on);
    btn.textContent=on?'\u2764\uFE0F':'\uD83E\uDD0D';
  });
}
function updateWishlistCount(){var el=document.getElementById('wishlist-count'); if(el) el.textContent=wishlist.length;}
function saveWishlist(){localStorage.setItem('th_wishlist', JSON.stringify(wishlist));}

// ── Address ──
var savedAddresses=[];
function loadSavedAddresses(){
  try{var s=localStorage.getItem('th_addresses');if(s)savedAddresses=JSON.parse(s);}catch(e){}
  var sec=document.getElementById('saved-addresses-section');
  if(!sec)return;
  if(savedAddresses.length){
    sec.style.display='block';
    var list=document.getElementById('saved-addresses-list');
    list.innerHTML=savedAddresses.map(function(a, i){
      return '<div class="saved-address-card" onclick="selectSavedAddr('+i+')" style="border:1.5px solid #ddd;border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer;background:#fff">'+
        '<strong>'+a.name+' — '+a.type+'</strong><br>'+
        '<span style="font-size:13px;color:#666">'+a.street+', '+a.city+', '+a.state+' - '+a.pin+'<br>'+a.phone+'</span></div>';
    }).join('');
  }
}
function selectSavedAddr(i){
  selectedAddress=savedAddresses[i];
  notify('Address selected!');
  goToPayment();
}
function saveAndProceed(){
  var name=document.getElementById('addr-name').value.trim();
  var phone=document.getElementById('addr-phone').value.trim();
  var street=document.getElementById('addr-street').value.trim();
  var area=document.getElementById('addr-area').value.trim();
  var city=document.getElementById('addr-city').value.trim();
  var state=document.getElementById('addr-state').value;
  var pin=document.getElementById('addr-pin').value.trim();
  var type=document.getElementById('addr-type').value;
  var errEl=document.getElementById('addr-error');
  if(!name||!phone||!street||!city||!state||!pin){errEl.textContent='Please fill all required fields';return;}
  if(!/^\d{6}$/.test(pin)){errEl.textContent='Pincode must be 6 digits';return;}
  errEl.textContent='';
  // Combine street and area if area exists for backend compatibility
  var fullStreet = area ? (street + ', ' + area) : street;
  selectedAddress={name:name, phone:phone, street:fullStreet, city:city, state:state, pin:pin, type:type};
  savedAddresses.push(selectedAddress);
  localStorage.setItem('th_addresses', JSON.stringify(savedAddresses));
  if(currentUser){apiCall('PUT', '/auth/profile', {address:{street:fullStreet, city:city, state:state, pincode:pin}}, function(){});}
  notify('Address saved!');
  goToPayment();
}

// ── Payment ──
function goToPayment(){
  if(!cart.length){notify('Your cart is empty!');return;}
  goTo('payment');
}
function selPay(m){
  document.querySelectorAll('.pay-method-btn').forEach(function(b){b.classList.remove('active-pay');});
  var btn=document.getElementById('btn-'+m);if(btn)btn.classList.add('active-pay');
  ['upi', 'card', 'netbanking', 'cod'].forEach(function(s){
    var el=document.getElementById('section-'+s);if(el)el.style.display=s===m?'block':'none';
  });
}
function openUPI(app){
  var total=cart.reduce(function(s, i){return s+i.price;}, 0);
  var uid='9359699646@ptsbi';
  var base='upi://pay?pa='+uid+'&pn=ThriftHub&am='+total+'&cu=INR';
  var links={paytm:'paytmmp://pay?pa='+uid+'&am='+total+'&cu=INR', phonepe:'phonepe://pay?pa='+uid+'&am='+total+'&cu=INR', gpay:'tez://upi/pay?pa='+uid+'&am='+total+'&cu=INR', bhim:base};
  window.location.href=links[app]||base;
  setTimeout(function(){notify('If app did not open, scan the QR instead.');}, 2000);
}
function doPlaceOrder(){
  if(window.isPlacing) return;
  if(!currentUser || !cart.length || !selectedAddress){
    notify('Missing address or cart items. Please go back and verify details.');
    return;
  }

  window.isPlacing = true;
  var btn = document.querySelector('.pay-final-btn');
  if(btn) { btn.textContent = 'Processing...'; btn.disabled = true; }

  var mb = document.querySelector('.active-pay');
  var method = mb ? mb.id.replace('btn-', '') : 'upi';

  var itemsTotal = cart.reduce(function(s, i){ return s + (i.price * (i.quantity || 1)); }, 0);
  var shipping   = itemsTotal > 999 ? 0 : 49;
  var codFee     = method === 'cod' ? 40 : 0;
  var finalAmount = itemsTotal + shipping + codFee;

  // Online payments (UPI/card/netbanking) are paid immediately;
  // COD stays pending until delivery.
  var payStatus = method === 'cod' ? 'pending' : 'paid';
  // Order fulfilment status: COD stays 'pending', online payments move to 'confirmed'
  var orderStatus = method === 'cod' ? 'pending' : 'confirmed';

  var orderData = {
    items: cart.map(function(i){ return { product: i.id, name: i.name, price: i.price, image: i.img, size: i.size, quantity: i.quantity || 1 }; }),
    shippingAddress: {
      name:    selectedAddress.name,
      phone:   selectedAddress.phone,
      street:  selectedAddress.street,
      city:    selectedAddress.city,
      state:   selectedAddress.state,
      pincode: selectedAddress.pin
    },
    payment:     { method: method, status: payStatus },
    orderStatus: orderStatus,
    itemsTotal:  itemsTotal,
    shippingCost: shipping,
    totalAmount: finalAmount
  };

  // ── Reset button & flag BEFORE navigating so DOM teardown doesn't trap them ──
  window.isPlacing = false;
  if(btn) { btn.textContent = 'Pay & Place Order'; btn.disabled = false; }

  notify('✅ Payment successful & Order placed!');

  // Clear cart and redirect instantly
  cart = []; saveCart(); updateCartBadge();
  goTo('home');

  // Send order to backend in background (user already sees success)
  apiCall('POST', '/orders', orderData, function(err, d){
    if(err) console.warn('Background order creation failed:', err);
    else    console.log('Order saved to DB:', d && d.order && d.order._id);
  });
}

// ── Filters ──
function setFilter(type, value){
  if(type==='priceRange'){var same=activeFilters.priceRange&&activeFilters.priceRange[0]===value[0]&&activeFilters.priceRange[1]===value[1];activeFilters.priceRange=same?null:value;}
  else{activeFilters[type]=activeFilters[type]===value?null:value;}
  updateFilterBtns();
  var active=document.querySelector('.page.active');if(active)populatePage(active.id.replace('page-', ''));
}
function clearFilters(){
  activeFilters={priceRange:null, condition:null};updateFilterBtns();
  var active=document.querySelector('.page.active');if(active)populatePage(active.id.replace('page-', ''));
}
function updateFilterBtns(){
  document.querySelectorAll('[data-ft]').forEach(function(btn){
    var ft=btn.dataset.ft, fv=btn.dataset.fv, on=false;
    if(ft==='pr'){if(fv==='b'&&activeFilters.priceRange&&activeFilters.priceRange[0]===0)on=true;if(fv==='m'&&activeFilters.priceRange&&activeFilters.priceRange[0]===700)on=true;if(fv==='p'&&activeFilters.priceRange&&activeFilters.priceRange[0]===1500)on=true;}
    else if(ft==='cond')on=activeFilters.condition===fv;
    btn.classList.toggle('active', on);
  });
}

// ── Search ──
function doSearch(){
  var q=document.getElementById('search-input').value.toLowerCase().trim();
  var rd=document.getElementById('search-results');rd.innerHTML='';
  if(!q)return;
  var m=allProducts.filter(function(p){return p.name.toLowerCase().indexOf(q)!==-1||p.brand.toLowerCase().indexOf(q)!==-1||p.cat.toLowerCase().indexOf(q)!==-1;});
  if(!m.length){rd.innerHTML='<p style="color:#aaa;padding:16px">No results found.</p>';return;}
  renderCards(rd, m, false);updateWishlistBtns();
}

// ── Validation ──
function vGmail(inputId, errId){
  var el=document.getElementById(inputId), err=document.getElementById(errId), val=el.value.trim();
  if(!val){el.className='';err.textContent='';return false;}
  if(!val.includes('@')){el.className='input-error';err.className='field-err';err.textContent='Enter a valid email';return false;}
  if(!val.toLowerCase().endsWith('@gmail.com')){var d=val.split('@')[1]||'';el.className='input-error';err.className='field-err';err.textContent=(d?'"'+d+'" not allowed — ':'')+'Only @gmail.com accepted';return false;}
  el.className='input-ok';err.className='field-err field-ok';err.textContent='Valid';return true;
}
function vPass(inputId, errId){
  var el=document.getElementById(inputId), err=document.getElementById(errId), val=el.value;
  if(!val){el.className='';err.textContent='';return false;}
  if(val.length<6){el.className='input-error';err.className='field-err';err.textContent='Min 6 characters ('+val.length+'/6)';return false;}
  el.className='input-ok';err.className='field-err field-ok';err.textContent='Good';return true;
}
function vName(inputId, errId){
  var el=document.getElementById(inputId), err=document.getElementById(errId), val=el.value.trim();
  if(!val){el.className='';err.textContent='';return false;}
  if(val.length<2){el.className='input-error';err.className='field-err';err.textContent='Too short';return false;}
  el.className='input-ok';err.className='field-err field-ok';err.textContent='Good';return true;
}
function forceErr(id, errId, msg){
  document.getElementById(id).className='input-error';
  var e=document.getElementById(errId);e.className='field-err';e.textContent=msg;
}

// ── Misc ──
function openStore(loc){window.open('https://maps.google.com/?q='+encodeURIComponent(loc), '_blank');}
function showLoader(show){var el=document.getElementById('ajax-loader'); if(el) el.classList.toggle('show', show);}
function fmtCard(el){var v=el.value.replace(/\D/g, '').substring(0, 16);el.value=v.replace(/(\d{4})/g, '$1 ').trim();}
function fmtExp(el){var v=el.value.replace(/\D/g, '');if(v.length>=2)v=v.substring(0, 2)+'/'+v.substring(2, 4);el.value=v;}
var notifTimer;
function notify(msg){var el=document.getElementById('notif'); if(!el) return; el.textContent=msg;el.classList.add('show');clearTimeout(notifTimer);notifTimer=setTimeout(function(){el.classList.remove('show');}, 3000);}
function openStore(query){
  window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query));
}

window.addEventListener('load', function(){loadProducts();loadSavedAddresses();});
