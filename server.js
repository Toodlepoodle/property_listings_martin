const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'adiiroy67@gmail.com';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'ggji sbkc bufx iyqa';

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
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
const USERS_DB_FILE = path.join(__dirname, 'data', 'users.json');
const REQUIREMENTS_DB_FILE = path.join(__dirname, 'data', 'requirements.json');
const OTP_DB_FILE = path.join(__dirname, 'data', 'otps.json');

// Configure multer for uploads
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
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb('Error: Only images, videos, and PDFs allowed!');
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

function loadOTPs() {
    try {
        if (fs.existsSync(OTP_DB_FILE)) {
            const data = fs.readFileSync(OTP_DB_FILE, 'utf8');
            return JSON.parse(data);
        }
        return { otps: [] };
    } catch (error) {
        console.error('Error loading OTPs:', error);
        return { otps: [] };
    }
}

function saveOTPs(data) {
    try {
        fs.writeFileSync(OTP_DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving OTPs:', error);
        return false;
    }
}

// OTP Functions
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(identifier, otp, type) {
    const otpData = loadOTPs();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Remove any existing OTP for this identifier
    otpData.otps = otpData.otps.filter(item => item.identifier !== identifier);
    
    // Add new OTP
    otpData.otps.push({
        identifier,
        otp,
        type, // 'email' or 'phone'
        expiryTime: expiryTime.toISOString(),
        attempts: 0
    });
    
    saveOTPs(otpData);
}

function verifyOTP(identifier, otp) {
    const otpData = loadOTPs();
    const otpRecord = otpData.otps.find(item => item.identifier === identifier);
    
    if (!otpRecord) {
        return { success: false, message: 'OTP not found or expired' };
    }
    
    if (new Date() > new Date(otpRecord.expiryTime)) {
        // Remove expired OTP
        otpData.otps = otpData.otps.filter(item => item.identifier !== identifier);
        saveOTPs(otpData);
        return { success: false, message: 'OTP has expired' };
    }
    
    if (otpRecord.attempts >= 3) {
        return { success: false, message: 'Too many failed attempts' };
    }
    
    if (otpRecord.otp !== otp) {
        otpRecord.attempts++;
        saveOTPs(otpData);
        return { success: false, message: 'Invalid OTP' };
    }
    
    // OTP is valid, remove it
    otpData.otps = otpData.otps.filter(item => item.identifier !== identifier);
    saveOTPs(otpData);
    
    return { success: true, message: 'OTP verified successfully' };
}

async function sendEmailOTP(email, otp) {
    const mailOptions = {
        from: ADMIN_EMAIL,
        to: email,
        subject: '🔐 Your Property Portal Login OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🏠 Property Portal</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your Login Verification Code</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">Your OTP Code</h2>
                    <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block; border: 2px solid #667eea;">
                        <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #7f8c8d; margin-top: 20px;">This OTP will expire in 10 minutes</p>
                </div>
                
                <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>© 2024 Property Portal - Secure Property Management</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Initialize database
function initializeDatabase() {
    const dbData = loadProperties();
    
    if (dbData.properties.length === 0) {
        const initialProperties = [
            {
                id: 1,
                title: "Luxury Apartment in Koramangala",
                type: "sale",
                bhk: "3BHK",
                bathrooms: "3",
                area: "1800",
                price: "2.5",
                location: "Koramangala 4th Block",
                facing: "East",
                furnished: "Semi Furnished",
                parking: "2 Covered",
                description: "Beautiful 3BHK apartment with modern amenities, prime location near metro station and IT parks.",
                images: [],
                videos: [],
                contact: "9123456789",
                createdBy: "system",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Premium Villa in Whitefield",
                type: "sale",
                bhk: "4BHK",
                bathrooms: "4",
                area: "3200",
                price: "4.75",
                location: "Whitefield ITPL Road",
                facing: "North",
                furnished: "Fully Furnished",
                parking: "3 Covered",
                description: "Spacious villa with garden, modern kitchen, and excellent connectivity to tech parks.",
                images: [],
                videos: [],
                contact: "9876543210",
                createdBy: "system",
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: "Cozy 2BHK for Rent",
                type: "rent",
                bhk: "2BHK",
                bathrooms: "2",
                area: "1200",
                price: "0.35",
                location: "HSR Layout",
                facing: "South",
                furnished: "Fully Furnished",
                parking: "1 Covered",
                description: "Ready to move 2BHK apartment with all amenities, perfect for young professionals.",
                images: [],
                videos: [],
                contact: "9988776655",
                createdBy: "system",
                createdAt: new Date().toISOString()
            }
        ];

        const dbData = {
            properties: initialProperties,
            nextId: 4
        };

        saveProperties(dbData);
        console.log('Database initialized with', initialProperties.length, 'properties');
        return dbData;
    }
    
    return dbData;
}

// Authentication middleware
function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // Simple token validation (in production, use JWT)
    const usersData = loadUsers();
    const user = usersData.users.find(u => u.sessionToken === token);
    
    if (!user) {
        return res.status(403).json({ error: 'Invalid or expired session' });
    }

    req.user = user;
    next();
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/send-otp', async (req, res) => {
    try {
        const { identifier, type } = req.body; // identifier can be email or phone
        
        if (!identifier || !type) {
            return res.status(400).json({ error: 'Identifier and type are required' });
        }
        
        const otp = generateOTP();
        storeOTP(identifier, otp, type);
        
        if (type === 'email') {
            const emailSent = await sendEmailOTP(identifier, otp);
            if (emailSent) {
                res.json({ message: 'OTP sent to your email successfully' });
            } else {
                res.status(500).json({ error: 'Failed to send email OTP' });
            }
        } else if (type === 'phone') {
            // For demo purposes, we'll just return success
            // In production, integrate with SMS service like Twilio
            console.log(`SMS OTP for ${identifier}: ${otp}`);
            res.json({ message: 'OTP sent to your phone successfully' });
        } else {
            res.status(400).json({ error: 'Invalid type. Use "email" or "phone"' });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/verify-otp', (req, res) => {
    try {
        const { identifier, otp, name } = req.body;
        
        if (!identifier || !otp) {
            return res.status(400).json({ error: 'Identifier and OTP are required' });
        }
        
        const verificationResult = verifyOTP(identifier, otp);
        
        if (!verificationResult.success) {
            return res.status(400).json({ error: verificationResult.message });
        }
        
        // OTP verified, create or update user
        const usersData = loadUsers();
        let user = usersData.users.find(u => u.identifier === identifier);
        
        if (!user) {
            // Create new user
            user = {
                id: usersData.nextId,
                identifier,
                name: name || 'User',
                sessionToken: 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString()
            };
            usersData.users.push(user);
            usersData.nextId++;
        } else {
            // Update existing user
            user.sessionToken = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            user.lastLogin = new Date().toISOString();
            if (name) user.name = name;
        }
        
        saveUsers(usersData);
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                identifier: user.identifier
            },
            token: user.sessionToken
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
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
        
        // Apply filters
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

app.post('/api/properties', authenticateUser, upload.fields([
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
            createdBy: req.user.identifier,
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

// Requirements routes
app.post('/api/requirements', authenticateUser, (req, res) => {
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
            createdBy: req.user.identifier,
            createdAt: new Date().toISOString()
        };
        
        requirementsData.requirements.push(newRequirement);
        requirementsData.nextId++;
        
        if (saveRequirements(requirementsData)) {
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
        usersCount: loadUsers().users.length
    });
});

// Initialize database on startup
initializeDatabase();

app.listen(PORT, () => {
    console.log(`🚀 Property Listing Server with OTP Authentication running on port ${PORT}`);
    console.log(`📊 Loaded ${loadProperties().properties.length} properties`);
    console.log(`👥 Loaded ${loadUsers().users.length} users`);
    console.log(`📋 Loaded ${loadRequirements().requirements.length} requirements`);
    console.log(`💾 Database files initialized`);
});