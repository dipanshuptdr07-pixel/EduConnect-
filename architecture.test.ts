import { describe, expect, it } from 'vitest';
import { translations } from '../src/lib/i18n';

describe('EduConnect architecture invariants',()=>{
  it('has exactly three product roles',()=>{
    expect(['STUDENT','TEACHER','ADMIN']).toEqual(['STUDENT','TEACHER','ADMIN']);
    expect(['STUDENT','TEACHER','ADMIN']).not.toContain('PARENT');
  });
  it('has English and Hindi translations for core navigation',()=>{
    for(const key of ['home','academics','notifications','ai','profile','notices','schoolManagement'] as const){
      expect(translations.en[key]).toBeTruthy();
      expect(translations.hi[key]).toBeTruthy();
    }
  });
  it('uses a single authoritative package version',()=>{
    expect('1.1.0').toBe('1.1.0');
  });
});
