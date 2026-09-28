import { collection, doc } from 'firebase/firestore'

/**
 * Multi-tenant Firestore collection path generators.
 * All client-specific data is strictly scoped under `/clients/{clientId}/...`
 */
export const FirestorePaths = {
  client: (clientId) => `clients/${clientId}`,
  warehouses: (clientId) => `clients/${clientId}/warehouses`,
  stores: (clientId) => `clients/${clientId}/stores`,
  products: (clientId) => `clients/${clientId}/products`,
  sales: (clientId) => `clients/${clientId}/sales`,
  staff: (clientId) => `clients/${clientId}/staff`,
  auditLogs: (clientId) => `clients/${clientId}/audit_logs`,
}

/**
 * Firestore Collection References for the Modular Web SDK
 */
export function getTenantCollections(db, clientId) {
  if (!db || !clientId) return null
  return {
    clientDoc: doc(db, 'clients', clientId),
    warehouses: collection(db, 'clients', clientId, 'warehouses'),
    stores: collection(db, 'clients', clientId, 'stores'),
    products: collection(db, 'clients', clientId, 'products'),
    sales: collection(db, 'clients', clientId, 'sales'),
    staff: collection(db, 'clients', clientId, 'staff'),
    auditLogs: collection(db, 'clients', clientId, 'audit_logs'),
  }
}

