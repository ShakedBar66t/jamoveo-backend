export interface SongLine {
    lyrics: string;
    chords?: string;
}

export interface SongIndex {
    [key: string]: {
        id: string;
        title: string;
        artist: string;
        file: string;
    }
}

export interface Session {
    active: boolean;
    songId: string | null;
    connectedUsers: string[];
}

export interface User {
    email: string;
    instrument: string;
    role: 'admin' | 'player' | 'singer';
} 