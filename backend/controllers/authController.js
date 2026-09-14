import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Shop from '../models/Shop.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

export const generateTokens = (payload) => {
    const secret = getJwtSecret();
    const accessToken = jwt.sign(payload, secret, { expiresIn: '7d' });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

export const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/'
    };
};

export const setRefreshCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        ...getCookieOptions(),
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};

export const clearRefreshCookie = (res) => {
    const opts = getCookieOptions();
    res.clearCookie('refreshToken', { ...opts, expires: new Date(0), maxAge: 0 });
    res.cookie('refreshToken', '', { ...opts, expires: new Date(0), maxAge: 0 });
};

// Safe helper to compare passwords
const verifySecret = async (input, storedHashOrPlain) => {
    if (!input || !storedHashOrPlain || typeof input !== 'string') return false;
    try {
        const isMatch = await bcrypt.compare(input, storedHashOrPlain);
        if (isMatch) return true;
    } catch {
        // Fallback for unhashed legacy records in dev
    }
    return input === storedHashOrPlain;
};

/**
 * Canonical Register Controller
 * Creates user in MongoDB with secure password hash and generates auth session
 */
export const register = async (req, res) => {
    try {
        const { name, email, mobile, phone, password, confirmPassword, role = 'user', location } = req.body || {};

        // 1. Name validation
        if (!name || typeof name !== 'string' || name.trim().length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name must be at least 3 characters long.' 
            });
        }

        // 2. Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address.' 
            });
        }

        // 3. Password validation
        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long.' 
            });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Passwords do not match.' 
            });
        }

        // 4. Optional Mobile validation
        const rawPhone = (mobile || phone || '').toString().trim();
        let validMobile = undefined;
        if (rawPhone) {
            if (!/^[0-9]{10}$/.test(rawPhone)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mobile number must be exactly 10 digits.' 
                });
            }
            validMobile = rawPhone;
        }

        const cleanEmail = email.trim().toLowerCase();

        // 5. Check duplicate email in MongoDB
        const existingEmailUser = await User.findOne({ email: cleanEmail });
        if (existingEmailUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered. Please login.' 
            });
        }

        // 6. Check duplicate mobile if provided
        if (validMobile) {
            const existingMobileUser = await User.findOne({ mobile: validMobile });
            if (existingMobileUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Mobile number is already registered.' 
                });
            }
        }

        // 7. Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 8. Location coordinates if provided
        let userLocation = undefined;
        let userLocationGeo = undefined;
        if (location && typeof location === 'object' && !isNaN(Number(location.lat)) && !isNaN(Number(location.lng))) {
            const lat = Number(location.lat);
            const lng = Number(location.lng);
            userLocation = {
                lat,
                lng,
                address: location.address || ''
            };
            userLocationGeo = {
                type: 'Point',
                coordinates: [lng, lat]
            };
        }

        // 9. Persist User in MongoDB
        const canonicalRole = (role === 'customer' || role === 'user') ? 'user' : role;
        const newUser = new User({ 
            name: name.trim(), 
            email: cleanEmail, 
            mobile: validMobile, 
            password: hashedPassword, 
            location: userLocation,
            locationGeo: userLocationGeo,
            role: canonicalRole,
            isActive: true
        });
        await newUser.save();

        const hasValidLoc = newUser.location && !isNaN(Number(newUser.location.lat)) && !isNaN(Number(newUser.location.lng));
        const userData = {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile || null,
            role: canonicalRole,
            location: hasValidLoc ? newUser.location : null
        };

        // 10. Generate tokens & session
        const { accessToken, refreshToken } = generateTokens({ id: newUser._id, role: canonicalRole });
        setRefreshCookie(res, refreshToken);

        console.log(`[AUTH] User created successfully in MongoDB: ${newUser._id} (${cleanEmail})`);

        return res.status(201).json({ 
            success: true, 
            message: 'Account created successfully.', 
            user: userData,
            token: accessToken
        });
    } catch (error) {
        console.error('[AUTH_REGISTER_ERROR]:', error);
        if (error.code === 11000) {
            const keyPattern = error.keyPattern || {};
            if (keyPattern.email) {
                return res.status(400).json({ success: false, message: 'This email is already registered. Please login.' });
            }
            if (keyPattern.mobile) {
                return res.status(400).json({ success: false, message: 'Mobile number is already registered.' });
            }
            return res.status(400).json({ success: false, message: 'Email or Mobile already registered.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unable to create your account. Please try again.',
            code: 'REGISTRATION_FAILED' 
        });
    }
};

