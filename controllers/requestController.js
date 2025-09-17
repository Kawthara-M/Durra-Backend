const Request = require("../models/Request")
const User = require("../models/User")
const Shop = require("../models/Shop")
const Collection = require("../models/Collection")
const Jewelry = require("../models/Jewelry")
const { sendEmail } = require("../services/emailService")

// tested!
const getAllRequests = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    let requests

    if (userRole === "Admin") {
      requests = await Request.find().populate("user")
    } else if (userRole === "Jeweler" || userRole === "Driver") {
      requests = await Request.find({ user: userId }).populate("user")
    } else {
      return res.status(403).json({ error: "Unauthorized to view requests." })
    }

    res.status(200).json({ requests })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching requests.",
    })
  }
}

// tested!
const getRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    const request = await Request.findById(requestId).populate("user")
    if (!request) {
      return res.status(404).json({ error: "Request not found." })
    }

    if (userRole !== "Admin" && request.user._id.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to view this request." })
    }

    res.status(200).json({
      request,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this request.",
    })
  }
}

const getAllRequestsByShop = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.params.shopId }).populate(
      "user"
    )
    if (!requests) {
      return res.status(404).json({
        error: "No requests found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      requests,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching requests for this shop",
    })
  }
}

// requires testing with each logic added
const updateRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const { status, details, adminNote } = req.body
    const userId = res.locals.payload.id
    const userRole = res.locals.payload.role

    const request = await Request.findById(requestId)
    if (!request) {
      return res.status(404).json({ error: "Request not found." })
    }

    // tested, test again for driver
    if (userRole === "Jeweler" || userRole === "Driver") {
      if (request.user.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized to edit this request." })
      }

      if (request.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Cannot edit a non-pending request." })
      }

      request.details = details
      await request.save()

      return res
        .status(200)
        .json({ message: "Request details updated successfully.", request })
    }

    if (userRole === "Admin") {
      if (!["approved", "rejected"].includes(status)) {
        return res
          .status(400)
          .json({ error: "Invalid status. Must be 'approved' or 'rejected'." })
      }

      if (request.status === status) {
        return res.status(400).json({ error: `Request is already ${status}.` })
      }

      if (status === "approved") {
        const parsedDetails =
          typeof request.details === "string"
            ? JSON.parse(request.details)
            : request.details

        //handle shop edit request, tested
        if (request.action === "edit" && request.entity === "Shop") {
          const { shopId, name, cr, description } = parsedDetails
          if (!shopId) {
            return res
              .status(400)
              .json({ error: "No Shop ID provided for editing." })
          }

          const shop = await Shop.findById(shopId)
          if (!shop) {
            return res.status(404).json({ error: "Shop not found." })
          }

          if (name !== undefined) shop.name = name
          if (cr !== undefined) shop.cr = cr
          if (description !== undefined) shop.description = description

          await shop.save()

          const user = await User.findById(shop.user)
          if (user && user.email) {
            await sendEmail({
              to: user.email,
              subject: "Your Shop Has Been Updated",
              text: `Hello,\n\nYour shop details update have been approved by an admin.\n\nRegards,\nDurra Team`,
            })
          }
          request.status = "approved"
          await request.save()
        }

        // handle collection create, tested
        if (request.action === "create" && request.entity === "Collection") {
          const { name, description, jewelry, shopId } = request.details

          const newCollection = await Collection.create({
            shop: shopId,
            name,
            description,
            jewelry,
          })
          request.status = "approved"
          await request.save()

          return res.status(201).json({
            message: "Collection created successfully.",
            collection: newCollection,
          })
        }

        // handle collection delete, tested without jewelry
        if (request.action === "delete" && request.entity === "Collection") {
          const { collectionId, shopId } = request.details

          const collection = await Collection.findOne({
            _id: collectionId,
            shop: shopId,
          })

          if (!collection) {
            return res
              .status(404)
              .json({ error: "Collection not found or unauthorized." })
          }

          await Jewelry.deleteMany({
            _id: { $in: collection.jewelry },
            shop: shopId,
          })

          await collection.deleteOne()
          request.status = "approved"
          await request.save()
          return res
            .status(200)
            .json({ message: "Collection deleted successfully." })
        }

        // handle collection edit, tested without jewelry initiional errors
        if (request.action === "edit" && request.entity === "Collection") {
          const { collectionId, shopId, name, description, jewelry } =
            request.details

          const collection = await Collection.findOne({
            _id: collectionId,
            shop: shopId,
          })

          if (!collection) {
            return res
              .status(404)
              .json({ error: "Collection not found or unauthorized." })
          }

          const duplicate = await Collection.findOne({
            _id: { $ne: collectionId }, // not equal
            shop: shopId,
            name: { $regex: `^${name}$`, $options: "i" }, // i for case-insensitive
          })

          if (duplicate) {
            return res.status(400).json({
              error:
                "Another collection with the same name already exists for this shop.",
            })
          }

          const validJewelry = await Jewelry.find({
            _id: { $in: jewelry },
            shop: shopId,
          })

          if (validJewelry.length !== jewelry.length) {
            return res.status(400).json({
              error:
                "One or more jewelry items are invalid or do not belong to this shop.",
            })
          }

          collection.name = name
          collection.description = description
          collection.jewelry = jewelry

          await collection.save()
          request.status = "approved"
          await request.save()

          return res.status(200).json({
            message: "Collection updated successfully.",
            collection,
          })
        }

        // handle jewelry add, tested, work on certification part and test again
        if (request.action === "create" && request.entity === "Jewelry") {
          const {
            name,
            description,
            type,
            mainMaterial,
            totalWeight,
            limitPerOrder,
            images,
            preciousMaterials,
            pearls,
            diamonds,
            otherMaterials,
            shopId,
          } = request.details
          let { totalPrice } = request.details

          console.log(preciousMaterials)

          let totalPreciousPrice = preciousMaterials.reduce((acc, material) => {
            const { karatCost, weight, productionCost } = material
            return acc + (karatCost * weight + productionCost)
          }, 0)

          totalPrice += totalPreciousPrice

          const newJewelry = await Jewelry.create({
            shop: shopId,
            name,
            description,
            type,
            mainMaterial,
            totalWeight,
            totalPrice,
            limitPerOrder,
            images,
            preciousMaterials,
            pearls,
            diamonds,
            otherMaterials,
          })

          request.status = "approved"
          await request.save()

          return res.status(201).json({
            message: "Jewelry created successfully.",
            jewelry: newJewelry,
          })
        }

        // handle jewelry delete, tested
        if (request.action === "delete" && request.entity === "Jewelry") {
          const { jewelryId } = request.details

          const jewelry = await Jewelry.findById(jewelryId)

          if (!jewelry) {
            return res.status(404).json({ error: "Jewelry not found." })
          }
          await Jewelry.findByIdAndDelete(jewelryId)
          const collection = await Collection.findOne({ jewelry: jewelryId })

          if (collection) {
            collection.jewelry.pull(jewelryId)
          }

          request.status = "approved"
          await request.save()
          return res
            .status(200)
            .json({ message: "Jewelry deleted successfully." })
        }

        // handle jewelry edit, tested, lets test after certifications logic
        if (request.action === "edit" && request.entity === "Jewelry") {
          const {
            jewelryId,
            name,
            description,
            type,
            mainMaterial,
            totalWeight,
            totalPrice,
            limitPerOrder,
            images,
            preciousMaterials,
            pearls,
            diamonds,
            otherMaterials,
            shopId,
            certifications
          } = request.details

          const jewelry = await Jewelry.findOne({
            _id: jewelryId,
            shop: shopId,
          })
          if (!jewelry) {
            return res.status(404).json({ error: "Jewelry not found." })
          }

          jewelry.name = name ?? jewelry.name
          jewelry.description = description ?? jewelry.description
          jewelry.type = type ?? jewelry.type
          jewelry.mainMaterial = mainMaterial ?? jewelry.mainMaterial
          jewelry.totalWeight = totalWeight ?? jewelry.totalWeight
          jewelry.totalPrice = totalPrice ?? jewelry.totalPrice
          jewelry.limitPerOrder = limitPerOrder ?? jewelry.limitPerOrder
          jewelry.images = images ?? jewelry.images
          jewelry.preciousMaterials =
            preciousMaterials ?? jewelry.preciousMaterials
          jewelry.pearls = pearls ?? jewelry.pearls
          jewelry.diamonds = diamonds ?? jewelry.diamonds
          jewelry.otherMaterials = otherMaterials ?? jewelry.otherMaterials
          jewelry.certifications = otherMaterials ?? jewelry.certifications

          await jewelry.save()

          return res.status(200).json({
            message: "Jewelry updated successfully.",
            jewelry,
          })
        }

        // Add other entity/action handlers as needed
      }

      if (status === "rejected") {
        const user = await User.findById(request.user)

        if (!user) {
          return res.status(404).json({ error: "User not found." })
        }

        const rejectionMessage = `Greetings,
We're sorry, but your shop request has been rejected.
${adminNote ? `\nReason: ${adminNote}\n` : ""}
You may reach out to support for more information.

Thanks,
Durra Team`

        await sendEmail({
          to: user.email,
          subject: `Your ${request.entity} ${request.action} Request Was Rejected`,
          text: rejectionMessage,
        })
      }

      request.status = status
      request.adminNote = adminNote || ""
      await request.save()

      return res
        .status(200)
        .json({ message: `Request ${status} successfully.` })
    }

    return res
      .status(403)
      .json({ error: "You are not authorized to update this request." })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to update request." })
  }
}

