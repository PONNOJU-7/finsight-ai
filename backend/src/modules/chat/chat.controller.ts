import { Controller, Post, Get, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send a message to the AI financial advisor' })
  sendMessage(@CurrentUser() user: { _id: string }, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user._id, dto.statementId, dto.message);
  }

  @Get('history')
  @ApiQuery({ name: 'statementId', required: true })
  @ApiOperation({ summary: 'Get conversation history for a statement' })
  getHistory(
    @CurrentUser() user: { _id: string },
    @Query('statementId') statementId: string,
  ) {
    return this.chatService.getHistory(user._id, statementId);
  }

  @Delete('history')
  @ApiQuery({ name: 'statementId', required: true })
  @ApiOperation({ summary: 'Clear conversation history' })
  clearHistory(
    @CurrentUser() user: { _id: string },
    @Query('statementId') statementId: string,
  ) {
    return this.chatService.clearHistory(user._id, statementId);
  }
}
