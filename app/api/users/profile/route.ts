import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  type UpdateUserData,
  updateUser,
} from '@/lib/api/users';
import { serverInstance } from '@/lib/monitoring/rollbar-official';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    serverInstance.error('Error in GET /api/users/profile', {
      error: error instanceof Error ? error.message : String(error),
      userId: 'unknown',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Type guard for body
    const data = body as Record<string, unknown>;
    const updateData: UpdateUserData = {};

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' && data.name !== null) {
        return NextResponse.json(
          { error: 'Name must be a string or null' },
          { status: 400 }
        );
      }
      updateData.name = data.name;
    }

    if (data.email !== undefined) {
      if (typeof data.email !== 'string' || !data.email.trim()) {
        return NextResponse.json(
          { error: 'Email must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.email = data.email.trim();
    }

    if (data.image !== undefined) {
      if (typeof data.image !== 'string' && data.image !== null) {
        return NextResponse.json(
          { error: 'Image must be a string URL or null' },
          { status: 400 }
        );
      }
      updateData.image = data.image;
    }

    const updatedUser = await updateUser(userId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    serverInstance.error('Error in PUT /api/users/profile', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
