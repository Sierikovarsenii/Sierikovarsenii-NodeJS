const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');
const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
    });
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
    .then(products => {
        console.log(products);
        res.render('admin/product-list', {
            prods: products,
            pageTitle: 'Admin Products',
           path: '/admin/products'
        });
    })
    .catch(err => {
    const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
});
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.file;
    const description = req.body.description;
    const price = req.body.price;

    if (!imageUrl){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                description: description,
                price: price
            },
            errorMessage: 'Invalid file type! Please choose the image (png, jpg, jpeg)!',
            validationErrors: []
            });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
        product: {
            title: title,
            description: description,
            price: price
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
        });
    }

    const product = new Product({
        //_id: new mongoose.Types.ObjectId('685fccb7ae5448792364ca17'),
        title: title,
        imageUrl: imageUrl.path,
        description: description,
        price: price,
        userId: req.user
    });
    product.save()
    .then(result => {
        console.log(result);
        res.redirect('/admin/products');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};
        // return res.status(500).render('admin/edit-product', {
        //     pageTitle: 'Add Product',
        //     path: '/admin/add-product',
        //     editing: false,
        //     hasError: true,
        //     product: {
        //         title: title,
        //         imageUrl: imageUrl,
        //         description: description,
        //         price: price
        //     },
        //     errorMessage: 'Databases operation failed, please try again!',
        //     validationErrors: []

    exports.getEditProduct = (req, res, next) => {
        const editMode = req.query.edit;
        if (!editMode) {
            return res.redirect('/');
        }
        const prodId = req.params.productId;
        Product.findById(prodId)
            .then(product => {
                if (!product) {
                    return res.redirect('/');
                }
            res.render('admin/edit-product', {
                pageTitle: 'Update Product',
            path: '/admin/edit-product',
            editing: editMode,
            hasError: false,
            product: product,
            errorMessage: null,
            validationErrors: []
            })
        })
            .catch(err => {
                const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
            });
    };

exports.postEditProduct = (req, res, next) => {
    const updated_id = req.body.productId;
    const updated_title = req.body.title;
    const updated_imageUrl = req.file;
    const updated_description = req.body.description;
    const updated_price = req.body.price;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
        pageTitle: 'Update Product',
        path: '/admin/edit-product',
        editing: true,
        hasError: true,
        product: {
            title: updated_title,
            description: updated_description,
            price: updated_price,
            _id: updated_id
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
        });
    }
    
    Product.findById(updated_id)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString() ) {
                return res.redirect('/');
            }
            product.title = updated_title;
            product.price = updated_price;
            product.description = updated_description;
            if (updated_imageUrl) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = updated_imageUrl.path;
            }
            return product.save()
            .then(result => {
                console.log('Updated product!')
                res.redirect('/admin/products')
            });
        })
    
    .catch(err => {
        const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
    });
    };

    exports.deleteProduct = (req, res, next) => {
        const prodId = req.params.productId;
        console.log(prodId);
        Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found!'))
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        
        .then(result => {
            console.log('Product deleted!');
            res.status(200).json({ message: 'Success!' });
        })
        .catch(err => {
       res.status(500).json({ message: 'Deleting failed!' });
    });
    };