export interface SongQueueItem {
    song_title: string,
    song_artist: string,
    song_desc:string,
    google_drive_file_id: string,
    album: string
}

export interface SongQueue {
    [key:string] : Array<SongQueueItem>
}