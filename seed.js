const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  // ── MEN'S T-SHIRTS ──
  { name:'Polo Collar T-Shirt', price:899, originalPrice:1299, gender:'men', category:'tshirts', brand:'Nike', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format'], description:'Classic polo collar tee in premium cotton pique. Smart casual, all-day comfort.' },
  { name:'Solid Cotton T-Shirt', price:749, originalPrice:999, gender:'men', category:'tshirts', brand:'Adidas', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format'], description:'Clean solid cotton tee. Breathable fabric, relaxed fit.' },
  { name:'Printed Graphic Tee', price:499, originalPrice:799, gender:'men', category:'tshirts', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'festival', images:['https://images.unsplash.com/photo-1503341338985-95048cd47b6e?w=600&auto=format'], description:'Bold vintage graphic tee. Unique print, standout style.' },
  { name:'Vintage Flannel Shirt', price:649, originalPrice:999, gender:'men', category:'tshirts', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'festival', images:['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format'], description:'Classic plaid flannel shirt. Soft brushed cotton, warm and versatile.' },
  { name:'Oversized Vintage Tee', price:399, originalPrice:699, gender:'men', category:'tshirts', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format'], description:'Relaxed oversized vintage tee. Dropped shoulders, boxy fit.' },
  // ── MEN'S HOODIES ──
  { name:'Marble Print Sweatshirt', price:1099, originalPrice:1799, gender:'men', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600&auto=format'], description:'Eye-catching marble swirl print sweatshirt. Heavyweight cotton blend.' },
  { name:'Ombre Knit Sweater', price:1199, originalPrice:1799, gender:'men', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format'], description:'Soft gradient ombre knit sweater. Two-tone fade, premium wool blend.' },
  { name:'Nike Pullover Hoodie', price:999, originalPrice:1499, gender:'men', category:'hoodies', brand:'Nike', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'festival', images:['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format'], description:'Classic Nike pullover hoodie. Soft fleece, kangaroo pocket, iconic Swoosh.' },
  { name:'Champion Crewneck', price:899, originalPrice:1399, gender:'men', category:'hoodies', brand:'Champion', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&auto=format'], description:'Authentic Champion crewneck. Reverse weave, iconic C logo.' },
  { name:'Puma Zip-Up Hoodie', price:849, originalPrice:1299, gender:'men', category:'hoodies', brand:'Puma', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'festival', images:['https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&auto=format'], description:'Full zip-up fleece hoodie. Warm and comfortable.' },
  { name:'Tommy Hilfiger Hoodie', price:1199, originalPrice:1899, gender:'men', category:'hoodies', brand:'Tommy', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1612917159949-e51ae6a18f4e?w=600&auto=format'], description:'Authentic Tommy Hilfiger hoodie. Preppy-classic style.' },
  // ── MEN'S JACKETS ──
  { name:'Carhartt Workwear Jacket', price:1599, originalPrice:2499, gender:'men', category:'jackets', brand:'Carhartt', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&auto=format'], description:'Rugged Carhartt workwear jacket. Heavy-duty canvas, built to last decades.' },
  { name:'Vintage Bomber Jacket', price:1899, originalPrice:2799, gender:'men', category:'jackets', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format'], description:"Iconic vintage bomber jacket. Lightweight, ribbed cuffs." },
  { name:"Levi's Denim Jacket", price:1499, originalPrice:2199, gender:'men', category:'jackets', brand:'Levis', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&auto=format'], description:"Classic Levi's denim jacket. Timeless cut, authentic vintage wash." },
  { name:'Leather Jacket', price:2499, originalPrice:3999, gender:'men', category:'jackets', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&auto=format'], description:'Premium vintage leather jacket. Ages beautifully.' },
  { name:'Nike Windbreaker', price:1299, originalPrice:1999, gender:'men', category:'jackets', brand:'Nike', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'festival', images:['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format'], description:'Iconic Nike windbreaker. Lightweight and packable.' },
  { name:'Varsity Jacket', price:2099, originalPrice:2999, gender:'men', category:'jackets', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'premium', images:['https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=600&auto=format'], description:'Classic varsity jacket with chenille lettering.' },
  { name:'Adidas Track Jacket', price:899, originalPrice:1499, gender:'men', category:'jackets', brand:'Adidas', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&auto=format'], description:'Retro Adidas track jacket. Stripe detailing, full zip.' },
  // ── MEN'S BOTTOMS ──
  { name:'Vintage Cargo Pants', price:1099, originalPrice:1799, gender:'men', category:'bottoms', brand:'Generic', condition:'Good', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format'], description:'Utility cargo pants with multiple pockets. Relaxed vintage fit.' },
  { name:'Nike Sweatpants', price:799, originalPrice:1299, gender:'men', category:'bottoms', brand:'Nike', condition:'Excellent', sizes:['S','M','L','XL','XXL'], style:'y2k', images:['https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600&auto=format'], description:'Soft vintage joggers. Elasticated waist, tapered leg.' },
  // ── WOMEN'S TOPS ──
  { name:"Women's Solid Crop Tee", price:449, originalPrice:699, gender:'women', category:'tshirts', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&auto=format'], description:'Casual solid cotton crop tee. Relaxed fit, versatile everyday wear.' },
  { name:"Women's Printed Tee", price:349, originalPrice:599, gender:'women', category:'tshirts', brand:'Generic', condition:'Good', sizes:['XS','S','M','L','XL'], style:'festival', images:['https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600&auto=format'], description:'Fun vintage printed tee. Soft cotton, easy style.' },
  { name:"Women's Polo Collar Top", price:599, originalPrice:899, gender:'women', category:'tshirts', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1527719327859-a8617d26a2ff?w=600&auto=format'], description:'Classic polo collar top. Smart-casual in premium cotton.' },
  { name:"Women's Oversized Tee", price:449, originalPrice:749, gender:'women', category:'tshirts', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1503342217505-b0a15cf70489?w=600&auto=format'], description:'Trendy oversized tee. Dropped shoulders, effortless vintage look.' },
  // ── WOMEN'S HOODIES ──
  { name:"Women's Zip-Through Hoodie", price:1299, originalPrice:1899, gender:'women', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'festival', images:['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format'], description:'Full zip-through hoodie in soft fleece. Warm and comfortable.' },
  { name:"Women's Solid Sweatshirt", price:499, originalPrice:799, gender:'women', category:'hoodies', brand:'Generic', condition:'Good', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format'], description:'Cozy solid crewneck sweatshirt. Soft brushed fleece inside.' },
  { name:"Women's Pullover Sweatshirt", price:1099, originalPrice:1699, gender:'women', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=600&auto=format'], description:'Premium pullover sweatshirt. Relaxed oversized fit.' },
  { name:"Women's Striped Sweatshirt", price:799, originalPrice:1199, gender:'women', category:'hoodies', brand:'Generic', condition:'Good', sizes:['XS','S','M','L','XL'], style:'festival', images:['https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=600&auto=format'], description:'Classic striped crewneck. Retro styling with modern comfort.' },
  { name:"Women's Crop Hoodie", price:899, originalPrice:1399, gender:'women', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1578681994506-b8f463449011?w=600&auto=format'], description:'Trendy crop hoodie. Perfect with high-waist jeans.' },
  { name:"Women's Knit Cardigan", price:799, originalPrice:1199, gender:'women', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format'], description:'Soft open-front knit cardigan. Lightweight and versatile.' },
  // ── WOMEN'S JACKETS ──
  { name:"Women's Denim Jacket", price:1299, originalPrice:1899, gender:'women', category:'jackets', brand:'Levis', condition:'Good', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&auto=format'], description:"Classic women's denim jacket. Timeless silhouette." },
  { name:"Women's Leather Jacket", price:2199, originalPrice:3299, gender:'women', category:'jackets', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=600&auto=format'], description:"Bold women's leather jacket. Sharp cut, instant edge." },
  { name:"Women's Blazer", price:1499, originalPrice:2299, gender:'women', category:'jackets', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format'], description:'Structured vintage blazer. Power dressing redefined.' },
  // ── WOMEN'S DRESSES ──
  { name:'Vintage Floral Dress', price:1099, originalPrice:1699, gender:'women', category:'dresses', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'festival', images:['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format'], description:'Flowy vintage floral dress. Romantic print, lightweight fabric.' },
  { name:'Printed Midi Dress', price:1299, originalPrice:1999, gender:'women', category:'dresses', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&auto=format'], description:'Elegant printed midi dress. Vintage-inspired pattern.' },
  { name:'Vintage Mini Dress', price:999, originalPrice:1599, gender:'women', category:'dresses', brand:'Generic', condition:'Good', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format'], description:'Playful vintage mini dress. Bold and fun, ultimate Y2K statement.' },
  // ── WOMEN'S BOTTOMS ──
  { name:"Women's Mini Skirt", price:599, originalPrice:999, gender:'women', category:'bottoms', brand:'Generic', condition:'Good', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format'], description:'Trendy Y2K mini skirt. Bold and playful, pairs with anything.' },
  { name:"Women's Wide Leg Pants", price:949, originalPrice:1499, gender:'women', category:'bottoms', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'premium', images:['https://images.unsplash.com/photo-1594938298603-c8148c4b4357?w=600&auto=format'], description:'Relaxed wide-leg trousers. High waist, flowing silhouette.' },
  { name:"Women's Sweater Vest", price:699, originalPrice:1099, gender:'women', category:'hoodies', brand:'Generic', condition:'Excellent', sizes:['XS','S','M','L','XL'], style:'y2k', images:['https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600&auto=format'], description:'Preppy knit sweater vest. Layer over shirts for that Y2K look.' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    console.log('🗑️  Old products cleared');

    const inserted = await Product.insertMany(products);
    console.log(`✅ ${inserted.length} products seeded successfully!`);

    mongoose.connection.close();
    console.log('✅ Done! Run: npm run dev');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
