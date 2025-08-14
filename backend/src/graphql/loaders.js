const DataLoader = require('dataloader');
const MenuItem = require('../models/MenuItem'); // usual single export
// If your file really exports { MenuItem, MenuItemModel }, use the right one

function createMenuItemLoader() {
  return new DataLoader(async (ids) => {
    // IMPORTANT: use _id, not id
    const docs = await MenuItem.find({ _id: { $in: ids } }).lean();
    const map = new Map(docs.map(d => [String(d._id), d]));
    return ids.map(id => map.get(String(id)) || null);
  });
}

module.exports = { createMenuItemLoader };
