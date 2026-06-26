const gym = require('./gym');
const gut = require('./gut');
const skin = require('./skin');
const fatLoss = require('./fatLoss');
const energy = require('./energy');

const modules = { gym, gut, skin, fat_loss: fatLoss, energy };

function getModule(id) {
  return modules[id] || null;
}

function getAllModules() {
  return Object.values(modules);
}

module.exports = { getModule, getAllModules };
