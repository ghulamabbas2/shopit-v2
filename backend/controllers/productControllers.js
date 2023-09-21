export const getProducts = async (req, res) => {
  res.status(200).json({
    message: "All Products",
  });
};
