import { AuthType } from '@prisma/client';

export class GetUserDto {
  id: number;

  email: string;

  authType: AuthType;
}
