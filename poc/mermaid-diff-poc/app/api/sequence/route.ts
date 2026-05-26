import { NextRequest, NextResponse } from 'next/server';
import { codeParser } from '@/lib/codeParser';

export async function POST(request: NextRequest) {
  try {
    const { method, className } = await request.json();

    if (!method || !className) {
      return NextResponse.json({ error: 'Method and className required' }, { status: 400 });
    }

    // Generate sequence diagram
    const sequenceDiagram = codeParser.generateSequenceDiagram(method, className);

    return NextResponse.json({ sequenceDiagram });
  } catch (error) {
    console.error('Sequence generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sequence diagram', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
