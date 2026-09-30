/* Queue the visit now; download analytics after the page has finished loading. */
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-6EZD4ZRZ76', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  cookie_flags: 'SameSite=Lax;Secure',
});

function scheduleAnalytics() {
  window.setTimeout(() => {
    const load = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-6EZD4ZRZ76';
      document.head.append(script);
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(load, { timeout: 2000 });
    } else {
      load();
    }
  }, 5000);
}

if (document.readyState === 'complete') scheduleAnalytics();
else window.addEventListener('load', scheduleAnalytics, { once: true });
