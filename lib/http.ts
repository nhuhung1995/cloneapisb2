import { NextResponse } from 'next/server';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function internalError(message = 'Internal Server Error') {
  return NextResponse.json({ error: message }, { status: 500 });
}
