const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyAZwrvW6goAs7SjMPmksXWiU1x57r4UbwU",
    authDomain: "yasin-b993b.firebaseapp.com",
    projectId: "yasin-b993b",
    storageBucket: "yasin-b993b.firebasestorage.app",
    messagingSenderId: "1094100813279",
    appId: "1:1094100813279:web:bb4cf51c0ecc313a58f06a",
    measurementId: "G-NG5F1J11DY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    try {
        console.log("Trying to read inventory...");
        const snapshot = await getDocs(collection(db, 'inventory'));
        console.log("Success! Inventory items:", snapshot.size);
    } catch(e) {
        console.error("Error reading inventory:", e.message);
    }
}

test();
