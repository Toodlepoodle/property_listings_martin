const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/media', express.static('media')); // New media folder
app.use(express.static('public'));

// Create necessary directories
const directories = ['uploads', 'data', 'media', 'media/bucket1', 'media/bucket2', 'media/bucket3'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Database file paths
const DB_FILE = path.join(__dirname, 'data', 'properties.json');
const MEDIA_DB_FILE = path.join(__dirname, 'data', 'media.json');

// Configure multer for property uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer for media bucket uploads
const mediaStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const bucket = req.body.bucket || 'bucket1';
        cb(null, `media/${bucket}/`);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only images, videos, and PDFs allowed!');
        }
    }
});

const mediaUpload = multer({ 
    storage: mediaStorage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for media
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only images and videos allowed!');
        }
    }
});

// Database functions
function loadProperties() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { properties: [], nextId: 1 };
    } catch (error) {
        console.error('Error loading properties:', error);
        return { properties: [], nextId: 1 };
    }
}

function saveProperties(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving properties:', error);
        return false;
    }
}

function loadMedia() {
    try {
        if (fs.existsSync(MEDIA_DB_FILE)) {
            const data = fs.readFileSync(MEDIA_DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { media: [], nextId: 1 };
    } catch (error) {
        console.error('Error loading media:', error);
        return { media: [], nextId: 1 };
    }
}

function saveMedia(data) {
    try {
        fs.writeFileSync(MEDIA_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving media:', error);
        return false;
    }
}

// Initialize database with enhanced sample properties
function initializeDatabase() {
    const dbData = loadProperties();
    
    if (dbData.properties.length === 0) {
        const initialProperties = [
            {
                id: 1,
                title: "IDEB Springfield Penthouse",
                type: "sale",
                bhk: "4BHK",
                bathrooms: "4",
                area: "2554",
                price: "3.45",
                location: "Sarjapur Road",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "4bhk 4 Toilet, SBA Around 2554 Sqft including Terrace Area, B Khata property E khata is available, Two Covered Parking",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Adarsh Lakefront Bellandur",
                type: "sale",
                bhk: "3BHK",
                bathrooms: "3",
                area: "2315",
                price: "4.5",
                location: "Bellandur Sarjapura Road",
                facing: "East",
                furnished: "Ready to move-in",
                parking: "1 Covered",
                description: "Ready to move-in, East facing balconies, swimming pool view, Flat on 9th floor, East Balcony, Main door South",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: "Sobha Royal Pavillion",
                type: "sale",
                bhk: "3BHK",
                bathrooms: "4",
                area: "1735",
                price: "3.05",
                location: "Sarjapur Road",
                facing: "North",
                furnished: "Unfurnished",
                parking: "1 Covered",
                description: "3BHK + 3 Bathroom + Servant room (with extra Bathroom), 1st Floor, One Balcony, Slightly Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                title: "Modern Apartment Koramangala",
                type: "rent",
                bhk: "2BHK",
                bathrooms: "2",
                area: "1200",
                price: "0.45",
                location: "Koramangala 4th Block",
                facing: "North",
                furnished: "Fully Furnished",
                parking: "1 Covered",
                description: "Fully furnished 2BHK in prime Koramangala location. Near metro, restaurants, and IT parks.",
                images: [],
                videos: [],
                contact: "9123456789",
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                title: "Luxury Villa Whitefield",
                type: "sale",
                bhk: "5BHK",
                bathrooms: "5",
                area: "3500",
                price: "6.75",
                location: "Whitefield ITPL Road",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "3 Covered",
                description: "Spacious villa with garden, modern amenities. Perfect for large families.",
                images: [],
                videos: [],
                contact: "9876543210",
                createdAt: new Date().toISOString()
            }
        ];

        const dbData = {
            properties: initialProperties,
            nextId: 6
        };

        saveProperties(dbData);
        console.log('Database initialized with', initialProperties.length, 'properties');
        return dbData;
    }
    
    return dbData;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced search with multiple parameters
app.get('/api/properties', (req, res) => {
    try {
        const dbData = loadProperties();
        let filteredProperties = [...dbData.properties];
        
        const { 
            search, type, minPrice, maxPrice, bhk, bathrooms, 
            location, facing, minArea, maxArea, furnished 
        } = req.query;
        
        // Text search
        if (search) {
            const searchLower = search.toLowerCase();
            filteredProperties = filteredProperties.filter(property => 
                property.title.toLowerCase().includes(searchLower) ||
                property.location.toLowerCase().includes(searchLower) ||
                property.description.toLowerCase().includes(searchLower) ||
                property.bhk.toLowerCase().includes(searchLower) ||
                property.furnished.toLowerCase().includes(searchLower) ||
                property.facing.toLowerCase().includes(searchLower)
            );
        }
        
        // Type filter
        if (type && type !== 'all') {
            filteredProperties = filteredProperties.filter(property => property.type === type);
        }
        
        // Price filters
        if (minPrice) {
            filteredProperties = filteredProperties.filter(property => parseFloat(property.price) >= parseFloat(minPrice));
        }
        if (maxPrice) {
            filteredProperties = filteredProperties.filter(property => parseFloat(property.price) <= parseFloat(maxPrice));
        }
        
        // BHK filter
        if (bhk && bhk !== 'all') {
            filteredProperties = filteredProperties.filter(property => property.bhk.includes(bhk));
        }
        
        // Bathrooms filter
        if (bathrooms && bathrooms !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.bathrooms && property.bathrooms.includes(bathrooms)
            );
        }
        
        // Area filters
        if (minArea) {
            filteredProperties = filteredProperties.filter(property => parseInt(property.area) >= parseInt(minArea));
        }
        if (maxArea) {
            filteredProperties = filteredProperties.filter(property => parseInt(property.area) <= parseInt(maxArea));
        }
        
        // Location filter
        if (location) {
            filteredProperties = filteredProperties.filter(property => 
                property.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        
        // Facing filter
        if (facing && facing !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.facing.toLowerCase().includes(facing.toLowerCase())
            );
        }
        
        // Furnished filter
        if (furnished && furnished !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.furnished.toLowerCase().includes(furnished.toLowerCase())
            );
        }
        
        // Sort by newest first
        filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(filteredProperties);
    } catch (error) {
        console.error('Error getting properties:', error);
        res.status(500).json({ error: 'Failed to load properties' });
    }
});

// Get single property
app.get('/api/properties/:id', (req, res) => {
    try {
        const dbData = loadProperties();
        const property = dbData.properties.find(p => p.id === parseInt(req.params.id));
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json(property);
    } catch (error) {
        console.error('Error getting property:', error);
        res.status(500).json({ error: 'Failed to load property' });
    }
});

// Add new property with enhanced fields
app.post('/api/properties', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), (req, res) => {
    try {
        const {
            title, type, bhk, bathrooms, area, price, location, facing, 
            furnished, parking, description, contact
        } = req.body;
        
        const images = req.files?.images?.map(file => `/uploads/${file.filename}`) || [];
        const videos = req.files?.videos?.map(file => `/uploads/${file.filename}`) || [];
        
        const dbData = loadProperties();
        
        const newProperty = {
            id: dbData.nextId,
            title,
            type,
            bhk,
            bathrooms: bathrooms || "1",
            area,
            price,
            location,
            facing,
            furnished,
            parking,
            description,
            contact,
            images,
            videos,
            createdAt: new Date().toISOString()
        };
        
        dbData.properties.push(newProperty);
        dbData.nextId++;
        
        if (saveProperties(dbData)) {
            res.status(201).json(newProperty);
        } else {
            res.status(500).json({ error: 'Failed to save property' });
        }
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ error: 'Failed to add property' });
    }
});

