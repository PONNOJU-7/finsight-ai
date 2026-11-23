import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email }).lean();
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({ ...dto, password: hashed });

    return this.signToken(user._id.toString(), user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).select('+password').lean();
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid email or password');

    return this.signToken(user._id.toString(), user.email, user.name);
  }

  private signToken(userId: string, email: string, name: string) {
    const token = this.jwtService.sign({ sub: userId, email });
    return { accessToken: token, user: { id: userId, email, name } };
  }
}
