const Service = require("../models/Service")
const Shop = require("../models/Shop")

// not tested
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate("shop")
    return res.status(200).json({ services })
  } catch (error) {
    console.error("Error fetching services:", error)
    return res.status(500).json({ error: "Failed to fetch services." })
  }
}

// tested from frontend
const getAllServicesByShop = async (req, res) => {
  try {
    const { role, userId } = res.locals.payload

    let services

    if (role === "Jeweler") {
      const shop = await Shop.findOne({ jeweler: userId })

      if (!shop) {
        return res
          .status(404)
          .json({ error: "Shop not found for this Jeweler." })
      }

      services = await Service.find({ shop: shop._id }).populate("shop")
    } else {
      services = await Service.find().populate("shop")
    }

    return res.status(200).json({ services })
  } catch (error) {
    console.error("Error fetching services:", error)
    return res.status(500).json({ error: "Failed to fetch services." })
  }
}

// not tested
const getService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.serviceId,
      deleted: false,
    }).populate("shop")
    if (!service) {
      return res.status(404).json({ error: "Service not found." })
    }
    return res.status(200).json({ service })
  } catch (error) {
    console.error("Error fetching service:", error)
    return res.status(500).json({ error: "Failed to fetch service." })
  }
}

// tested from frontend!
const createService = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { name, description, price } = req.body

    if (!name || !price) {
      return res.status(400).json({ error: "Missing required fields." })
    }

    const shop = await Shop.findOne({ user: userId })
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    if (shop.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to create service for this shop." })
    }

    const BASE_URL = process.env.BASE_URL 

    const images =
      req.files?.map((file) => `${BASE_URL}/uploads/${file.filename}`) || []

    const newService = await Service.create({
      name,
      description,
      price,
      images,
      shop: shop._id,
    })

    return res.status(201).json({
      message: "Service created successfully.",
      service: newService,
    })
  } catch (error) {
    console.error("Error creating service:", error)
    return res.status(500).json({ error: "Failed to create service." })
  }
}

// not tested
const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params
    const { id: userId } = res.locals.payload

    const service = await Service.findById(serviceId)
    if (!service) {
      return res.status(404).json({ error: "Service not found." })
    }

    const shop = await Shop.findById(service.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isOwner = shop.user.toString() === userId
    if (!isOwner) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this service." })
    }

    const { name, description, price } = req.body

    if (req.files && req.files.length > 0) {
      service.images = req.files.map((file) => `/uploads/${file.filename}`)
    }

    service.name = name ?? service.name
    service.description = description ?? service.description
    service.price = price ?? service.price

    await service.save()

    return res.status(200).json({
      message: "Service updated successfully.",
      service,
    })
  } catch (error) {
    console.error("Error updating service:", error)
    return res.status(500).json({ error: "Failed to update service." })
  }
}

// not tested
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params
    const { id: userId, role } = res.locals.payload

    const service = await Service.findById(serviceId)
    if (!service) {
      return res.status(404).json({ error: "Service not found." })
    }

    const shop = await Shop.findById(service.shop)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    const isOwner = shop.user.toString() === userId
    const isAdmin = role === "Admin"

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this service." })
    }

    await Jewelry.findByIdAndUpdate(serviceId, { deleted: true })

    return res.status(200).json({ message: "Service deleted successfully." })
  } catch (error) {
    console.error("Error deleting service:", error)
    return res.status(500).json({ error: "Failed to delete service." })
  }
}

module.exports = {
  getAllServices,
  getService,
  getAllServicesByShop,
  createService,
  updateService,
  deleteService,
}
