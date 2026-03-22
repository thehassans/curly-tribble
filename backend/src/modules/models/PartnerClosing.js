import mongoose from "mongoose";

const PartnerClosingSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rangeStart: {
      type: Date,
      required: true,
    },
    rangeEnd: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deliveredOrders: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    cancelledOrders: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    pdfPath: {
      type: String,
      default: "",
    },
    closedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

PartnerClosingSchema.index({ partnerId: 1, closedAt: -1 });
PartnerClosingSchema.index({ ownerId: 1, country: 1, closedAt: -1 });

export default mongoose.model("PartnerClosing", PartnerClosingSchema);
