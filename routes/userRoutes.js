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

router.get("/get-stores-assets/:storeId", tokenValidator, getAssetsByStoreId);

router.get("/assets", getAllAssets);
router.get("/get-asset-detail/:assetId", getAssetDetails);

router.post(
  "/create-gig",
  tokenValidator,
  upload.fields([{ name: "images", maxCount: 10 }]), // Max 10 images, no zipFile
  createGig
);

router.get("/get-stores-gigs/:storeId", tokenValidator, getGigsByStoreId);
router.get("/gigs", getAllGigs);
router.get("/get-gig-detail/:gigId", getGigDetails);

module.exports = router;
