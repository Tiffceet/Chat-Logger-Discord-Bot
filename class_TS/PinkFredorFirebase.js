"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinkFredorFirebase = void 0;
require("firebase/firestore");
const firebase_admin = require("firebase-admin");
const firebase_serviceAccount = require("../pinkfredor-firebase-adminsdk-ujfaz-4c1e8a5d88.json");
class PinkFredorFirebase {
    constructor(private_key) {
        firebase_serviceAccount.private_key = private_key;
        firebase_admin.initializeApp({
            credential: firebase_admin.credential.cert(firebase_serviceAccount),
            databaseURL: "https://pinkfredor.firebaseio.com",
        });
    }
    async retrieve_collection(collection_name) {
        let collection_content = [];
        let db = firebase_admin.firestore();
        let querySnapshot = await db.collection(collection_name).get();
        querySnapshot.forEach(function (doc) {
            collection_content.push({
                id: doc.id,
                content: doc.data(),
            });
        });
        return collection_content;
    }
    async add_document(collection, id, data) {
        let db = firebase_admin.firestore();
        await db.collection(collection).doc(id).set(data);
    }
    async update_document(collection, id, data) {
        let db = firebase_admin.firestore();
        await db.collection(collection).doc(id).update(data);
    }
}
exports.PinkFredorFirebase = PinkFredorFirebase;
//# sourceMappingURL=PinkFredorFirebase.js.map