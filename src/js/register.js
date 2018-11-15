const { serviceWorker } = navigator;

const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        serviceWorker.register('/sw.js', 
            { scope: './' }
        ).then((registration) => {
            console.info('Service worker registered', registration.scope);
            const sw = {};
    
            if (registration.installing) {
                sw.status = registration.installing;
                console.info('Service worker installing');
            }
    
            if (registration.waiting) {
                sw.status = registration.waiting;
                console.warn('Service worker waiting');
            }
    
            if (registration.active) {
                sw.status = registration.active;
                console.info('Service worker active');
            }
    
            if (sw.status) {
                console.log('Service worker state:', sw.status.state);
                sw.status.addEventListener('statechange', (e) => {
                    console.log('Service worker state:', e.target.state)
                });
            }
        }).catch(() => {
            console.error('Service worker installation failed');
        })
    };
};

document.addEventListener('DOMContentLoaded', (event) => {
    registerServiceWorker();
    
  });