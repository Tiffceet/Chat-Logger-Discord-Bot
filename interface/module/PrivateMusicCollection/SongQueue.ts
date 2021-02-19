export interface SongQueueItem {
	song_title: string;
	song_artist: string;
	song_desc: string;
	google_drive_file_id: string;
	album: string;
}

export interface SongQueue {
	[key: string]: {
        queue: Array<SongQueueItem>;
        /**
         * This queue have more priority have the queue, contains index referencing original queue
         */
		immediate_queue: Array<number>;
	};
}
