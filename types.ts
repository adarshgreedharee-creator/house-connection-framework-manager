
export type FeasibilityStatus = 'Feasible' | 'Not Feasible' | 'Low Lying';
export type WorksStatus = 'Not Started' | 'Ongoing' | 'Completed' | 'Claimed' | 'Certified';
export type OverbudgetStatus = 'Not Started' | 'Ongoing' | 'Completed' | 'Claimed' | 'Paid';

export interface FileData {
  name: string;
  dataUrl: string;
  mimeType: string;
}

export interface BOQItemValues {
  estExpr: string;
  estVal: number;
  overExpr: string;
  overVal: number;
  claimExpr: string;
  claimVal: number;
  certExpr: string;
  certVal: number;
}

export interface Totals {
  est: number;
  over: number;
  claim: number;
  cert: number;
}

export interface HouseConnectionRecord {
  id: string;
  listNo: string;
  reference: string;
  surname: string;
  name: string;
  phone1: string;
  phone2: string;
  address: string;
  location: string;
  surveyDate: string;
  feasible: FeasibilityStatus;
  worksStatus: WorksStatus;
  overbudgetStatus: OverbudgetStatus;
  reason: string;
  photos: FileData[];
  drawings: FileData[];
  boq: Record<string, BOQItemValues>;
  totals: Totals;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface BOQMasterItem {
  section: string;
  bill: string;
  desc: string;
  unit: string;
  rate: number | null;
  rateStr: string;
  kind: 'section' | 'group' | 'item' | 'note' | 'subsection';
}

export interface User {
  username: string;
  role: 'Admin' | 'Engineer' | 'Surveyor';
  status?: 'online' | 'offline';
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  targetRef?: string;
}
