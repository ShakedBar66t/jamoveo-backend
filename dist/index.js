"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./socket");
const auth_1 = __importDefault(require("./routes/auth"));
const session_1 = __importDefault(require("./routes/session"));
const songs_1 = __importDefault(require("./routes/songs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
(0, socket_1.initializeSocket)(server);
app.use((0, cors_1.default)({
    origin: '*'
}));
app.use(express_1.default.json());
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert('serviceAccountKey.json'),
});
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/session', session_1.default);
app.use('/api/songs', songs_1.default);
app.get('/*', (req, res) => {
    res.sendFile(path_1.default.resolve('public', 'index.html'), (err) => {
        if (err) {
            res.status(500).send(err);
        }
    });
});
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
