const { COLLECTIONS, findById, findOne, findAll, create, update, remove } = require('../models');

async function getMyVehicles(userEmail) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');

  const vehicles = await findAll(COLLECTIONS.VEHICLES, [['ownerId', '==', user.id]]);
  return vehicles.map(mapVehicleDto);
}

async function registerVehicle(userEmail, data) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');

  const model = data.model?.trim();
  const registrationNumber = (data.registrationNumber || data.registration_number || data.regNo)?.trim().toUpperCase();
  const seatingCapacity = parseInt(data.seatingCapacity || data.seating_capacity || data.capacity) || 4;
  const vehicleType = data.vehicleType || (data.isEV ? 'ELECTRIC' : 'PETROL');

  if (!model || !registrationNumber) {
    throw new Error('Vehicle model and registration number are required');
  }

  // Check if vehicle with this registration number already exists
  const existing = await findOne(COLLECTIONS.VEHICLES, 'registrationNumber', registrationNumber);
  if (existing) {
    if (existing.ownerId === user.id) {
      // Already owned by this user, update it
      const updated = await update(COLLECTIONS.VEHICLES, existing.id, {
        model,
        seatingCapacity,
        vehicleType,
      });
      return mapVehicleDto(updated);
    }
    throw new Error('A vehicle with this registration number is already registered by another user');
  }

  const vehicle = await create(COLLECTIONS.VEHICLES, {
    ownerId: user.id,
    model,
    registrationNumber,
    seatingCapacity,
    vehicleType,
    insuranceDocument: data.insuranceDocument || null,
    registrationDocument: data.registrationDocument || null,
    pollutionDocument: data.pollutionDocument || null,
  });

  // Automatically ensure user role allows driving (upgrade EMPLOYEE to DRIVER)
  if (user.role === 'EMPLOYEE') {
    await update(COLLECTIONS.USERS, user.id, { role: 'DRIVER' });
  }

  return mapVehicleDto(vehicle);
}

async function deleteVehicle(userEmail, vehicleId) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');

  const vehicle = await findById(COLLECTIONS.VEHICLES, vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');

  if (vehicle.ownerId !== user.id && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to delete this vehicle');
  }

  await remove(COLLECTIONS.VEHICLES, vehicleId);
  return { message: 'Vehicle deleted successfully' };
}

async function updateVehicle(userEmail, vehicleId, data) {
  const user = await findOne(COLLECTIONS.USERS, 'email', userEmail);
  if (!user) throw new Error('User not found');

  const vehicle = await findById(COLLECTIONS.VEHICLES, vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');

  if (vehicle.ownerId !== user.id && user.role !== 'ADMIN') {
    throw new Error('Unauthorized to update this vehicle');
  }

  const updates = {};
  if (data.model) updates.model = data.model.trim();
  if (data.registrationNumber) updates.registrationNumber = data.registrationNumber.trim().toUpperCase();
  if (data.seatingCapacity) updates.seatingCapacity = parseInt(data.seatingCapacity);
  if (data.vehicleType) updates.vehicleType = data.vehicleType;

  const updated = await update(COLLECTIONS.VEHICLES, vehicleId, updates);
  return mapVehicleDto(updated);
}

function mapVehicleDto(v) {
  return {
    id: v.id,
    model: v.model,
    registrationNumber: v.registrationNumber,
    seatingCapacity: v.seatingCapacity,
    vehicleType: v.vehicleType || 'ELECTRIC',
    userId: v.ownerId,
    createdAt: v.createdAt,
  };
}

module.exports = {
  getMyVehicles,
  registerVehicle,
  deleteVehicle,
  updateVehicle,
  mapVehicleDto,
};
