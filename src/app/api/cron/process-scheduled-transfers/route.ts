// app/api/cron/process-scheduled/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Basic security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        // Find all scheduled transfers that are due
        const dueTransfers = await prisma.transaction.findMany({
            where: {
                isScheduled: true,
                scheduledFor: { lte: now },
                transactionStatus: { status: 'scheduled' },
                OR: [
                    { referenceNumber: { contains: '-OUT' } },
                    { referenceNumber: { contains: '-IN' } }
                ]
            },
            include: {
                fromAccount: true,
                toAccount: true,
                transactionStatus: true,
            },
            orderBy: { scheduledFor: 'asc' },
        });

        // Group transfers by reference number
        const transfersByRef = new Map();
        dueTransfers.forEach(transfer => {
            const refBase = transfer.referenceNumber.split('-')[0];
            if (!transfersByRef.has(refBase)) {
                transfersByRef.set(refBase, { out: null, in: null, fee: null });
            }

            if (transfer.referenceNumber.endsWith('-OUT')) {
                transfersByRef.get(refBase).out = transfer;
            } else if (transfer.referenceNumber.endsWith('-IN')) {
                transfersByRef.get(refBase).in = transfer;
            } else if (transfer.referenceNumber.endsWith('-FEE')) {
                transfersByRef.get(refBase).fee = transfer;
            }
        });

        const results = [];

        for (const [refBase, transfers] of transfersByRef) {
            if (!transfers.out || !transfers.in) continue;

            try {
                await prisma.$transaction(async (tx) => {
                    const completedStatus = await tx.transactionStatus.findUnique({
                        where: { status: 'completed' }
                    });

                    const failedStatus = await tx.transactionStatus.findUnique({
                        where: { status: 'failed' }
                    });

                    // Check if funds are still available
                    const fromAccount = await tx.account.findUnique({
                        where: { id: transfers.out.fromAccountId! }
                    });

                    const toAccount = await tx.account.findUnique({
                        where: { id: transfers.in.toAccountId! }
                    });

                    const availableBalance = fromAccount!.balance + (fromAccount!.overdraftLimit || 0);
                    const transferAmount = Math.abs(transfers.out.amount);
                    const incomingAmount = Math.abs(transfers.in.amount);

                    if (availableBalance >= transferAmount) {
                        // Calculate new balances
                        const newFromBalance = fromAccount!.balance - transferAmount;
                        const newToBalance = toAccount!.balance + incomingAmount;

                        // Update account balances
                        await tx.account.update({
                            where: { id: transfers.out.fromAccountId! },
                            data: { balance: newFromBalance },
                        });

                        await tx.account.update({
                            where: { id: transfers.in.toAccountId! },
                            data: { balance: newToBalance },
                        });

                        // Update transaction statuses
                        await tx.transaction.update({
                            where: { id: transfers.out.id },
                            data: {
                                transactionStatusId: completedStatus!.id,
                                isScheduled: false,
                            }
                        });

                        await tx.transaction.update({
                            where: { id: transfers.in.id },
                            data: {
                                transactionStatusId: completedStatus!.id,
                                isScheduled: false,
                            }
                        });

                        if (transfers.fee) {
                            await tx.transaction.update({
                                where: { id: transfers.fee.id },
                                data: {
                                    transactionStatusId: completedStatus!.id,
                                    isScheduled: false,
                                }
                            });
                        }

                        // Update account transaction records
                        // For the outgoing transaction
                        await tx.accountTransaction.updateMany({
                            where: {
                                transactionId: transfers.out.id,
                                accountId: transfers.out.fromAccountId!,
                            },
                            data: {
                                balanceAfter: newFromBalance,
                            }
                        });

                        // For the incoming transaction - FIXED: should be transfers.in.id, not transfers.out.id
                        await tx.accountTransaction.updateMany({
                            where: {
                                transactionId: transfers.in.id, // FIXED THIS LINE
                                accountId: transfers.in.toAccountId!,
                            },
                            data: {
                                balanceAfter: newToBalance,
                            }
                        });

                        // Send notifications
                        await tx.notification.createMany({
                            data: [
                                {
                                    userId: transfers.out.userId,
                                    title: 'Scheduled Transfer Executed',
                                    message: `Scheduled transfer of $${incomingAmount.toFixed(2)} has been processed`,
                                    type: 'TRANSACTION',
                                },
                                {
                                    userId: transfers.in.userId,
                                    title: 'Scheduled Transfer Received',
                                    message: `Scheduled transfer of $${incomingAmount.toFixed(2)} has been received`,
                                    type: 'TRANSACTION',
                                }
                            ]
                        });

                        results.push({ ref: refBase, status: 'completed' });
                    } else {
                        // Insufficient funds - mark as failed
                        await tx.transaction.updateMany({
                            where: {
                                OR: [
                                    { id: transfers.out.id },
                                    { id: transfers.in.id },
                                    ...(transfers.fee ? [{ id: transfers.fee.id }] : [])
                                ]
                            },
                            data: {
                                transactionStatusId: failedStatus!.id,
                                isScheduled: false,
                            }
                        });

                        await tx.notification.create({
                            data: {
                                userId: transfers.out.userId,
                                title: 'Scheduled Transfer Failed',
                                message: `Scheduled transfer failed due to insufficient funds`,
                                type: 'TRANSACTION',
                            },
                        });

                        results.push({ ref: refBase, status: 'failed', reason: 'insufficient_funds' });
                    }
                });
            } catch (error) {
                console.error(`Failed to process scheduled transfer ${refBase}:`, error);
                results.push({ ref: refBase, status: 'error', error: (error as Error).message });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Scheduled transfers processed',
            processed: results.filter(r => r.status === 'completed').length,
            failed: results.filter(r => r.status === 'failed').length,
            errors: results.filter(r => r.status === 'error').length,
            results
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}