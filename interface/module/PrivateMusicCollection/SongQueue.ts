export interface SongQueueItem {
    song_title: string,
    song_artist: string,
    album_art_drive_file_id: string,
    google_drive_file_id: string,
    data_stream: any
}

export interface SongQueue {
    [key:string] : Array<SongQueueItem>
}