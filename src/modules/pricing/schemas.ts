/**
 * Zod schemas for pricing module - contract v1.0.0
 */

import { z } from 'zod';

export const AddressSchema = z.object({
  city: z.string().min(1),
  district: z.string().optional().default(''),
});

export const DimensionsStraightSchema = z.object({
  formType: z.literal('STRAIGHT'),
  length: z.number().positive(),
  depth: z.number().positive(),
});

export const DimensionsLSchema = z.object({
  formType: z.literal('L'),
  leg1: z.number().positive(),
  leg2: z.number().positive(),
  depth: z.number().positive(),
});

export const DimensionsUSchema = z.object({
  formType: z.literal('U'),
  leg1: z.number().positive(),
  leg2: z.number().positive(),
  leg3: z.number().positive(),
  depth: z.number().positive(),
});

export const DimensionsIslandSchema = z.object({
  formType: z.literal('ISLAND'),
  length: z.number().positive(),
  depth: z.number().positive(),
});

export const DimensionsSchema = z.discriminatedUnion('formType', [
  DimensionsStraightSchema,
  DimensionsLSchema,
  DimensionsUSchema,
  DimensionsIslandSchema,
]);

export const ConfigurationInputSchema = z.object({
  stoneColorId: z.string().cuid(),
  thicknessId: z.string().cuid(),
  formTypeId: z.string().cuid(),
  edgeTypeId: z.string().cuid(),
  dimensions: DimensionsSchema,
  sinkHoles: z.number().int().min(0).default(0),
  cooktopHole: z.boolean().default(false),
  install: z.boolean().default(false),
  skirtingEnabled: z.boolean().default(false),
  skirtingHeightCm: z.number().positive().optional(),
  trimEnabled: z.boolean().default(false),
  trimModel: z.string().optional(),
  address: AddressSchema.optional(),
  dealerId: z.string().cuid().optional(),
});

export type ConfigurationInput = z.infer<typeof ConfigurationInputSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
