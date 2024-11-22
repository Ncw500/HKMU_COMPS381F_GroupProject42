const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
    title: String,
    artist: String,
    album: String,
    genre: String,
    duration: Number,
    cover_image: String,
    file_name: String,
    file_data: Buffer,
    file_size: Number,
    bitrate: Number,
    format: String,
    create_at: Date,
    update_at: Date
});

const Audio = mongoose.model('Audio', audioSchema);

module.exports = Audio;