'use server';

import prisma from '@/lib/prisma';

// Get account statuses
export async function getAccountStatuses() {
    try {
        const statuses = await prisma.accountStatus.findMany({
            orderBy: { id: 'asc' },
        });

        return {
            success: true,
            data: { statuses },
        };
    } catch (error) {
        console.error('Error fetching account statuses:', error);
        return {
            success: false,
            message: 'Failed to fetch account statuses',
        };
    }
}

// Get account types
export async function getAccountTypes() {
    try {
        const types = await prisma.accountType.findMany({
            orderBy: { id: 'asc' },
        });

        return {
            success: true,
            data: { types },
        };
    } catch (error) {
        console.error('Error fetching account types:', error);
        return {
            success: false,
            message: 'Failed to fetch account types',
        };
    }
}