import mongoose from "mongoose";
import products from "./data.js";
import Product from "../models/product.js";

const seedProducts = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://ghulamabbas:ghulamabbas@shopit.wkd8107.mongodb.net/shopit-v2?retryWrites=true&w=majority"
    );

    await Product.deleteMany();
    console.log("Products are deleted");

    await Product.insertMany(products);
    console.log("Products are added");

    process.exit();
  } catch (error) {
    console.log(error.message);
    process.exit();
  }
};

seedProducts();
