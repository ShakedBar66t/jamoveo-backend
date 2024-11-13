import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';
import songsIndex from '../data/songs.json';
import { io } from '../socket';
import { SongIndex, SongLine } from '../types';

const router = Router();

async function loadSongData(fileName: string): Promise<SongLine[][]> {
    const filePath = path.join(__dirname, '../data', fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

function formatSongForRole(songData: SongLine[][], role: string) {
    if (role === 'singer') {
        // For singers, return only lyrics
        return songData.map(line =>
            line.map(segment => segment.lyrics).join(' ')
        ).join('\n');
    } else {
        // For players, return both lyrics and chords
        return songData.map(line => {
            const lineChords = line
                .filter(segment => segment.chords)
                .map(segment => segment.chords)
                .join(' ');
            const lineLyrics = line
                .map(segment => segment.lyrics)
                .join(' ');
            return lineChords ? `${lineChords}\n${lineLyrics}` : lineLyrics;
        }).join('\n');
    }
}

// Search songs
const searchSongs = (req: Request, res: Response): void => {
    const query = req.query.query?.toString().toLowerCase() || '';

    const results = Object.values(songsIndex as SongIndex).filter(
        song =>
            song.title.toLowerCase().includes(query) ||
            song.artist.toLowerCase().includes(query)
    );

    res.json(results);
};

// Get song details
const getSongDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const songId = req.params.id;

        const songInfo = (songsIndex as SongIndex)[songId];
        if (!songInfo) {
            return res.status(404).json({ error: 'Song not found' }) as any;
        }

        const songData = await loadSongData(songInfo.file);
        const userRole = req.query.role?.toString() || 'player';

        const formattedSong = {
            ...songInfo,
            content:songData,
        };
        return res.json(formattedSong) as any;
    } catch (error) {
        console.error('Error loading song:', error);
        return res.status(500).json({ error: 'Error loading song' }) as any;
    }
};

// Select a song
const selectSong = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId, songId } = req.body;

        const songInfo = (songsIndex as SongIndex)[songId];

        if (!songInfo) {
            return res.status(404).json({ error: 'Song not found' }) as any;
        }

        const songData = await loadSongData(songInfo.file);

        await admin
            .firestore()
            .collection('sessions')
            .doc(sessionId)
            .update({ songId });


        const session = await admin
            .firestore()
            .collection('sessions')
            .doc(sessionId)
            .get();


        const connectedUsers = session.data()?.connectedUsers || [];

        for (const userId of connectedUsers) {
            const userDoc = await admin
                .firestore()
                .collection('users')
                .doc(userId)
                .get();

            const userRole = userDoc.data()?.role;
            const formattedContent = formatSongForRole(songData, userRole);
            console.log('formatted content:');
            console.log(formattedContent);
            
            
            io.to(`user:${userId}`).emit('song-selected', songData);
        }

        return res.status(200).json({ message: 'Song selected' }) as any;
    } catch (error) {
        console.error('Error selecting song:', error);
        return res.status(500).json({ error: 'Error selecting song' }) as any;
    }
};

// Assign routes to the router
router.get('/search', searchSongs as any);
router.get('/:id', getSongDetails as any);
router.post('/select', selectSong as any);

export default router;
