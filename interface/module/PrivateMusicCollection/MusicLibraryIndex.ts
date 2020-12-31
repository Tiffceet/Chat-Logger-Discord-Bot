export interface SongFileInfo {
    kind: string,
    id: string,
    name: string,
    mimeType: string
}

export interface AlbumFolderInfo {
    folder_id: string,
    name: string,
    info_json?: any,
    content:Array<SongFileInfo>
}

export interface MusicLibraryIndex {
    album: Array<AlbumFolderInfo>
}