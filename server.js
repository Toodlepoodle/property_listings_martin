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
app.use(express.static('public'));

// Create necessary directories
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
}

// Database file path
const DB_FILE = path.join(__dirname, 'data', 'properties.json');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
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

// Initialize database with sample properties if it doesn't exist
function initializeDatabase() {
    const dbData = loadProperties();
    
    if (dbData.properties.length === 0) {
        const initialProperties = [
            {
                id: 1,
                title: "IDEB Springfield Penthouse",
                type: "sale",
                bhk: "4BHK",
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
                bhk: "3.5BHK",
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
                title: "DSR Wood Winds",
                type: "sale",
                bhk: "3BHK",
                area: "1840",
                price: "2.15",
                location: "Sarjapur Road",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "West facing door and East facing Balcony, Semi furnished, Keys available for immediate visit, Non negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                title: "Sobha Sentosa Rental",
                type: "rent",
                bhk: "3BHK",
                area: "1804",
                price: "0.72",
                location: "Sarjapur Road",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, 3Balconies, Rent 72K Plus maintenance, Deposit 4 to 5 months, Ready to move, Only family, Middle Floor",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 6,
                title: "Banyan Tree Rental",
                type: "rent",
                bhk: "3BHK",
                area: "2410",
                price: "0.75",
                location: "Sarjapur Road",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 4Bath, 3Balconies, Carpet Area 2410, Rent 75K Plus maintenance, Deposit 3Lac, Available July 30th, Only family",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 7,
                title: "Purva Skywood",
                type: "rent",
                bhk: "2BHK",
                area: "1200",
                price: "0.60",
                location: "Sarjapur Road",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2 BHK, 2 Bath, 1 Balcony, Rent: 60k including maintenance, Deposit: 3 Lacs, Available From 22nd June",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 8,
                title: "Sobha Royal Pavilion Rental",
                type: "rent",
                bhk: "3BHK",
                area: "1560",
                price: "0.75",
                location: "Sarjapur Road",
                facing: "East",
                furnished: "Fully Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, 1Balcony, Fully furnished, Rent 75K, Maintenance 5K, Deposit 4.5Lac, Higher floor, Carpet 1200",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 9,
                title: "Prestige Kew Gardens",
                type: "rent",
                bhk: "2BHK",
                area: "1300",
                price: "0.60",
                location: "Whitefield",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, 1Balcony, Rent 60K, Maintenance 5.5K, Deposit 3Lac, Family and Female bachelors, Available July 1st",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 10,
                title: "Pranavas BSR Gtaaar",
                type: "rent",
                bhk: "2BHK",
                area: "1200",
                price: "0.55",
                location: "Sarjapur Road",
                facing: "North",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, Rent 55K, Maintenance 3K, Deposit 1.5Lac, Available July 1st, Family and bachelors both welcome",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 11,
                title: "Salarpuria Sattva Greenage",
                type: "rent",
                bhk: "3BHK",
                area: "1800",
                price: "0.85",
                location: "Whitefield",
                facing: "North",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, Rent 85K Plus maintenance, Deposit 3Lac, Higher floor, Only family, Ready to move",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 12,
                title: "SJR Palaza City",
                type: "rent",
                bhk: "3.5BHK",
                area: "1900",
                price: "0.65",
                location: "Whitefield",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3.5Bhk, 3Bath, Rent 65K, Maintenance 6.5K, Deposit 2.5Lac, Higher floor, Family and bachelors both welcome",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 13,
                title: "Silver Country Apartment",
                type: "rent",
                bhk: "3BHK",
                area: "1650",
                price: "0.48",
                location: "Electronic City",
                facing: "South",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, 2Balconies, Rent 48K negotiable, Maintenance 3.7K, Deposit 2Lac, Available June 30th, Only family",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 14,
                title: "Ozone Residenza",
                type: "rent",
                bhk: "3BHK",
                area: "2200",
                price: "1.50",
                location: "Whitefield",
                facing: "North",
                furnished: "Fully Furnished",
                parking: "2 Covered",
                description: "3Bhk, 4Bath, 3Balconies, With Study Room, Rent 1.5Lac Plus maintenance, Deposit 6Months, Ground floor, Family and Female bachelors",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 15,
                title: "Sobha Garnet",
                type: "rent",
                bhk: "3BHK",
                area: "1750",
                price: "0.75",
                location: "Sarjapur Road",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, Ground floor, Rent 75K Including maintenance, Deposit 5Months, Family and bachelors both welcome",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 16,
                title: "SNN Raj Eternia",
                type: "rent",
                bhk: "3BHK",
                area: "1680",
                price: "0.70",
                location: "Whitefield",
                facing: "North",
                furnished: "Fully Furnished",
                parking: "1 Covered",
                description: "3Bhk, 2Bath, 2Balconies, Rent 70k, Maintenance 5 to 6K, Deposit 3Lac, Higher floor, Available July 1st, Only family",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 17,
                title: "Vaishnavi Orchids Villament Duplex - 1",
                type: "sale",
                bhk: "3BHK",
                area: "3150",
                price: "3.28",
                location: "Whitefield",
                facing: "South",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "Duplex villa, Ground & 1st Floor, South Facing Main Door, 3bhk, 3bath, 3150 Sq ft, Negotiable price",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 18,
                title: "Vaishnavi Orchids Villament Duplex - 2",
                type: "sale",
                bhk: "3BHK",
                area: "3100",
                price: "2.95",
                location: "Whitefield",
                facing: "South",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "Duplex villa, Ground & 1st Floor, South Facing Main Door & West Facing, 3bhk, 3bath, 3100 Sq ft, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 19,
                title: "Vaishnavi Orchids Villament Duplex - 3",
                type: "sale",
                bhk: "3BHK",
                area: "3250",
                price: "3.58",
                location: "Whitefield",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "Duplex villa, 2nd & 3rd Floor with Terrace, East Facing Main Door, 3bhk, 3bath, 3250 Sq ft, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 20,
                title: "Prestige Ferns Residency (PFR)",
                type: "sale",
                bhk: "2BHK",
                area: "1197",
                price: "1.89",
                location: "Whitefield",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, 1197 Sq ft, 13th floor, West Facing, Semi Furnished, One Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 21,
                title: "Bhuvana Greens Apartment",
                type: "sale",
                bhk: "2BHK",
                area: "1250",
                price: "1.32",
                location: "Electronic City",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, 1250 Sq ft, 7th floor, East Facing Main Door, West facing Balcony, One Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 22,
                title: "Mana Jardin Apartment",
                type: "sale",
                bhk: "2BHK",
                area: "1241",
                price: "1.10",
                location: "Doddakanahalli",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, 1241 Sq feet, West facing Main Door, Ground floor, One Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 23,
                title: "Purva Sunshine Apartment",
                type: "sale",
                bhk: "3BHK",
                area: "1757",
                price: "2.20",
                location: "Electronic City",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, Semi furnished, 1757 Sq ft, 6th floor, West Facing, One Covered car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 24,
                title: "Bren Zahara Apartment - Brand New",
                type: "sale",
                bhk: "1BHK",
                area: "495",
                price: "0.56",
                location: "Electronic City",
                facing: "South",
                furnished: "Unfurnished",
                parking: "1 Covered",
                description: "Brand New Flat, 1Bhk, 1 Bath, 495 Sq ft, South Facing, 1st floor, Unfurnished, One Covered Car Parking",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 25,
                title: "Sharanya Arcade Apartment",
                type: "sale",
                bhk: "2BHK",
                area: "1121",
                price: "0.65",
                location: "Whitefield",
                facing: "West",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2 Bhk, 2 bath, 1121 Sq ft, West Facing Main Door, 2nd floor, Semi Furnished, Basic Apt with Power Back Up, Lift, Negotiable",
                images: [],
                videos: [],
                contact: "9019040620",
                createdAt: new Date().toISOString()
            },
            {
                id: 26,
                title: "Bren Imperia Apartment",
                type: "sale",
                bhk: "3BHK",
                area: "1779",
                price: "3.39",
                location: "Whitefield",
                facing: "North",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, 1779Sq ft, North Facing Main Door, Semi Furnished, 1st Floor, One Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 27,
                title: "Kumar I Life Apartment",
                type: "sale",
                bhk: "3BHK",
                area: "1830",
                price: "2.80",
                location: "Whitefield",
                facing: "North",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3Bhk, 3Bath, 1830Sq ft, Semi Furnished, North Facing, 6th Floor, One Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 28,
                title: "Bren Celestia Apartment",
                type: "sale",
                bhk: "2BHK",
                area: "1350",
                price: "1.55",
                location: "Whitefield",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "2Bhk, 2Bath, 1350 Sq ft, Semi Furnished, East Facing, 5th floor, one Covered Car Parking, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 29,
                title: "Sobha Manhattan Towers",
                type: "sale",
                bhk: "3BHK",
                area: "1755",
                price: "2.30",
                location: "Hosur Main Road",
                facing: "South",
                furnished: "Semi Furnished",
                parking: "1 Covered",
                description: "3BHK, SBUA 1755 Sqft, 38th floor (Top most floor), 2 Balconies, Tower-1, Possession 2026 December End, No National Highway",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            },
            {
                id: 30,
                title: "DLF Westend Heights",
                type: "sale",
                bhk: "3BHK",
                area: "1570",
                price: "1.72",
                location: "Akshayanagar",
                facing: "South",
                furnished: "Unfurnished",
                parking: "1 Covered",
                description: "3BHK Unfinished brand New flat Never Occupied, 3 Bathroom, 3 Balcony, Utility-1, 11th Floor out of 18 Floors, Main Door South East, A Khata, 8 years old, Negotiable",
                images: [],
                videos: [],
                contact: "9902925519",
                createdAt: new Date().toISOString()
            }
        ];

        const dbData = {
            properties: initialProperties,
            nextId: 31
        };

        saveProperties(dbData);
        console.log('Database initialized with', initialProperties.length, 'properties');
        return dbData;
    }
    
    return dbData;
}

