if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const { forEach } = require('./cities');
const Campground = require('../models/campground')
const cities = require('./cities')
const { places, descriptors } = require('./seedHelper');
const dbUrl=process.env.DB_URL
//const descriptors = require('./seedHelper')
//const mongoose = require('mongoose')
const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(dbUrl);
    console.log('conection established');

    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
const sample = (array) => {
    return array[Math.floor(Math.random() * array.length)];

}
const seedDB = async () => {
    await Campground.deleteMany({})
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '679cffa70e15940f733df141',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            geometry: {
                type: "Point",
                coordinates: [cities[random1000].longitude,
                cities[random1000].latitude,]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/douqbebwk/image/upload/v1600060601/YelpCamp/ahfnenvca4tha00h2ubt.png',
                    filename: 'YelpCamp/ahfnenvca4tha00h2ubt'
                },
                {
                    url: 'https://res.cloudinary.com/douqbebwk/image/upload/v1600060601/YelpCamp/ruyoaxgf72nzpi4y6cdi.png',
                    filename: 'YelpCamp/ruyoaxgf72nzpi4y6cdi'
                }
            ]
        })
        //})

        await camp.save()
    }

}
seedDB();