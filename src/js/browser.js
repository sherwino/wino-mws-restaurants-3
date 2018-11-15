let usersBrowser;
const { userAgent } = navigator;

// The order matters here, and this may report false positives for unlisted browsers.
// TODO: Maybe refactor this
if (userAgent.indexOf('Firefox') > -1) {
    usersBrowser = 'Mozilla Firefox';
} else if (userAgent.indexOf('Opera') > -1) {
    usersBrowser = 'Opera';
} else if (userAgent.indexOf('Trident') > -1) {
    usersBrowser = 'Microsoft Internet Explorer';
} else if (userAgent.indexOf('Edge') > -1) {
    usersBrowser = 'Microsoft Edge';
} else if (userAgent.indexOf('Chrome') > -1) {
    usersBrowser = 'Google Chrome or Chromium';
} else if (userAgent.indexOf('Safari') > -1) {
    usersBrowser = 'Apple Safari';
} else {
    usersBrowser = 'unknown';
}

console.log(`You are using: ${usersBrowser}`);
