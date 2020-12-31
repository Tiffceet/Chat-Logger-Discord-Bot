// const firebase = require("firebase/app");
require("firebase/firestore");
import * as firebase_admin from "firebase-admin";
const firebase_serviceAccount = require("../pinkfredor-firebase-adminsdk-ujfaz-4c1e8a5d88.json");
import { FirebaseCollection } from "../interface/class/PinkFredorFirebase/FirebaseCollection";
/**
 * Contains functions to handles all transactions between this bot and firebase
 */
export class PinkFredorFirebase {
	constructor(private_key: string) {
		firebase_serviceAccount.private_key = private_key;
		firebase_admin.initializeApp({
			credential: firebase_admin.credential.cert(firebase_serviceAccount),
			databaseURL: "https://pinkfredor.firebaseio.com",
		});
	}

	/**
	 * Retreive an array of data from a specific collection
	 * @param {string} collection_name
	 * @return {Promise<Array<FirebaseCollection>>}
	 */
	async retrieve_collection(
		collection_name: string
	): Promise<Array<FirebaseCollection>> {
		let collection_content: Array<FirebaseCollection> = [];

		let db = firebase_admin.firestore();
		let querySnapshot = await db.collection(collection_name).get();
		querySnapshot.forEach(function (
			doc: FirebaseFirestore.QueryDocumentSnapshot
		) {
			collection_content.push({
				id: doc.id,
				content: doc.data(),
			});
		});
		return collection_content;
	}

	/**
	 * Add a document into an collection
	 * @param {string} collection collection name
	 * @param {string} id id of the data
	 * @param {FirebaseFirestore.DocumentData} data content of the data in object
	 * @return {Promise} Rejected if failed, Resolved if success
	 */
	async add_document(
		collection: string,
		id: string,
		data: FirebaseFirestore.DocumentData
	) {
		let db = firebase_admin.firestore();
		await db.collection(collection).doc(id).set(data);
	}

	/**
	 * Update an document in specified collection an id
	 * @param {string} collection collection name
	 * @param {string} id id of the data
	 * @param {FirebaseFirestore.DocumentData} data content to update
	 * @return {Promise} Rejected if failed, Resolved if success
	 */
	async update_document(
		collection: string,
		id: string,
		data: FirebaseFirestore.DocumentData
	) {
		let db = firebase_admin.firestore();
		await db.collection(collection).doc(id).update(data);
	}
}