// Initialize database on startup
const dbData = initializeDatabase();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all properties with search and filters
app.get('/api/properties', (req, res) => {
    try {
        const dbData = loadProperties();
        let filteredProperties = [...dbData.properties];
        
        const { search, type, minPrice, maxPrice, bhk, location, facing } = req.query;
        
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
        
        if (type && type !== 'all') {
            filteredProperties = filteredProperties.filter(property => property.type === type);
        }
        
        if (minPrice) {
            filteredProperties = filteredProperties.filter(property => parseFloat(property.price) >= parseFloat(minPrice));
        }
        
        if (maxPrice) {
            filteredProperties = filteredProperties.filter(property => parseFloat(property.price) <= parseFloat(maxPrice));
        }
        
        if (bhk && bhk !== 'all') {
            filteredProperties = filteredProperties.filter(property => property.bhk.includes(bhk));
        }
        
        if (location) {
            filteredProperties = filteredProperties.filter(property => 
                property.location.toLowerCase().includes(location.toLowerCase())
            );
        }
        
        if (facing && facing !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.facing.toLowerCase().includes(facing.toLowerCase())
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

// Add new property
app.post('/api/properties', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), (req, res) => {
    try {
        const {
            title, type, bhk, area, price, location, facing, 
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

// Generate shareable link
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
        propertiesCount: loadProperties().properties.length
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Property Listing Server running on port ${PORT}`);
    console.log(`📊 Loaded ${loadProperties().properties.length} properties from database`);
    console.log(`💾 Database file: ${DB_FILE}`);
});