const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const databaseUrl = process.env.MONGODB_URI || 'mongodb://nog19630:123@cluster0-shard-00-00.oicc7.mongodb.net:27017,cluster0-shard-00-01.oicc7.mongodb.net:27017,cluster0-shard-00-02.oicc7.mongodb.net:27017/COMPS381F_GroupProject?ssl=true&replicaSet=atlas-13zfqv-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
let isConnected = false;

async function connectDatabase() {
    if (isConnected) return;

    await mongoose.connect(databaseUrl).then(() => {
        isConnected = true;
        // console.log('Connected to MongoDB');
    }).catch((err) => {
        console.log(err);
    });
};

async function disconnectDatabase() {
    if (!isConnected) return;

    await mongoose.disconnect().then(() => {
        isConnected = false;
        // console.log('Disconnected from MongoDB');
    }).catch((err) => {
        console.log(err);
    });
}

async function executeQuery(queryFunction) {
    try {
        await connectDatabase();
        let result = await queryFunction();
        return result;
    } catch (err) {
        throw new Error(`Database query failed: ${err.message}`);
    } finally {
        await disconnectDatabase();
    }
}

async function findDocument(collection, query) {
    try {
        let result = await executeQuery(() => collection.find(query));
        return result;
    } catch (err) {
        throw new Error(`Failed to find document: ${err.message}`);
    }
}

async function insertDocument(collection, doc, oneOrMany = 'one') {
    try {
        let result = await executeQuery(() => collection.create(doc));
        return result;
    } catch (err) {
        throw new Error(`Failed to insert document: ${err.message}`);
    }
}

async function updateDocument(collection, query, updateData) {
    try {
        let result = await executeQuery(() => collection.findOneAndUpdate(
            query,
            { $set: updateData },  // Use $set to only update specified fields
            { 
                new: true,
                runValidators: true
            }
        ));
        return result;
    } catch (err) {
        throw new Error(`Failed to update document: ${err.message}`);
    }
}

async function deleteDocument(collection, query, oneOrMany = 'one') {
    try {
        let result;

        if (oneOrMany === 'one') {
            result = await executeQuery(() => collection.deleteOne(query));
        } else if (oneOrMany === 'many') {
            result = await executeQuery(() => collection.deleteMany(query));
        } else {
            throw new Error('Invalid input parameter');
        }

        return result;
    } catch (err) {
        throw new Error(`Failed to delete document: ${err.message}`);
    }
}

module.exports = {
    connectDatabase,
    disconnectDatabase,
    findDocument,
    insertDocument,
    updateDocument,
    deleteDocument
};

