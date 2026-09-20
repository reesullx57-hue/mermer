/**
 * POST /api/pricing/quote
 * Generates a pricing quote for a countertop configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeQuote } from '@/modules/pricing';
import { ConfigurationInputSchema } from '@/modules/pricing/schemas';
import type { PricingSnapshot } from '@/modules/pricing/types';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input against Zod schema
    const validatedInput = ConfigurationInputSchema.parse(body);

    // Compute quote
    const pricingSnapshot = await computeQuote(validatedInput);

    // Return response with money strings + pricing snapshot
    return NextResponse.json({
      success: true,
      data: {
        subtotalExVat: pricingSnapshot.subtotalExVat,
        dealerDiscount: pricingSnapshot.dealerDiscount,
        promoDiscount: pricingSnapshot.promoDiscount,
        vatAmount: pricingSnapshot.vatAmount,
        totalInclVat: pricingSnapshot.totalInclVat,
        pricingSnapshot,
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid configuration input',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Handle specific Prisma/database errors
    if (error instanceof Error) {
      // Check for "not found" errors
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

      // Log error for debugging
      console.error('Quote computation error:', error);

      // Return generic error response
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to compute quote',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // Unknown error type
    return NextResponse.json(
      {
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
