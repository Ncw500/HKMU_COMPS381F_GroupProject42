//==============================================================================================
// dependencies setup



const express = require('express');
const session = require('express-session');
const formidable = require('express-formidable');
// const ffsmpeg = require('fluent-ffmpeg');
const passport = require('passport');// Use Passport Middleware
// const fs = require('fs').promises;  // Correct fs.promises import at the top level
const dotenv = require('dotenv');
// const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

// const crypto = require('crypto');
// asdsad
// Or use a simpler alternative without requiring crypto:
const generateRandomState = () => Math.random().toString(36).substring(7);

const Audio = require('./models/audioModel');
const DatabaseHandler = require('./lib/mongodbHandler');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { ObjectId } = require('mongodb');
const { type } = require('os');

//==============================================================================================
// environment variables setup

dotenv.config(); // Load environment variables from .env file

const PORT = process.env.PORT;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL;



const facebookAuth = {
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_CALLBACK_URL
};

const googleAuth = {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
};


const app = express();

//==============================================================================================
// Middleware setup

// 設置模板引擎
app.set('view engine', 'ejs');
app.set('views', './views');

// 設置中間件
app.use(formidable({
    uploadDir: './uploads',    // Directory for temporary files
    keepExtensions: true,      // Keep file extensions
    maxFileSize: 50 * 1024 * 1024, // Max file size (50MB)
    multiples: true           // Allow multiple files
}));
app.use(session({
    secret: 'COMPS381F_GROUPPROJECT', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 在生产环境中，使用 HTTPS 时应设置为 true
}));


app.use(passport.initialize());
app.use(passport.session());

app.use('/public', express.static('public'));




//==============================================================================================
// OAUTH setup
// Passport needs the following setup to save user data after authentication in the session:
// initialize passposrt and and session for persistent login sessions


var user = {};  // user object to be put in session

// passport needs ability to serialize and unserialize users out of session
// Passport uses serializeUser function to persist user data (after successful authentication) into session. 
// Function deserializeUser is used to retrieve user data from session.


// passport facebook strategy
passport.use(new FacebookStrategy({
    "clientID": facebookAuth.clientID,
    "clientSecret": facebookAuth.clientSecret,
    "callbackURL": facebookAuth.callbackURL
}, function (token, refreshToken, profile, done) {
        //console.log("Facebook Profile: " + JSON.stringify(profile));
        //console.log("Facebook Profile: ");
        //console.log(profile);

        const user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        }


        //console.log('user object: ' + JSON.stringify(user));
        return done(null, user); 
    })
);

passport.use(new GoogleStrategy({
    "clientID": googleAuth.clientID,
    "clientSecret": googleAuth.clientSecret,
    "callbackURL": googleAuth.callbackURL
}, function (token, refreshToken, profile, done) {
        //console.log("Google Profile: ");
        // console.log(profile);

        const user = {
            id: profile.id,
            name: profile.displayName,
            type: profile.provider
        };

        // console.log('user object: ' + JSON.stringify(user));
        return done(null, user);
    })
);

passport.serializeUser((user, done) => {
    done(null, user); 
});

passport.deserializeUser((user, done) => {
    done(null, user);
});





//=======================================================================================
//DB Control part
// Add these to your existing server.js imports



// Handle Find Audio Files
const handle_Find = async (req, res) => {
    try {
        const audioFiles = await DatabaseHandler.findDocument(Audio, {});
        res.status(200).render('list', {
            nAudios: audioFiles.length,
            audios: audioFiles,
            user: req.session.passport.user
        });
    } catch (err) {
        console.error('Find error:', err);
        res.status(500).render('info', {
            message: 'Error finding audio files',
            user: req.user
        });
    }
};

// Handle Edit Audio
const handle_Edit = async (req, res, criteria) => {
    try {
        const audioFile = await DatabaseHandler.findDocument(Audio, {
            _id: new ObjectId(criteria._id)
        });

        if (audioFile.length > 0) {
            res.status(200).render('edit', {
                audio: audioFile[0],
                user: req.user
            });
        } else {
            res.status(404).render('info', {
                message: 'Audio file not found!',
                user: req.user
            });
        }
    } catch (err) {
        console.error('Edit error:', err);
        res.status(500).render('info', {
            message: 'Error editing audio file',
            user: req.user
        });
    }
};

