import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WaiverSubmission } from './entities/waiver-submission.entity';
import { User } from '../users/entities/user.entity';
import { SubmitWaiverDto } from './dto/submit-waiver.dto';

@Injectable()
export class WaiversService {
  constructor(
    @InjectRepository(WaiverSubmission)
    private readonly repo: Repository<WaiverSubmission>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Store the submission and mark the user's waiver as signed, atomically, so
   * the boolean gate on users and the submission record never disagree.
   */
  async submit(userId: string, dto: SubmitWaiverDto): Promise<WaiverSubmission> {
    return this.dataSource.transaction(async (manager) => {
      const submission = manager.create(WaiverSubmission, {
        userId,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        medicalNotes: dto.medicalNotes ?? null,
        acceptedTerms: dto.acceptedTerms,
        signature: dto.signature,
      });
      const saved = await manager.save(submission);
      await manager.update(User, { id: userId }, {
        healthWaiverSignedAt: new Date(),
      });
      return saved;
    });
  }

  getMine(userId: string): Promise<WaiverSubmission | null> {
    return this.repo.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });
  }

  list(): Promise<WaiverSubmission[]> {
    return this.repo.find({
      order: { submittedAt: 'DESC' },
      relations: { user: true },
    });
  }

  async getForUser(userId: string): Promise<WaiverSubmission> {
    const submission = await this.repo.findOne({
      where: { userId },
      order: { submittedAt: 'DESC' },
      relations: { user: true },
    });
    if (!submission) throw new NotFoundException('No waiver on file');
    return submission;
  }
}
