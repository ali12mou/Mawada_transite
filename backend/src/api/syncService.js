/**
 * Sync Service - Formerly used for syncing MongoDB with Supabase.
 * This service is now deactivated as the system has fully migrated to MongoDB.
 */

export async function syncCollectionToSupabase() {
  return {
    synced: false,
    reason: 'Supabase integration has been removed. System is strictly MongoDB.'
  };
}
