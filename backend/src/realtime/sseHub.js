// Simple in-memory SSE hub for admin order updates
const clients = new Set();

function addClient(client) {
  clients.add(client);
}

function removeClient(client) {
  clients.delete(client);
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch(_) {}
  }
}

module.exports = { addClient, removeClient, broadcast };
