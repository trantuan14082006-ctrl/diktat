/* Chế độ nhanh: bật crossOriginIsolated (Whisper/ONNX nhiều luồng) trên host không đặt được header (GitHub Pages).
   CHỈ chạy khi localStorage.coiOn === '1' (công tắc "Chế độ nhanh" trong trang Thêm bài).
   Khi tắt: file này tự gỡ service worker rồi tải lại trang 1 lần. Đăng nhập Google chỉ chạy được khi chế độ này TẮT. */
if (typeof window === 'undefined') {
  /* ===== chạy trong service worker ===== */
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
  self.addEventListener('message', e => {
    if (e.data && e.data.type === 'coi-off') self.registration.unregister();
  });
  self.addEventListener('fetch', e => {
    const r = e.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
    /* request CORS sang domain khác (Firebase, Hugging Face…): để trình duyệt tự xử lý */
    try { if (new URL(r.url).origin !== self.location.origin && r.mode === 'cors') return; } catch (_) {}
    e.respondWith(
      fetch(r).then(res => {
        if (res.status === 0) return res;
        const h = new Headers(res.headers);
        h.set('Cross-Origin-Embedder-Policy', 'require-corp');
        h.set('Cross-Origin-Opener-Policy', 'same-origin');
        h.set('Cross-Origin-Resource-Policy', 'cross-origin');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
      }).catch(err => { console.error('coi-sw', err); return fetch(r); })
    );
  });
} else {
  /* ===== chạy trong trang ===== */
  const SRC = document.currentScript && document.currentScript.src;
  (async () => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    let on = false;
    try { on = localStorage.getItem('coiOn') === '1'; } catch (e) {}
    if (/[?&]nocoi\b/.test(location.search)) { try { localStorage.setItem('coiOn', '0'); localStorage.setItem('coiWant', '0'); } catch (e) {} on = false; }
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (!on) {
        /* chế độ thường: gỡ service worker cũ (nếu có) rồi tải lại 1 lần */
        for (const r of regs) await r.unregister();
        if (regs.length && !sessionStorage.getItem('coi-removed')) { sessionStorage.setItem('coi-removed', '1'); location.reload(); }
        else if (!regs.length) sessionStorage.removeItem('coi-removed');
        return;
      }
      sessionStorage.removeItem('coi-removed');
      if (window.crossOriginIsolated) { sessionStorage.removeItem('coi-reloaded'); return; }
      const reg = await navigator.serviceWorker.register(SRC);
      const reload = () => {
        if (sessionStorage.getItem('coi-reloaded')) return;   /* chỉ tải lại 1 lần, tránh vòng lặp */
        sessionStorage.setItem('coi-reloaded', '1'); location.reload();
      };
      if (navigator.serviceWorker.controller) reload();
      else navigator.serviceWorker.addEventListener('controllerchange', reload);
      if (reg.active && !navigator.serviceWorker.controller) reload();
    } catch (e) { console.warn('coi-serviceworker lỗi:', e); }
  })();
}
