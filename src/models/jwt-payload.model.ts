import { AuthType } from '@prisma/client';

export class JwtPayloadModel {
  id: number;

  email: string;

  authType: AuthType;
}
