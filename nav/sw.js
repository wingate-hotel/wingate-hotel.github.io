// עבודה גם בלי קליטה: הקבצים נשמרים במכשיר בזמן השימוש הראשון
const CACHE = 'wingate-nav-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return
  // דף הבית וקבצי הנתונים נבדקים מול השרת בכל פעם, כדי שעדכון יגיע מיד ולא אחרי עשר דקות של מטמון
  const fresh = e.request.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.webmanifest')
  const req = fresh ? new Request(e.request, { cache: 'no-cache' }) : e.request
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      })
      .catch(() => caches.match(e.request).then((hit) => hit ?? caches.match(self.registration.scope))),
  )
})