/**
 * Canonical Login Controller
 * Authenticates against MongoDB records across roles
 */
export const login = async (req, res) => {
    try {
        const { email, mobile, identifier, password, role } = req.body || {};
        const loginQuery = (email || identifier || mobile || '').toString().trim().toLowerCase();

        if (!loginQuery) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide an email or mobile number.' 
            });
        }
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: 'Password is required.' 
            });
        }

        let userRecord = null;
        let matchedRole = 'user';

        // 1. Search in User collection first
        userRecord = await User.findOne({ 
            $or: [{ email: loginQuery }, { mobile: loginQuery }] 
        });

        if (userRecord) {
            matchedRole = userRecord.role === 'customer' ? 'user' : userRecord.role;
        } else if (role === 'farmer' || role === 'client') {
            // Search in Farmer collection
            userRecord = await Farmer.findOne({ 
                $or: [{ mobile: loginQuery }, { email: loginQuery }] 
            });
            if (userRecord) matchedRole = 'client';
        } else if (role === 'shop') {
            // Search in Shop collection
            userRecord = await Shop.findOne({ 
                $or: [{ mobile: loginQuery }, { email: loginQuery }] 
            });
            if (userRecord) matchedRole = 'shop';
        } else if (role === 'delivery') {
            // Search in DeliveryPartner collection
            userRecord = await DeliveryPartner.findOne({ 
                $or: [{ email: loginQuery }, { mobile: loginQuery }] 
            });
            if (userRecord) matchedRole = 'delivery';
        } else {
            // Auto-detect across other collections if not specified
            userRecord = await Shop.findOne({ $or: [{ email: loginQuery }, { mobile: loginQuery }] });
            if (userRecord) {
                matchedRole = 'shop';
            } else {
                userRecord = await DeliveryPartner.findOne({ $or: [{ email: loginQuery }, { mobile: loginQuery }] });
                if (userRecord) {
                    matchedRole = 'delivery';
                } else {
                    userRecord = await Farmer.findOne({ $or: [{ mobile: loginQuery }, { email: loginQuery }] });
                    if (userRecord) matchedRole = 'client';
                }
            }
        }

        if (!userRecord) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.',
                code: 'INVALID_CREDENTIALS' 
            });
        }

        if (userRecord.isActive === false) {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account has been deactivated. Please contact support.',
                code: 'ACCOUNT_DEACTIVATED' 
            });
        }

        // Verify password hash
        const storedSecret = userRecord.password || userRecord.pin;
        const isMatch = await verifySecret(password, storedSecret);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password.',
                code: 'INVALID_CREDENTIALS' 
            });
        }

        // Build sanitized user data
        const hasValidLoc = userRecord.location && !isNaN(Number(userRecord.location.lat)) && !isNaN(Number(userRecord.location.lng));
        const userData = {
            id: userRecord._id,
            name: userRecord.name || userRecord.ownerName,
            email: userRecord.email || '',
            mobile: userRecord.mobile || null,
            role: matchedRole,
            location: hasValidLoc ? userRecord.location : (userRecord.farmLocation || null)
        };

        const { accessToken, refreshToken } = generateTokens({ id: userRecord._id, role: matchedRole });
        setRefreshCookie(res, refreshToken);

        // Update lastLogoutAt to null on login
        if (matchedRole === 'user' || matchedRole === 'admin') {
            await User.updateOne({ _id: userRecord._id }, { $set: { lastLogoutAt: null } }).catch(() => {});
        }

        console.log(`[AUTH] User logged in: ${userRecord._id} (${matchedRole})`);

        return res.status(200).json({ 
            success: true, 
            message: 'Login successful.', 
            user: userData,
            token: accessToken
        });
    } catch (error) {
        console.error('[AUTH_LOGIN_ERROR]:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'GreenBond is temporarily unavailable. Please try again.',
            code: 'LOGIN_FAILED' 
        });
    }
};

/**
 * Canonical Token Validation Controller
 * Re-authenticates strictly against live MongoDB record
 */
