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

export const SinkSchema = z.object({
  type: z.string(),
  holes: z.number().int().min(0),
}).nullable();

export const SkirtingSchema = z.object({
  enabled: z.boolean(),
  heightCm: z.number().positive().optional(),
});

export const TrimSchema = z.object({
  enabled: z.boolean(),
  model: z.string().optional(),
});

export const SideBoxSchema = z.object({
  enabled: z.boolean(),
  sizeCm: z.number().positive().optional(),
});

export const ConfigurationInputSchema = z.object({
  stoneColorId: z.string().cuid(),
  thicknessId: z.string().cuid(),
  formTypeId: z.string().cuid(),
  edgeTypeId: z.string().cuid(),
  dimensions: DimensionsSchema,
  sink: SinkSchema.optional(),
  cooktopHole: z.boolean().default(false),
  install: z.boolean().default(false),
  skirting: SkirtingSchema.optional(),
  trim: TrimSchema.optional(),
  panelled: z.boolean().default(false),
  sideBox: SideBoxSchema.optional(),
  address: AddressSchema.optional(),
  dealerId: z.string().cuid().optional(),
});

export type ConfigurationInput = z.infer<typeof ConfigurationInputSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Dimensions = z.infer<typeof DimensionsSchema>;
