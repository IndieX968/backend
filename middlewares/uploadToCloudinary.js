const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const dotenv = require("dotenv");
dotenv.config({ path: require("path").resolve(__dirname, "../.env") });
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file buffer to Cloudinary
const uploadToCloudinary = async (buffer, format) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", format: format }, // Specify resource_type and format
      (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          return reject(error);
        }
        console.log("File uploaded to Cloudinary:", result.url);
        resolve(result);
      }
    );

    // Convert the buffer to a readable stream and pipe it to Cloudinary
    const readableStream = new Readable();
    readableStream._read = () => {}; // No-op
    readableStream.push(buffer);
    readableStream.push(null); // End the stream
    readableStream.pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