// Media upload endpoint
app.post('/api/upload-media', mediaUpload.array('media', 20), (req, res) => {
    try {
        const { bucket, title, description } = req.body;
        const files = req.files || [];
        
        if (files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const mediaData = loadMedia();
        
        const uploadedFiles = files.map(file => ({
            id: mediaData.nextId++,
            originalName: file.originalname,
            filename: file.filename,
            path: `/media/${bucket}/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype,
            bucket: bucket || 'bucket1',
            title: title || file.originalname,
            description: description || '',
            uploadedAt: new Date().toISOString()
        }));
        
        mediaData.media.push(...uploadedFiles);
        
        if (saveMedia(mediaData)) {
            res.status(201).json({
                message: 'Files uploaded successfully',
                files: uploadedFiles
            });
        } else {
            res.status(500).json({ error: 'Failed to save media data' });
        }
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Get media files
app.get('/api/media', (req, res) => {
    try {
        const { bucket } = req.query;
        const mediaData = loadMedia();
        
        let files = mediaData.media;
        if (bucket && bucket !== 'all') {
            files = files.filter(file => file.bucket === bucket);
        }
        
        res.json(files);
    } catch (error) {
        console.error('Error getting media:', error);
        res.status(500).json({ error: 'Failed to load media' });
    }
});

// Delete property
app.delete('/api/properties/:id', (req, res) => {
    try {
        const dbData = loadProperties();
        const propertyIndex = dbData.properties.findIndex(p => p.id === parseInt(req.params.id));
        
        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        const property = dbData.properties[propertyIndex];
        
        // Delete associated files
        [...property.images, ...property.videos].forEach(filePath => {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.unlinkSync(fullPath);
                } catch (fileError) {
                    console.error('Error deleting file:', fullPath, fileError);
                }
            }
        });
        
        // Remove property from database
        dbData.properties.splice(propertyIndex, 1);
        
        if (saveProperties(dbData)) {
            res.json({ message: 'Property deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete property' });
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

// Enhanced share with search filters
app.get('/api/share/:id', (req, res) => {
    try {
        const dbData = loadProperties();
        const property = dbData.properties.find(p => p.id === parseInt(req.params.id));
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        const shareUrl = `${req.protocol}://${req.get('host')}/property/${property.id}`;
        res.json({ shareUrl, property });
    } catch (error) {
        console.error('Error generating share link:', error);
        res.status(500).json({ error: 'Failed to generate share link' });
    }
});

// Property detail page
app.get('/property/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'property.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        propertiesCount: loadProperties().properties.length,
        mediaCount: loadMedia().media.length
    });
});

// Initialize database on startup
const dbData = initializeDatabase();

app.listen(PORT, () => {
    console.log(`🚀 Enhanced Property Listing Server running on port ${PORT}`);
    console.log(`📊 Loaded ${loadProperties().properties.length} properties from database`);
    console.log(`📁 Media storage buckets created: bucket1, bucket2, bucket3`);
    console.log(`💾 Database file: ${DB_FILE}`);
    console.log(`📸 Media database: ${MEDIA_DB_FILE}`);
});