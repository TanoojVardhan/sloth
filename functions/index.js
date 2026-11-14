/**
 * Push reminders from the server were removed when end-to-end encryption was added.
 *
 * Task and event content is now encrypted on the user's devices, so a server
 * function can no longer read due dates. Reminders run on the devices instead:
 * Android uses a background worker plus local alarms, and the website uses
 * browser notifications.
 *
 * If `sendReminders` is still deployed, remove it:
 *   firebase functions:delete sendReminders
 */
module.exports = {}
