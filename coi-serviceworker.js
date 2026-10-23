/* Đã TẮT chế độ crossOriginIsolated vì nó làm hỏng cửa sổ đăng nhập Google (Firebase).
   File này chỉ còn nhiệm vụ: tự gỡ service worker cũ khỏi trình duyệt rồi tải lại trang 1 lần. */
if (typeof window === 'undefined') {
  /* ===== chạy trong service worker (bản cũ được cập nhật lên bản này) ===== */
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll()).then(cs => cs.forEach(c => c.navigate(c.url)))
  ));
} else {
  /* ===== chạy trong trang ===== */
  (async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      if (regs.length && !sessionStorage.getItem('coi-removed')) {
        sessionStorage.setItem('coi-removed', '1'); location.reload();
      }
    } catch (e) { console.warn('coi cleanup', e); }
  })();
}
