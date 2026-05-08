import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '../../common/auth/jwt.service';
import { PasswordService } from '../../common/auth/password.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { AuthProvider } from './dto/auth-provider.enum';
import { CreateAccountDto } from './dto/create-account.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createAccount(input: CreateAccountDto) {
    this.validateLocalPayload(input);

    const normalizedEmail = input.email.toLowerCase().trim();
    const alreadyExists = await this.userModel.exists({ email: normalizedEmail });

    if (alreadyExists) {
      throw new ConflictException('Ja existe uma conta com esse email');
    }

    const user = await this.userModel.create({
      name: input.name.trim(),
      email: normalizedEmail,
      password: this.passwordService.hash(input.password),
      provider: AuthProvider.LOCAL,
      lastLogin: new Date(),
    });

    return this.buildAuthResponse(user, true);
  }

  async login(input: LoginDto) {
    this.validateLoginPayload(input);

    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user || user.provider !== AuthProvider.LOCAL) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    if (!user.password || !this.passwordService.compare(input.password, user.password)) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    const isFirstLogin = !user.lastLogin;
    user.lastLogin = new Date();
    await user.save();

    return this.buildAuthResponse(user, isFirstLogin);
  }

  async loginWithGoogle(input: GoogleLoginDto) {
    this.validateGooglePayload(input);

    // Em producao este token deve ser validado na API do Google.
    if (!input.googleToken.startsWith('google_')) {
      throw new UnauthorizedException('Token do Google invalido');
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    let user = await this.userModel.findOne({ email: normalizedEmail });
    let isFirstLogin = false;

    if (!user) {
      isFirstLogin = true;
      user = await this.userModel.create({
        name: input.name.trim(),
        email: normalizedEmail,
        provider: AuthProvider.GOOGLE,
        lastLogin: new Date(),
      });
    } else {
      isFirstLogin = !user.lastLogin;
      if (!user.name && input.name.trim()) {
        user.name = input.name.trim();
      }
      user.lastLogin = new Date();
      await user.save();
    }

    return this.buildAuthResponse(user, isFirstLogin);
  }

  async updateProfile(userId: string, input: UpdateUserDto, avatarFile?: Express.Multer.File) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    const nextName = input?.name?.trim();
    if (!nextName && !avatarFile) {
      throw new BadRequestException('Informe name ou avatar para atualizar');
    }

    if (nextName) {
      user.name = nextName;
    }

    if (avatarFile) {
      if (!avatarFile.mimetype.startsWith('image/')) {
        throw new BadRequestException('Apenas arquivos de imagem sao permitidos');
      }

      const maxSizeInBytes = 5 * 1024 * 1024;
      if (avatarFile.size > maxSizeInBytes) {
        throw new BadRequestException('Imagem deve ter no maximo 5MB');
      }

      const previousPublicId = user.avatarPublicId;
      const uploadResult = await this.cloudinaryService.uploadImage({
        fileBuffer: avatarFile.buffer,
        folder: 'hubrl/avatars',
        publicId: `user-${user._id.toString()}-${Date.now()}`,
      });

      user.avatarUrl = uploadResult.secure_url;
      user.avatarPublicId = uploadResult.public_id;

      if (previousPublicId && previousPublicId !== uploadResult.public_id) {
        await this.cloudinaryService.destroyImage(previousPublicId);
      }
    }
    await user.save();

    return {
      user: this.buildUserResponse(user, false),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    return this.buildUserResponse(user, false);
  }

  private buildAuthResponse(user: UserDocument, isFirstLogin: boolean) {
    return {
      accessToken: this.jwtService.sign({
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        provider: user.provider,
      }),
      user: this.buildUserResponse(user, isFirstLogin),
    };
  }

  private buildUserResponse(user: UserDocument, isFirstLogin: boolean) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      provider: user.provider,
      lastLogin: user.lastLogin ?? null,
      isFirstLogin,
      avatarUrl: user.avatarUrl ?? null,
      avatarPublicId: user.avatarPublicId ?? null,
    };
  }

  private validateLocalPayload(input: CreateAccountDto) {
    if (!input?.name?.trim()) {
      throw new BadRequestException('Nome e obrigatorio');
    }
    if (!this.isValidEmail(input?.email)) {
      throw new BadRequestException('Email invalido');
    }
    if (!input?.password || input.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }
  }

  private validateLoginPayload(input: LoginDto) {
    if (!this.isValidEmail(input?.email)) {
      throw new BadRequestException('Email invalido');
    }
    if (!input?.password) {
      throw new BadRequestException('Senha e obrigatoria');
    }
  }

  private validateGooglePayload(input: GoogleLoginDto) {
    if (!input?.googleToken?.trim()) {
      throw new BadRequestException('googleToken e obrigatorio');
    }
    if (!this.isValidEmail(input?.email)) {
      throw new BadRequestException('Email invalido');
    }
    if (!input?.name?.trim()) {
      throw new BadRequestException('Nome e obrigatorio');
    }
  }

  private isValidEmail(email?: string): boolean {
    if (!email) {
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  }
}
