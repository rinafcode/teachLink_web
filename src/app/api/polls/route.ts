import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    
    let polls;
    if (courseId) {
      const result = await query('SELECT * FROM polls WHERE course_id = $1 ORDER BY created_at DESC', [courseId]);
      polls = result.rows;
    } else {
      const result = await query('SELECT * FROM polls ORDER BY created_at DESC LIMIT 100');
      polls = result.rows;
    }
    
    return NextResponse.json({ data: polls });
  } catch (error) {
    console.error('Failed to fetch polls:', error);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, question, options, course_id, created_by } = body;
    
    // Create table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS polls (
        id VARCHAR(255) PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        course_id VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await query(
      \`INSERT INTO polls (id, question, options, course_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *\`,
      [
        id || crypto.randomUUID(),
        question,
        JSON.stringify(options || []),
        course_id || null,
        created_by || 'anonymous'
      ]
    );
    
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create poll:', error);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}
