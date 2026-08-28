import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WaiversService } from './waivers.service';
import { WaiverSubmission } from './entities/waiver-submission.entity';
import { User } from '../users/entities/user.entity';

describe('WaiversService', () => {
  let service: WaiversService;
  let dataSourceMock: { transaction: jest.Mock };

  const repoMock = { findOne: jest.fn() };

  const validDto = {
    fullName: 'Jamie Cruz',
    dateOfBirth: '1994-05-02',
    emergencyContactName: 'Alex Cruz',
    emergencyContactPhone: '+63 917 000 0000',
    acceptedTerms: true,
    signature: 'Jamie Cruz',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSourceMock = { transaction: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        WaiversService,
        { provide: getRepositoryToken(WaiverSubmission), useValue: repoMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();
    service = moduleRef.get(WaiversService);
  });

  it('submit stores the row and stamps the user waiver flag', async () => {
    const manager = {
      create: (_e: unknown, data: object) => data,
      save: jest.fn((row) => Promise.resolve({ id: 'w1', ...row })),
      update: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    dataSourceMock.transaction.mockImplementation((cb: any) => cb(manager));

    const saved = await service.submit('u1', validDto);

    expect(saved.userId).toBe('u1');
    expect(manager.update).toHaveBeenCalledWith(
      User,
      { id: 'u1' },
      expect.objectContaining({ healthWaiverSignedAt: expect.any(Date) }),
    );
  });
});
