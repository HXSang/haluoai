import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { NewCandidateDto } from './dtos/new-candidate.dto';
import { UpdateStatusCandidateDto } from './dtos/update-status-candidate.dto';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendMailForgotPassword({ email, name, link }: ForgotPasswordDto) {
    return this.mailerService.sendMail({
      to: email,
      from: this.configService.get('email.fromAddress'),
      subject: 'Your Password Reset Request',
      template: 'forgot-password',
      context: {
        name,
        link,
      },
    });
  }

  async sendMailNewCandidate({
    email,
    candidateId,
    candidateName,
    recruiterName,
    link,
    jobTitle,
    submissionDate,
    contactChannel,
    groupChat,
    clientName,
  }: NewCandidateDto) {
    return this.mailerService.sendMail({
      to: email,
      from: this.configService.get('email.fromAddress'),
      subject: 'New Candidate Submission',
      template: 'new-candidate',
      context: {
        candidateName,
        candidateId,
        recruiterName,
        link,
        jobTitle,
        submissionDate,
        contactChannel,
        groupChat,
        clientName,
      },
    });
  }

  async sendMailUpdateStatusCandidate({
    email,
    candidateId,
    candidateName,
    recruiterName,
    jobTitle,
    previousStatus,
    newStatus,
    dateOfUpdate,
    link,
    clientName,
    reasonRejected,
  }: UpdateStatusCandidateDto) {
    return this.mailerService.sendMail({
      to: email,
      from: this.configService.get('email.fromAddress'),
      subject: 'Candidate Status Update',
      template: 'update-status-candidate',
      context: {
        candidateName,
        candidateId,
        recruiterName,
        jobTitle,
        previousStatus,
        newStatus,
        dateOfUpdate,
        link,
        clientName,
        reasonRejected,
      },
    });
  }
}