// tested: edit shop
const createRequest = async (req, res) => {
  try {
    const userId = res.locals.payload.id
    const { action, entity, details } = req.body

    if (typeof details === "string") {
      try {
        details = JSON.parse(details)
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON in details field." })
      }
    }

    const imageFiles = req.files

    if (!action || !entity || !details) {
      return res.status(400).json({ error: "Missing required fields." })
    }
    if (imageFiles) {
      details.images = imageFiles.map((file) => file.filename)
    }

    const { shopId, name, jewelry } = details
    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({ error: "Shop not found." })
    }

    if (shop.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to create this request." })
    }

    if (action === "create" && entity === "Collection") {
      const existing = await Collection.findOne({ shop: shopId, name })
      if (existing) {
        return res.status(400).json({
          error:
            "A collection with the same name already exists for this shop.",
        })
      }

      const validJewelry = await Jewelry.find({
        _id: { $in: jewelry },
        shop: shopId,
      })

      if (validJewelry.length !== jewelry.length) {
        return res.status(400).json({
          error:
            "One or more jewelry items are invalid or do not belong to this shop.",
        })
      }
    }

    const newRequest = new Request({
      user: userId,
      action,
      entity,
      details,
      status: "pending",
    })

    await newRequest.save()

    return res
      .status(201)
      .json({ message: "Request created successfully.", request: newRequest })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Failed to create request." })
  }
}

// tested
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
    const userId = res.locals.payload.id

    if (!request) {
      return res.status(404).json({ error: "Request not found." })
    }
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Cannot delete a non-pending request." })
    }
    if (request.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this request." })
    }
    await Request.findByIdAndDelete(req.params.requestId)

    res.status(200).send({ msg: "Request successfully deleted" })
  } catch (error) {
    console.error(error)
    res.status(500).send({ msg: "Failed to delete request" })
  }
}

module.exports = {
  getAllRequests,
  getRequest,
  getAllRequestsByShop,
  updateRequest,
  createRequest,
  deleteRequest,
}
