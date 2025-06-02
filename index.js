// index.js
// Main WhatsApp booking bot using Venom.js

const venom = require('venom-bot');
const sheet = require('./sheet');
const materials = require('./materials.json');

// In-memory map to track pending bookings per user (until they send a date)
const pendingBookings = {};

venom
  .create({
    session: 'booking-bot-session',
    multidevice: false
  })
  .then(client => start(client))
  .catch(err => console.error('Error starting Venom:', err));

async function start(client) {
  console.log('🟢 Venom bot is up and running');

  // Listen for group participant events (join/leave)
  client.onGlobalParticipantsChanged(async event => {
    /**
     * event = {
     *   id: '919876543210-16254321@g.us',   // Group ID
     *   participants: ['919xxxxxx@c.us'],  // Array of affected participants
     *   action: 'add'                      // 'add' when someone joined
     * }
     */
    if (event.action === 'add') {
      for (const participant of event.participants) {
        // Send a private list-of-materials message to each new participant
        await sendWelcomeList(client, participant);
      }
    }
  });

  // Handle all incoming private messages (1:1 chats only)
  client.onMessage(async message => {
    const from = message.from;           // e.g. '919876543210@c.us'
    const isGroup = message.isGroupMsg;  // true if message came from a group
    const text = (message.body || '').trim().toLowerCase();

    // Ignore any group messages
    if (isGroup) return;

    // 1️⃣ If user tapped a list item, Venom delivers text = 'm0', 'm1', etc.
    if (/^m\d+$/.test(text)) {
      const idx = parseInt(text.slice(1), 10);
      const item = materials[idx];
      if (!item) {
        return client.sendText(from, '❌ Invalid selection. Type "list" to see options.');
      }
      // Record which item index they chose
      pendingBookings[from] = { itemIndex: idx };
      // Prompt for date
      return client.sendText(
        from,
        `You chose *${item}*.\n\nNow reply with:\n` +
        `"date YYYY-MM-DD"\nExample: date 2025-06-05`
      );
    }

    // 2️⃣ If user sends “date YYYY-MM-DD”
    if (text.startsWith('date ')) {
      const parts = text.split(' ');
      if (parts.length !== 2) {
        return client.sendText(from, '❌ Invalid format. Use: date YYYY-MM-DD');
      }
      const date = parts[1];
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return client.sendText(from, '❌ Date format must be YYYY-MM-DD');
      }
      const pending = pendingBookings[from];
      if (!pending) {
        return client.sendText(from, '❌ You haven’t selected a material yet. Type "list".');
      }
      const idx = pending.itemIndex;
      const itemName = materials[idx];

      // Check if already booked
      const already = await sheet.checkIfBooked(itemName, date);
      if (already) {
        return client.sendText(
          from,
          `❌ Sorry, *${itemName}* is already booked on ${date}.\n` +
          `Reply "list" to choose another item or date.`
        );
      }
      // Book it
      await sheet.addBooking(itemName, date, from);
      delete pendingBookings[from];
      return client.sendText(
        from,
        `✅ Booked *${itemName}* on *${date}* for you. Enjoy!`
      );
    }

    // 3️⃣ If user types “list”, show the interactive list again
    if (text === 'list') {
      return sendWelcomeList(client, from);
    }

    // 4️⃣ If user greets with “help”/“hi”/“hello”
    if (['help', 'hi', 'hello'].includes(text)) {
      return client.sendText(
        from,
        '👋 Hi! Type *list* to see available materials and book.\n' +
        'When you joined the group, you should have received this list automatically.'
      );
    }

    // 5️⃣ Any other text → show a help prompt
    return client.sendText(
      from,
      '❓ I did not understand. Type *list* to see options, or *help* for instructions.'
    );
  });
}

/**
 * sendWelcomeList:
 * Sends a “list message” to the given WhatsApp ID (user).
 * Each row’s id is “m0”, “m1”, etc., so when the user taps it, Venom delivers “mX” as text.
 */
async function sendWelcomeList(client, to) {
  // Build the list rows
  const rows = materials.map((item, idx) => ({
    id: `m${idx}`,   // this is sent back when tapped
    title: item      // what the user sees
  }));

  const sections = [
    {
      title: 'Choose a Material to Book:',
      rows: rows
    }
  ];

  const listMessage = {
    buttonText: 'View Materials 📚',
    description: 'Tap a material, then send a date (YYYY-MM-DD).',
    sections: sections,
    title: 'Welcome to StudyChannel!'
  };

  await client.sendList(to, listMessage);
}
