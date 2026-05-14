const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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
        console.log("Trying to add complete order with 1 item...");
        const order = {
            orderNumber: "SH-1234567",
            customerName: "Test",
            phone: "0555",
            wilaya: "01",
            baladiya: "Test",
            address: "Test",
            notes: "",
            items: [{ productId: "1", name: "Shirt", qty: 1, size: "M", colorName: "Black", colorHex: "#000", sellPrice: 100, buyPrice: 50, image: "test.jpg" }],
            subtotal: 100,
            discount: 0,
            promoCode: null,
            shipping: 600,
            totalPrice: 700,
            paymentMethod: 'cod',
            status: 'new',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'online_orders'), order);
        console.log("Success!");
    } catch(e) {
        console.error("Error:", e.message);
    }
}

test();
