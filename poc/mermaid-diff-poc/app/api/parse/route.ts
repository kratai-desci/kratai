import { NextRequest, NextResponse } from 'next/server';
import { codeParser } from '@/lib/codeParser';

export async function POST(request: NextRequest) {
  try {
    const { code, fileName } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Parse the code
    const classes = codeParser.parseTypeScript(code, fileName || 'temp.ts');

    // Generate class diagram
    const classDiagram = classes.length > 0 
      ? codeParser.generateClassDiagram(classes)
      : '';

    return NextResponse.json({
      classes,
      classDiagram,
    });
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse code', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
