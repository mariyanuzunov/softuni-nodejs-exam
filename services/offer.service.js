const Offer = require('../models/Offer.model');

async function create(offerData) {
    const offer = new Offer(offerData);
    await offer.save();
    return offer;
}

async function getAll(searchTerm) {
    const options = {};

    if (searchTerm) {
        options.type = { $regex: searchTerm, $options: 'i' };
    }

    const offers = await Offer.find(options).sort({ createdAt: -1 }).lean();
    return offers;
}

async function getById(id) {
    const offer = await Offer.findById(id).populate('tenants').lean();
    return offer;
}

async function edit(id, offerData) {
    const offer = await Offer.findById(id);

    offer.name = offerData.name;
    offer.type = offerData.type;
    offer.year = offerData.year;
    offer.city = offerData.city;
    offer.imgUrl = offerData.imgUrl;
    offer.description = offerData.description;
    offer.availablePieces = offerData.availablePieces;

    return offer.save();
}

async function deleteById(id) {
    return Offer.findByIdAndDelete(id);
}

async function book(offerId, userId) {
    const offer = await Offer.findById(offerId);
    offer.tenants.push(userId);
    offer.availablePieces--;

    offer.save();
}

module.exports = {
    create,
    getAll,
    getById,
    edit,
    book,
    deleteById,
};
