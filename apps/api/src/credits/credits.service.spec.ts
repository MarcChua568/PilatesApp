import { Test } from '@nestjs/testing';
import { BadRequestException, GoneException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreditsService } from './credits.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CreditsService', () => {
  let service: CreditsService;
  let dataSourceMock: {
    transaction: jest.Mock;
    manager: { findOne: jest.Mock; find: jest.Mock };
  };
  let emailMock: { giftInvite: jest.Mock; giftReceived: jest.Mock };
  let notificationsMock: { safeCreate: jest.Mock };

  const sender = { id: 'sender-1', fullName: 'Ava Bennett', creditBalance: 5 };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSourceMock = {
      transaction: jest.fn(),
      manager: { findOne: jest.fn(), find: jest.fn() },
    };
    emailMock = {
      giftInvite: jest.fn().mockResolvedValue(undefined),
      giftReceived: jest.fn().mockResolvedValue(undefined),
    };
    notificationsMock = { safeCreate: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: EmailService, useValue: emailMock },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();
    service = moduleRef.get(CreditsService);
  });

  it('getBalance() reads the balance off the user', async () => {
    dataSourceMock.manager.findOne.mockResolvedValue({ creditBalance: 7 });
    await expect(service.getBalance('sender-1')).resolves.toBe(7);
  });

  it('getBalance() throws when the user is missing', async () => {
    dataSourceMock.manager.findOne.mockResolvedValue(undefined);
    await expect(service.getBalance('missing')).rejects.toThrow(NotFoundException);
  });

  it('purchase() credits the balance and writes a purchase transaction', async () => {
    const user = { ...sender, creditBalance: 5 };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn((row) => Promise.resolve(row)),
      findOne: jest.fn().mockResolvedValue(user),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    const balance = await service.purchase('sender-1', 10);

    expect(balance).toBe(15);
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'purchase', amount: 10, userId: 'sender-1' }),
    );
  });

  it('gift() to an existing member transfers immediately and notifies them', async () => {
    const senderUser = { ...sender, creditBalance: 5 };
    const recipientUser = { id: 'rec-1', email: 'friend@studio.test', fullName: 'Liam Ford', creditBalance: 0 };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn((row) => Promise.resolve(row)),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(senderUser) // load sender
        .mockResolvedValueOnce(recipientUser), // load recipient by email
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    await service.gift('sender-1', {
      recipientEmail: 'friend@studio.test',
      amount: 3,
    });

    expect(senderUser.creditBalance).toBe(2);
    expect(recipientUser.creditBalance).toBe(3);
    expect(notificationsMock.safeCreate).toHaveBeenCalledWith(
      'rec-1',
      'gift_received',
      expect.any(String),
      expect.stringContaining('Ava Bennett'),
    );
    expect(emailMock.giftReceived).toHaveBeenCalledWith(
      'friend@studio.test',
      'Ava Bennett',
      3,
    );
    expect(emailMock.giftInvite).not.toHaveBeenCalled();
  });

  it('gift() to a non-member email debits the sender and creates a pending gift', async () => {
    const senderUser = { ...sender, creditBalance: 5 };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn((row) => Promise.resolve(row)),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(senderUser) // load sender
        .mockResolvedValueOnce(undefined), // no user with that email
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    await service.gift('sender-1', {
      recipientEmail: 'newperson@example.com',
      amount: 2,
    });

    expect(senderUser.creditBalance).toBe(3);
    expect(emailMock.giftInvite).toHaveBeenCalledWith(
      'newperson@example.com',
      'Ava Bennett',
      2,
      expect.any(String),
    );
    const savedGift = manager.save.mock.calls
      .map((c) => c[0])
      .find((row: any) => 'recipientEmail' in row);
    expect(savedGift).toMatchObject({
      recipientEmail: 'newperson@example.com',
      amount: 2,
      status: 'pending',
    });
  });

  it('gift() rejects when the sender has insufficient balance', async () => {
    const senderUser = { ...sender, creditBalance: 1 };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn(),
      findOne: jest.fn().mockResolvedValueOnce(senderUser),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    await expect(
      service.gift('sender-1', { recipientEmail: 'x@y.com', amount: 5 }),
    ).rejects.toThrow(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('claimGift() credits the claimant and marks the gift claimed', async () => {
    const gift: {
      id: string;
      token: string;
      senderId: string;
      amount: number;
      message: string | null;
      status: string;
      claimedByUserId: string | null;
      expiresAt: Date;
    } = {
      id: 'g1',
      token: 'abc',
      senderId: 'sender-1',
      amount: 4,
      message: null,
      status: 'pending',
      claimedByUserId: null,
      expiresAt: new Date(Date.now() + 86_400_000),
    };
    const claimant = { id: 'claimant-1', creditBalance: 0 };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn((row) => Promise.resolve(row)),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(gift)
        .mockResolvedValueOnce(claimant),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    const balance = await service.claimGift('abc', 'claimant-1');

    expect(balance).toBe(4);
    expect(gift.status).toBe('claimed');
    expect(gift.claimedByUserId).toBe('claimant-1');
  });

  it('claimGift() rejects an already-claimed gift', async () => {
    const gift = { token: 'abc', status: 'claimed', expiresAt: new Date(Date.now() + 86_400_000) };
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn(),
      findOne: jest.fn().mockResolvedValueOnce(gift),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    await expect(service.claimGift('abc', 'claimant-1')).rejects.toThrow(GoneException);
  });

  it('claimGift() rejects an unknown token', async () => {
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn(),
      findOne: jest.fn().mockResolvedValueOnce(undefined),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    await expect(service.claimGift('missing', 'claimant-1')).rejects.toThrow(NotFoundException);
  });
});
