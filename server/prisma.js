const { PrismaClient } = require('@prisma/client');

// One shared instance for the whole app.
// Creating a new PrismaClient per request would open a new connection
// pool every time and exhaust your database's connection limit fast.
const prisma = new PrismaClient();

module.exports = prisma;