export const validateToken = async (req, res) => {
    try {
        const { id, role } = req.user;
        let userData = null;

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id).select('-password');
            if (user) {
                const canonicalRole = user.role === 'customer' ? 'user' : user.role;
                userData = { 
                    id: user._id, 
                    name: user.name, 
                    email: user.email, 
                    mobile: user.mobile, 
                    role: canonicalRole, 
                    isActive: user.isActive, 
                    location: user.location || null,
                    addresses: user.addresses || []
                };
            }
        } else if (role === 'client' || role === 'farmer') {
            const farmer = await Farmer.findById(id).select('-pin');
            if (farmer) {
                const loc = farmer.farmLocation || (farmer.lat ? { lat: farmer.lat, lng: farmer.lng, address: farmer.address } : (farmer.location ? { address: farmer.location } : null));
                userData = { 
                    id: farmer._id, 
                    name: farmer.name, 
                    mobile: farmer.mobile, 
                    email: farmer.email,
                    verificationStatus: farmer.verificationStatus, 
                    farmerStatus: farmer.farmerStatus,
                    landDocumentRejectionReason: farmer.landDocumentRejectionReason,
                    surveyNumber: farmer.surveyNumber,
                    landDocumentType: farmer.landDocumentType,
                    hasLandDocument: Boolean(farmer.landDocumentReference),
                    role: 'client', 
                    location: loc 
                };
            }
        } else if (role === 'shop') {
            const shop = await Shop.findById(id).select('-password');
            if (shop) {
                userData = { 
                    id: shop._id, 
                    name: shop.name, 
                    ownerName: shop.ownerName, 
                    mobile: shop.mobile, 
                    role: 'shop', 
                    isActive: shop.isActive, 
                    location: shop.location || null 
                };
            }
        } else if (role === 'delivery') {
            const partner = await DeliveryPartner.findById(id).select('-password');
            if (partner) {
                userData = { 
                    id: partner._id, 
                    name: partner.name, 
                    email: partner.email, 
                    mobile: partner.mobile, 
                    status: partner.status, 
                    role: 'delivery', 
                    location: partner.location || null 
                };
            }
        }

        if (!userData || userData.isActive === false) {
            return res.status(401).json({ 
                success: false, 
                message: 'Your account is no longer active or could not be found.', 
                code: 'USER_INVALID' 
            });
        }

        return res.status(200).json({ success: true, user: userData });
    } catch (error) {
        console.error('[AUTH_VALIDATE_ERROR]:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired session.', 
            code: 'VALIDATE_FAILED' 
        });
    }
};

/**
 * Canonical Update Location Controller
 * Persists selected location directly into the MongoDB User record
 */
