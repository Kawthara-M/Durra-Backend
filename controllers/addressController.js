const Shop = require("../models/Shop")
const User = require("../models/User")
const Address = require("../models/Address")


// tested for customer
const getAllAddresses = async (req, res) => {
  try {
    const user = await User.findById(res.locals.payload.id)
    const userRole = res.locals.payload.role
    let addresses

    if (userRole === "Customer" || userRole === "Jeweler") {
      addresses = await Address.find({ user: user._id })
    } else {
      return res.status(403).json({ message: "Unauthorized action." })
    }

    res.status(200).json({
      addresses,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching addresses.",
    })
  }
}

// tested for customer
const getAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.addressId)
    if (!address) {
      return res.status(404).json({
        error: "Address not found. It may have been deleted or does not exist.",
      })
    }

    res.status(200).json({
      address,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Failure encountred while fetching this address.",
    })
  }
}

// tested for customer
const createAddress = async (req, res) => {
  try {
    const { name, street, building, house, city } = req.body
    const user = await User.findById(res.locals.payload.id)

    const newAddress = await Address.create({
      user: res.locals.payload.id,
      name,
      city,
      building,
      street,
      house,
    })

    await User.findByIdAndUpdate(user._id, {
      $push: { addresses: newAddress._id },
    })

    return res.status(201).json({
      message: "Address Successfully Created!",
      address: newAddress,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

// tested for customer
const updateAddress = async (req, res) => {
  try {
    const { name, street, building, house, city, setDefault } = req.body
    const { addressId } = req.params
    const userId = res.locals.payload.id
    const address = await Address.findById(addressId)

    if (!address || address.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this address" })
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name,
        street,
        building,
        house,
        city,
      },
      { new: true }
    )
    // true, so we return the updated document, not the old one

    if (setDefault === true || setDefault === "true") {
      await User.findByIdAndUpdate(userId, {
        defaultAddress: addressId,
      })
    }

    return res.status(201).json({
      message: "Address Successfully Updated!",
      address: updatedAddress,
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

// tested for customer
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params
    const userId = res.locals.payload.id
    const address = await Address.findById(addressId)

    if (!address || address.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this address" })
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { addresses: addressId },
    })

    await Address.findByIdAndDelete(addressId)

    return res.status(200).json({
      message: "Address successfully deleted!",
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getAllAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
}
