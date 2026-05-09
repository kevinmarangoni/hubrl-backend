import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { JwtPayload } from '../../common/auth/jwt.service';
import { CreateHubrlDto } from './dto/create-hubrl.dto';
import { HubrlsService } from './hubrls.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@Controller('hubrls')
export class HubrlsController {
  constructor(private readonly hubrlsService: HubrlsService) {}

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.hubrlsService.uploadImageAsset(request.user.sub, file);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: AuthenticatedRequest, @Body() body: CreateHubrlDto) {
    return this.hubrlsService.create(request.user.sub, body);
  }

  @Patch(':hubrlId')
  @UseGuards(JwtAuthGuard)
  update(
    @Req() request: AuthenticatedRequest,
    @Param('hubrlId') hubrlId: string,
    @Body() body: CreateHubrlDto,
  ) {
    return this.hubrlsService.updateByHubrlId(request.user.sub, hubrlId, body);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    return this.hubrlsService.listMine(request.user.sub);
  }

  @Get(':hubrlId')
  getByHubrlId(@Param('hubrlId') hubrlId: string) {
    return this.hubrlsService.getByHubrlId(hubrlId);
  }
}
