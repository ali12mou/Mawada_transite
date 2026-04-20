import { getSupabaseAdminClient } from '../config/supabase.js';

function toSupabaseTableName(collectionName) {
  return `mongodb_${collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

export async function syncCollectionToSupabase({ collectionName, documents }) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      synced: false,
      reason: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing'
    };
  }

  if (!Array.isArray(documents) || documents.length === 0) {
    return {
      synced: true,
      inserted: 0
    };
  }

  const rows = documents.map((doc) => ({
    source_db: 'transit-transport',
    collection_name: collectionName,
    document_id: String(doc._id),
    payload: doc,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('mongo_documents')
    .upsert(rows, {
      onConflict: 'collection_name,document_id'
    });

  if (error) {
    throw error;
  }

  const dedicatedTableName = toSupabaseTableName(collectionName);
  const dedicatedRows = documents.map((doc) => ({
    mongo_document_id: String(doc._id),
    data: doc,
    updated_at: new Date().toISOString()
  }));

  const { error: dedicatedError } = await supabase
    .from(dedicatedTableName)
    .upsert(dedicatedRows, { onConflict: 'mongo_document_id' });

  if (dedicatedError) {
    return {
      synced: true,
      inserted: rows.length,
      dedicatedTableSynced: false,
      dedicatedTableName,
      dedicatedTableReason: dedicatedError.message
    };
  }

  return {
    synced: true,
    inserted: rows.length,
    dedicatedTableSynced: true,
    dedicatedTableName
  };
}
