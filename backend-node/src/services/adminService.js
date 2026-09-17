const { COLLECTIONS, findOne, findAll, findById } = require('../models');

async function getAdminCompany(adminEmail) {
  const admin = await findOne(COLLECTIONS.USERS, 'email', adminEmail);
  if (!admin) throw new Error('Admin not found');
  if (admin.role !== 'ADMIN') throw new Error('Unauthorized');
  const company = await findById(COLLECTIONS.COMPANIES, admin.companyId);
  return company;
}

async function getOrCreateSettings(company) {
  let settings = await findOne(COLLECTIONS.COMPANY_SETTINGS, 'companyId', company.id);
  if (!settings) {
    settings = await require('../models').create(COLLECTIONS.COMPANY_SETTINGS, {
      companyId: company.id, baseFare: 50, fuelCostPerKm: 8, travelCostDeduction: 0.1,
    });
  }
  return settings;
}

async function getCompanySettings(adminEmail) {
  const company = await getAdminCompany(adminEmail);
  const settings = await getOrCreateSettings(company);
  return mapSettings(settings);
}

async function updateCompanySettings(adminEmail, body) {
  const company = await getAdminCompany(adminEmail);
  const settings = await getOrCreateSettings(company);
  const updated = await require('../models').update(COLLECTIONS.COMPANY_SETTINGS, settings.id, {
    baseFare: body.baseFare ?? settings.baseFare,
    fuelCostPerKm: body.fuelCostPerKm ?? settings.fuelCostPerKm,
    travelCostDeduction: body.travelCostDeduction ?? settings.travelCostDeduction,
  });
  return mapSettings(updated);
}

async function getCompanyEmployees(adminEmail) {
  const company = await getAdminCompany(adminEmail);
  const employees = await findAll(COLLECTIONS.USERS, [['companyId', '==', company.id]]);
  return employees.map(u => ({
    id: u.id, firstName: u.firstName, lastName: u.lastName,
    email: u.email, phoneNumber: u.phoneNumber, role: u.role, companyName: company.name,
  }));
}

function mapSettings(s) {
  return { baseFare: s.baseFare, fuelCostPerKm: s.fuelCostPerKm, travelCostDeduction: s.travelCostDeduction };
}

module.exports = { getCompanySettings, updateCompanySettings, getCompanyEmployees };
