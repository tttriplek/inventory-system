const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  category: String,
  quantity: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ordered', 'delivered', 'cancelled'],
    default: 'ordered'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  supplierInfo: String,
  notes: String
});

// Calculate total price before saving
purchaseOrderSchema.pre('save', function(next) {
  this.totalPrice = this.quantity * this.pricePerUnit;
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
