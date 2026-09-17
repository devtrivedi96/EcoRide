const { COLLECTIONS, findOne, findAll, findById, create, remove } = require('../models');

async function getSavedLocations(userEmail) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const locations = await findAll(COLLECTIONS.SAVED_LOCATIONS, [['userId', '==', user.id]]);
  return locations.map(mapDto);
}

async function addSavedLocation(userEmail, body) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const loc = await create(COLLECTIONS.SAVED_LOCATIONS, { userId: user.id, name: body.name, address: body.address });
  return mapDto(loc);
}

async function deleteSavedLocation(userEmail, locationId) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');
  const loc = await findById(COLLECTIONS.SAVED_LOCATIONS, locationId);
  if (!loc) throw new Error('Location not found');
  if (loc.userId !== user.id) throw new Error('Unauthorized to delete this location');
  await remove(COLLECTIONS.SAVED_LOCATIONS, locationId);
}

function mapDto(loc) {
  return { id: loc.id, name: loc.name, address: loc.address, createdAt: loc.createdAt };
}

module.exports = { getSavedLocations, addSavedLocation, deleteSavedLocation };
