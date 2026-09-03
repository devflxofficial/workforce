'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maybeToastSuccess, toastApiError } from '../../../lib/api/toast-api';
import { tenantSettingsApi } from '../api/tenant-settings-api';
import type {
  CreateCustomFieldPayload,
  CreateHolidayCalendarPayload,
  CreateHolidayPayload,
  CreatePayrollCalendarPayload,
  CreatePayrollGroupPayload,
  CreatePayrollPeriodPayload,
  UpdateCustomFieldPayload,
} from '../types/tenant-settings.types';

export const TENANT_SETTINGS_KEYS = {
  all: ['tenant-settings'] as const,
  customFields: (entityType?: string) => [...TENANT_SETTINGS_KEYS.all, 'custom-fields', entityType] as const,
  holidayCalendars: () => [...TENANT_SETTINGS_KEYS.all, 'holiday-calendars'] as const,
  holidays: (calendarId: string) => [...TENANT_SETTINGS_KEYS.all, 'holidays', calendarId] as const,
  payrollGroups: () => [...TENANT_SETTINGS_KEYS.all, 'payroll-groups'] as const,
  payrollCalendars: (year?: number) => [...TENANT_SETTINGS_KEYS.all, 'payroll-calendars', year] as const,
  payrollPeriods: (calendarId: string) => [...TENANT_SETTINGS_KEYS.all, 'payroll-periods', calendarId] as const,
};

export function useCustomFields(entityType?: string) {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.customFields(entityType),
    queryFn: () => tenantSettingsApi.customFields.list(entityType),
  });
}

export function useCreateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomFieldPayload) => tenantSettingsApi.customFields.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useUpdateCustomField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomFieldPayload }) =>
      tenantSettingsApi.customFields.update(id, payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useHolidayCalendars() {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.holidayCalendars(),
    queryFn: () => tenantSettingsApi.holidayCalendars.list(),
  });
}

export function useCreateHolidayCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHolidayCalendarPayload) => tenantSettingsApi.holidayCalendars.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useHolidays(calendarId: string | undefined) {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.holidays(calendarId ?? ''),
    queryFn: () => tenantSettingsApi.holidayCalendars.listHolidays(calendarId!),
    enabled: !!calendarId,
  });
}

export function useCreateHoliday(calendarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHolidayPayload) =>
      tenantSettingsApi.holidayCalendars.createHoliday(calendarId, payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holidayId: string) => tenantSettingsApi.holidayCalendars.deleteHoliday(holidayId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function usePayrollGroups() {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.payrollGroups(),
    queryFn: () => tenantSettingsApi.payroll.listGroups(),
  });
}

export function useCreatePayrollGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollGroupPayload) => tenantSettingsApi.payroll.createGroup(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function usePayrollCalendars(year?: number) {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.payrollCalendars(year),
    queryFn: () => tenantSettingsApi.payroll.listCalendars(year),
  });
}

export function useCreatePayrollCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollCalendarPayload) => tenantSettingsApi.payroll.createCalendar(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function usePublishPayrollCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (calendarId: string) => tenantSettingsApi.payroll.publishCalendar(calendarId),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function usePayrollPeriods(calendarId: string | undefined) {
  return useQuery({
    queryKey: TENANT_SETTINGS_KEYS.payrollPeriods(calendarId ?? ''),
    queryFn: () => tenantSettingsApi.payroll.listPeriods(calendarId!),
    enabled: !!calendarId,
  });
}

export function useCreatePayrollPeriod(calendarId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePayrollPeriodPayload) =>
      tenantSettingsApi.payroll.createPeriod(calendarId, payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: TENANT_SETTINGS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}
