/**
 * @typedef {'ADMIN' | 'FARMER' | 'CONSUMER'} UserRole
 * @typedef {'ACTIVE' | 'SUSPENDED' | 'PENDING'} AccountStatus
 * @typedef {'PENDING' | 'APPROVED' | 'REJECTED'} VerificationStatus
 * @typedef {'ORGANIC' | 'NATURAL' | 'CONVENTIONAL' | 'HYDROPONIC' | 'PERMACULTURE'} FarmingMethod
 *
 * @typedef {Object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {UserRole} role
 * @property {AccountStatus} accountStatus
 * @property {string} createdAt
 *
 * @typedef {Object} FarmerProfile
 * @property {string} _id
 * @property {string} user
 * @property {{ address: string, district: string, state: string, pincode: string }} farmLocation
 * @property {string[]} cropTypes
 * @property {FarmingMethod} farmingMethod
 * @property {VerificationStatus} verificationStatus
 * @property {number} farmSizeAcres
 * @property {number} experienceYears
 * @property {string} bio
 * @property {{ average: number, count: number }} rating
 *
 * @typedef {Object} Product
 * @property {string} _id
 * @property {string|Object} farmer
 * @property {string|Object} category
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} unit
 * @property {number} quantity
 * @property {number} minOrderQuantity
 * @property {string} harvestDate
 * @property {FarmingMethod} farmingMethod
 * @property {boolean} isOrganic
 * @property {string[]} images
 * @property {{ district: string, state: string }} location
 * @property {'IN_STOCK'|'LOW_STOCK'|'OUT_OF_STOCK'|'UNAVAILABLE'} availabilityStatus
 * @property {boolean} isFeatured
 * @property {boolean} isActive
 *
 * @typedef {Object} Order
 * @property {string} _id
 * @property {string} orderNumber
 * @property {string|Object} consumer
 * @property {Array<{ product: string, farmer: string, name: string, unit: string, price: number, quantity: number, itemTotal: number }>} items
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} total
 * @property {string} status
 * @property {string} deliveryDate
 * @property {string} deliverySlot
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  FARMER: 'FARMER',
  CONSUMER: 'CONSUMER',
};

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
};

export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};
