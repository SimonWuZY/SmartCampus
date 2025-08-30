import { NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function GET() {
  try {
    const history = llmService.getConversationHistory();
    const stats = llmService.getStats();
    
    return NextResponse.json({
      history,
      stats,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve history' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    llmService.clearHistory();
    
    return NextResponse.json({
      message: 'Conversation history cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear history API error:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}