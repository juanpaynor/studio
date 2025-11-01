import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || 'IMG';
  
  // Extract dimensions from path params
  const [width = '300', height = '200'] = params.params || [];
  
  const w = parseInt(width) || 300;
  const h = parseInt(height) || 200;
  
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
            font-family="system-ui, sans-serif" font-size="${Math.min(w, h) / 8}" fill="#9ca3af">
        ${text.slice(0, 20)}
      </text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}