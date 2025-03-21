import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { FilterUserDto } from './dto/filter-user.dto';
import { Role, UserRole } from '@prisma/client';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  create(createUserDto: CreateUserDto) {
    return this.userRepository.create(createUserDto);
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
