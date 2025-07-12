const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'adiiroy67@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'ggji sbkc bufx iyqa';

// Email configuration
const transporter = nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
        user: ADMIN_EMAIL,
        pass: EMAIL_PASSWORD
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/media', express.static('media'));
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
const REQUIREMENTS_DB_FILE = path.join(__dirname, 'data', 'requirements.json');
const USERS_DB_FILE = path.join(__dirname, 'data', 'users.json');

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
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Only images, videos, and PDFs allowed!');
    }
});

const mediaUpload = multer({ 
    storage: mediaStorage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mkv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Only images and videos allowed!');
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

function loadRequirements() {
    try {
        if (fs.existsSync(REQUIREMENTS_DB_FILE)) {
            const data = fs.readFileSync(REQUIREMENTS_DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { requirements: [], nextId: 1 };
    } catch (error) {
        console.error('Error loading requirements:', error);
        return { requirements: [], nextId: 1 };
    }
}

function saveRequirements(data) {
    try {
        fs.writeFileSync(REQUIREMENTS_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving requirements:', error);
        return false;
    }
}

function loadUsers() {
    try {
        if (fs.existsSync(USERS_DB_FILE)) {
            const data = fs.readFileSync(USERS_DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { users: [], nextId: 1 };
    } catch (error) {
        console.error('Error loading users:', error);
        return { users: [], nextId: 1 };
    }
}

function saveUsers(data) {
    try {
        fs.writeFileSync(USERS_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Property matching function
function checkPropertyMatches(property) {
    const requirementsData = loadRequirements();
    
    requirementsData.requirements.forEach(requirement => {
        if (isPropertyMatch(property, requirement)) {
            sendMatchNotificationEmail(property, requirement);
        }
    });
}

function isPropertyMatch(property, requirement) {
    // Check type match
    if (requirement.type !== 'any' && property.type !== requirement.type) {
        return false;
    }
    
    // Check price range
    const propertyPrice = parseFloat(property.price);
    if (requirement.minPrice && propertyPrice < parseFloat(requirement.minPrice)) {
        return false;
    }
    if (requirement.maxPrice && propertyPrice > parseFloat(requirement.maxPrice)) {
        return false;
    }
    
    // Check area range
    const propertyArea = parseInt(property.area);
    if (requirement.minArea && propertyArea < parseInt(requirement.minArea)) {
        return false;
    }
    if (requirement.maxArea && propertyArea > parseInt(requirement.maxArea)) {
        return false;
    }
    
    // Check location (partial match)
    if (requirement.location && requirement.location !== 'any') {
        const locationMatch = property.location.toLowerCase().includes(requirement.location.toLowerCase());
        if (!locationMatch) return false;
    }
    
    // Check BHK
    if (requirement.bhk && requirement.bhk !== 'any') {
        if (!property.bhk.toLowerCase().includes(requirement.bhk.toLowerCase())) {
            return false;
        }
    }
    
    // Check bathrooms
    if (requirement.bathrooms && requirement.bathrooms !== 'any') {
        if (property.bathrooms !== requirement.bathrooms) {
            return false;
        }
    }
    
    return true;
}

async function sendMatchNotificationEmail(property, requirement) {
    const mailOptions = {
        from: ADMIN_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🏠 Property Match Found!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">🎉 Property Match Alert!</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #2c3e50;">Matched Property:</h3>
                    <p><strong>Title:</strong> ${property.title}</p>
                    <p><strong>Type:</strong> ${property.type}</p>
                    <p><strong>Price:</strong> ₹${property.price} ${property.type === 'sale' ? 'Cr' : 'Lakh/month'}</p>
                    <p><strong>Area:</strong> ${property.area} Sq Ft</p>
                    <p><strong>Location:</strong> ${property.location}</p>
                    <p><strong>Configuration:</strong> ${property.bhk}</p>
                    <p><strong>Bathrooms:</strong> ${property.bathrooms || 'N/A'}</p>
                    <p><strong>Contact:</strong> ${property.contact}</p>
                </div>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #27ae60;">Matched Requirement:</h3>
                    <p><strong>Client Name:</strong> ${requirement.clientName}</p>
                    <p><strong>Contact:</strong> ${requirement.clientContact}</p>
                    <p><strong>Email:</strong> ${requirement.clientEmail}</p>
                    <p><strong>Type:</strong> ${requirement.type}</p>
                    <p><strong>Budget:</strong> ₹${requirement.minPrice || '0'} - ₹${requirement.maxPrice || '∞'} ${requirement.type === 'sale' ? 'Cr' : 'Lakh/month'}</p>
                    <p><strong>Preferred Area:</strong> ${requirement.minArea || '0'} - ${requirement.maxArea || '∞'} Sq Ft</p>
                    <p><strong>Location:</strong> ${requirement.location || 'Any'}</p>
                    <p><strong>Configuration:</strong> ${requirement.bhk || 'Any'}</p>
                </div>
                
                <p style="color: #7f8c8d; font-size: 14px;">
                    This email was automatically generated when a new property matched an existing requirement.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Match notification email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Initialize database
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
            }
        ];

        const dbData = {
            properties: initialProperties,
            nextId: 3
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

// Authentication routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const usersData = loadUsers();
        
        // Check if user already exists
        const existingUser = usersData.users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: usersData.nextId,
            username,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        usersData.users.push(newUser);
        usersData.nextId++;
        
        if (saveUsers(usersData)) {
            const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
            res.status(201).json({ 
                message: 'User registered successfully',
                token,
                user: { id: newUser.id, username: newUser.username, email: newUser.email }
            });
        } else {
            res.status(500).json({ error: 'Failed to save user' });
        }
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const usersData = loadUsers();
        const user = usersData.users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            message: 'Login successful',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Properties routes
app.get('/api/properties', (req, res) => {
    try {
        const dbData = loadProperties();
        let filteredProperties = [...dbData.properties];
        
        const { 
            search, type, minPrice, maxPrice, bhk, bathrooms, 
            location, facing, minArea, maxArea, furnished 
        } = req.query;
        
        // Apply filters (same as before)
        if (search) {
            const searchLower = search.toLowerCase();
            filteredProperties = filteredProperties.filter(property => 
                property.title.toLowerCase().includes(searchLower) ||
                property.location.toLowerCase().includes(searchLower) ||
                property.description.toLowerCase().includes(searchLower)
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
        
        if (bathrooms && bathrooms !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.bathrooms && property.bathrooms.includes(bathrooms)
            );
        }
        
        if (minArea) {
            filteredProperties = filteredProperties.filter(property => parseInt(property.area) >= parseInt(minArea));
        }
        if (maxArea) {
            filteredProperties = filteredProperties.filter(property => parseInt(property.area) <= parseInt(maxArea));
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
        
        if (furnished && furnished !== 'all') {
            filteredProperties = filteredProperties.filter(property => 
                property.furnished.toLowerCase().includes(furnished.toLowerCase())
            );
        }
        
        filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(filteredProperties);
    } catch (error) {
        console.error('Error getting properties:', error);
        res.status(500).json({ error: 'Failed to load properties' });
    }
});

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

app.post('/api/properties', authenticateToken, upload.fields([
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
            title, type, bhk, bathrooms: bathrooms || "1", area, price, location, facing,
            furnished, parking, description, contact, images, videos,
            createdAt: new Date().toISOString()
        };
        
        dbData.properties.push(newProperty);
        dbData.nextId++;
        
        if (saveProperties(dbData)) {
            // Check for matches with existing requirements
            checkPropertyMatches(newProperty);
            res.status(201).json(newProperty);
        } else {
            res.status(500).json({ error: 'Failed to save property' });
        }
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ error: 'Failed to add property' });
    }
});

app.put('/api/properties/:id', authenticateToken, upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
]), (req, res) => {
    try {
        const dbData = loadProperties();
        const propertyIndex = dbData.properties.findIndex(p => p.id === parseInt(req.params.id));
        
        if (propertyIndex === -1) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        const {
            title, type, bhk, bathrooms, area, price, location, facing, 
            furnished, parking, description, contact
        } = req.body;
        
        const existingProperty = dbData.properties[propertyIndex];
        const images = req.files?.images?.map(file => `/uploads/${file.filename}`) || existingProperty.images;
        const videos = req.files?.videos?.map(file => `/uploads/${file.filename}`) || existingProperty.videos;
        
        const updatedProperty = {
            ...existingProperty,
            title, type, bhk, bathrooms: bathrooms || existingProperty.bathrooms, 
            area, price, location, facing, furnished, parking, description, contact,
            images, videos, updatedAt: new Date().toISOString()
        };
        
        dbData.properties[propertyIndex] = updatedProperty;
        
        if (saveProperties(dbData)) {
            res.json(updatedProperty);
        } else {
            res.status(500).json({ error: 'Failed to update property' });
        }
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

app.delete('/api/properties/:id', authenticateToken, (req, res) => {
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

// Requirements routes
app.get('/api/requirements', (req, res) => {
    try {
        const requirementsData = loadRequirements();
        res.json(requirementsData.requirements);
    } catch (error) {
        console.error('Error getting requirements:', error);
        res.status(500).json({ error: 'Failed to load requirements' });
    }
});

app.post('/api/requirements', (req, res) => {
    try {
        const {
            clientName, clientEmail, clientContact, type, minPrice, maxPrice,
            minArea, maxArea, location, bhk, bathrooms, furnished, additionalRequirements
        } = req.body;
        
        const requirementsData = loadRequirements();
        
        const newRequirement = {
            id: requirementsData.nextId,
            clientName, clientEmail, clientContact, type, minPrice, maxPrice,
            minArea, maxArea, location, bhk, bathrooms, furnished, additionalRequirements,
            createdAt: new Date().toISOString()
        };
        
        requirementsData.requirements.push(newRequirement);
        requirementsData.nextId++;
        
        if (saveRequirements(requirementsData)) {
            // Check existing properties for matches
            const propertiesData = loadProperties();
            propertiesData.properties.forEach(property => {
                if (isPropertyMatch(property, newRequirement)) {
                    sendMatchNotificationEmail(property, newRequirement);
                }
            });
            
            res.status(201).json({ 
                message: 'Requirement submitted successfully',
                requirement: newRequirement 
            });
        } else {
            res.status(500).json({ error: 'Failed to save requirement' });
        }
    } catch (error) {
        console.error('Error adding requirement:', error);
        res.status(500).json({ error: 'Failed to add requirement' });
    }
});

// Media upload
app.post('/api/upload-media', authenticateToken, mediaUpload.array('media', 20), (req, res) => {
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

// Share property
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        propertiesCount: loadProperties().properties.length,
        requirementsCount: loadRequirements().requirements.length,
        mediaCount: loadMedia().media.length
    });
});

// Initialize database on startup
initializeDatabase();

app.listen(PORT, () => {
    console.log(`🚀 Enhanced Property Listing Server running on port ${PORT}`);
    console.log(`📊 Loaded ${loadProperties().properties.length} properties`);
    console.log(`📋 Loaded ${loadRequirements().requirements.length} requirements`);
    console.log(`📁 Media storage buckets created: bucket1, bucket2, bucket3`);
    console.log(`💾 Database files initialized`);
});