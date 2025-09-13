const fs = require('fs');
const path = require('path');
//const stripe = require('stripe')('sk_test_51RuB9EKeZ5NKygtSrP8Xyd601MENtzcGK4n7v4LEgUU9WXgikHx0ndmhW4qKhRqnNPaW1Gyl07xUUF2PJ21EO0Aa00mF1nzNLb');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');


const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
    .countDocuments()
    .then(numDocuments => {
        totalItems = numDocuments;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'List of products',
            path: '/products',
            isAuth: req.session.isLoggedIn,
            csrfToken: req.csrfToken(),
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
    });
};

       exports.getProduct = (req, res, next) => {
            const prodId = req.params.productId;
            Product.findById(prodId)
.then(product => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
            isAuth: req.session.isLoggedIn
        });
    })
.catch(err => {
    const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
});
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
    .countDocuments()
    .then(numDocuments => {
        totalItems = numDocuments;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop #1',
            path: '/',
            isAuth: req.session.isLoggedIn,
            csrfToken: req.csrfToken(),
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
    });
};

// exports.getCheckout = (req, res, next) => {
//         res.render('shop/checkout', {
//             pageTitle: 'Your current order',
//             path: '/checkout'
//         });
//     };

    

exports.getCart = (req, res, next) => {
    req.user
    .populate('cart.items.productId')
    .then(user => {
         const products = user.cart.items;
         res.render('shop/cart', {
            pageTitle: 'Your Cart',
            path: '/cart',
            products: products,
            isAuth: req.session.isLoggedIn
     });
    })
    .catch(err => {
        const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
    }); 
};

    exports.postCart = (req, res, next) => {
        const prodId = req.body.productId;
        Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };

    exports.postCartDelete = (req, res, next) => {
        const prodId = req.body.productId;
        req.user
        .deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };

    exports.getCheckout = (req, res, next) => {
        let products;
        let total = 0;
        req.user
    .populate('cart.items.productId')
    .then(user => {
        products = user.cart.items;
        total = 0;
        products.forEach(p => {
            total += p.quantity * p.productId.price;
     });
     return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
            return {
                price_data: {
                    unit_amount: p.productId.price * 100,
                    currency: 'usd',
                    product_data: {
                        name: p.productId.title,
                        description: p.productId.description
                    }
                },
                quantity: p.quantity
            }
        }),
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
     });
    })
    .then(session => {
        res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products: products,
            totalSum: total,
            sessionId: session.id
    })
})
    .catch(err => {
        const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
    });
    }

    exports.getCheckoutSuccess = (req, res, next) => {
        req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); 
        })
    }

    exports.getOrders = (req, res, next) => {
        Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your orders',
                path: '/orders',
                orders: orders,
                isAuth: req.session.isLoggedIn
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };

    exports.postOrder = (req, res, next) => {
        req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
    };

    exports.getInvoice = (req, res, next) => {
        const orderId = req.params.orderId;

        Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found.'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()){
                return next (new Error('Unauthorized!'));
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoice', invoiceName);

        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; fileName="' + invoiceName + '"');
        //     res.send(data);
        // });

        // const file = fs.createReadStream(invoicePath);
        const PDFDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; fileName="' + invoiceName + '"');
        PDFDoc.pipe(fs.createWriteStream(invoicePath));
        PDFDoc.pipe(res);

        PDFDoc.fontSize(26).text('invoice', {underline: true});

        PDFDoc.text('----------------------');

        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
            PDFDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
            
        });
        PDFDoc.text('----------------------');
        PDFDoc.fontSize(20).text('Total Price: $' + totalPrice);
        PDFDoc.end();
        // file.pipe(res);
        })
        .catch(err => next(err));
    };