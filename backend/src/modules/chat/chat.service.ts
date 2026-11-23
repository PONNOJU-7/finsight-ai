import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { isMockAiEnabled } from '../../common/ai/ai-mode';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { AnalysisService } from '../analysis/analysis.service';
import { buildMockChatReply } from './mock-chat';

const SYSTEM_PROMPT = `You are FinSight, a friendly and expert AI personal finance advisor.
You have access to the user's bank statement analysis and help them understand their financial health,
improve their loan eligibility, and make smarter financial decisions.

Rules:
- Always refer to specific numbers from the user's financial data when answering
- Be encouraging but honest about financial weaknesses
- Give actionable, specific advice — not generic tips
- Keep responses concise (under 200 words unless the user asks for detail)
- Use ₹ symbol for Indian Rupee amounts
- If asked about topics unrelated to finance, politely redirect to financial topics`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly mockAi: boolean;
  private readonly claude: Anthropic | null;

  constructor(
    @InjectModel(Conversation.name) private convModel: Model<ConversationDocument>,
    private analysisService: AnalysisService,
    config: ConfigService,
  ) {
    this.mockAi = isMockAiEnabled(config);
    if (this.mockAi) {
      this.claude = null;
      this.logger.warn('AI_PROVIDER=mock — chat uses canned advisor replies');
    } else {
      const apiKey = config.get<string>('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required unless AI_PROVIDER=mock or MOCK_CLAUDE=true');
      }
      this.claude = new Anthropic({ apiKey });
    }
  }

  async sendMessage(userId: string, statementId: string, userMessage: string) {
    // Get or create conversation
    let conversation = await this.convModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), statementId: new Types.ObjectId(statementId) },
      { $setOnInsert: { userId: new Types.ObjectId(userId), statementId: new Types.ObjectId(statementId), messages: [] } },
      { upsert: true, new: true },
    );

    // Get financial context
    const financialContext = await this.analysisService.getAnalysisSummaryForChat(userId, statementId);

    // Build message history for Claude (last 10 messages to stay within context)
    const recentMessages = conversation.messages.slice(-10);
    const claudeMessages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `FINANCIAL CONTEXT (use this data to answer questions):\n${financialContext}\n\nUser Question: ${userMessage}`,
      },
    ];

    // Inject history
    if (recentMessages.length > 0) {
      claudeMessages.unshift(
        ...recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      );
    }

    let assistantMessage: string;

    if (this.mockAi) {
      await new Promise(r => setTimeout(r, 300));
      assistantMessage = buildMockChatReply(userMessage, financialContext);
    } else {
      const response = await this.claude!.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: claudeMessages,
      });

      const assistantContent = response.content[0];
      if (assistantContent.type !== 'text') throw new NotFoundException('Unexpected AI response');
      assistantMessage = assistantContent.text;
    }
    const now = new Date();

    // Append both messages to conversation
    await this.convModel.updateOne(
      { _id: conversation._id },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: userMessage, timestamp: now },
              { role: 'assistant', content: assistantMessage, timestamp: now },
            ],
          },
        },
      },
    );

    return {
      message: assistantMessage,
      conversationId: conversation._id,
    };
  }

  async getHistory(userId: string, statementId: string) {
    const conversation = await this.convModel
      .findOne({
        userId: new Types.ObjectId(userId),
        statementId: new Types.ObjectId(statementId),
      })
      .lean();

    return {
      messages: conversation?.messages ?? [],
      statementId,
    };
  }

  async clearHistory(userId: string, statementId: string) {
    await this.convModel.updateOne(
      { userId: new Types.ObjectId(userId), statementId: new Types.ObjectId(statementId) },
      { $set: { messages: [] } },
    );
    return { cleared: true };
  }
}
