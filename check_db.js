const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const Product = require('./models/Product');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        const count = await Product.countDocuments();
        console.log(`📦 Product Count: ${count}`);
        if (count > 0) {
            const first = await Product.findOne();
            console.log('📄 Sample Product:', JSON.stringify(first, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkData();