// In handle_Create
const handle_Create = async (req, res) => {
    try {

        console.log('Files received:', req.files); // Debug log
        const newAudio = {
            title: req.fields.title,
            artist: req.fields.artist,
            album: req.fields.album,
            genre: req.fields.genre,
            create_at: new Date(),
            update_at: new Date()
        };

        // Handle audio file upload
        if (req.files && req.files.audio_file) {
            console.log('Processing audio file:', req.files.audio_file); // Debug log

            const file = req.files.audio_file;
            const fileData = await readFile(file.path);
            newAudio.file_data = fileData;
            newAudio.file_name = file.originalFilename || file.name;
            newAudio.file_size = file.size;

            try {
                await unlink(file.path);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
            }
        }

        // Handle cover image upload
        if (req.files && req.files.cover_image) {
            console.log('Processing cover image:', req.files.cover_image); // Debug log

            const imageFile = req.files.cover_image;
            const imageData = await readFile(imageFile.path);
            newAudio.cover_image = imageData.toString('base64');

            try {
                await unlink(imageFile.path);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
            }
        }

        console.log('Saving audio document:', newAudio); // Debug log

        const result = await DatabaseHandler.insertDocument(Audio, newAudio);
        res.status(200).render('info', {
            message: `Created new audio file: ${newAudio.title}`,
            user: req.user
        });
    } catch (err) {
        console.error('Create error:', err);
        res.status(500).render('info', {
            message: 'Error creating audio file: ' + err.message,
            user: req.user
        });
    }
};


// In handle_Update
const handle_Update = async (req, res, criteria) => {
    try {
        // Only include fields that are actually being updated
        const updateDoc = {};

        // Update text fields if they exist
        if (req.fields.title) updateDoc.title = req.fields.title;
        if (req.fields.artist) updateDoc.artist = req.fields.artist;
        if (req.fields.album) updateDoc.album = req.fields.album;
        if (req.fields.genre) updateDoc.genre = req.fields.genre;
        updateDoc.update_at = new Date();

        // Handle audio file upload only if new file is provided
        if (req.files && req.files.audio_file && req.files.audio_file.size > 0) {
            const file = req.files.audio_file;
            const fileData = await readFile(file.path);
            updateDoc.file_data = fileData;
            updateDoc.file_name = file.originalFilename || file.name;
            updateDoc.file_size = file.size;

            try {
                await unlink(file.path);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
            }
        }

        // Handle cover image upload only if new image is provided
        if (req.files && req.files.cover_image && req.files.cover_image.size > 0) {
            const imageFile = req.files.cover_image;
            const imageData = await readFile(imageFile.path);
            updateDoc.cover_image = imageData.toString('base64');

            try {
                await unlink(imageFile.path);
            } catch (unlinkError) {
                console.error('Error deleting temporary file:', unlinkError);
            }
        }

        console.log('Updating with:', {
            ...updateDoc,
            file_data: updateDoc.file_data ? '[FILE DATA]' : undefined,
            cover_image: updateDoc.cover_image ? '[IMAGE DATA]' : undefined
        });

        const results = await DatabaseHandler.updateDocument(
            Audio,
            { _id: new ObjectId(criteria._id) },
            updateDoc
        );

        res.status(200).render('info', {
            message: `Updated audio file: ${updateDoc.title}`,
            user: req.user
        });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).render('info', {
            message: 'Error updating audio file: ' + err.message,
            user: req.user
        });
    }
};

// Handle Delete Audio
const handle_Delete = async (req, res) => {
    try {
        const audioFile = await DatabaseHandler.findDocument(Audio, {
            _id: new ObjectId(req.query._id)
        });

        if (audioFile.length > 0) {
            await DatabaseHandler.deleteDocument(Audio, {
                _id: new ObjectId(req.query._id)
            });
            res.status(200).render('info', {
                message: `Deleted audio file: ${audioFile[0].title}`,
                user: req.user
            });
        } else {
            res.status(404).render('info', {
                message: 'Audio file not found!',
                user: req.user
            });
        }
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).render('info', {
            message: 'Error deleting audio file',
            user: req.user
        });
    }
};

const validateAudioFile = (req, res, next) => {
    if (!req.fields || !req.fields.title || !req.fields.artist) {
        return res.status(400).render('info', {
            message: 'Title and artist are required',
            user: req.user
        });
    }

    if (!req.files || !req.files.audio_file) {
        return res.status(400).render('info', {
            message: 'Audio file is required',
            user: req.user
        });
    }

    next();
};


//=======================================================================================
// App routes functions

// app.get('/', isLoggedIn, async (req, res) => {
//     try {
//         let result = [];

//         result = await DatabaseHandler.findDocument(Audio, { filename: "test1" });  // Corrected
//         // result = await DatabaseHandler.insertDocument(Audio, {filename: "test2", data: "test2"}); // Corrected
//         // result = await DatabaseHandler.updateDocument(Audio, {filename: "test2"}, {filename: "test3"}); // Corrected
//         // result = await DatabaseHandler.deleteDocument(Audio, {filename: "test3"}); // Corrected

