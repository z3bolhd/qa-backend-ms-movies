import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint()
export class IsValueTrimmedConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    return value.trim() === value;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return `Поле ${validationArguments.property} не может содержать пробелы в начале или в конце`;
  }
}
