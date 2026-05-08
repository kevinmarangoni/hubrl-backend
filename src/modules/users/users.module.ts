import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtService } from '../../common/auth/jwt.service';
import { PasswordService } from '../../common/auth/password.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService, JwtService, JwtAuthGuard, PasswordService, CloudinaryService],
})
export class UsersModule {}
