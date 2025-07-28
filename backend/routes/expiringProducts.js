// Get products expiring within a timeframe
router.get('/expiring', async (req, res) => {
  try {
    const { months } = req.query;
    const monthsNum = Number(months) || 3; // Default to 3 months if not specified
    
    // Calculate the date range
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + monthsNum);

    // Find products that:
    // 1. Have expiry tracking enabled
    // 2. Have an expiry date set
    // 3. Expiry date falls within the range
    const products = await Product.find({
      'expiry.isTracked': true,
      'expiry.date': {
        $exists: true,
        $ne: null,
        $gte: today,
        $lte: futureDate
      }
    }).sort({ 'expiry.date': 1 }); // Sort by expiry date ascending

    // Group products by expiry timeframe
    const groupedProducts = products.reduce((acc, product) => {
      const monthsToExpiry = Math.floor((product.expiry.date - today) / (30 * 24 * 60 * 60 * 1000));
      const key = monthsToExpiry <= 1 ? '1 month' : 
                 monthsToExpiry <= 3 ? '3 months' :
                 monthsToExpiry <= 6 ? '6 months' : 'over 6 months';
      
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        ...product.toObject(),
        daysToExpiry: Math.ceil((product.expiry.date - today) / (24 * 60 * 60 * 1000))
      });
      return acc;
    }, {});

    res.json(groupedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
