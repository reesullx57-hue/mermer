import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST() {
  try {
    const demoEmail = `demo-${Date.now()}@mermer.app`;
    const hashedPassword = await hashPassword('demo123');

    let demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        password: hashedPassword,
        name: 'Demo Kullanıcı',
      },
    });

    // Create sample project with synthetic marble texture
    await prisma.project.create({
      data: {
        name: 'Örnek Proje - Mutfak Tezgahı',
        userId: demoUser.id,
        slabPhotoUrl: '/sample-marble.svg',
        slabWidth: 2400,
        slabHeight: 1400,
        calibrationData: JSON.stringify({
          corners: [
            { x: 50, y: 50 },
            { x: 750, y: 50 },
            { x: 750, y: 550 },
            { x: 50, y: 550 },
          ],
          slabWidth: 2400,
          slabHeight: 1400,
        }),
        pieces: {
          create: [
            {
              name: 'Ana Tezgah',
              type: 'rectangle',
              geometry: JSON.stringify({
                width: 800,
                height: 600,
                points: [
                  { x: 0, y: 0 },
                  { x: 800, y: 0 },
                  { x: 800, y: 600 },
                  { x: 0, y: 600 },
                ],
              }),
              x: 100,
              y: 100,
              rotation: 0,
              flipped: false,
              width: 800,
              height: 600,
              orderIndex: 0,
            },
            {
              name: 'Ada Tezgah',
              type: 'rectangle',
              geometry: JSON.stringify({
                width: 1000,
                height: 600,
                points: [
                  { x: 0, y: 0 },
                  { x: 1000, y: 0 },
                  { x: 1000, y: 600 },
                  { x: 0, y: 600 },
                ],
              }),
              x: 1200,
              y: 400,
              rotation: 0,
              flipped: false,
              width: 1000,
              height: 600,
              orderIndex: 1,
            },
          ],
        },
      },
    });

    await createSession(demoUser.id, demoUser.email, demoUser.role);

    return NextResponse.json({
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Demo giriş başarısız' },
      { status: 500 }
    );
  }
}
