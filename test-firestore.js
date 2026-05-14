const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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
        console.log("Trying to add to online_orders...");
        await addDoc(collection(db, 'online_orders'), {
            status: 'new',
            customerName: 'Test',
            phone: '123',
            items: [],
            totalPrice: 100
        });
        console.log("Success online_orders!");
    } catch(e) {
        console.error("Error online_orders:", e.message);
    }
}

test();
