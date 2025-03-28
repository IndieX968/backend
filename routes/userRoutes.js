const express = require("express");
const {
  signUpUser,
  signInUser,
  updateUserRole,
  createStore,
  editStore,
  updateUserProfile,
  createAsset,
  getAssetsByStoreId,
  getAllAssets,
  getAssetDetails,
  createGig,
  getGigDetails,
  getAllGigs,
  getGigsByStoreId,
  addToCart,
  removeFromCart,
  getCart,
  getGameDetails,
  getAllGames,
  getGamesByStoreId,
  createGame,
  getItemsByType,
  getItemsByTypeAndCategory,
  getReviews,
  createReview,
  sendMessage,
  getChatHistory,
  getUserChatList,
  search,
} = require("../controllers/userController");
const tokenValidator = require("../middlewares/errorHandler");
const upload = require("../middlewares/multer");

const router = express.Router();

// Signup route
router.post("/signup", signUpUser);

router.post("/signin", signInUser);

router.put("/update-role", tokenValidator, updateUserRole);

router.post("/store", tokenValidator, upload.single("image"), createStore);

router.put("/update-store", tokenValidator, upload.single("image"), editStore);

router.put(
  "/update-profile",
  tokenValidator,
  upload.single("image"),
  updateUserProfile
);

router.post(
  "/create-assets",
  tokenValidator,
  upload.fields([
    { name: "images", maxCount: 10 }, // Max 10 images
    { name: "zipFile", maxCount: 1 }, // Single ZIP file
  ]),
  createAsset
);

router.get("/get-stores-assets/:storeId", getAssetsByStoreId);

router.get("/assets", getAllAssets);
router.get("/get-asset-detail/:assetId", getAssetDetails);

router.post(
  "/create-gig",
  tokenValidator,
  upload.fields([{ name: "images", maxCount: 10 }]), // Max 10 images, no zipFile
  createGig
);

router.get("/get-stores-gigs/:storeId", getGigsByStoreId);
router.get("/gigs", getAllGigs);
router.get("/get-gig-detail/:gigId", getGigDetails);

router.post("/add-to-cart", tokenValidator, addToCart);
router.post("/remove-from-cart", tokenValidator, removeFromCart);
router.get("/get-cart/:userId", tokenValidator, getCart);

router.post(
  "/create-games",
  tokenValidator,
  upload.fields([
    { name: "images", maxCount: 10 }, // Max 10 images
    { name: "webglDemoZip", maxCount: 1 }, // Single ZIP file for WebGL demo
  ]),
  createGame
);
router.get("/get-stores-games/:storeId", getGamesByStoreId);
router.get("/games", getAllGames);
router.get("/get-game-detail/:gameId", getGameDetails);

router.get("/categories/:type", getItemsByType);
router.get("/categories/:type/:category", getItemsByTypeAndCategory);

router.get("/reviews/:itemType/:itemId", getReviews);
router.post("/reviews/", tokenValidator, createReview);

router.post("/chats", tokenValidator, sendMessage);
router.get("/chats/:chatId", tokenValidator, getChatHistory);
router.get("/chats", tokenValidator, getUserChatList);
router.get("/search", search);

module.exports = router;
