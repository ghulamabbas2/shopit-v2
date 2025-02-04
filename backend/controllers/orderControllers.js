import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import ErrorHandler from "../utils/errorHandler.js";

// Create new Order  =>  /api/v1/orders/new
export const newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxAmount,
    shippingAmount,
    totalAmount,
    paymentMethod,
    paymentInfo,
  } = req.body;

  const order = await Order.create({
    orderItems,
    shippingInfo,
    itemsPrice,
    taxAmount,
    shippingAmount,
    totalAmount,
    paymentMethod,
    paymentInfo,
    user: req.user._id,
  });

  res.status(200).json({
    order,
  });
});

// Get current user orders  =>  /api/v1/me/orders
export const myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    orders,
  });
});

// Get order details  =>  /api/v1/orders/:id
export const getOrderDetails = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  res.status(200).json({
    order,
  });
});

// Get all orders - ADMIN  =>  /api/v1/admin/orders
export const allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  res.status(200).json({
    orders,
  });
});

// Update Order - ADMIN  =>  /api/v1/admin/orders/:id
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  if (order?.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  // Update products stock
  order?.orderItems?.forEach(async (item) => {
    const product = await Product.findById(item?.product?.toString());
    if (!product) {
      return next(new ErrorHandler("No Product found with this ID", 404));
    }
    product.stock = product.stock - item.quantity;
    await product.save({ validateBeforeSave: false });
  });

  order.orderStatus = req.body.status;
  order.deliveredAt = Date.now();

  await order.save();

  res.status(200).json({
    success: true,
  });
});

// Delete order  =>  /api/v1/admin/orders/:id
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
  });
});

/* 
    The Goal is to send back an object with 
    Array of Sales, Number of Orders and Total Sales for each day.
    and 
    Aggregated Total Sales and Number of Orders for the entire period.
  */
const getSalesData  = async(startDate,endDate) => {

  /* 
    - Aggregation is means to perform operations on data one by one.
    - Like a nested operations list. 
    - The output of the first operation is passed to the second operation and so on.
  */
  const salesData = await Order.aggregate([
    {
      // Stage 1 - Filter results as per date ranges
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      // Stage 2 - Group Data
      // Group Total Sales and Number of Orders for each date.
      $group: {
        _id: {
        // Converts "2024-03-15T10:30:00Z" to "2024-03-15"
        // Required for $group stage to work with dates effectively
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        },
        totalSalesPerDay: { $sum: "$totalAmount" },
        numOrdersPerDay: { $sum: 1 }, // count the number of orders
      },
    },
  ]);
  
  /*  
    When we create a graph
    We need entire dates including dates with no sales and no orders.
    So we need to fill in the missing dates.
    Why create a hashmap ?
    Aux to creating an Array of dates between the start and end dates.
  */
  const salesMap = new Map()
  let totalSales = 0;
  let totalOrders = 0;
  
  salesData.forEach((eachDate) => {
    const date = eachDate?._id.date;
    const totalSalesPerDay = eachDate?.totalSalesPerDay
    const numOrdersPerDay = eachDate?.numOrdersPerDay
    // Date is the key and values are results of total sales and number of orders.
    salesMap.set(date, { totalSalesPerDay, numOrdersPerDay });
    totalSales += totalSalesPerDay;
    totalOrders += numOrdersPerDay;
  })

  // Generate an array of dates between start & end Date
  const datesBetween = getDatesBetween(startDate, endDate);
  const finalSalesData = datesBetween.map((date) => {
    // If date exists in salesMap return it else return 0
    return {
      date,
      // If data exists in hashmap then fetch, else 0.
      totalSalesPerDay: salesMap.get(date)?.totalSalesPerDay ||  0,
      numOrdersPerDay: salesMap.get(date)?.numOrdersPerDay || 0
    }
  })
  
  return ({
    finalSalesData,
    totalSales,
    totalOrders
  })
}
    
// Return an array of dates between start and end date
const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    /* 
      getDate to fetch day of month
      setDate to set day of month
    */
    while (currentDate <= new Date(endDate)) {
      //ISO String format = '2025-02-04T09:19:19.359Z'
      const formattedDate = currentDate.toISOString().split("T")[0];
      dates.push(formattedDate);
      //Incrementing current date by one
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
  return dates;
}
  

// Get Sales Data  =>  /api/v1/admin/get_sales
export const getSales = catchAsyncErrors(async (req, res, next) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  const { finalSalesData, totalSales, totalOrders } = await getSalesData(
    startDate,
    endDate
  );

  res.status(200).json({
    totalSales: totalSales,
    totalNumOrders: totalOrders,
    sales: finalSalesData,
  });

});
