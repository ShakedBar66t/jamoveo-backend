"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const songs_json_1 = __importDefault(require("../data/songs.json"));
const socket_1 = require("../socket");
const router = (0, express_1.Router)();
function loadSongData(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const filePath = path_1.default.join(__dirname, '../data', fileName);
        const fileContent = yield fs_1.promises.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    });
}
function formatSongForRole(songData, role) {
    if (role === 'singer') {
        // For singers, return only lyrics
        return songData.map(line => line.map(segment => segment.lyrics).join(' ')).join('\n');
    }
    else {
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
const searchSongs = (req, res) => {
    var _a;
    const query = ((_a = req.query.query) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase()) || '';
    const results = Object.values(songs_json_1.default).filter(song => song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query));
    res.json(results);
};
// Get song details
const getSongDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const songId = req.params.id;
        const songInfo = songs_json_1.default[songId];
        if (!songInfo) {
            return res.status(404).json({ error: 'Song not found' });
        }
        const songData = yield loadSongData(songInfo.file);
        const userRole = ((_a = req.query.role) === null || _a === void 0 ? void 0 : _a.toString()) || 'player';
        const formattedSong = Object.assign(Object.assign({}, songInfo), { content: songData });
        return res.json(formattedSong);
    }
    catch (error) {
        console.error('Error loading song:', error);
        return res.status(500).json({ error: 'Error loading song' });
    }
});
// Select a song
const selectSong = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { sessionId, songId } = req.body;
        const songInfo = songs_json_1.default[songId];
        if (!songInfo) {
            return res.status(404).json({ error: 'Song not found' });
        }
        const songData = yield loadSongData(songInfo.file);
        yield firebase_admin_1.default
            .firestore()
            .collection('sessions')
            .doc(sessionId)
            .update({ songId });
        const session = yield firebase_admin_1.default
            .firestore()
            .collection('sessions')
            .doc(sessionId)
            .get();
        const connectedUsers = ((_a = session.data()) === null || _a === void 0 ? void 0 : _a.connectedUsers) || [];
        for (const userId of connectedUsers) {
            const userDoc = yield firebase_admin_1.default
                .firestore()
                .collection('users')
                .doc(userId)
                .get();
            const userRole = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.role;
            const formattedContent = formatSongForRole(songData, userRole);
            console.log('formatted content:');
            console.log(formattedContent);
            socket_1.io.to(`user:${userId}`).emit('song-selected', songData);
        }
        return res.status(200).json({ message: 'Song selected' });
    }
    catch (error) {
        console.error('Error selecting song:', error);
        return res.status(500).json({ error: 'Error selecting song' });
    }
});
// Assign routes to the router
router.get('/search', searchSongs);
router.get('/:id', getSongDetails);
router.post('/select', selectSong);
exports.default = router;
