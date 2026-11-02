// Start Firebase
(function initializeAgriFirebase() {
    if (typeof firebase === "undefined") {
        throw new Error("Firebase SDK scripts must load before firebase-init.js.");
    }

    if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === "PASTE_API_KEY_HERE") {
        console.warn("AgriCulture: replace placeholder values in js/firebase-config.js with your Firebase web app config.");
    }

    const app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(FIREBASE_CONFIG);

    window.AgriFirebase = {
        app: app,
        auth: firebase.auth(),
        db: firebase.firestore()
    };
}());
