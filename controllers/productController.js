const Product=require('../models/product')
const ErrorHandler=require('../utils/errorHandler');
const catchAsyncErrors=require('../middlewares/catchAsyncErrors')
const APIFeatures=require('../utils/apiFeatures')

//create new product =>/api/v1/admin/product/new

exports.newProduct= catchAsyncErrors (async(req, res, next)=>{
    req.body.user=req.user.id;
    const product=await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })
})
//get all products =>/api/v1/products
exports.getProducts= catchAsyncErrors(async(req, res, next)=>{
    const resultPerPage = 8;

    const productCount=await Product.countDocuments();

    const apiFeatures =new APIFeatures(Product.find(),req.query)
                        .search()
                        .filter()
                        
    let products = await apiFeatures.query;
    let filteredProductsCount = products.length;
                         
    apiFeatures.pagination(resultPerPage);
    products = await apiFeatures.query.clone(); 


    res.status(200).json({
        success:true,
        productCount,
        resultPerPage,
        filteredProductsCount,
        products
    })
}
)

// Get all products (Admin)  =>   /api/v1/admin/products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {

    const products = await Product.find();

    res.status(200).json({
        success: true,
        products
    })

})


//get single product by id=> api/v1/product/:id
exports.getSingleProduct=catchAsyncErrors (async(req, res, next)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler('Product Not found', 404));
    }
    res.status(200).json({
        success:true,
        product
    })
})

//update Product => /api/v1/admin/product/:id

exports.updateProduct=catchAsyncErrors(async (req, res, next)=>{
    let product=await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandler('Product Not found', 404));
    }
    product=await Product.findByIdAndUpdate(req.params.id, req.body,{
        new:true,
        runValidators:true
    });

    res.status(200).json({
        success:true,
        product
    })

}
)
//Delete Product => /api/v1/admin/product/:id
exports.deleteProduct=catchAsyncErrors(async(req, res, next)=>{
    const product =await Product.findById(req.params.id);
    if(!product){
        return next(new ErrorHandler('Product Not found', 404));
    }
    await product.deleteOne();
    res.status(200).json({
        success:true,
        message:'Product is deleted'
    })
})

//create new review =>/api/v1/review
exports.createProductReview=catchAsyncErrors(async(req, res, next)=>{
    const {rating, comment, productId}=req.body;
    const review={
        user: req.user._id,
        name: req.user.name,
        rating:Number(rating),
        comment
    }

    //name is not showing on the  review
    console.log(review.name) 
    const product=await Product.findById(productId);

    //checking if there is review already
    const isReviewed = product.reviews.find(
        r=>r.user.toString()===req.user._id.toString()
    )
    

    //updating review
    if(isReviewed){
        product.reviews.forEach(review=>{
            if(review.user.toString()===req.user._id.toString()){
                review.comment=comment;
                review.rating=rating;
            }
        })
    }else{
        product.reviews.push(review);
        product.numOfReviews=product.reviews.length;
    }


    //making average rating
    product.ratings=product.reviews.reduce((acc, item)=>item.rating+acc,0)/product.reviews.length;

    await product.save({validateBeforeSave: false});

    res.status(200).json({
        success:true
    })
})


//get Product Reviews =>/api/v1/reviews

exports.getProductReviews = catchAsyncErrors(async(req, res, next)=>{
    const product =await Product.findById(req.query.id);

    res.status(200).json({
        success:true,
        reviews: product.reviews
    })
})


//delete Product Review =>/api/v1/reviews

exports.deleteReview = catchAsyncErrors(async(req, res, next)=>{
    const product =await Product.findById(req.query.productId);

    const reviews=product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

    const numOfReviews=reviews.length;

    const ratings=product.reviews.reduce((acc, item)=>item.rating+acc,0)/reviews.length;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true
    })
})