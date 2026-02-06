
export enum AssetStatus {
  IN_STOCK = 'In Stock',
  RESERVED = 'Reserved', 
  ALLOCATED = 'Allocated',
  FAULTY = 'Faulty',
  UNDER_REPAIR = 'Under Repair', 
  VENDOR_RETURN = 'Vendor Return',
  RETIRED = 'Retired'
}

export enum RequestStatus {
  PENDING = 'Pending',
  PREPARING = 'Preparing',
  READY_FOR_COLLECTION = 'Ready for Collection',
  COMPLETED = 'Completed',
  RETURN_INITIATED = 'Return Initiated',
  RETURNED = 'Returned',
  RETURN_REJECTED = 'Return Rejected',
  REPAIR_IN_PROGRESS = 'Repair In Progress',
  REPAIR_COMPLETED = 'Repair Completed',
  AWAITING_HR_DECISION = 'Awaiting HR Decision'
}

export type UserRole = 'HR' | 'IT' | 'EMPLOYEE' | 'PowerIT';

export type RequestType = 'INDIVIDUAL' | 'EVENT_LOAN' | 'OFFBOARDING' | 'REPAIR_SWAP' | 'UPGRADE_PROMOTION' | 'SECURE_SETUP';

export type EmployeeStatus = 'New' | 'Rehire' | 'Temp' | 'Promoted' | 'Secure User' | 'Offboard' | 'Current';

export type IssuancePurpose = 'NEW_LAPTOP' | 'NEW_TABLET' | 'LOAN' | 'REPLACEMENT' | 'SECURE_STATION';

export interface User {
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  id?: string;
  admId?: string;
}

export interface Employee {
  id: string; 
  employeeId: string; 
  firstName: string;
  lastName: string;
  email: string; 
  privateEmail?: string; 
  handphone: string;
  department: string; // Division
  role: string;
  officeLocation: string;
  status: EmployeeStatus;
  dateJoined: string;
  dateResigned?: string;
  isActive: boolean;
  isArchived?: boolean;
  
  // Reporting Officer Hierarchy
  reportingOfficerName: string;
  reportingOfficerId: string;
  reportingOfficerRole: string;
  reportingOfficerHp: string;
  reportingOfficerEmail: string;
  reportingOfficerPrivateEmail?: string;
  reportingOfficerDivision: string;
  reportingOfficerLocation: string;
}

export interface Asset {
  id: string;
  assetTag: string; // IT-2025-L/T/D/X/E/S
  brand: string;
  model: string; 
  specs: string; // Intel Core Ultra, 64GB RAM, etc.
  serialNumber: string;
  type: 'Laptop' | 'Tablet' | 'Desktop' | 'Peripheral' | 'Mobile';
  status: AssetStatus;
  purchaseDate: string;
  expiryDate?: string; 
  vendor: string;
  poNumber: string;
  macAddress: string;
  hostname?: string;
  cloudId?: string;
  assignedTo?: string; // Custodian EMPID
  peripherals: {
    kensingtonLock: boolean;
    powerAdapter: boolean;
    mouse: boolean;
    notebookBag: boolean;
    keyboard: boolean;
  };
}

export interface ITEngineer {
    id: string;
    name: string;
    email?: string;
    active: boolean;
}

export interface AssetRequest {
  id: string;
  type: RequestType;
  employeeId: string; 
  issuancePurpose?: IssuancePurpose;
  hostname?: string;
  requestedLaptopModel: string;
  requiredSoftware: string[];
  requiredHardware?: string[];
  othersHardware?: string;
  collectionDate: string; 
  collectionTime: string; 
  status: RequestStatus;
  assignedAssetId?: string; 
  signedUAT?: string; 
  signedDate?: string;
  handoverPhoto?: string;
  handoverItEngineerName?: string;
  handoverItEngineerId?: string;
  accessoriesChecked?: any;
  verifiedCondition?: boolean;
  verifiedLogin?: boolean;
  uatRemarks?: string;
  justification?: string;
}

export interface ReturnRecord {
  id: string;
  assetId: string;
  employeeId: string;
  returnDate: string;
  condition: 'Good' | 'Damaged' | 'Faulty';
  remarks: string;
  photo?: string;
  processedBy: string;
  itEngineerId: string;
  itEngineerName: string;
  itSignature?: string;
}

export const LAPTOP_MODELS = [
  'Dell Latitude 7350',
  'HP EliteBook 640 G11',
  'MacBook Pro 14',
  'Lenovo ThinkBook 14 Gen 8'
];

export const COLLECTION_SLOTS = [
  "09:00 AM",
  "10:30 AM",
  "11:15 AM",
  "02:00 PM",
  "03:30 PM",
  "04:45 PM"
];

export const SOFTWARE_CATALOG = [
  { id: '1', name: 'Microsoft Office 365' },
  { id: '2', name: 'Microsoft Teams' },
  { id: '3', name: 'Outlook Email Setup' },
  { id: '4', name: 'OneDrive Setup' },
  { id: '5', name: 'SharePoint Access' },
  { id: '6', name: 'VPN Access' },
  { id: '7', name: 'Visual Studio Code' },
  { id: '8', name: 'Docker Desktop' }
];

export const HARDWARE_ACCESSORIES = [
  { id: 'h1', name: 'Secure Thumb Drive' },
  { id: 'h2', name: 'External Harddrive' },
  { id: 'h3', name: 'SIM Card' }
];
