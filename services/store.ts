
import { Asset, AssetStatus, AssetRequest, Employee, RequestStatus, User, EmployeeStatus, ITEngineer } from '../types';

const STORAGE_KEYS = {
  EMPLOYEES: 'itam_employees',
  ASSETS: 'itam_assets',
  REQUESTS: 'itam_requests',
  RETURNS: 'itam_returns',
  SESSION: 'itam_session',
  WITNESSES: 'itam_witnesses',
  INIT: 'itam_initialized_v26' 
};

export const AuthService = {
  login: (username: string, password: string): User | null => {
    if (username === 'hr_admin' && password === 'hr123') {
      const user: User = { username, role: 'HR', name: 'HR Manager', admId: 'ADM-HR-01' };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    if (username === 'it_bau' && password === 'it123') {
      const user: User = { username, role: 'IT', name: 'IT Admin', admId: 'ADM-IT-01' };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    if (username === 'power_it' && password === 'rainpower2025') {
        const user: User = { username, role: 'PowerIT', name: 'Super Admin', admId: 'ADM-SUP-01' };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        return user;
    }

    const employees = DataService.getEmployees();
    const foundEmp = employees.find(e => e.email.toLowerCase() === username.toLowerCase());
    
    if (foundEmp && password.toLowerCase() === foundEmp.firstName.toLowerCase()) {
        const user: User = { 
            username: foundEmp.email, 
            role: 'EMPLOYEE', 
            name: `${foundEmp.firstName} ${foundEmp.lastName}`,
            id: foundEmp.id
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        return user;
    }
    return null;
  },
  logout: () => localStorage.removeItem(STORAGE_KEYS.SESSION),
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    return stored ? JSON.parse(stored) : null;
  }
};

const seedData = () => {
  if (localStorage.getItem(STORAGE_KEYS.INIT)) return;
  
  const employees: Employee[] = [
    {
        id: 'emp-cynthia',
        employeeId: 'EMP00888',
        firstName: 'Cynthia',
        lastName: 'Matthew',
        role: 'Senior Architect',
        handphone: '123456789',
        privateEmail: 'Cynthia@gmail.com',
        email: 'Cynthia@company.com',
        department: 'Architect Central',
        officeLocation: 'Orchard Gateway Office, 218 Orchard Rd, Level 4',
        status: 'New',
        dateJoined: '2025-10-10',
        isActive: true,
        reportingOfficerName: 'Sam Smith',
        reportingOfficerId: 'EMP00123',
        reportingOfficerRole: 'Architectural Manager',
        reportingOfficerHp: '123123123',
        reportingOfficerEmail: 'Sam@company.com',
        reportingOfficerDivision: 'Architect Central',
        reportingOfficerLocation: 'Orchard Gateway Office, 218 Orchard Rd, Level 4'
    }
  ];

  const brands = ['Dell', 'HP', 'Apple', 'Lenovo'];
  const models = ['Dell Latitude 7350', 'HP EliteBook 640 G11', 'MacBook Pro 14', 'Lenovo ThinkBook 14 Gen 8'];
  const assets: Asset[] = [];

  models.forEach((model, mIdx) => {
    const brand = brands[mIdx];
    for (let i = 1; i <= 8; i++) {
        assets.push({
            id: `ast-${brand.toLowerCase()}-${i}`,
            assetTag: `IT-2025-L${mIdx + 1}00${i}`,
            brand: brand,
            model: model,
            specs: 'High Performance Spec (v25 Seed)',
            serialNumber: `${brand.toUpperCase()}-SN-${1000 + i}`,
            type: 'Laptop',
            status: AssetStatus.IN_STOCK,
            purchaseDate: '2025-01-01',
            expiryDate: '2025-12-31',
            vendor: `${brand} Authorized Dealer`,
            poNumber: `PO-${brand.toUpperCase()}-2025`,
            macAddress: `00:11:22:33:44:0${mIdx}${i}`,
            peripherals: { kensingtonLock: true, powerAdapter: true, mouse: true, notebookBag: true, keyboard: false }
        });
    }
  });

  const witnesses: ITEngineer[] = [
      { id: 'IT-001', name: 'James Carter', active: true },
      { id: 'IT-002', name: 'Sarah Connor', active: true },
      { id: 'IT-003', name: 'Neo Anderson', active: true }
  ];

  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.WITNESSES, JSON.stringify(witnesses));
  localStorage.setItem(STORAGE_KEYS.INIT, 'true');
};

seedData();

export const DataService = {
  getEmployees: (): Employee[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]'),
  getAssets: (): Asset[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSETS) || '[]'),
  getRequests: (): AssetRequest[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS) || '[]'),
  getWitnesses: (): ITEngineer[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.WITNESSES) || '[]'),

  saveWitness: (witness: ITEngineer) => {
      const list = DataService.getWitnesses();
      const idx = list.findIndex(w => w.id === witness.id);
      if (idx >= 0) list[idx] = witness; else list.push(witness);
      localStorage.setItem(STORAGE_KEYS.WITNESSES, JSON.stringify(list));
  },

  deleteWitness: (id: string) => {
      const list = DataService.getWitnesses();
      const newList = list.filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEYS.WITNESSES, JSON.stringify(newList));
  },
  
  saveAsset: (asset: Asset) => {
      const list = DataService.getAssets();
      const idx = list.findIndex(a => a.id === asset.id);
      if (idx >= 0) list[idx] = asset; else list.push(asset);
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(list));
  },

  deleteAsset: (id: string) => {
      const list = DataService.getAssets();
      const newList = list.filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(newList));
  },

  bulkImportAssets: (newAssets: Asset[]) => {
      const current = DataService.getAssets();
      const combined = [...current, ...newAssets];
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(combined));
  },

  saveEmployee: (emp: Employee) => {
    const list = DataService.getEmployees();
    const idx = list.findIndex(e => e.id === emp.id);
    if (idx >= 0) list[idx] = emp; else list.push(emp);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
  },

  deleteEmployee: (id: string) => {
    const list = DataService.getEmployees();
    const newList = list.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(newList));
  },
  
  bulkImportEmployees: () => {
    const current = DataService.getEmployees();
    const startId = current.length + 1000;
    const newBatch: Employee[] = [];
    const depts = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Logistics'];
    
    for (let i = 1; i <= 100; i++) {
        const empId = `EMP${startId + i}`;
        newBatch.push({
            id: `bulk-${Date.now()}-${i}`,
            employeeId: empId,
            firstName: `User${i}`,
            lastName: `Staff`,
            role: 'Staff Associate',
            handphone: `9000${(i + 1000).toString()}`,
            privateEmail: `user${i}.staff@gmail.com`,
            email: `user${i}.staff@company.com`,
            department: depts[i % depts.length],
            officeLocation: 'HQ',
            status: 'Current',
            dateJoined: '2025-01-01',
            isActive: true,
            reportingOfficerName: 'Manager Mike',
            reportingOfficerId: 'EMP-MGR-001',
            reportingOfficerRole: 'Dept Lead',
            reportingOfficerHp: '98887777',
            reportingOfficerEmail: 'mike@company.com',
            reportingOfficerDivision: 'Operations',
            reportingOfficerLocation: 'HQ'
        });
    }
    const total = [...current, ...newBatch];
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(total));
  },

  saveRequest: (req: AssetRequest) => {
    const list = DataService.getRequests();
    const idx = list.findIndex(r => r.id === req.id);
    if (idx >= 0) list[idx] = req; else list.push(req);
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
  },

  fulfillRequest: (reqId: string, assetId: string, hostname: string) => {
    const assets = DataService.getAssets();
    const requests = DataService.getRequests();
    const aIdx = assets.findIndex(a => a.id === assetId);
    const rIdx = requests.findIndex(r => r.id === reqId);
    
    if (aIdx >= 0 && rIdx >= 0) {
        // Phase 2: Hardware Locked (RESERVED)
        assets[aIdx].status = AssetStatus.RESERVED;
        assets[aIdx].hostname = hostname;
        assets[aIdx].assignedTo = requests[rIdx].employeeId; 

        requests[rIdx].assignedAssetId = assetId;
        requests[rIdx].status = RequestStatus.READY_FOR_COLLECTION;
        
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
        return true;
    }
    return false;
  },

  finalizeHandover: (reqId: string) => {
    const assets = DataService.getAssets();
    const requests = DataService.getRequests();
    const rIdx = requests.findIndex(r => r.id === reqId);
    
    if (rIdx >= 0) {
        const assetId = requests[rIdx].assignedAssetId;
        const employeeId = requests[rIdx].employeeId;
        const aIdx = assets.findIndex(a => a.id === assetId);
        
        if (aIdx >= 0) {
            // Phase 3: Finalized (ALLOCATED)
            assets[aIdx].status = AssetStatus.ALLOCATED;
            assets[aIdx].assignedTo = employeeId;
            localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
            console.log(`RAIN SQL LEDGER: Updated asset ${assets[aIdx].assetTag} custodian to ${employeeId}.`);
        }
    }
  },

  processReturn: (record: any) => {
    const assets = DataService.getAssets();
    const aIdx = assets.findIndex(a => a.id === record.assetId);
    if (aIdx >= 0) {
        assets[aIdx].status = record.condition === 'Good' ? AssetStatus.IN_STOCK : AssetStatus.FAULTY;
        assets[aIdx].assignedTo = undefined;
        assets[aIdx].hostname = undefined;
        localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
    }
  },
  
  checkVendorReturns: () => {
    const assets = DataService.getAssets();
    const vendorReturns = assets.filter(a => a.status === AssetStatus.VENDOR_RETURN);
    if (vendorReturns.length > 0) {
      console.log(`Found ${vendorReturns.length} assets flagged for vendor return.`);
    }
  }
};
