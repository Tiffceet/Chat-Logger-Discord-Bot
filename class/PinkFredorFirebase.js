const firebase = require("firebase/app");
require("firebase/firestore");
const firebase_admin = require("firebase-admin");
const firebase_serviceAccount = require("../pinkfredor-firebase-adminsdk-ujfaz-4c1e8a5d88.json");

/**
 * Contains functions to handles all transactions between this bot and firebase
 */
module.exports = class PinkFredorFirebase {
	constructor(private_key) {
		firebase_serviceAccount.private_key = private_key;
		firebase_admin.initializeApp({
			credential: firebase_admin.credential.cert(firebase_serviceAccount),
			databaseURL: "https://pinkfredor.firebaseio.com",
		});
    }
    
    /**
     * Retreive an array of data from a specific collection
     * @param {string} collection_name 
     * @return Array of object: {id: string, content: object}
     */
    async retrieve_collection(collection_name) {
        let collection_content = [];

        let db = firebase_admin.firestore();
        let querySnapshot = await db.collection(collection_name).get();
	    querySnapshot.forEach(function (doc) {
            collection_content.push(
                {
                    id: doc.id,
                    content: doc.data()
                });
        });
        return collection_content;
    }

    /**
     * Add a document into an collectionm
     * @param {string} collection collection name
     * @param {string} id id of the data
     * @param {object} data content of the data in object
     * @return {Promise} Rejected if failed, Resolved if success
     */
    async add_document(collection, id, data) {
        let db = firebase_admin.firestore();
        await db.collection(collection).doc(id).set(data);
    }

    /**
     * Update an document in specified collection an id
     * @param {string} collection collection name
     * @param {string} id id of the data
     * @param {object} data content to update
     * @return {Promise} Rejected if failed, Resolved if success
     */
    async update_document(collection, id, data) {
        let db = firebase_admin.firestore();
        await db.collection(collection).doc(id).update(data);
    }
};
