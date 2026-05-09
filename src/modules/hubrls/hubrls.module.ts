import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtService } from '../../common/auth/jwt.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { HubrlsController } from './hubrls.controller';
import { HubrlsService } from './hubrls.service';
import { Hubrl, HubrlSchema } from './schemas/hubrl.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Hubrl.name, schema: HubrlSchema }])],
  controllers: [HubrlsController],
  providers: [HubrlsService, JwtService, JwtAuthGuard, CloudinaryService],
})
export class HubrlsModule {}
