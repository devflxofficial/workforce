import { apiClient } from '../../../lib/api/client';
import type { ApiSuccessResponse } from '../../../lib/api/types';
import type {
  CreateCustomFieldPayload,
  CreateHolidayCalendarPayload,
  CreateHolidayPayload,
  CreatePayrollCalendarPayload,
  CreatePayrollGroupPayload,
  CreatePayrollPeriodPayload,
  CustomFieldDefinition,
  Holiday,
  HolidayCalendar,
  PayrollCalendar,
  PayrollGroup,
  PayrollPeriod,
  UpdateCustomFieldPayload,
} from '../types/tenant-settings.types';

export const tenantSettingsApi = {
  customFields: {
    list: (entityType?: string) =>
      apiClient
        .get<ApiSuccessResponse<CustomFieldDefinition[]>>('/custom-field-definitions', {
          params: entityType ? { entityType } : undefined,
        })
        .then((r) => r.data),
    create: (payload: CreateCustomFieldPayload) =>
      apiClient
        .post<ApiSuccessResponse<CustomFieldDefinition>>('/custom-field-definitions', payload)
        .then((r) => r.data),
    update: (id: string, payload: UpdateCustomFieldPayload) =>
      apiClient
        .patch<ApiSuccessResponse<CustomFieldDefinition>>(`/custom-field-definitions/${id}`, payload)
        .then((r) => r.data),
  },
  holidayCalendars: {
    list: () =>
      apiClient
        .get<ApiSuccessResponse<HolidayCalendar[]>>('/holiday-calendars')
        .then((r) => r.data),
    create: (payload: CreateHolidayCalendarPayload) =>
      apiClient
        .post<ApiSuccessResponse<HolidayCalendar>>('/holiday-calendars', payload)
        .then((r) => r.data),
    listHolidays: (calendarId: string) =>
      apiClient
        .get<ApiSuccessResponse<Holiday[]>>(`/holiday-calendars/${calendarId}/holidays`)
        .then((r) => r.data),
    createHoliday: (calendarId: string, payload: CreateHolidayPayload) =>
      apiClient
        .post<ApiSuccessResponse<Holiday>>(`/holiday-calendars/${calendarId}/holidays`, payload)
        .then((r) => r.data),
    deleteHoliday: (holidayId: string) =>
      apiClient.delete(`/holiday-calendars/holidays/${holidayId}`),
  },
  payroll: {
    listGroups: () =>
      apiClient.get<ApiSuccessResponse<PayrollGroup[]>>('/payroll/groups').then((r) => r.data),
    createGroup: (payload: CreatePayrollGroupPayload) =>
      apiClient.post<ApiSuccessResponse<PayrollGroup>>('/payroll/groups', payload).then((r) => r.data),
    listCalendars: (year?: number) =>
      apiClient
        .get<ApiSuccessResponse<PayrollCalendar[]>>('/payroll/calendars', {
          params: year ? { year } : undefined,
        })
        .then((r) => r.data),
    createCalendar: (payload: CreatePayrollCalendarPayload) =>
      apiClient
        .post<ApiSuccessResponse<PayrollCalendar>>('/payroll/calendars', payload)
        .then((r) => r.data),
    publishCalendar: (calendarId: string) =>
      apiClient
        .post<ApiSuccessResponse<PayrollCalendar>>(`/payroll/calendars/${calendarId}/publish`)
        .then((r) => r.data),
    listPeriods: (calendarId: string) =>
      apiClient
        .get<ApiSuccessResponse<PayrollPeriod[]>>(`/payroll/calendars/${calendarId}/periods`)
        .then((r) => r.data),
    createPeriod: (calendarId: string, payload: CreatePayrollPeriodPayload) =>
      apiClient
        .post<ApiSuccessResponse<PayrollPeriod>>(`/payroll/calendars/${calendarId}/periods`, payload)
        .then((r) => r.data),
  },
};
