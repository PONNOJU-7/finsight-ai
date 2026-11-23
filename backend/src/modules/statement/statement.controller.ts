import {
  Controller, Post, Get, Delete, Param,
  UseGuards, Req, HttpCode, HttpStatus, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StatementService } from './statement.service';

@ApiTags('Statement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statement')
export class StatementController {
  constructor(private statementService: StatementService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        bankName: { type: 'string', example: 'HDFC Bank' },
        accountHolder: { type: 'string', example: 'Pramod Ponnoju' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a bank statement CSV' })
  async upload(
    @CurrentUser() user: { _id: string },
    @Req() req: FastifyRequest,
  ) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    let file: { buffer: Buffer; originalname: string; mimetype: string } | null = null;
    let bankName = '';
    let accountHolder = '';

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname === 'file') {
          const buffer = await part.toBuffer();
          file = {
            buffer,
            originalname: part.filename ?? 'upload.csv',
            mimetype: part.mimetype ?? 'text/csv',
          };
        }
      } else if (part.fieldname === 'bankName') {
        bankName = String(part.value);
      } else if (part.fieldname === 'accountHolder') {
        accountHolder = String(part.value);
      }
    }

    if (!file || file.buffer.length === 0) {
      throw new BadRequestException('CSV file is required');
    }

    return this.statementService.upload(user._id, file, bankName, accountHolder);
  }

  @Get()
  @ApiOperation({ summary: 'List all uploaded statements' })
  findAll(@CurrentUser() user: { _id: string }) {
    return this.statementService.findByUser(user._id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a statement with transactions' })
  findOne(@CurrentUser() user: { _id: string }, @Param('id') id: string) {
    return this.statementService.findById(user._id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a statement' })
  delete(@CurrentUser() user: { _id: string }, @Param('id') id: string) {
    return this.statementService.delete(user._id, id);
  }
}