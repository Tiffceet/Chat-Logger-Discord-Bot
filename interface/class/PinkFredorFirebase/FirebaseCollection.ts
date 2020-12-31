/**
 * Custom Firebase Collection returned by retrieve_collection()
 */
export interface FirebaseCollection {
    id: string,
    content: FirebaseFirestore.DocumentData
}