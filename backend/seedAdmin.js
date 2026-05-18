const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding");

    const adminEmail = "admin@campus.com";
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin@123", salt);

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      existingAdmin.password = hashedPassword;
      // Force update other fields just in case
      existingAdmin.role = "Admin";
      existingAdmin.status = "active";
      existingAdmin.isBlacklisted = false;
      await existingAdmin.save();
      console.log("Admin user already existed. Password has been forcefully updated and re-hashed.");
    } else {
      const adminUser = new User({
        name: "System Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "Admin",
        department: "IT",
        status: "active",
        isBlacklisted: false
      });
      await adminUser.save();
      console.log("Admin user seeded successfully.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
