import { IsString, IsMongoId, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: '6684a1c9f3e2b8d2c0a1b2c3' })
  @IsMongoId()
  statementId: string;

  @ApiProperty({ example: 'Can I afford a ₹5 lakh loan with ₹8000 monthly EMI?' })
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  message: string;
}
