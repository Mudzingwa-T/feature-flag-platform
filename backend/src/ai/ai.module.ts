import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MockRuleProvider } from './providers/mock-rule.provider';
import { OpenAiRuleProvider } from './providers/openai-rule.provider';
import { PRIMARY_RULE_PROVIDER } from './providers/rule-provider.interface';

@Module({
  providers: [
    AiService,
    MockRuleProvider,
    OpenAiRuleProvider,
    {
      // Use the real provider when a key is present, otherwise the offline heuristic.
      provide: PRIMARY_RULE_PROVIDER,
      useFactory: (openai: OpenAiRuleProvider, mock: MockRuleProvider) =>
        process.env.OPENAI_API_KEY ? openai : mock,
      inject: [OpenAiRuleProvider, MockRuleProvider],
    },
  ],
  controllers: [AiController],
})
export class AiModule {}
