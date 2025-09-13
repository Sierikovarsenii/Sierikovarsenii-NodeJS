const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true},
            quantity: { type: Number, required: true}
        }]
    }
});

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cartProduct => {
        return cartProduct.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity });
    }
    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.deleteItemFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(items => {
    return items.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function() {
this.cart = { items: [] };
return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const mongoDb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongoDb.ObjectId;

// class User {
//     constructor(username, email, id, cart) {
//         this.username = username;
//         this.email = email;
//         this._id = id ? new mongoDb.ObjectId(id) : null;
//         this.cart = cart;
//     }

//     save () {
//         const db = getDb();
//         return db.collection('users').insertOne(this)
//     }

// addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex(cartProduct => {
//         return cartProduct.productId.toString() === product._id.toString();
//     });
//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//         newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//         updatedCartItems[cartProductIndex].quantity = newQuantity;
//     }
//     else {
//         updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
//     }

//     const db = getDb();
//     return db.collection('users')
//     .updateOne(
//     { _id: this._id },
//     { $set: { cart: { items: updatedCartItems } } });
// }

// getCart() {
//     const db = getDb();
//     const productIds = this.cart.items.map(prod => {
//         return prod.productId;
//     });
//     return db.collection('products')
//     .find({_id: {$in: productIds}})
//     .toArray()
//     .then(products => {
//         return products.map(product => {
//             return {
//                 ...product,
//                 quantity: this.cart.items.find(i => {
//                     return i.productId.toString() === product._id.toString();
//                 }).quantity
//             }
//         });
//     })
//     .catch(err => console.log(err));
// }

// deleteItemFromCart(productId) {
//     const db = getDb();
//     const updatedCartItems = this.cart.items.filter(items => {
//         return items.productId.toString() !== productId.toString();
//     });
//     return db.collection('users')
//     .updateOne(
//         {_id: this._id},
//         { $set: { cart: {items: updatedCartItems}} }
//         );
// }

// addOrder() {
//     const db = getDb();
//     return this.getCart().then(products => {
//         const order = {
//             items: products,
//             user: {
//                 _id: new ObjectId(this._id),
//                 name: this.username
//    }
// };
// return db.collection('orders').insertOne(order);
// }) 
//     .then(result => {
//         this.cart = { items: [] };
//         return db.collection('users')
//         .updatedOne(
//             { _id: this._id },
//             { $set:
//             { cart:
//                 { items: [] } } })
//     })
//     .catch(err => console.log(err));
// }

// getOrders() {
//     const db = getDb();
//     return db.collection('orders').find({'user._id': new ObjectId(this._id)}).toArray();
// }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users')
//         .findOne({ _id: new ObjectId(userId)})
//         .then(user => {
//             console.log(user);
//             return user;
//         })
//         .catch(err => console.log(err));
//     }
// }

// module.exports = User;