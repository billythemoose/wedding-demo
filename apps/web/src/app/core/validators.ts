import { AbstractControl, ValidationErrors } from '@angular/forms';
import { PhoneNumberUtil } from 'google-libphonenumber';

const util = PhoneNumberUtil.getInstance();
export function E164Validator(region = 'US') {
  return (c: AbstractControl): ValidationErrors | null => {
    try {
      const n = util.parseAndKeepRawInput(c.value, region);
      return util.isPossibleNumber(n) ? null : { phone: 'invalid' };
    } catch {
      return { phone: 'invalid' };
    }
  };
}
