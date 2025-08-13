require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { hashPassword } = require('../utils/password');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/online_ordering';
  await mongoose.connect(uri);
  console.log('Connected for seeding.');

  await Promise.all([User.deleteMany({}), Category.deleteMany({}), MenuItem.deleteMany({})]);

  const admin = await User.create({
    email: 'admin@example.com',
    passwordHash: await hashPassword('Admin@123'),
    role: 'admin',
    name: 'Admin User'
  });

  const customer = await User.create({
    email: 'customer@example.com',
    passwordHash: await hashPassword('Customer@123'),
    role: 'customer',
    name: 'Customer One'
  });

  const cats = await Category.insertMany([
    { name: 'APPERTIZER' }, 
    { name: 'CURRY' }, 
    { name: 'NOODLE' }, 
    { name: 'FRIED RICE' }, 
    { name: 'AUTHENTIC THAI'}, 
    { name:'KIDS MEAL' }, 
    { name: 'DESSERT' },
    { name: 'DRINK' }
  ]);

  const appCat = cats.find(c => c.name === 'APPERTIZER')._id;
  const curryCat = cats.find(c => c.name === 'CURRY')._id;
  const noodleCat = cats.find(c => c.name === 'NOODLE')._id;
  const friedriceCat = cats.find(c => c.name === 'FRIED RICE')._id;
  const authenticCat = cats.find(c => c.name === 'AUTHENTIC THAI')._id;
  const kidsCat = cats.find(c => c.name === 'KIDS MEAL')._id;
  const dessertCat = cats.find(c => c.name === 'DESSERT')._id;
  const drinkCat = cats.find(c => c.name === 'DRINK')._id;

  await MenuItem.insertMany([
    { 
      name: 'Calamari', 
      description: 'Deep fried calamari in a crunchy, light batter, served with spicy sweet and sour sauce', 
      price: 12, 
      categories: [appCat] 
    },
    { 
      name: 'Green Curry', 
      description: 'Creamy coconut milk with green curry, bamboo shoots, chili and basil leaves', 
      price: 16.50, 
      categories: [curryCat] 
    },
    { 
      name: 'Pad Thai Shrimp', 
      description: 'Our house specialty! Rice noodle stir fried with shrimps, bean sprouts, egg and roasted peanuts', 
      price: 18.50, 
      categories: [noodleCat] 
    },
    { 
      name: 'Chef\'s Fried Rice', 
      description: 'Shrimp, chicken, egg and scallion with special Thai flavors w/ splash of white wine', 
      price: 16.50, 
      categories: [friedriceCat] 
    },
    { 
      name: 'Chili Basil', 
      description: 'Our recommended spicy dish, stired fried meat with chili and basil leaves', 
      price: 15.50, 
      categories: [authenticCat] 
    },
    { 
      name: 'Kids Chicken Fried Rice', 
      description: ' ', 
      price: 9, 
      categories: [kidsCat] 
    },
    { 
      name: 'Mango with Sticky Rice', 
      description: 'Tree-ripen mango served with sweet sticky rice and topped with sesame seed and flavored coconut milk', 
      price: 8.50, 
      categories: [dessertCat] 
    },
    { 
      name: 'Coke', 
      description: 'Soda', 
      price: 2.99, 
      categories: [drinkCat] 
    },
    
  ]);

  console.log('Seeded users and menu.');
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
