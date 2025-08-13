// Simple client-side auth + portfolio admin
(() => {
  const VALID_LOGIN = 'Adam.FS.314257';
  const VALID_PASSWORD = '314257Eqrwtu';
  const AUTH_KEY = 'hillman_admin_auth_v1';
  const DATA_KEY = 'hillman_portfolio_items_v2';

  function setup(){
    const loginView = document.getElementById('loginView');
    const loginForm = document.getElementById('loginForm');
    const errorEl = document.getElementById('error');
    const app = document.getElementById('adminApp');

    const formAdd = document.getElementById('formAdd');
    const inputFile = document.getElementById('imageFile');
    const inputUrl = document.getElementById('imageUrl');
    const inputCaption = document.getElementById('caption');
    const inputCategory = document.getElementById('category');
    const list = document.getElementById('items');
    const btnPull = document.getElementById('btnPull');
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');
    const btnLogout = document.getElementById('btnLogout');
    const chkAutoExport = document.getElementById('autoExport');
    const syncStatus = document.getElementById('syncStatus');

    function isAuthed(){ return localStorage.getItem(AUTH_KEY) === '1'; }
    function setAuthed(v){ v ? localStorage.setItem(AUTH_KEY,'1') : localStorage.removeItem(AUTH_KEY); }

    function showApp(){
      if (loginView){ loginView.hidden = true; loginView.style.display = 'none'; }
      if (app){ app.hidden = false; app.style.display = ''; }
    }
    function showLogin(){
      if (app){ app.hidden = true; app.style.display = 'none'; }
      if (loginView){ loginView.hidden = false; loginView.style.display = ''; }
    }

    if (!loginForm || !loginView || !app) {
      console.error('Admin init error: missing DOM nodes', { loginForm: !!loginForm, loginView: !!loginView, app: !!app });
      return;
    }

    console.log('Admin setup OK');

    function handleLogin(e){
      if (e) e.preventDefault();
      const loginInput = document.getElementById('login');
      const passInput = document.getElementById('password');
      const login = (loginInput && loginInput.value || '').trim();
      const pass = (passInput && passInput.value || '').trim();
      const ok = login === VALID_LOGIN && pass === VALID_PASSWORD;
      if (!ok){ if (errorEl) errorEl.style.display = 'block'; return false; }
      if (errorEl) errorEl.style.display = 'none';
      setAuthed(true);
      showApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }

    loginForm.addEventListener('submit', handleLogin);
    const btnSignIn = document.getElementById('btnSignIn');
    btnSignIn && btnSignIn.addEventListener('click', handleLogin);

    if (isAuthed()) showApp();

    // Auto-login via URL params (?login=&password=)
    try{
      const params = new URLSearchParams(window.location.search);
      const qLogin = params.get('login');
      const qPass = params.get('password');
      if (qLogin && qPass){
        const loginInput = document.getElementById('login');
        const passInput = document.getElementById('password');
        if (loginInput) loginInput.value = qLogin;
        if (passInput) passInput.value = qPass;
        handleLogin();
      }
    }catch(_){}

    btnLogout && btnLogout.addEventListener('click', () => {
      setAuthed(false);
      showLogin();
    });

    // Data helpers
    let items = [];
    function load(){
      try { items = JSON.parse(localStorage.getItem(DATA_KEY) || '[]'); } catch { items = []; }
      // migrate legacy v1 if present and current store is empty
      if (!items.length){
        try{
          const legacy = JSON.parse(localStorage.getItem('hillman_portfolio_items_v1') || '[]');
          if (Array.isArray(legacy) && legacy.length){
            items = legacy.map(it => ({ src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' }));
            save();
          }
        }catch(_e){ /* ignore */ }
      }
    }
    function save(){ localStorage.setItem(DATA_KEY, JSON.stringify(items)); }

    async function fetchRemoteItems(){
      try{
        const res = await fetch('/assets/portfolio/items.json', { cache: 'no-store' });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      }catch(_e){ return []; }
    }

    function mergeItems(remoteList, localList){
      const map = new Map();
      // start with remote to avoid dropping existing items
      for (const it of remoteList){
        if (it && typeof it.src === 'string'){
          map.set(it.src, { src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' });
        }
      }
      // overlay local (prefer local captions/categories if same src)
      for (const it of localList){
        if (it && typeof it.src === 'string'){
          map.set(it.src, { src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' });
        }
      }
      return Array.from(map.values());
    }

    async function fileToDataUrl(file){
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    }

    function renderList(){
      list.innerHTML = '';
      items.forEach((it, idx) => {
        const row = document.createElement('div');
        row.className = 'admin-item';
        const meta = document.createElement('div');
        meta.className = 'meta';
        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = it.src; img.alt = '';
        const cap = document.createElement('span');
        cap.textContent = it.caption || '';
        meta.append(img, cap);
        const del = document.createElement('button');
        del.type = 'button'; del.textContent = 'Delete';
        del.addEventListener('click', () => {
          items.splice(idx, 1); save(); renderList();
        });
        row.append(meta, del);
        list.append(row);
      });
    }

    const onSubmit = async (e) => {
      e.preventDefault();
      let src = (inputUrl.value || '').trim();
      // If file selected and no URL, upload to Netlify Blobs
      if (!src && inputFile.files && inputFile.files[0]){
        try{
          const pres = await fetch('/api/upload-url', { method: 'POST', headers: { 'Authorization': 'Basic ' + btoa('Adam.FS.314257:314257Eqrwtu') } });
          if (pres.ok){
            const { uploadUrl } = await pres.json();
            const up = await fetch(uploadUrl, { method: 'PUT', body: inputFile.files[0], headers: { 'Content-Type': inputFile.files[0].type || 'application/octet-stream' } });
            if (up.ok){
              // Presigned URL becomes the blob URL without query
              src = uploadUrl.split('?')[0];
            }
          }
        }catch(_e){ /* fallback to data URL below if needed */ }
        if (!src) src = await fileToDataUrl(inputFile.files[0]);
      }
      const caption = (inputCaption.value || '').trim();
      const category = (inputCategory && inputCategory.value) || 'Kitchen';
      if (!src) { alert('Please select an image or paste an image URL'); return; }
      items.push({ src, caption, category });
      // merge with server before publish to avoid wiping others
      const remote = await fetchRemoteItems();
      items = mergeItems(remote, items);
      save(); renderList(); formAdd.reset();
      if (chkAutoExport && chkAutoExport.checked){
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'portfolio-items.json'; a.click(); URL.revokeObjectURL(url);
      }
      // Create item on server (Netlify function)
      try{
        const resp = await fetch('/api/create-work', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa('Adam.FS.314257:314257Eqrwtu')
          },
          body: JSON.stringify(items)
        });
        if (resp.ok) {
          console.log('Server items.json updated');
          if (syncStatus) { syncStatus.textContent = 'Published'; setTimeout(()=>{ syncStatus.textContent=''; }, 1500); }
        } else {
          const text = await resp.text();
          console.warn('Publish failed:', text);
          alert('Публикация на сервер не выполнена (Netlify). Проверьте переменные окружения и токен.');
        }
      }catch(_e){ /* ignore on static hosts */ }
    };
    formAdd && formAdd.addEventListener('submit', onSubmit);
    const btnAdd = document.getElementById('btnAdd');
    btnAdd && btnAdd.addEventListener('click', onSubmit);

    btnExport && btnExport.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'portfolio-items.json'; a.click(); URL.revokeObjectURL(url);
    });

    btnImport && btnImport.addEventListener('click', async () => {
      const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'application/json';
      picker.onchange = async () => {
        const file = picker.files && picker.files[0]; if (!file) return;
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)){
            items = data.filter(it => it && typeof it.src === 'string').map(it => ({ src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' }));
            // also merge with remote to avoid overwriting
            const remote = await fetchRemoteItems();
            items = mergeItems(remote, items);
            save(); renderList();
            if (syncStatus) { syncStatus.textContent = 'Imported and merged'; setTimeout(()=>{ syncStatus.textContent=''; }, 1500); }
          } else { alert('Invalid JSON format'); }
        } catch { alert('Failed to parse JSON'); }
      };
      picker.click();
    });

    btnPull && btnPull.addEventListener('click', async ()=>{
      if (syncStatus) syncStatus.textContent = 'Syncing...';
      const remote = await fetchRemoteItems();
      items = mergeItems(remote, items);
      save(); renderList();
      if (syncStatus) { syncStatus.textContent = 'Up to date'; setTimeout(()=>{ syncStatus.textContent=''; }, 2000); }
    });

    // Initial sync: local + remote merge
    load();
    (async () => {
      const remote = await fetchRemoteItems();
      if (remote.length){
        items = mergeItems(remote, items);
        save();
      }
      renderList();
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

