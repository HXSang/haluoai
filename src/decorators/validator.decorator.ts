import { RegexConstant } from '@n-constants';
import { registerDecorator, ValidationOptions } from 'class-validator';
import { validate } from './class-validator-custom/time';

export function IsTimeFormat(validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'isTimeFormat',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: validate,
    });
  };
}

export function IsAlphaNumericString(validationOptions?: ValidationOptions) {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      name: 'isAlphaNumericString',
      target: object.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message: `${propertyName} must be a string and not contain special characters or spaces`,
      },
      constraints: [],
      validator: {
        validate(value: any) {
          if (value === '') return true;
          const notSpecialCharacterReg = new RegExp(
            RegexConstant.AlphaNumericRegex,
          );
          return (
            typeof value === 'string' && notSpecialCharacterReg.test(value)
          );
        },
      },
    });
  };
}