export const updateLocation = async (req, res) => {
    try {
        const { id, role } = req.user;
        const { 
            lat, 
            lng, 
            latitude, 
            longitude, 
            address, 
            city, 
            state, 
            pincode, 
            postalCode, 
            area, 
            country, 
            placeId 
        } = req.body || {};

        const effectiveLat = Number(lat !== undefined ? lat : latitude);
        const effectiveLng = Number(lng !== undefined ? lng : longitude);

        if (isNaN(effectiveLat) || isNaN(effectiveLng)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid latitude and longitude coordinates are required.' 
            });
        }

        const cleanAddress = (address || '').trim() || `${effectiveLat.toFixed(4)}, ${effectiveLng.toFixed(4)}`;
        const cleanPincode = String(pincode || postalCode || '').trim();
        const cleanCity = String(city || '').trim();
        const cleanState = String(state || '').trim();
        const cleanCountry = String(country || 'India').trim();
        const cleanArea = String(area || '').trim();
        const cleanPlaceId = placeId ? String(placeId).trim() : null;

        const locationPayload = {
            lat: effectiveLat,
            lng: effectiveLng,
            latitude: effectiveLat,
            longitude: effectiveLng,
            address: cleanAddress,
            city: cleanCity,
            state: cleanState,
            pincode: cleanPincode,
            country: cleanCountry,
            area: cleanArea,
            placeId: cleanPlaceId
        };

        const locationGeoPayload = {
            type: 'Point',
            coordinates: [effectiveLng, effectiveLat]
        };

        if (role === 'user' || role === 'customer' || role === 'admin') {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            user.location = locationPayload;
            user.locationGeo = locationGeoPayload;

            if (!user.addresses) user.addresses = [];
            const existingDefault = user.addresses.find(a => a.isDefault);
            if (existingDefault) {
                existingDefault.address = cleanAddress;
                existingDefault.lat = effectiveLat;
                existingDefault.lng = effectiveLng;
                if (cleanCity) existingDefault.city = cleanCity;
                if (cleanState) existingDefault.state = cleanState;
                if (cleanPincode) existingDefault.pin = cleanPincode;
            } else {
                user.addresses.push({
                    label: 'HOME',
                    name: user.name,
                    address: cleanAddress,
                    city: cleanCity,
                    state: cleanState,
                    pin: cleanPincode,
                    lat: effectiveLat,
                    lng: effectiveLng,
                    isDefault: true
                });
            }

            await user.save();
            console.log(`[AUTH] User location updated in MongoDB: ${id} (${effectiveLat}, ${effectiveLng})`);

            const canonicalRole = user.role === 'customer' ? 'user' : user.role;
            const updatedUser = {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: canonicalRole,
                location: user.location,
                addresses: user.addresses
            };

            return res.status(200).json({
                success: true,
                message: 'Location saved successfully.',
                user: updatedUser,
                location: locationPayload
            });
        } else if (role === 'client' || role === 'farmer') {
            const updatedFarmer = await Farmer.findByIdAndUpdate(
                id,
                { 
                    $set: { 
                        farmLocation: locationPayload, 
                        farmLocationGeo: locationGeoPayload, 
                        lat: effectiveLat, 
                        lng: effectiveLng, 
                        address: cleanAddress,
                        location: cleanAddress 
                    } 
                },
                { new: true }
            ).select('-pin');

            if (!updatedFarmer) {
                return res.status(404).json({ success: false, message: 'Farmer not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'Farmer location saved successfully.',
                user: { id: updatedFarmer._id, name: updatedFarmer.name, location: updatedFarmer.farmLocation },
                location: locationPayload
            });
        } else if (role === 'shop') {
            const updatedShop = await Shop.findByIdAndUpdate(
                id,
                { $set: { location: locationPayload, locationGeo: locationGeoPayload } },
                { new: true }
            ).select('-password');

            if (!updatedShop) {
                return res.status(404).json({ success: false, message: 'Shop not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'Shop location saved successfully.',
                user: { id: updatedShop._id, name: updatedShop.name, location: updatedShop.location },
                location: locationPayload
            });
        } else if (role === 'delivery') {
            const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
                id,
                { 
                    $set: { 
                        location: { ...locationPayload, updatedAt: new Date() }, 
                        locationGeo: locationGeoPayload 
                    } 
                },
                { new: true }
            ).select('-password');

            if (!updatedPartner) {
                return res.status(404).json({ success: false, message: 'Delivery partner not found.' });
            }

            return res.status(200).json({
                success: true,
                message: 'Delivery partner location saved successfully.',
                user: { id: updatedPartner._id, name: updatedPartner.name, location: updatedPartner.location },
                location: locationPayload
            });
        }

        return res.status(400).json({ success: false, message: 'Unsupported role for location update.' });
    } catch (error) {
        console.error('[AUTH_UPDATE_LOCATION_ERROR]:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Unable to save your location. Please try again.',
            code: 'LOCATION_UPDATE_FAILED' 
        });
    }
};

/**
 * Canonical Logout Controller
 * Clears cookies and invalidates session timestamp
 */
export const logout = async (req, res) => {
    try {
        clearRefreshCookie(res);

        // Invalidate database session by recording lastLogoutAt
        let tokenToInvalidate = null;
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            tokenToInvalidate = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.refreshToken) {
            tokenToInvalidate = req.cookies.refreshToken;
        }

        if (tokenToInvalidate) {
            try {
                const decoded = jwt.verify(tokenToInvalidate, getJwtSecret());
                const { id, role } = decoded || {};
                if (id) {
                    const now = new Date();
                    if (role === 'user' || role === 'customer' || role === 'admin') {
                        await User.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'client' || role === 'farmer') {
                        await Farmer.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'shop') {
                        await Shop.findByIdAndUpdate(id, { lastLogoutAt: now });
                    } else if (role === 'delivery') {
                        await DeliveryPartner.findByIdAndUpdate(id, { lastLogoutAt: now });
                    }
                }
            } catch {
                // Token invalid or expired, continue
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully.' 
        });
    } catch (error) {
        console.error('[AUTH_LOGOUT_ERROR]:', error);
        clearRefreshCookie(res);
        return res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully.' 
        });
    }
};
