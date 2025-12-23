import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { LoginResponseData } from '@/types/auth';
import { formatZodError, loginSchema } from '@/validation/auth';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/login
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request body with Zod
        const validationResult = loginSchema.safeParse(body);

        if (!validationResult.success) {
            const response: ApiResponse = {
                success: false,
                message: 'Validation failed',
                errors: formatZodError(validationResult.error),
            };
            return NextResponse.json(response, { status: 400 });
        }

        const { email, password } = validationResult.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        // Check if user exists
        if (!user) {
            const response: ApiResponse = {
                success: false,
                message: 'Invalid email or password',
            };
            return NextResponse.json(response, { status: 401 });
        }

        // Check if user is banned
        if (user.status === 'BANNED') {
            const response: ApiResponse = {
                success: false,
                message: 'Your account has been suspended. Please contact support.',
            };
            return NextResponse.json(response, { status: 403 });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            const response: ApiResponse = {
                success: false,
                message: 'Invalid email or password',
            };
            return NextResponse.json(response, { status: 401 });
        }

        // Import JWT functions dynamically
        const { generateToken } = await import('@/lib/auth');

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
        });

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;

        // Create success response data
        const responseData: LoginResponseData = {
            user: userWithoutPassword,
            token,
        };

        const response: ApiResponse<LoginResponseData> = {
            success: true,
            message: 'Login successful',
            data: responseData,
        };

        // Create HTTP response
        const httpResponse = NextResponse.json(response);

        // Set HTTP-only cookie with the token
        httpResponse.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return httpResponse;

    } catch (error) {
        console.error('Login API error:', error);

        const response: ApiResponse = {
            success: false,
            message: 'Internal server error',
        };

        return NextResponse.json(response, { status: 500 });
    }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Allow': 'POST, OPTIONS',
        },
    });
}