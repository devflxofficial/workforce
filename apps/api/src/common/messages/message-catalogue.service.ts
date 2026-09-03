import { Injectable } from '@nestjs/common';
import type { MessageKey } from './message-keys.constants';
import enMessages from './en.messages.json';
import urMessages from './ur.messages.json';

const CATALOGUES: Record<string, Record<string, string>> = {
  en: enMessages as Record<string, string>,
  ur: urMessages as Record<string, string>,
};

const DEFAULT_LOCALE = 'en';

@Injectable()
export class MessageCatalogueService {
  resolve(key: MessageKey | string, locale?: string | null): string {
    const normalized = this.normalizeLocale(locale);
    const catalogue = CATALOGUES[normalized] ?? CATALOGUES[DEFAULT_LOCALE];
    return catalogue?.[key] ?? CATALOGUES[DEFAULT_LOCALE]?.[key] ?? key;
  }

  resolveFromRequest(
    key: MessageKey | string,
    acceptLanguage?: string | null,
  ): string {
    const locale = this.parseAcceptLanguage(acceptLanguage);
    return this.resolve(key, locale);
  }

  messagePayload(
    key: MessageKey | string,
    acceptLanguage?: string | null,
  ): { messageKey: string; message: string } {
    return {
      messageKey: key,
      message: this.resolveFromRequest(key, acceptLanguage),
    };
  }

  private normalizeLocale(locale?: string | null): string {
    if (!locale) return DEFAULT_LOCALE;
    const base = locale.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
    return base && CATALOGUES[base] ? base : DEFAULT_LOCALE;
  }

  private parseAcceptLanguage(header?: string | null): string {
    if (!header) return DEFAULT_LOCALE;
    const first = header.split(',')[0]?.trim();
    if (!first) return DEFAULT_LOCALE;
    const lang = first.split('-')[0]?.toLowerCase();
    return lang && CATALOGUES[lang] ? lang : DEFAULT_LOCALE;
  }
}
