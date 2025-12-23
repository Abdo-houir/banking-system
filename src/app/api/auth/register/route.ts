import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { RegisterResponseData } from '@/types/auth';
import { formatZodError, registerSchema } from '@/validation/auth';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/register
export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();

        // Validate request body with Zod
        const validationResult = registerSchema.safeParse(body);

        if (!validationResult.success) {
            const response: ApiResponse = {
                success: false,
                message: 'Validation failed',
                errors: formatZodError(validationResult.error),
            };
            return NextResponse.json(response, { status: 400 });
        }

        const { email, password, firstName, lastName, phone } = validationResult.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email },
        });

        if (existingUser) {
            const response: ApiResponse = {
                success: false,
                message: 'User with this email already exists',
            };
            return NextResponse.json(response, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
                role: 'CUSTOMER',
                status: 'ACTIVE', // Default status
            },
        });

        // Import JWT functions dynamically
        const { generateToken } = await import('@/lib/auth');

        // Generate JWT token
        const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
        });

        // Remove password from user object
        const { password:_, ...userWithoutPassword } = newUser;

        // Create success response data
        const responseData: RegisterResponseData = {
            user: userWithoutPassword,
            token,
        };

        const response: ApiResponse<RegisterResponseData> = {
            success: true,
            message: 'Registration successful',
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
        console.error('Register API error:', error);

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