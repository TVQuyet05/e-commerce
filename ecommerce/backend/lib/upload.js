import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate unique filename with timestamp
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
	},
});

// File filter for images only
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed!"), false);
	}
};

// Configure multer
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
	fileFilter: fileFilter,
});

// Helper function to save base64 image
export const saveBase64Image = (base64Data, filename = null) => {
	try {
		// Remove data URL prefix if exists
		const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
		if (!matches || matches.length !== 3) {
			throw new Error("Invalid base64 image data");
		}

		const imageExtension = matches[1]; // jpg, png, etc.
		const imageData = matches[2];

		// Generate filename if not provided
		if (!filename) {
			const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
			filename = `image-${uniqueSuffix}.${imageExtension}`;
		}

		const filepath = path.join(uploadDir, filename);
		
		// Write file
		fs.writeFileSync(filepath, imageData, "base64");
		
		// Return the relative URL that will be served by Express
		return `/uploads/products/${filename}`;
	} catch (error) {
		console.error("Error saving base64 image:", error);
		throw error;
	}
};

// Helper function to delete image file
export const deleteImageFile = (imageUrl) => {
	try {
		if (!imageUrl) return;
		
		// Extract filename from URL (e.g., "/uploads/products/image-123.jpg" -> "image-123.jpg")
		const filename = imageUrl.split("/").pop();
		const filepath = path.join(uploadDir, filename);
		
		// Check if file exists and delete it
		if (fs.existsSync(filepath)) {
			fs.unlinkSync(filepath);
			console.log(`Deleted image file: ${filename}`);
		}
	} catch (error) {
		console.error("Error deleting image file:", error);
	}
};

export default upload;