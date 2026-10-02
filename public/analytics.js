(function () {
  'use strict';
  if(location.hostname!=='wendao.wonderelian.com'||window.Capacitor?.isNativePlatform?.())return;
  const id='G-HDHST6WKKB',q=new URLSearchParams(location.search);
  const excluded=q.has('acceptance')||q.has('preview')||q.get('analytics')==='off'||navigator.webdriver||navigator.globalPrivacyControl===true;
  let initialized=false;
  const consent=()=>{try{return !excluded&&localStorage.getItem('wendao.usageConsent.v1')==='granted';}catch{return false;}};
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){if(consent()||arguments[0]==='consent')window.dataLayer.push(arguments);};
  function update(){const enabled=consent();window['ga-disable-'+id]=!enabled;
    if(initialized)window.gtag('consent','update',{analytics_storage:enabled?'granted':'denied'});
    if(!enabled||initialized)return;initialized=true;
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());window.gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'wendao.wonderelian.com',page_location:location.origin+location.pathname,page_referrer:''});
    const loader=document.createElement('script');loader.async=true;loader.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.appendChild(loader);
  }
  update();window.addEventListener('wendao:usage-consent',update);
}());
