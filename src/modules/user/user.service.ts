import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { FilterUserDto } from './dto/filter-user.dto';
import { AuthType, Role, UserRole } from '@prisma/client';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword;
    return this.userRepository.create({
      email: createUserDto.email,
      password: createUserDto.password,
      name: createUserDto.name,
      authType: AuthType.EMAIL,
    });
  }

  async findAll(filterUserDto: FilterUserDto) {
    const { page, limit, ...where } = filterUserDto;
    const users = await this.userRepository.paginate({
      page,
      limit,
      where,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    users.items = users.items.map(
      (user: User & { userRoles: UserRole & { role: Role } }) => {
        return {
          ...user,
          role: user.userRoles?.[0]?.role || null,
        };
      },
    );

    return users;
  }

  findOne(id: number) {
    return this.userRepository.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
