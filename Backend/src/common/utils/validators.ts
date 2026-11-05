import { registerDecorator, ValidationOptions } from 'class-validator';
import { validarPatente } from './patente';
import { validarRut } from './rut';

export function EsRut(opciones?: ValidationOptions): PropertyDecorator {
  return (objeto, propiedad) =>
    registerDecorator({
      name: 'esRut',
      target: objeto.constructor,
      propertyName: propiedad as string,
      options: { message: 'RUT inválido', ...opciones },
      validator: { validate: (valor: unknown) => typeof valor === 'string' && validarRut(valor) },
    });
}

export function EsPatente(opciones?: ValidationOptions): PropertyDecorator {
  return (objeto, propiedad) =>
    registerDecorator({
      name: 'esPatente',
      target: objeto.constructor,
      propertyName: propiedad as string,
      options: { message: 'Patente inválida', ...opciones },
      validator: { validate: (valor: unknown) => typeof valor === 'string' && validarPatente(valor) },
    });
}
