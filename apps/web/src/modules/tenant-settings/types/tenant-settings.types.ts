export interface CustomFieldDefinition {
  id: string;
  entityType: string;
  fieldKey: string;
  label: string;
  dataType: string;
  configuration: Record<string, unknown>;
  required: boolean;
  classification: string | null;
  status: string;
}

export interface CreateCustomFieldPayload {
  entityType: string;
  fieldKey: string;
  label: string;
  dataType: string;
  configuration?: Record<string, unknown>;
  required?: boolean;
  classification?: string;
}

export interface UpdateCustomFieldPayload {
  label?: string;
  configuration?: Record<string, unknown>;
  required?: boolean;
  status?: string;
}

export interface HolidayCalendar {
  id: string;
  code: string;
  name: string;
  countryCode: string | null;
  legalEntityId: string | null;
  branchId: string | null;
  status: string;
  holidayCount: number;
}

export interface CreateHolidayCalendarPayload {
  code: string;
  name: string;
  countryCode?: string;
  legalEntityId?: string;
  branchId?: string;
}

export interface Holiday {
  id: string;
  calendarId: string;
  holidayDate: string;
  name: string;
  dayFraction: number;
  paid: boolean;
}

export interface CreateHolidayPayload {
  holidayDate: string;
  name: string;
  dayFraction?: number;
  paid?: boolean;
}

export interface PayrollGroup {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface CreatePayrollGroupPayload {
  code: string;
  name: string;
}

export interface PayrollCalendar {
  id: string;
  payrollGroupId: string;
  payrollGroupName: string;
  payrollGroupCode: string;
  calendarYear: number;
  status: string;
  publishedAt: string | null;
  periodCount: number;
}

export interface CreatePayrollCalendarPayload {
  payrollGroupId: string;
  calendarYear: number;
}

export interface PayrollPeriod {
  id: string;
  periodCode: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  attendanceCutoffAt: string;
  adjustmentCutoffAt: string;
  status: string;
}

export interface CreatePayrollPeriodPayload {
  periodCode: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  attendanceCutoffAt: string;
  adjustmentCutoffAt: string;
}