//         res.status(200).json(result).end();
//         // res.render('index', { result: result });
//     } catch (err) {
//         res.status(404).json(err.message).end();
//     }
// });

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated() || req.session.user) {
        return next();
    }
    res.redirect('/login');
}



app.get("/", isLoggedIn, function (req, res) {
    res.redirect('/content');
});

//Login Page
app.get("/login", function (req, res) {
    res.render("login");
});

// send to facebook to do the authentication
app.get("/auth/facebook", passport.authenticate("facebook" ,{ scope: "email", session: true }));
// handle the callback after facebook has authenticated the user
app.get("/auth/facebook/callback",
    passport.authenticate("facebook", {
        successRedirect: "/content",
        failureRedirect: "/"
    })
);

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/content',
        failureRedirect: '/'
    })
);

// Content/List route
app.get("/content", isLoggedIn, async (req, res) => {
    try {
        // Use handle_Find function we created earlier
        await handle_Find(req, res);
    } catch (err) {
        console.error("Error in content route:", err);
        res.status(500).render('info', {
            message: 'Error loading audio list',
            user: req.user
        });
    }
});

// Create routes
app.get('/create', isLoggedIn, (req, res) => {
    res.status(200).render('create', { user: req.user });
});

app.post('/create', isLoggedIn, validateAudioFile, async (req, res) => {
    try {
        await handle_Create(req, res);
    } catch (err) {
        console.error('Route error:', err);
        res.status(500).render('info', {
            message: 'Server error during file upload',
            user: req.user
        });
    }
});

// Details route
app.get('/details', isLoggedIn, async (req, res) => {
    try {
        const audioFile = await DatabaseHandler.findDocument(Audio, {
            _id: new ObjectId(req.query._id)
        });

        if (audioFile.length > 0) {
            res.status(200).render('details', {
                audio: audioFile[0],
                user: req.user
            });
        } else {
            res.status(404).render('info', {
                message: 'Audio file not found',
                user: req.user
            });
        }
    } catch (err) {
        console.error("Error in details route:", err);
        res.status(500).render('info', {
            message: 'Error loading audio details',
            user: req.user
        });
    }
});

// Edit routes
app.get('/edit', isLoggedIn, async (req, res) => {
    try {
        await handle_Edit(req, res, req.query);
    } catch (err) {
        console.error("Error in edit route:", err);
        res.status(500).render('info', {
            message: 'Error loading edit form',
            user: req.user
        });
    }
});

app.post('/update', isLoggedIn, validateAudioFile, async (req, res) => {
    try {
        const criteria = { _id: req.fields._id };
        await handle_Update(req, res, criteria);
    } catch (err) {
        console.error("Error in update route:", err);
        res.status(500).render('info', {
            message: 'Error updating audio file',
            user: req.user
        });
    }
});

// Delete route
app.get('/delete', isLoggedIn, async (req, res) => {
    try {
        await handle_Delete(req, res);
    } catch (err) {
        console.error("Error in delete route:", err);
        res.status(500).render('info', {
            message: 'Error deleting audio file',
            user: req.user
        });
    }
});

// Logout route (no changes needed)
app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/login');
    });
});

// ------------------------
// Add these routes to handle audio playback and download
// Add route to stream audio
app.get('/audio/:id', isLoggedIn, async (req, res) => {
    try {
        const audioFile = await DatabaseHandler.findDocument(Audio, {
            _id: new ObjectId(req.params.id)
        });

        if (!audioFile || audioFile.length === 0 || !audioFile[0].file_data) {
            return res.status(404).send('Audio file not found');
        }

        // Set the content type and headers for audio streaming
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioFile[0].file_data.length,
            'Accept-Ranges': 'bytes'
        });

        res.send(audioFile[0].file_data);
    } catch (err) {
        console.error('Audio streaming error:', err);
        res.status(500).send('Error streaming audio');
    }
});

// Add route to download audio
app.get('/download/:id', isLoggedIn, async (req, res) => {
    try {
        const audioFile = await DatabaseHandler.findDocument(Audio, {
            _id: new ObjectId(req.params.id)
        });

        if (!audioFile || audioFile.length === 0 || !audioFile[0].file_data) {
            return res.status(404).send('Audio file not found');
        }

        // Set headers for file download
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${audioFile[0].file_name}"`,
            'Content-Length': audioFile[0].file_data.length
        });

        res.send(audioFile[0].file_data);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
    }
});

//=========================
// 啟動伺服器

app.listen(PORT, '0.0.0.0', () => {
    console.log(`伺服器運行在 http://localhost:${PORT}`);
});

