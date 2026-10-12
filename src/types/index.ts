export interface ServiceOption {
    name: string;
    price: number;
    duration: number;
}

export interface AddOnService {
    name: string;
    price: number;
    duration: number;
}

export interface AreaOption {
    name: string;
    price?: number;
    duration?: number;
}

export interface MultiArea {
    name: string;
    price?: number;
    duration?: number;
    packages?: ServiceOption[];
}

export interface TechnicianInfo {
    firstName: string;
    lastName?: string;
    nickname?: string;
}

export interface AreaGroup {
    areaName: string;
    options: AreaOption[];
}

export interface Service {
    id?: string;
    name?: string;
    serviceName?: string;
    price?: number;
    duration?: number;
    description?: string;
    details?: string;
    imageUrl?: string;
    status: 'available' | 'unavailable';
    category?: string;
    serviceType?: 'single' | 'option-based' | 'area-based-options' | 'multi-area';
    serviceOptions?: ServiceOption[];
    areaOptions?: AreaGroup[];
    areas?: MultiArea[];
    selectableAreas?: string[];
    addOnServices?: AddOnService[];
    createdAt?: any;
    updatedAt?: any;
}

export interface Appointment {
    id: string;
    status: 'awaiting_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'pending' | 'blocked';
    queue?: string | number;
    queueNumber?: string | number;
    customerInfo: {
        name?: string;
        fullName?: string;
        phone?: string;
        pictureUrl?: string;
        note?: string;
    };
    serviceInfo: {
        id?: string;
        name?: string;
        imageUrl?: string;
        duration?: number;
        price?: number;
        completionNote?: string;
        // Extended properties
        serviceType?: string;
        selectedOptionName?: string;
        selectedOptionPrice?: number;
        selectedOptionDuration?: number;
        selectedAreas?: string[];
        selectedAreaOptions?: any[];
        selectedArea?: { name: string; price?: number };
        selectedPackage?: { name: string; duration?: number; price?: number };
    };
    appointmentInfo?: {
        dateTime?: any;
        duration?: number;
        addOns?: any[];
        technicianName?: string;
        technicianInfo?: { firstName?: string; lastName?: string };
        employeeId?: string;
        technicianId?: string;
    };
    paymentInfo?: {
        basePrice?: number;
        totalPrice?: number;
        originalPrice?: number;
        amountPaid?: number;
        addOnsTotal?: number;
        discount?: number;
        couponDiscount?: number;
        paymentStatus?: 'paid' | 'unpaid' | 'invoiced' | 'pending';
        paymentMethod?: string;
        paidAt?: any;
    };
    addOns?: any[];
    date?: any;
    time?: string;
    dateTime?: any;
    userId?: string;
    completionNote?: string;
    createdAt?: any;
    updatedAt?: any;
}

export type ServiceInfoSnap = Appointment['serviceInfo'];

export interface Technician {
    id: string;
    firstName: string;
    lastName?: string;
    phoneNumber: string;
    lineUserId?: string;
    imageUrl?: string;
    status: 'available' | 'on_trip' | 'unavailable' | 'suspended';
    createdAt?: any;
    updatedAt?: any;
}

export interface Customer {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    points?: number;
    userId?: string; // LINE User ID
    imageUrl?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    email?: string;
    lineUserId?: string;
    photoURL?: string;
    status?: 'available' | 'on_leave' | 'suspended';
    role?: 'admin' | 'employee';
    createdAt?: any;
    updatedAt?: any;
    uid?: string; // Links to Auth
}

// ==============================================================================
// DENTAL CLINIC SPECIFIC TYPES (ธีมฟ้าเขียว / Dental Types)
// ==============================================================================

export interface DentalChair {
    id: string;
    name: string; // เช่น 'Unit 1 (ริมหน้าต่าง)', 'Unit 2'
    roomNumber?: string;
    status: 'available' | 'occupied' | 'maintenance';
    colorCode?: string; // ธีมฟ้าเขียว เช่น '#0D9488'
    createdAt?: any;
    updatedAt?: any;
}

export interface DentalPatient extends Customer {
    hn?: string; // เช่น 'DN-670001'
    idCardNumber?: string;
    bloodGroup?: 'A' | 'B' | 'AB' | 'O' | string;
    drugAllergies?: string[];
    medicalConditions?: string[];
    takingBloodThinners?: boolean; // ทานยาละลายลิ่มเลือด (วิกฤตสำหรับการถอน/ผ่า)
    isPregnant?: boolean;
    emergencyContact?: {
        name?: string;
        relation?: string;
        phone?: string;
    };
}

export interface Dentist extends Technician {
    licenseNumber?: string; // ท.xxxx
    specialty?: 'General' | 'Orthodontics' | 'Oral Surgery' | 'Endodontics' | 'Pedodontics' | 'Periodontics' | string;
    dfPercentage?: number; // % Doctor Fee
    defaultChairId?: string;
}

export interface DentalRecord {
    id: string;
    appointmentId?: string;
    patientId: string;
    dentistId: string;
    chairId?: string;
    toothNumber: string; // '11' - '48' (FDI) หรือ 'all'
    surface?: 'MODBL' | 'MOD' | 'MO' | 'DO' | 'O' | 'B' | 'L' | string;
    condition?: 'healthy' | 'caries' | 'filled' | 'missing' | 'impacted' | 'crown' | 'rct' | string;
    diagnosis?: string;
    treatmentDone: string;
    doctorNotes?: string;
    anesthesiaUsed?: string;
    cost?: number;
    dfAmount?: number;
    xrayUrls?: string[];
    createdAt?: any;
    updatedAt?: any;
}

export interface OrthoCase {
    id: string;
    patientId: string;
    dentistId: string;
    planName: string; // เช่น 'จัดฟันโลหะ (Metal Brackets)'
    totalAmount: number;
    paidAmount: number;
    totalMonths: number;
    currentMonth: number;
    status: 'in_progress' | 'completed' | 'cancelled';
    bracketUpperBonded?: boolean;
    bracketLowerBonded?: boolean;
    notes?: string;
    createdAt?: any;
}

export interface OrthoInstallment {
    id: string;
    caseId: string;
    installmentNo: number;
    dueAmount: number;
    paidAmount?: number;
    paidAt?: any;
    status: 'pending' | 'paid';
    procedureNote?: string;
    appointmentId?: string;
}

export interface DentalLabOrder {
    id: string;
    orderCode: string;
    patientId: string;
    dentistId: string;
    labName: string;
    applianceType: string; // 'Retainer', 'Crown', 'Night Guard'
    toothNumber?: string;
    shade?: string;
    impressionDate: string;
    expectedDate: string;
    receivedDate?: string;
    fittingAppointmentId?: string;
    labFee?: number;
    status: 'sent' | 'in_process' | 'received' | 'fitted' | 'redo';
    notes?: string;
    createdAt?: any;
}

export interface DentalPrescription {
    id: string;
    appointmentId?: string;
    patientId: string;
    dentistId: string;
    medicineName: string;
    dosage: string;
    quantity: number;
    dispensed?: boolean;
    createdAt?: any;
}

